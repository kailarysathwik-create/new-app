import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { generateAndStoreKeypair, getLocalPublicKey } from '../crypto/encryption';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: false,
  cloudNode: null, // { accessToken, folderId }

  setSession: (session) => set({ session, user: session?.user ?? null }),

  ensureHarbourProvisioned: async (userId) => {
    try {
      const { data, error } = await supabase.functions.invoke('harbour-provision-user', {
        body: { userId },
      });

      if (error) {
        return { data: null, error };
      }

      if (data?.profile) {
        set((state) => ({
          profile: state.profile?.id === data.profile.id ? { ...state.profile, ...data.profile } : state.profile,
        }));
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  fetchProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.log('AUTH_STORE: Profile not found for session, possibly stale or DB reset.');
        set({ profile: null });
        return null;
      }
      
      set({ profile: data });

      if (!data.harbour_folder_id) {
        const { data: provisionData } = await get().ensureHarbourProvisioned(userId);
        if (provisionData?.profile) {
          set({ profile: provisionData.profile });
          return provisionData.profile;
        }
      }

      return data;
    } catch (_e) {
      set({ profile: null });
      return null;
    }
  },

  createProfile: async ({ userId, username, publicKey, bio }) => {
    set({ loading: true });
    // Use upsert to handle cases where the DB trigger already created a baseline profile
    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            username: username.toLowerCase(),
            public_key: publicKey,
            bio: bio,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();
    
    if (!error && data) {
        set({ profile: data });
    }
    set({ loading: false });
    return { data, error };
  },

  updateProfile: async (updates) => {
    const { user, profile } = get();
    if (!user) return { data: null, error: new Error('User not signed in') };

    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) {
      set({ profile: { ...(profile || {}), ...data } });
    }

    return { data, error };
  },

  setCloudNode: (nodeData) => {
    set({ cloudNode: nodeData });
  },

  syncCloudNodeToDB: async (folderId) => {
    const { user } = get();
    if (!user) return;
    const { error } = await supabase
        .from('profiles')
        .update({ cloud_node_folder_id: folderId })
        .eq('id', user.id);
    return { error };
  },

  signUpManual: async ({ identifier, password, username }) => {
    set({ loading: true });
    
    const isEmail = identifier.includes('@');
    const authData = isEmail ? { email: identifier, password } : { phone: identifier, password };

    // Pass the username in metadata so the DB Trigger can create the profile automatically
    const { data: authUser, error: authError } = await supabase.auth.signUp({
        ...authData,
        options: {
            data: {
                username: username
            }
        }
    });

    if (authError) {
      set({ loading: false });
      return { error: authError };
    }

    // Generate local E2E keys
    // (We do this here so they are ready for the first session)
    await generateAndStoreKeypair();
    const publicKey = await getLocalPublicKey();

    // Since we now use a DB Trigger for profiles, we only update the public key here
    // IF the user is confirmed immediately. Otherwise, we do it on first login.
    if (authUser.session) {
        await supabase.from('profiles').update({ public_key: publicKey }).eq('id', authUser.user.id);
        await get().fetchProfile(authUser.user.id);
        set({ session: authUser.session, user: authUser.user });
    }
    
    set({ loading: false });
    return { data: authUser };
  },

  /*
  requestOTP: async (phone) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: { shouldCreateUser: true }
    });
    set({ loading: false });
    return { data, error };
  },

  verifyOTP: async (phone, token) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
    
    if (!error && data.user) {
        set({ session: data.session, user: data.user });
        await get().fetchProfile(data.user.id);
    }
    
    set({ loading: false });
    return { data, error };
  },

  updatePassword: async (password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.updateUser({ password });
    set({ loading: false });
    return { data, error };
  },
  */

  signInManual: async ({ identifier, password }) => {
    set({ loading: true });
    try {
        let authIdentifier = identifier.trim();
        let isPhone = /^\+?[\d]{10,15}$/.test(authIdentifier.replace(/[\s-]/g, ''));
        const isEmail = authIdentifier.includes('@');

        let authData;
        if (isEmail) {
            authData = { email: authIdentifier, password };
        } else if (isPhone) {
            authData = { phone: authIdentifier, password };
        } else {
            // Resolution: Lookup email for this username
            const { data: profileData, error: lookupError } = await supabase
                .from('profiles')
                .select('email, phone')
                .eq('username', authIdentifier)
                .single();
            
            if (lookupError || (!profileData?.email && !profileData?.phone)) {
                throw new Error("Username not found");
            }
            
            if (profileData.email) {
                authData = { email: profileData.email, password };
            } else {
                authData = { phone: profileData.phone, password };
            }
        }

        const { data, error } = await supabase.auth.signInWithPassword(authData);
        if (error) throw error;

        await get().fetchProfile(data.user.id);
        set({ session: data.session, user: data.user, loading: false });
        return { data, error: null };
    } catch (error) {
        set({ loading: false });
        return { data: null, error };
    }
  },

  requestPasswordResetCode: async ({ identifier }) => {
    try {
      set({ loading: true });
      const cleanIdentifier = identifier?.trim();
      if (!cleanIdentifier) throw new Error('Email or phone number is required.');

      const isEmail = cleanIdentifier.includes('@');
      const isPhone = /^\+?[\d\- ]+$/.test(cleanIdentifier) && cleanIdentifier.length > 8;
      if (!isEmail && !isPhone) {
        throw new Error('Use the email or phone number from onboarding.');
      }

      const payload = isEmail
        ? { email: cleanIdentifier, options: { shouldCreateUser: false } }
        : { phone: cleanIdentifier, options: { shouldCreateUser: false } };
      const { error } = await supabase.auth.signInWithOtp(payload);
      if (error) throw error;

      set({ loading: false });
      return { success: true, channel: isEmail ? 'email' : 'phone' };
    } catch (error) {
      set({ loading: false });
      return { error };
    }
  },

  resetPasswordWithCode: async ({ identifier, code, newPassword }) => {
    try {
      set({ loading: true });
      const cleanIdentifier = identifier?.trim();
      const cleanCode = code?.trim();
      if (!cleanIdentifier || !cleanCode || !newPassword) {
        throw new Error('Identifier, code, and new password are required.');
      }

      const isEmail = cleanIdentifier.includes('@');
      const verifyPayload = isEmail
        ? { email: cleanIdentifier, token: cleanCode, type: 'email' }
        : { phone: cleanIdentifier, token: cleanCode, type: 'sms' };
      const { error: verifyError } = await supabase.auth.verifyOtp(verifyPayload);
      if (verifyError) throw verifyError;

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      await supabase.auth.signOut();
      set({ loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return { error };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, session: null, cloudNode: null });
  },
}));
