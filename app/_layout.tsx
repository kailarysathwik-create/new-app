import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/authStore';

export default function RootLayout() {
  const { setSession, fetchProfile } = useAuthStore();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) await fetchProfile(session.user.id);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="setup-username" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_right' }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
