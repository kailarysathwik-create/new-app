import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const TAB_ORDER = ['index', 'explore', 'chat', 'vault', 'profile'];
const TAB_ROUTES = {
  index: '/(tabs)',
  explore: '/(tabs)/explore',
  chat: '/(tabs)/chat',
  vault: '/(tabs)/vault',
  profile: '/(tabs)/profile',
};

export default function TabSwipeShell({ routeName, children }) {
  const router = useRouter();
  const translateX = useSharedValue(0);
  const screenWidth = Dimensions.get('window').width;

  const navigateTo = React.useCallback(
    (nextRouteName) => {
      const href = TAB_ROUTES[nextRouteName];
      if (href) {
        router.replace(href);
      }
    },
    [router]
  );

  const gesture = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-18, 18])
    .onUpdate((event) => {
      translateX.value = event.translationX * 0.22;
    })
    .onEnd((event) => {
      const currentIndex = TAB_ORDER.indexOf(routeName);
      const isSwipeLeft = event.translationX < -88;
      const isSwipeRight = event.translationX > 88;

      if (isSwipeLeft && currentIndex < TAB_ORDER.length - 1) {
        translateX.value = withTiming(-screenWidth * 0.12, { duration: 120 }, () => {
          runOnJS(navigateTo)(TAB_ORDER[currentIndex + 1]);
        });
        return;
      }

      if (isSwipeRight && currentIndex > 0) {
        translateX.value = withTiming(screenWidth * 0.12, { duration: 120 }, () => {
          runOnJS(navigateTo)(TAB_ORDER[currentIndex - 1]);
        });
        return;
      }

      translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
