import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { generateAndStoreKeypair, getLocalPublicKey } from '../crypto/encryption';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { findSailyFolder, createSailyFolder } from '../lib/cloudNode';

// Configure Google Sign-In with the 'drive.file' scope as requested
GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    // Use your Web Client ID from Google Cloud Console here
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

  // NEW: Manual Sign Up with Email or Phone
  signUpManual: async ({ identifier, password, username }) => {
    set({ loading: true });
    
    const isEmail = identifier.includes('@');
    const authData = isEmail ? { email: identifier, password } : { phone: identifier, password };

    const { data: authUser, error: authError } = await supabase.auth.signUp(authData);

    if (authError) {
      set({ loading: false });
      return { error: authError };
    }

    await generateAndStoreKeypair();
    const publicKey = await getLocalPublicKey();

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

  // Link the "SAILY" folder on Google Drive (Renamed to Cloud Node)
  linkCloudNode: async () => {
    try {
      set({ loading: true });
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      
      const accessToken = tokens.accessToken;

      // Find or Create the folder named "SAILY" as requested
      let folder = await findSailyFolder(accessToken);
      if (!folder) {
        folder = await createSailyFolder(accessToken);
      }

      // Save folder ID to Supabase profile for future sessions
      const { error } = await supabase
        .from('profiles')
        .update({ cloud_node_folder_id: folder.id })
        .eq('id', get().user.id);

      if (error) throw error;

      set({ cloudNode: { accessToken, folderId: folder.id }, loading: false });
      await get().fetchProfile(get().user.id);
      return { success: true };
    } catch (error) {
      console.error('Failed to link cloud node:', error);
      set({ loading: false });
      return { error };
    }
  },

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
    await GoogleSignin.signOut();
    set({ user: null, profile: null, session: null, cloudNode: null });
  },
}));
