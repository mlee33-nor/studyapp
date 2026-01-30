import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Trigger a light haptic feedback pulse.
 * Uses Capacitor Haptics for native iOS, falls back to Vibration API on web.
 */
export const triggerHapticFeedback = (duration: number = 10): void => {
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
        // Silently fail if vibration is not supported or blocked
      }
    }
  });
};

/**
 * Trigger a medium haptic feedback pulse
 */
export const triggerMediumHaptic = (): void => {
  Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch {
        // Silently fail
      }
    }
  });
};

/**
 * Trigger a strong haptic feedback pulse
 */
export const triggerStrongHaptic = (): void => {
  Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch {
        // Silently fail
      }
    }
  });
};
