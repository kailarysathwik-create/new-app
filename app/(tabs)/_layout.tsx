import { useState } from 'react';
import { Tabs } from 'expo-router';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Image, View, StyleSheet, Text, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { colors, typography, shadows, borders } from '../../src/theme/tokens';

function NeoTabBarButton({ children, onPress, accessibilityState, style, ...rest }: BottomTabBarButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityState={accessibilityState}
      style={styles.tabButtonPressable}
      {...rest}
    >
      <MotiView
        animate={{
          translateX: pressed ? 3 : 0,
          translateY: pressed ? 3 : 0,
        }}
        transition={{ type: 'spring', damping: 18, stiffness: 300 }}
        style={[style, styles.tabButtonShell]}
      >
        {children}
      </MotiView>
    </Pressable>
  );
}

function TabIcon({ image, label, focused }: { image: number; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
      <Image source={image} style={[styles.tabImage, focused && styles.tabImageFocused]} resizeMode="contain" />
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const feedIcon = require('../../assets/images/SAILY-logo.png');
  const exploreIcon = require('../../assets/images/explore-logo.png');
  const chatIcon = require('../../assets/images/chat-logo.png');
  const vaultIcon = require('../../assets/images/vault-logo.png');
  const profileIcon = require('../../assets/images/profile-logo.png');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: '#F7E3BE',
        },
        animation: 'shift',
        tabBarButton: (props) => <NeoTabBarButton {...props} />,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon image={feedIcon} label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon image={exploreIcon} label="Explore" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon image={chatIcon} label="Chat" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon image={vaultIcon} label="Vault" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon image={profileIcon} label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    height: 98,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  tabBarItem: {
    height: 78,
    paddingHorizontal: 2,
  },
  tabButtonPressable: {
    flex: 1,
  },
  tabButtonShell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItem: {
    width: 68,
    height: 68,
    backgroundColor: '#FFF8EB',
    borderWidth: borders.thick,
    borderColor: borders.color,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.brutalSmall,
  },
  tabItemFocused: {
    backgroundColor: colors.accent,
  },
  tabImage: {
    width: 24,
    height: 24,
    opacity: 0.85,
  },
  tabImageFocused: {
    opacity: 1,
  },
  tabLabel: {
    marginTop: 6,
    fontFamily: typography.family.black,
    color: colors.black,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  tabLabelFocused: {
    color: colors.black,
  },
});
