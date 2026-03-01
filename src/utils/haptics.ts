import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const isNative = Capacitor.isNativePlatform();

// ---------------------------------------------------------------------------
// Web Audio "haptic" fallback
// ---------------------------------------------------------------------------
// iOS Safari has no Vibration API, so we synthesise a ultra-short low-
// frequency audio pulse that produces a tactile click through the speakers.
// On Android Chrome we prefer navigator.vibrate() when available.
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null;

const getAudioCtx = (): AudioContext | null => {
  if (audioCtx) return audioCtx;
  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioCtx;
  } catch {
    return null;
  }
};

/**
 * Fire a short oscillator pulse that produces a physical "tick" through the
 * device speakers. Params let us differentiate light / medium / heavy.
 */
const audioPulse = (freq: number, gainValue: number, ms: number): void => {
  const ctx = getAudioCtx();
  if (!ctx) return;

  // Resume context if it was suspended (Safari autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.value = freq;
  gain.gain.value = gainValue;

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  osc.start(now);
  // Rapid fade-out to avoid an audible pop
  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + ms / 1000);
  osc.stop(now + ms / 1000);
};

/**
 * Web fallback: prefer Vibration API (Android), fall back to audio pulse.
 */
const webHaptic = (
  vibMs: number,
  freq: number,
  gain: number,
  pulseMs: number,
): void => {
  if (navigator?.vibrate?.(vibMs)) return; // Android Chrome
  audioPulse(freq, gain, pulseMs);
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Light haptic pulse. */
export const triggerHapticFeedback = (_duration: number = 10): void => {
  if (isNative) {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  } else {
    webHaptic(10, 150, 0.3, 8);
  }
};

/** Medium haptic pulse. */
export const triggerMediumHaptic = (): void => {
  if (isNative) {
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
  } else {
    webHaptic(20, 120, 0.45, 15);
  }
};

/**
 * Selection-change tick — the subtle "picker wheel" haptic on iOS.
 * On web this is a very short, crisp audio click.
 */
export const triggerSelectionTick = (): void => {
  if (isNative) {
    Haptics.selectionChanged().catch(() => {});
  } else {
    webHaptic(5, 180, 0.25, 6);
  }
};

/** Strong haptic pulse. */
export const triggerStrongHaptic = (): void => {
  if (isNative) {
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
  } else {
    webHaptic(30, 80, 0.6, 25);
  }
};
