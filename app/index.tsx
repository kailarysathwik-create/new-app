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

  if (!session) return <Redirect href="/login" />;
  if (!profile) return <Redirect href="/setup-username" />;
  return <Redirect href="/(tabs)" />;
}
