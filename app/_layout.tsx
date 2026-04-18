import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/authStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_700Bold, Outfit_900Black } from '@expo-google-fonts/outfit';
import { colors } from '../src/theme/tokens';

export default function RootLayout() {
  const { setSession, fetchProfile, session, profile } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Load "Neat" Fonts
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
    Outfit_900Black,
  });

  useEffect(() => {
    // Initial Session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
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
    if (!fontsLoaded) return;

    const isLogin = segments[0] === 'login';
    const isOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';

    if (!session && !isLogin && !isOnboarding) {
      // Not logged in -> go to login
      router.replace('/login');
    } else if (session && (isLogin || isOnboarding)) {
      // Logged in but on entry screen -> go to app
      router.replace('/(tabs)');
    }
  }, [session, fontsLoaded, segments]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Slot />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
