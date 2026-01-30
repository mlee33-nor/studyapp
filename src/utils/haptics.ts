/**
 * Trigger a light haptic feedback pulse
 * Uses the Vibration API for supported devices
 */
export const triggerHapticFeedback = (duration: number = 10): void => {
  // Check if the Vibration API is supported
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch (error) {
      // Silently fail if vibration is not supported or blocked
      console.debug('Haptic feedback not available:', error);
    }
  }
};

/**
 * Trigger a medium haptic feedback pulse
 */
export const triggerMediumHaptic = (): void => {
  triggerHapticFeedback(20);
};

/**
 * Trigger a strong haptic feedback pulse
 */
export const triggerStrongHaptic = (): void => {
  triggerHapticFeedback(30);
};
