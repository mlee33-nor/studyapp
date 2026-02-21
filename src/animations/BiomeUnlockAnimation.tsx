import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import type { BiomeType } from '../types';
import { BIOME_CONFIG } from '../data/biomes';

interface BiomeUnlockCelebrationProps {
  biomeId: BiomeType;
  stage: number; // 0=appear, 1=first shake, 2=intense shake, 3=burst+reveal
  onTap: () => void;
}

export const BiomeUnlockCelebration: React.FC<BiomeUnlockCelebrationProps> = ({
  biomeId,
  stage,
  onTap,
}) => {
  const config = BIOME_CONFIG[biomeId];
  const color = config.primaryColor;
  const color2 = config.secondaryColor;
  const emoji = config.emoji;

  // Load chest Lottie
  const [chestAnimData, setChestAnimData] = useState<any>(null);
  const chestLottieRef = useRef<any>(null);

  useEffect(() => {
    fetch('/studyapp/treasure-3d.json')
      .then(r => r.json())
      .then(data => setChestAnimData(data))
      .catch(() => {});
  }, []);

  // Control chest Lottie playback per stage
  useEffect(() => {
    if (!chestLottieRef.current) return;
    const lottie = chestLottieRef.current;
    if (stage === 0) {
      lottie.goToAndStop(0, true);
    } else if (stage === 1) {
      lottie.playSegments([0, 45], true);
    } else if (stage === 2) {
      lottie.playSegments([45, 90], true);
    }
  }, [stage]);

  return (
    <motion.div
      onClick={onTap}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: stage >= 3
          ? `radial-gradient(circle, ${color}66 0%, rgba(0,0,0,0.85) 70%)`
          : 'rgba(0, 0, 0, 0.85)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'background 0.5s ease',
      }}
    >
      {/* Biome-colored light rays behind chest (stage 2+) */}
      {stage >= 2 && stage < 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: [0, 0.8, 0.5], scale: [0.3, 1.5, 1.2] }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: '400px', height: '400px',
            background: `radial-gradient(circle, ${color}80 0%, ${color}33 40%, transparent 70%)`,
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* The 3D Chest (stages 0-2) */}
      {stage < 3 && (
        <motion.div
          animate={
            stage === 0 ? { scale: [0, 1.15, 1], rotate: 0 } :
            stage === 1 ? {
              rotate: [-4, 4, -4, 4, -3, 3, 0],
              scale: [1, 1.06, 1],
            } :
            {
              rotate: [-7, 7, -9, 9, -7, 7, -5, 5, 0],
              scale: [1, 1.1, 1.03, 1.1, 1],
              y: [0, -8, 0, -5, 0],
            }
          }
          transition={
            stage === 0
              ? { type: 'spring', stiffness: 300, damping: 15, duration: 0.5 }
              : { duration: stage === 1 ? 0.5 : 0.7, ease: 'easeInOut' }
          }
          style={{
            position: 'relative',
            width: '200px',
            height: '200px',
            filter: stage >= 2
              ? `drop-shadow(0 0 30px ${color}99)`
              : 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))',
          }}
        >
          {/* 3D Lottie Chest */}
          {chestAnimData && (
            <Lottie
              lottieRef={chestLottieRef}
              animationData={chestAnimData}
              loop={false}
              autoplay={false}
              style={{ width: '100%', height: '100%' }}
            />
          )}

          {/* Biome emoji peeking out of chest (stage 1+) */}
          {stage >= 1 && (
            <div style={{
              position: 'absolute',
              top: '8%', left: '15%',
              width: '70%', height: '50%',
              overflow: 'hidden',
              zIndex: 1,
              pointerEvents: 'none',
            }}>
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={
                  stage === 1
                    ? { y: [30, 15, 30], opacity: 1, rotate: [-4, 4, -4] }
                    : { y: [10, -8, 10], opacity: 1, rotate: [-6, 6, -6], scale: [1, 1.1, 1] }
                }
                transition={{
                  duration: stage === 1 ? 1 : 0.6,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                }}
                style={{
                  width: '90px', height: '90px',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '60px',
                  filter: `drop-shadow(0 2px 8px ${color}80)`,
                }}
              >
                {emoji}
              </motion.div>
            </div>
          )}

          {/* Sparkles around chest (stage 1+) */}
          {stage >= 1 && (
            <>
              {[...Array(stage >= 2 ? 10 : 6)].map((_, i) => {
                const count = stage >= 2 ? 10 : 6;
                const angle = (i / count) * Math.PI * 2;
                const radius = stage >= 2 ? 120 : 90;
                return (
                  <motion.div
                    key={`sparkle-${i}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      x: Math.cos(angle) * radius,
                      y: Math.sin(angle) * radius,
                    }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.06,
                      repeat: Infinity,
                      repeatDelay: 0.2,
                    }}
                    style={{
                      position: 'absolute',
                      top: '50%', left: '50%',
                      width: stage >= 2 ? '8px' : '5px',
                      height: stage >= 2 ? '8px' : '5px',
                      background: i % 3 === 0 ? color : i % 3 === 1 ? color2 : '#FFFFFF',
                      borderRadius: '50%',
                      boxShadow: `0 0 10px ${color}CC`,
                      pointerEvents: 'none',
                    }}
                  />
                );
              })}
            </>
          )}

          {/* Biome-colored glow pulse on stage 2 */}
          {stage >= 2 && (
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{
                position: 'absolute',
                top: '-20%', left: '-20%',
                width: '140%', height: '140%',
                background: `radial-gradient(circle, ${color}4D 0%, transparent 60%)`,
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />
          )}
        </motion.div>
      )}

      {/* Stage 3: Biome Reveal */}
      {stage >= 3 && (
        <>
          {/* Glow ring */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 2], opacity: [1, 0] }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: '200px', height: '200px',
              border: `4px solid ${color}99`,
              borderRadius: '50%',
              boxShadow: `0 0 40px ${color}66, inset 0 0 40px ${color}33`,
              pointerEvents: 'none',
            }}
          />

          {/* Big biome emoji reveal */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: [0, 1.35, 1.05], rotate: [-10, 5, 0] }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
            style={{
              fontSize: 96,
              filter: `drop-shadow(0 0 30px ${color}B3)`,
              zIndex: 2,
            }}
          >
            {emoji}
          </motion.div>

          {/* "BIOME UNLOCKED!" text */}
          <motion.div
            initial={{ y: -40, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.25 }}
            style={{
              marginTop: '12px',
              fontSize: '28px',
              fontWeight: 900,
              fontFamily: "'Quicksand', sans-serif",
              color: color2,
              textShadow: `0 0 20px ${color}, 0 0 40px ${color}80, 0 2px 4px rgba(0,0,0,0.8)`,
              letterSpacing: '4px',
              zIndex: 2,
            }}
          >
            UNLOCKED!
          </motion.div>

          {/* Biome name */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            style={{
              marginTop: '6px',
              fontSize: '20px',
              fontWeight: 700,
              color: '#FFFFFF',
              fontFamily: "'Quicksand', sans-serif",
              textShadow: `0 0 12px ${color}99, 0 2px 4px rgba(0,0,0,0.7)`,
              zIndex: 2,
            }}
          >
            {config.name}
          </motion.div>

          {/* Orbiting sparkles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`orbit-${i}`}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5],
                x: [0, Math.cos((i / 8) * Math.PI * 2) * 140, Math.cos((i / 8) * Math.PI * 2) * 180],
                y: [0, Math.sin((i / 8) * Math.PI * 2) * 140, Math.sin((i / 8) * Math.PI * 2) * 180],
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                width: '6px', height: '6px',
                borderRadius: '50%',
                background: i % 2 === 0 ? color : color2,
                boxShadow: `0 0 12px ${color}CC`,
                pointerEvents: 'none',
              }}
            />
          ))}
        </>
      )}

      {/* Tap prompt text */}
      {stage < 3 && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            marginTop: '32px',
            fontSize: 18,
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.85)',
            fontFamily: "'Quicksand', sans-serif",
            letterSpacing: '2px',
            textTransform: 'uppercase',
            textShadow: `0 0 12px ${color}66`,
          }}
        >
          {stage === 2 ? 'ONE MORE TAP!' : 'TAP TO OPEN!'}
        </motion.div>
      )}
    </motion.div>
  );
};
