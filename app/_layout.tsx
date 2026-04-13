import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/authStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../src/theme/tokens';

export default function RootLayout() {
  const { setSession, fetchProfile, session, profile } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Initial Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for Auth Changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    const isLogin = segments[0] === 'login';

    if (!session && !isLogin) {
      // Not logged in -> go to login
      router.replace('/login');
    } else if (session && isLogin) {
      // Logged in but on login screen -> go to app or setup
      if (!profile) {
        router.replace('/setup-username');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [session, profile, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Slot />
    </GestureHandlerRootView>
  );
}
