import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TutorialStep {
  id: string;
  message: string;
  // Where to show the tooltip relative to viewport
  tooltipPosition: 'top' | 'center' | 'bottom';
  // Optional arrow pointing direction
  arrow?: 'up' | 'down' | 'none';
  // Button label
  buttonLabel?: string;
  // If true, the overlay lets touches through and waits for external advance
  waitForInteraction?: boolean;
  // If true, skip the dark background overlay (e.g. when shown over another modal)
  noOverlay?: boolean;
}

interface TutorialOverlayProps {
  step: TutorialStep | null;
  onNext: () => void;
  visible: boolean;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ step, onNext, visible }) => {
  if (!visible || !step) return null;

  const getTooltipTop = (): string => {
    if (step.tooltipPosition === 'top') return 'calc(env(safe-area-inset-top, 0px) + 80px)';
    if (step.tooltipPosition === 'bottom') return 'auto';
    return '50%';
  };

  const getTooltipBottom = (): string => {
    if (step.tooltipPosition === 'bottom') return 'calc(env(safe-area-inset-bottom, 0px) + 100px)';
    return 'auto';
  };

  const getTooltipTransform = (): string => {
    if (step.tooltipPosition === 'center') return 'translateY(-50%)';
    return 'none';
  };

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
          // When waiting for interaction, let touches pass through the overlay
          // but keep the tooltip itself interactive
          pointerEvents: step.waitForInteraction ? 'none' : 'auto',
        }}
      >
        {/* Dark overlay background */}
        {!step.waitForInteraction && !step.noOverlay && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              zIndex: 100001,
            }}
          />
        )}

        {/* Tooltip card — centered with padding */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.25, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: getTooltipTop(),
            bottom: getTooltipBottom(),
            left: 24,
            right: 24,
            transform: getTooltipTransform(),
            zIndex: 100002,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'auto',
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
