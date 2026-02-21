import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BiomeType } from '../types';
import { BIOME_CONFIG } from '../data/biomes';

interface BiomeUnlockCelebrationProps {
  biomeId: BiomeType;
  stage: number; // 0=appear, 1=first crack, 2=intense glow, 3=bloom
  onTap: () => void;
}

// Crack line positions for each stage
const CRACKS_STAGE_1 = [
  { x: -8, y: -20, rotate: -25, height: 40 },
  { x: 12, y: -15, rotate: 35, height: 30 },
  { x: -3, y: 10, rotate: -60, height: 25 },
];

const CRACKS_STAGE_2 = [
  ...CRACKS_STAGE_1,
  { x: 15, y: 5, rotate: 50, height: 35 },
  { x: -15, y: -5, rotate: -40, height: 32 },
  { x: 5, y: -25, rotate: 15, height: 28 },
  { x: -10, y: 18, rotate: -70, height: 22 },
];

// Sparkle orbiting positions
const makeSparkles = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    angle: (i / count) * Math.PI * 2,
    radius: 70 + (i % 3) * 15,
    size: 4 + (i % 3) * 2,
    delay: i * 0.12,
  }));

const SPARKLES_6 = makeSparkles(6);
const SPARKLES_10 = makeSparkles(10);
const SPARKLES_8 = makeSparkles(8);

// Gem clip-path (pentagon/crystal shape)
const GEM_CLIP = 'polygon(50% 0%, 85% 25%, 75% 85%, 25% 85%, 15% 25%)';

