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

  signInWithOtp: async (email) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithOtp({ email });
    set({ loading: false });
    return { error };
  },

  verifyOtp: async (email, token) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (!error && data.session) {
      set({ session: data.session, user: data.session.user });
      const profile = await get().fetchProfile(data.session.user.id);
      if (!profile) {
        const { publicKey } = await generateAndStoreKeypair();
        set({ loading: false });
        return { isNewUser: true, publicKey };
      }
      const existingKey = await getLocalPublicKey();
      if (!existingKey) {
        const { publicKey } = await generateAndStoreKeypair();
        await supabase.from('profiles').update({ public_key: publicKey }).eq('id', data.session.user.id);
      }
    }
    set({ loading: false });
    return { error, isNewUser: false };
  },

  createProfile: async ({ userId, username, publicKey }) => {
    const { error } = await supabase.from('profiles').insert({ id: userId, username, public_key: publicKey });
    if (!error) await get().fetchProfile(userId);
    return { error };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, session: null });
  },
}));
