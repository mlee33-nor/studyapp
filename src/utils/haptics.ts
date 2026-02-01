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
  // Try to use Capacitor haptics if available
  try {
    const capacitor = (globalThis as any).capacitor;
    if (capacitor?.Plugins?.Haptics) {
      capacitor.Plugins.Haptics.impact({ style: 'Light' }).catch(() => {
        fallbackVibrate(duration);
      });
    } else {
      fallbackVibrate(duration);
    }
  } catch {
    fallbackVibrate(duration);
  }
};

/**
 * Trigger a medium haptic feedback pulse
 */
export const triggerMediumHaptic = (): void => {
  try {
    const capacitor = (globalThis as any).capacitor;
    if (capacitor?.Plugins?.Haptics) {
      capacitor.Plugins.Haptics.impact({ style: 'Medium' }).catch(() => {
        fallbackVibrate(20);
      });
    } else {
      fallbackVibrate(20);
    }
  } catch {
    fallbackVibrate(20);
  }
};

/**
 * Trigger a strong haptic feedback pulse
 */
export const triggerStrongHaptic = (): void => {
  try {
    const capacitor = (globalThis as any).capacitor;
    if (capacitor?.Plugins?.Haptics) {
      capacitor.Plugins.Haptics.impact({ style: 'Heavy' }).catch(() => {
        fallbackVibrate(30);
      });
    } else {
      fallbackVibrate(30);
    }
  } catch {
    fallbackVibrate(30);
  }
};
