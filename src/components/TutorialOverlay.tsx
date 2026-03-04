import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TutorialStep {
  id: string;
  message: string;
  // Position of the spotlight cutout (if any)
  spotlightTarget?: {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius?: number;
  };
  // Where to show the tooltip relative to viewport
  tooltipPosition: 'top' | 'center' | 'bottom';
  // Optional arrow pointing direction
  arrow?: 'up' | 'down' | 'none';
  // Button label
  buttonLabel?: string;
  // If true, the user must interact with the highlighted element instead of pressing the button
  waitForInteraction?: boolean;
}

interface TutorialOverlayProps {
  step: TutorialStep | null;
  onNext: () => void;
  visible: boolean;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ step, onNext, visible }) => {
  if (!visible || !step) return null;

  const getTooltipStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100002,
      maxWidth: 320,
      width: 'calc(100% - 48px)',
    };

    if (step.tooltipPosition === 'top') {
      return { ...base, top: 'calc(env(safe-area-inset-top, 0px) + 80px)' };
    } else if (step.tooltipPosition === 'bottom') {
      return { ...base, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)' };
    }
    return { ...base, top: '50%', transform: 'translate(-50%, -50%)' };
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
          pointerEvents: 'auto',
        }}
      >
        {/* Dark overlay with optional spotlight cutout */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 100001,
          }}
          onClick={step.waitForInteraction ? undefined : onNext}
        />

        {/* Spotlight cutout */}
        {step.spotlightTarget && (
          <div
            style={{
              position: 'absolute',
              left: step.spotlightTarget.x,
              top: step.spotlightTarget.y,
              width: step.spotlightTarget.width,
              height: step.spotlightTarget.height,
              borderRadius: step.spotlightTarget.borderRadius ?? 20,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
              zIndex: 100001,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Tooltip card */}
        <motion.div
          initial={{ opacity: 0, y: step.tooltipPosition === 'bottom' ? 20 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3, ease: 'easeOut' }}
          style={getTooltipStyle()}
        >
          {/* Arrow pointing up */}
          {step.arrow === 'up' && (
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                textAlign: 'center',
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
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
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
                textAlign: 'center',
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