export const BiomeUnlockCelebration: React.FC<BiomeUnlockCelebrationProps> = ({
  biomeId,
  stage,
  onTap,
}) => {
  const config = BIOME_CONFIG[biomeId];
  const color = config.primaryColor;
  const emoji = config.emoji;

  const sparkles = stage === 1 ? SPARKLES_6 : stage === 2 ? SPARKLES_10 : SPARKLES_8;

  return (
    <motion.div
      onClick={onTap}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        overflow: 'hidden',
      }}
    >
      <AnimatePresence mode="wait">
        {stage < 3 ? (
          /* ── Crystal Gem (stages 0–2) ── */
          <motion.div
            key="crystal"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Outer glow */}
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 40px 15px ${color}44, 0 0 80px 30px ${color}22`,
                  `0 0 60px 25px ${color}66, 0 0 100px 40px ${color}33`,
                  `0 0 40px 15px ${color}44, 0 0 80px 30px ${color}22`,
                ],
                scale: stage === 2 ? [1, 1.08, 1] : [1, 1.03, 1],
              }}
              transition={{ duration: stage === 2 ? 0.6 : 1.2, repeat: Infinity }}
              style={{
                position: 'absolute',
                width: 160,
                height: 180,
                borderRadius: '50%',
              }}
            />

            {/* Crystal gem body */}
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{
                scale: 1,
                rotate: stage === 0
                  ? 0
                  : stage === 1
                    ? [-4, 4, -4, 4, 0]
                    : [-7, 7, -9, 9, -5, 5, 0],
              }}
              transition={
                stage === 0
                  ? { type: 'spring', damping: 10, stiffness: 200 }
                  : { duration: stage === 1 ? 0.5 : 0.6, ease: 'easeInOut' }
              }
              style={{
                width: 140,
                height: 160,
                clipPath: GEM_CLIP,
                background: `linear-gradient(160deg, ${color}CC 0%, ${color} 40%, ${color}88 100%)`,
                border: `2px solid ${color}`,
                boxShadow: `inset 0 0 30px ${color}66, 0 0 20px ${color}44`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Biome emoji inside crystal */}
              <motion.div
                animate={{
                  opacity: stage === 0 ? 0.3 : stage === 1 ? 0.5 : 0.7,
                }}
                style={{
                  fontSize: 56,
                  filter: `blur(${stage === 0 ? 2 : stage === 1 ? 1 : 0}px)`,
                  zIndex: 2,
                }}
              >
                {emoji}
              </motion.div>

              {/* Crack lines */}
              {stage >= 1 && (stage === 1 ? CRACKS_STAGE_1 : CRACKS_STAGE_2).map((crack, i) => (
                <motion.div
                  key={`crack-${i}`}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 0.9, scaleY: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${crack.x}px)`,
                    top: `calc(50% + ${crack.y}px)`,
                    width: 2,
                    height: crack.height,
                    background: 'rgba(255, 255, 255, 0.85)',
                    transform: `rotate(${crack.rotate}deg)`,
                    transformOrigin: 'top center',
                    borderRadius: 1,
                    boxShadow: `0 0 6px 1px rgba(255, 255, 255, 0.5)`,
                    zIndex: 3,
                  }}
                />
              ))}

              {/* Light leak glow (stage 2) */}
              {stage === 2 && (
                <motion.div
                  animate={{
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{
                    position: 'absolute',
                    inset: -10,
                    background: `radial-gradient(circle, ${color}88 0%, transparent 60%)`,
                    zIndex: 1,
                  }}
                />
              )}
            </motion.div>

            {/* Orbiting sparkles */}
            {stage >= 1 && (stage === 1 ? SPARKLES_6 : SPARKLES_10).map((sp, i) => (
              <motion.div
                key={`sparkle-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                  x: [
                    Math.cos(sp.angle) * (sp.radius - 20),
                    Math.cos(sp.angle + 0.5) * sp.radius,
                    Math.cos(sp.angle + 1) * (sp.radius - 20),
                  ],
                  y: [
                    Math.sin(sp.angle) * (sp.radius - 20),
                    Math.sin(sp.angle + 0.5) * sp.radius,
                    Math.sin(sp.angle + 1) * (sp.radius - 20),
                  ],
                }}
                transition={{
                  duration: 2,
                  delay: sp.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  position: 'absolute',
                  width: sp.size,
                  height: sp.size,
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: `0 0 8px 2px ${color}AA`,
                }}
              />
            ))}
          </motion.div>
        ) : (
          /* ── Stage 3: Bloom / Reveal ── */
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* Expanding glow ring */}
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: 120,
                height: 120,
                borderRadius: '50%',
                border: `3px solid ${color}`,
                boxShadow: `0 0 30px ${color}66`,
              }}
            />

            {/* Big biome emoji reveal */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.35, 1.05] }}
              transition={{
                type: 'spring',
                damping: 8,
                stiffness: 180,
                mass: 1.2,
              }}
              style={{
                fontSize: 96,
                marginBottom: 24,
                filter: `drop-shadow(0 0 20px ${color}88)`,
              }}
            >
              {emoji}
            </motion.div>

            {/* "BIOME UNLOCKED!" text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: 'spring', damping: 12 }}
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: '#FFFFFF',
                fontFamily: "'Quicksand', 'Arial Black', sans-serif",
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                textShadow: `0 0 30px ${color}, 0 0 60px ${color}88, 0 3px 12px rgba(0,0,0,0.8)`,
                padding: '12px 28px',
                border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: 14,
                background: `linear-gradient(135deg, ${color}44 0%, ${color}22 100%)`,
                backdropFilter: 'blur(6px)',
                marginBottom: 14,
              }}
            >
              BIOME UNLOCKED!
            </motion.div>

            {/* Biome name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: '#FFFFFF',
                fontFamily: "'Quicksand', sans-serif",
                textShadow: `0 0 20px ${color}, 0 2px 8px rgba(0,0,0,0.6)`,
              }}
            >
              {config.name}
            </motion.div>

            {/* Orbiting sparkles in biome colors */}
            {SPARKLES_8.map((sp, i) => (
              <motion.div
                key={`bloom-sparkle-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0.6, 1, 0],
                  scale: [0, 1.2, 0.8, 1, 0],
                  x: [0, Math.cos(sp.angle) * sp.radius, Math.cos(sp.angle + 1) * (sp.radius + 20)],
                  y: [0, Math.sin(sp.angle) * sp.radius, Math.sin(sp.angle + 1) * (sp.radius + 20)],
                }}
                transition={{
                  duration: 2.5,
                  delay: sp.delay * 0.5,
                  ease: 'easeOut',
                }}
                style={{
                  position: 'absolute',
                  width: sp.size + 2,
                  height: sp.size + 2,
                  borderRadius: '50%',
                  background: i % 2 === 0 ? color : config.secondaryColor,
                  boxShadow: `0 0 10px 3px ${color}AA`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap prompt text */}
      {stage < 3 && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            position: 'absolute',
            bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
            fontSize: 16,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.8)',
            fontFamily: "'Quicksand', sans-serif",
            letterSpacing: '0.05em',
          }}
        >
          {stage === 2 ? 'One more tap!' : 'Tap to reveal!'}
        </motion.div>
      )}
    </motion.div>
  );
};
