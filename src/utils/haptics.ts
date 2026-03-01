import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Fallback vibration for devices that don't support Haptics
 */
const fallbackVibrate = (duration: number): void => {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // Silently fail if vibration is not supported or blocked
    }
  }
};

/**
 * Trigger a light haptic feedback pulse.
 * Uses Capacitor Haptics for native iOS, falls back to Vibration API on web.
 */
export const triggerHapticFeedback = (duration: number = 10): void => {
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
    fallbackVibrate(duration);
  });
};

/**
 * Trigger a medium haptic feedback pulse
 */
export const triggerMediumHaptic = (): void => {
  Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {
    fallbackVibrate(20);
  });
};

/**
 * Trigger a selection-change tick (the subtle "picker wheel" haptic on iOS).
 * Uses Haptics.selectionChanged() for the native feel, falls back to a
 * very short vibration on Android / web.
 */
export const triggerSelectionTick = (): void => {
  Haptics.selectionChanged().catch(() => {
    fallbackVibrate(5);
  });
};

/**
 * Trigger a strong haptic feedback pulse
 */
export const triggerStrongHaptic = (): void => {
  Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {
    fallbackVibrate(30);
  });
};
