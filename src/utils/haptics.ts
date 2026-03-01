import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Whether we're running inside a native Capacitor shell (iOS/Android).
 * On web the Haptics plugin resolves as a no-op, so we need to fall back
 * to navigator.vibrate() ourselves.
 */
const isNative = Capacitor.isNativePlatform();

const vibrate = (ms: number): void => {
  try {
    navigator?.vibrate?.(ms);
  } catch {
    // Vibration API not available or blocked
  }
};

/**
 * Light haptic pulse.
 */
export const triggerHapticFeedback = (duration: number = 10): void => {
  if (isNative) {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  } else {
    vibrate(duration);
  }
};

/**
 * Medium haptic pulse.
 */
export const triggerMediumHaptic = (): void => {
  if (isNative) {
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
  } else {
    vibrate(20);
  }
};

/**
 * Selection-change tick — the subtle "picker wheel" haptic on iOS.
 * Falls back to a very short vibration on Android web.
 */
export const triggerSelectionTick = (): void => {
  if (isNative) {
    Haptics.selectionChanged().catch(() => {});
  } else {
    vibrate(5);
  }
};

/**
 * Strong haptic pulse.
 */
export const triggerStrongHaptic = (): void => {
  if (isNative) {
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
  } else {
    vibrate(30);
  }
};
