import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { colors, typography } from '../../src/theme/tokens';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>{icon}</Text>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 72,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Feed" focused={focused} /> }}
      />
      <Tabs.Screen
        name="chat"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="💬" label="Chat" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Me" focused={focused} /> }}
      />
      <Tabs.Screen
        name="vault"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🔒" label="Vault" focused={focused} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22, opacity: 0.45 },
  iconFocused: { opacity: 1 },
  label: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: 2 },
  labelFocused: { color: colors.accent, fontWeight: typography.weight.semibold as any },
});
