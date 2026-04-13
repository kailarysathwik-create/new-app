import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { generateAndStoreKeypair, getLocalPublicKey } from '../crypto/encryption';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: false,

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

  // NEW: Manual Sign Up with Email or Phone
  signUpManual: async ({ identifier, password, username }) => {
    set({ loading: true });
    
    // Check if identifier is email or phone
    const isEmail = identifier.includes('@');
    const authData = isEmail ? { email: identifier, password } : { phone: identifier, password };

    // 1. Create Supabase Auth User
    const { data: authUser, error: authError } = await supabase.auth.signUp(authData);

    if (authError) {
      set({ loading: false });
      return { error: authError };
    }

    // 2. Initialise Crypto Keys on Device
    await generateAndStoreKeypair();
    const publicKey = await getLocalPublicKey();

    // 3. Create Custom Profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authUser.user.id,
      username: username,
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

  // NEW: Manual Login
  signInManual: async ({ identifier, password }) => {
    set({ loading: true });
    const isEmail = identifier.includes('@');
    const authData = isEmail ? { email: identifier, password } : { phone: identifier, password };

    const { data, error } = await supabase.auth.signInWithPassword(authData);
    
    if (!error) {
      await get().fetchProfile(data.user.id);
    }
    
    set({ loading: false });
    return { data, error };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, session: null });
  },
}));
