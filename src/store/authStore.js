import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { generateAndStoreKeypair, getLocalPublicKey } from '../crypto/encryption';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { findSailyRoot, createSailyRoot } from '../lib/cloudNode';

// Configure Google Sign-In with the 'drive.file' scope as requested
GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '', 
});

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: false,
  cloudNode: null, // { accessToken, folderId }

  setSession: (session) => set({ session, user: session?.user ?? null }),

  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) set({ profile: data });
    return data;
  },

  signUpManual: async ({ identifier, password, username }) => {
    set({ loading: true });
    
    const isEmail = identifier.includes('@');
    const authData = isEmail ? { email: identifier, password } : { phone: identifier, password };

    const { data: authUser, error: authError } = await supabase.auth.signUp(authData);

    if (authError) {
      set({ loading: false });
      return { error: authError };
    }

    // Generate local E2E keys
    await generateAndStoreKeypair();
    const publicKey = await getLocalPublicKey();

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authUser.user.id,
      username: username,
      email: authData.email || authData.phone, // Store for login resolution
      public_key: publicKey,
      is_public: true,
    });

    if (profileError) {
      set({ loading: false });
      return { error: profileError };
    }

    await get().fetchProfile(authUser.user.id);
    set({ loading: false });
    return { data: authUser };
  },

  signInManual: async ({ identifier, password }) => {
    set({ loading: true });
    try {
        let authIdentifier = identifier;

        // 1. Detect if it's a username (not email, not phone)
        const isEmail = identifier.includes('@');
        const isPhone = /^\+?[\d\- ]+$/.test(identifier) && identifier.length > 8;

        if (!isEmail && !isPhone) {
            // Resolution: Lookup email for this username
            const { data: profileData, error: lookupError } = await supabase
                .from('profiles')
                .select('email')
                .eq('username', identifier)
                .single();
            
            if (lookupError || !profileData?.email) throw new Error("Username not found");
            authIdentifier = profileData.email;
        }

        const authData = authIdentifier.includes('@') ? { email: authIdentifier, password } : { phone: authIdentifier, password };
        const { data, error } = await supabase.auth.signInWithPassword(authData);
        
        if (error) throw error;

        await get().fetchProfile(data.user.id);
        set({ loading: false });
        return { data, error: null };
    } catch (error) {
        set({ loading: false });
        return { data: null, error };
    }
  },

  linkCloudNode: async () => {
    try {
      set({ loading: true });
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      const accessToken = tokens.accessToken;

      let root = await findSailyRoot(accessToken);
      if (!root) {
        root = await createSailyRoot(accessToken);
      }

      const { error } = await supabase
        .from('profiles')
        .update({ cloud_node_folder_id: root.id })
        .eq('id', get().user.id);

      if (error) throw error;

      set({ cloudNode: { accessToken, folderId: root.id }, loading: false });
      await get().fetchProfile(get().user.id);
      return { success: true };
    } catch (error) {
      console.error('Failed to link cloud node:', error);
      set({ loading: false });
      return { error };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    await GoogleSignin.signOut();
    set({ user: null, profile: null, session: null, cloudNode: null });
  },
}));

