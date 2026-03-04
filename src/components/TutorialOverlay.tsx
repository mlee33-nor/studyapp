import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TutorialStep {
  id: string;
  message: string;
  // Where to show the tooltip relative to viewport
  tooltipPosition: 'top' | 'center' | 'bottom' | 'bottom-flush';
  // Optional arrow pointing direction
  arrow?: 'up' | 'down' | 'none';
  // Button label
  buttonLabel?: string;
  // If true, the overlay lets touches through and waits for external advance
  waitForInteraction?: boolean;
  // If true, skip the dark background overlay (e.g. when shown over another modal)
  noOverlay?: boolean;
  // CSS selector value for data-tutorial-target to spotlight (e.g. "timer-ring")
  highlightTarget?: string;
  // Padding around the spotlight hole (default 8)
  highlightPadding?: number;
  // Border radius of the spotlight hole (default 16)
  highlightBorderRadius?: number;
}

interface TutorialOverlayProps {
  step: TutorialStep | null;
  onNext: () => void;
  visible: boolean;
}

interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ step, onNext, visible }) => {
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const rafRef = useRef<number>(0);

  // Track the target element's position
  const updateSpotlight = useCallback(() => {
    if (!step?.highlightTarget) {
      setSpotlightRect(null);
      return;
    }
    const el = document.querySelector(`[data-tutorial-target="${step.highlightTarget}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setSpotlightRect({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    }
  }, [step?.highlightTarget]);

  useEffect(() => {
    if (!visible || !step?.highlightTarget) {
      setSpotlightRect(null);
      return;
    }

    // Poll position to handle layout shifts, scrolling, drag movements
    const poll = () => {
      updateSpotlight();
      rafRef.current = requestAnimationFrame(poll);
    };
    // Small delay to let the DOM settle after step transitions
    const timeout = setTimeout(() => {
      poll();
    }, 50);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [visible, step?.highlightTarget, updateSpotlight]);

  if (!visible || !step) return null;

  const pad = step.highlightPadding ?? 8;
  const borderRadius = step.highlightBorderRadius ?? 16;
  const hasSpotlight = !!spotlightRect;

  // Raw spotlight area bounds (with padding) — may extend above/left of viewport
  const rawSpotLeft = hasSpotlight ? spotlightRect.x - pad : 0;
  const rawSpotTop = hasSpotlight ? spotlightRect.y - pad : 0;
  const rawSpotWidth = hasSpotlight ? spotlightRect.width + pad * 2 : 0;
  const rawSpotHeight = hasSpotlight ? spotlightRect.height + pad * 2 : 0;

  // Clamp spotlight to visible viewport so the glow border and darkening look correct
  // when the element is partially scrolled off-screen (e.g. keyboard pushing modal up)
  const spotLeft = Math.max(0, rawSpotLeft);
  const spotTop = Math.max(0, rawSpotTop);
  const spotWidth = rawSpotWidth - (spotLeft - rawSpotLeft);
  const spotHeight = rawSpotHeight - (spotTop - rawSpotTop);

  // --- Tooltip positioning ---
  const getTooltipStyle = (): React.CSSProperties => {
    // For 'top' tooltips with an active spotlight: position above or below the spotlight
    if (hasSpotlight && (step.tooltipPosition === 'top' || step.tooltipPosition === 'center')) {
      const gap = 12;
      // Need ~90px for tooltip card; if not enough room above, place below
      if (spotTop >= 90) {
        return {
          top: `${spotTop - gap}px`,
          bottom: 'auto',
          transform: 'translateY(-100%)',
        };
      }
      return {
        top: `${spotTop + spotHeight + gap}px`,
        bottom: 'auto',
        transform: 'none',
      };
    }

    // Fixed viewport positions for all other cases
    if (step.tooltipPosition === 'top') {
      return { top: 'calc(env(safe-area-inset-top, 0px) + 80px)', bottom: 'auto', transform: 'none' };
    }
    if (step.tooltipPosition === 'bottom') {
      return { top: 'auto', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 170px)', transform: 'none' };
    }
    if (step.tooltipPosition === 'bottom-flush') {
      return { top: 'auto', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)', transform: 'none' };
    }
    // center
    return { top: '50%', bottom: 'auto', transform: 'translateY(-50%)' };
  };

  const tooltipStyle = getTooltipStyle();

  return (
    <AnimatePresence>
      <motion.div
        key={step.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100000,
          pointerEvents: 'none',
        }}
      >
        {/* === SPOTLIGHT MODE: dark surround + glow + click blocking === */}
        {hasSpotlight && (
          <>
            {/* Dark surround via box-shadow on a transparent div positioned over the target */}
            <div
              style={{
                position: 'fixed',
                left: spotLeft,
                top: spotTop,
                width: spotWidth,
                height: spotHeight,
                borderRadius: borderRadius,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
                zIndex: 100000,
                pointerEvents: 'none',
              }}
            />

            {/* Glow ring around the spotlight area */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'fixed',
                left: spotLeft - 2,
                top: spotTop - 2,
                width: spotWidth + 4,
                height: spotHeight + 4,
                borderRadius: borderRadius + 2,
                border: '2px solid rgba(167, 139, 250, 0.6)',
                boxShadow: '0 0 24px 6px rgba(167, 139, 250, 0.35), inset 0 0 24px 6px rgba(167, 139, 250, 0.08)',
                zIndex: 100000,
                pointerEvents: 'none',
              }}
            />

            {/* 4 invisible click-blocking divs — cover everything EXCEPT the spotlight hole */}
            {/* TOP */}
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0,
              height: Math.max(0, spotTop),
              zIndex: 100001, pointerEvents: 'auto',
            }} />
            {/* BOTTOM */}
            <div style={{
              position: 'fixed', left: 0, right: 0, bottom: 0,
              top: Math.max(0, spotTop + spotHeight),
              zIndex: 100001, pointerEvents: 'auto',
            }} />
            {/* LEFT */}
            <div style={{
              position: 'fixed', left: 0,
              top: Math.max(0, spotTop),
              width: Math.max(0, spotLeft),
              height: spotHeight,
              zIndex: 100001, pointerEvents: 'auto',
            }} />
            {/* RIGHT */}
            <div style={{
              position: 'fixed', right: 0,
              top: Math.max(0, spotTop),
              left: Math.max(0, spotLeft + spotWidth),
              height: spotHeight,
              zIndex: 100001, pointerEvents: 'auto',
            }} />
          </>
        )}

        {/* === FALLBACK: full dark overlay (no spotlight) === */}
        {!hasSpotlight && !step.noOverlay && !step.waitForInteraction && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              zIndex: 100001,
              pointerEvents: 'auto',
            }}
          />
        )}

        {/* Tooltip card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.25, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: 24,
            right: 24,
            zIndex: 100002,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'auto',
            ...tooltipStyle,
          }}
        >
          {/* Arrow pointing up */}
          {step.arrow === 'up' && (
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                fontSize: '28px',
                marginBottom: '8px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}
            >
              ☝️
            </motion.div>
          )}

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '20px 24px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: 320,
            }}
          >
            <p
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'rgba(15, 23, 42, 0.9)',
                margin: 0,
                lineHeight: 1.5,
                fontFamily: "'Quicksand', -apple-system, sans-serif",
              }}
            >
              {step.message}
            </p>

            {!step.waitForInteraction && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                style={{
                  marginTop: '16px',
                  padding: '10px 28px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Quicksand', -apple-system, sans-serif",
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                }}
              >
                {step.buttonLabel || 'Got it'}
              </motion.button>
            )}
          </div>

          {/* Arrow pointing down */}
          {step.arrow === 'down' && (
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                fontSize: '28px',
                marginTop: '8px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}
            >
              👇
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TutorialOverlay;
