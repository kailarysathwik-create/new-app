import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const webStorageFallback = new Map();

const getWebStorage = () => {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

const webStorage = {
  getItem: async (key) => {
    const storage = getWebStorage();
    if (storage) {
      return storage.getItem(key);
    }

    return webStorageFallback.get(key) ?? null;
  },
  setItem: async (key, value) => {
    const storage = getWebStorage();
    if (storage) {
      storage.setItem(key, value);
      return;
    }

    webStorageFallback.set(key, value);
  },
  removeItem: async (key) => {
    const storage = getWebStorage();
    if (storage) {
      storage.removeItem(key);
    }

    webStorageFallback.delete(key);
  },
};

const authStorage = Platform.OS === 'web' ? webStorage : AsyncStorage;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web' && typeof window !== 'undefined',
  },
});
