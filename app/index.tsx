import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../src/theme/tokens';

export default function Index() {
  const { session, profile } = useAuthStore();

  // Still loading app state — show spinner
  if (session === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  // LOGIC:
  // 1. Authenticated & Profile exists -> Goto App Home
  if (session && profile) {
    return <Redirect href="/(tabs)" />;
  }

  // 2. No Session -> Goto Login (Main Entry)
  if (!session) {
    return <Redirect href="/login" />;
  }

  // 3. Session exists but no Profile -> Goto Setup
  return <Redirect href="/setup-username" />;
}
