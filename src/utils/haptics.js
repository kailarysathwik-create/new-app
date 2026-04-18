import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptics service to provide tactical feedback.
 * Automatically handles platform differences and no-op on unsupported devices.
 */
export const haptics = {
  /**
   * Light impact for subtle actions (e.g., tap, checkbox)
   */
  light: () => {
    if (Platform.OS !== 'web') {
      console.log('HAPTICS: Triggering Light Impact');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  /**
   * Medium impact for primary actions (e.g., button press)
   */
  medium: () => {
    if (Platform.OS !== 'web') {
      console.log('HAPTICS: Triggering Medium Impact');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  /**
   * Heavy impact for destructive or significant actions
   */
  heavy: () => {
    if (Platform.OS !== 'web') {
      console.log('HAPTICS: Triggering Heavy Impact');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  /**
   * Success notification (double tap pattern)
   */
  success: () => {
    if (Platform.OS !== 'web') {
      console.log('HAPTICS: Triggering Success Notification');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  /**
   * Warning notification
   */
  warning: () => {
    if (Platform.OS !== 'web') {
      console.log('HAPTICS: Triggering Warning Notification');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },

  /**
   * Error notification (rapid vibration)
   */
  error: () => {
    if (Platform.OS !== 'web') {
      console.log('HAPTICS: Triggering Error Notification');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },

  /**
   * Selection feedback for scrolling or toggling
   */
  selection: () => {
    if (Platform.OS !== 'web') {
      console.log('HAPTICS: Triggering Selection Feedback');
      Haptics.selectionAsync();
    }
  },
};
