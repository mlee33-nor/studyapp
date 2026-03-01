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
 * Trigger a selection-change tick (the subtle "picker wheel" haptic on iOS).
 * Uses Haptics.selectionChanged() for the native feel, falls back to a
 * very short vibration on Android / web.
 */
export const triggerSelectionTick = (): void => {
  try {
    const capacitor = (globalThis as any).capacitor;
    if (capacitor?.Plugins?.Haptics) {
      // selectionChanged gives the precise tick-per-notch feel
      if (typeof capacitor.Plugins.Haptics.selectionChanged === 'function') {
        capacitor.Plugins.Haptics.selectionChanged().catch(() => {
          fallbackVibrate(5);
        });
      } else {
        // Older Capacitor versions — fall back to lightest impact
        capacitor.Plugins.Haptics.impact({ style: 'Light' }).catch(() => {
          fallbackVibrate(5);
        });
      }
    } else {
      fallbackVibrate(5);
    }
  } catch {
    fallbackVibrate(5);
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
