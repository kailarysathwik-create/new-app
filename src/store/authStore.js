import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { generateAndStoreKeypair, getLocalPublicKey } from '../crypto/encryption';

WebBrowser.maybeCompleteAuthSession();

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

  signInWithGoogle: async () => {
    set({ loading: true });
    
    // Construct the redirect URL for mobile
    const redirectUri = makeRedirectUri({
      scheme: 'newapp',
      preferLocalhost: true,
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: false,
      },
    });

    if (error) {
      console.error('Google Auth Error:', error.message);
      set({ loading: false });
      return { error };
    }

    // Note: The rest of the handling happens in the Auth listener 
    // in navigation/RootLayout or via the deep link callback.
    return { data };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, session: null });
  },

  createProfile: async ({ userId, username, publicKey }) => {
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      username,
      public_key: publicKey,
    });
    if (!error) await get().fetchProfile(userId);
    return { error };
  },
}));
