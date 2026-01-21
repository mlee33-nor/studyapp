import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Smooth spring animation constant
const SMOOTH_SPRING = { type: 'spring' as const, damping: 15, stiffness: 100 };

// Helper to get detailed level features
const getLevelFeatures = (level: number) => {
  return {
    // Levels 1-9: Micro-evolution
    hasDirt: level === 1,
    sproutStage: level >= 2 && level <= 4 ? level - 1 : 0, // 1,2,3
    hasFirstLeaf: level >= 5,
    hasSecondLeaf: level >= 6,
    hasBlush: level >= 7,
    hasNubArms: level >= 8,
    isTallPear: level >= 9,

    // Levels 11-15: Spirit's Awakening
    hasHeartbeat: level >= 11,
    hasSpiritWisps: level >= 12,
    hasHands: level >= 13,
    hasBouncyIdle: level >= 14,
    hasHeadBud: level >= 15,

    // Levels 21-30: Guardian's Ascendance
    hasRotatingFlower: level >= 21,
    hasSparkleTrails: level >= 22,
    hasLeafCapes: level >= 23,
    hasFocusAura: level >= 25,
    hasLargeFlower: level >= 27,
    hasPollenParticles: level >= 27,
    isHovering: level >= 29,
    isTranscendent: level >= 30,
    hasTranscendentAura: level >= 33
  };
};

export const SproutCharacter: React.FC<{ size?: number; level: number; isTimerActive?: boolean }> = ({
  size = 120,
  level,
  isTimerActive = false
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const features = getLevelFeatures(level);

  // Dynamic size scaling (micro-growth within stages)
  const microScale = 1 + (level % 10) * 0.03;

  // Blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, Math.random() * 2000 + 3000);
    return () => clearInterval(blinkInterval);
  }, []);

  // ============================================
  // LEVELS 1-4: SEED TO SPROUT
  // ============================================
  if (level >= 1 && level <= 4) {
    const seedColor = level === 1 ? '#654321' : level === 2 ? '#7D5A3F' : '#96724D';
    const sproutGreen = level >= 2 ? '#84CC16' : seedColor;
    const emergence = Math.max(0, (level - 1) / 3); // 0 to 1 progression

    return (
      <motion.svg
        width={size * microScale}
        height={size * microScale}
        viewBox="0 0 100 100"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={SMOOTH_SPRING}
      >
        <defs>
          <radialGradient id="seedGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor={seedColor} />
            <stop offset="100%" stopColor="#3E2723" />
          </radialGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="50" cy="90" rx="18" ry="4" fill="rgba(0,0,0,0.2)" />

        {/* Dirt mound (fades out as sprout emerges) */}
        {features.hasDirt && (
          <motion.ellipse
            cx="50"
            cy="82"
            rx="28"
            ry="12"
            fill="#6B4423"
            animate={{ opacity: 1 - emergence }}
            transition={SMOOTH_SPRING}
          />
        )}

        {/* Seed/Sprout body - emerges upward */}
        <motion.g
          animate={{ y: [0, -emergence * 15] }}
          transition={SMOOTH_SPRING}
        >
          <motion.ellipse
            cx="50"
            cy="70"
            rx="12"
            ry="16"
            fill={level === 1 ? 'url(#seedGradient)' : sproutGreen}
            animate={{
              ry: level === 1 ? 16 : [16, 17, 16]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Tiny crack/sprout tip (levels 2-4) */}
          {level >= 2 && (
            <motion.path
              d="M 50 54 Q 48 48, 50 42"
              stroke="#A3E635"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: emergence }}
              transition={SMOOTH_SPRING}
            />
          )}
        </motion.g>
      </motion.svg>
    );
  }

  // ============================================
  // LEVELS 5-9: EARLY GROWTH - ONE FEATURE PER LEVEL
  // ============================================
  if (level >= 5 && level <= 9) {
    return (
      <motion.svg
        width={size * microScale}
        height={size * microScale}
        viewBox="0 0 100 100"
        animate={{ rotate: [-1, 1, -1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <defs>
          <radialGradient id="sproutGradient" cx="45%" cy="35%">
            <stop offset="0%" stopColor="#D9F99D" />
            <stop offset="50%" stopColor="#A3E635" />
            <stop offset="100%" stopColor="#65A30D" />
          </radialGradient>
        </defs>

        <ellipse cx="50" cy="88" rx="20" ry="5" fill="rgba(0,0,0,0.15)" />

        {/* Main body - grows taller at level 9 */}
        <motion.path
          d={features.isTallPear
            ? "M 38 35 Q 34 45, 32 55 Q 30 65, 35 72 Q 40 78, 50 80 Q 60 78, 65 72 Q 70 65, 68 55 Q 66 45, 62 35 Q 58 28, 50 28 Q 42 28, 38 35 Z"
            : "M 40 45 Q 36 52, 34 60 Q 32 68, 38 74 Q 43 78, 50 80 Q 57 78, 62 74 Q 68 68, 66 60 Q 64 52, 60 45 Q 56 40, 50 40 Q 44 40, 40 45 Z"
          }
          fill="url(#sproutGradient)"
          animate={{
            d: features.isTallPear ? [
              "M 38 35 Q 34 45, 32 55 Q 30 65, 35 72 Q 40 78, 50 80 Q 60 78, 65 72 Q 70 65, 68 55 Q 66 45, 62 35 Q 58 28, 50 28 Q 42 28, 38 35 Z",
              "M 39 36 Q 35 45, 33 55 Q 31 64, 36 71 Q 41 77, 50 79 Q 59 77, 64 71 Q 69 64, 67 55 Q 65 45, 61 36 Q 58 29, 50 29 Q 43 29, 39 36 Z",
              "M 38 35 Q 34 45, 32 55 Q 30 65, 35 72 Q 40 78, 50 80 Q 60 78, 65 72 Q 70 65, 68 55 Q 66 45, 62 35 Q 58 28, 50 28 Q 42 28, 38 35 Z"
            ] : [
              "M 40 45 Q 36 52, 34 60 Q 32 68, 38 74 Q 43 78, 50 80 Q 57 78, 62 74 Q 68 68, 66 60 Q 64 52, 60 45 Q 56 40, 50 40 Q 44 40, 40 45 Z",
              "M 41 46 Q 37 52, 35 60 Q 33 67, 39 73 Q 44 77, 50 79 Q 56 77, 61 73 Q 67 67, 65 60 Q 63 52, 59 46 Q 56 41, 50 41 Q 45 41, 41 46 Z",
              "M 40 45 Q 36 52, 34 60 Q 32 68, 38 74 Q 43 78, 50 80 Q 57 78, 62 74 Q 68 68, 66 60 Q 64 52, 60 45 Q 56 40, 50 40 Q 44 40, 40 45 Z"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* First leaf - Level 5 */}
        {features.hasFirstLeaf && (
          <motion.g
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path
              d="M 40 28 Q 33 22, 28 20 Q 25 18, 22 20 Q 19 24, 24 32 Q 32 36, 40 33 Z"
              fill="#10B981"
            />
            <path d="M 40 28 Q 33 24, 28 22" stroke="#059669" strokeWidth="0.5" fill="none" />
          </motion.g>
        )}

        {/* Second leaf - Level 6 */}
        {features.hasSecondLeaf && (
          <motion.g
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            <path
              d="M 60 28 Q 67 22, 72 20 Q 75 18, 78 20 Q 81 24, 76 32 Q 68 36, 60 33 Z"
              fill="#10B981"
            />
            <path d="M 60 28 Q 67 24, 72 22" stroke="#059669" strokeWidth="0.5" fill="none" />
          </motion.g>
        )}

        {/* Nub arms - Level 8 */}
        {features.hasNubArms && (
          <>
            <motion.ellipse
              cx="28"
              cy="58"
              rx="4"
              ry="6"
              fill="#84CC16"
              animate={{ cy: [58, 60, 58] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.ellipse
              cx="72"
              cy="58"
              rx="4"
              ry="6"
              fill="#84CC16"
              animate={{ cy: [58, 60, 58] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
          </>
        )}

        {/* FACIAL FEATURES GROUPED INSIDE BODY */}
        <motion.g>
          {/* Eyes */}
          <motion.ellipse
            cx="42"
            cy={features.isTallPear ? "48" : "58"}
            rx="3"
            ry={isBlinking ? "0.3" : "4"}
            fill="#065F46"
            transition={{ duration: 0.1 }}
          />
          {!isBlinking && (
            <ellipse cx="43" cy={features.isTallPear ? "46.5" : "56.5"} rx="1" ry="1.3" fill="white" opacity="0.9" />
          )}

          <motion.ellipse
            cx="58"
            cy={features.isTallPear ? "48" : "58"}
            rx="3"
            ry={isBlinking ? "0.3" : "4"}
            fill="#065F46"
            transition={{ duration: 0.1 }}
          />
          {!isBlinking && (
            <ellipse cx="59" cy={features.isTallPear ? "46.5" : "56.5"} rx="1" ry="1.3" fill="white" opacity="0.9" />
          )}

          {/* Smile */}
          <path
            d={features.isTallPear ? "M 40 58 Q 50 63, 60 58" : "M 42 66 Q 50 70, 58 66"}
            stroke="#065F46"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Blush - Level 7 */}
          {features.hasBlush && (
            <>
              <ellipse cx="35" cy={features.isTallPear ? "54" : "63"} rx="4" ry="2.5" fill="rgba(252, 165, 165, 0.6)" />
              <ellipse cx="65" cy={features.isTallPear ? "54" : "63"} rx="4" ry="2.5" fill="rgba(252, 165, 165, 0.6)" />
            </>
          )}
        </motion.g>
      </motion.svg>
    );
  }

  // ============================================
  // LEVELS 10-20: PEAR WITH ARMS + SPIRIT'S AWAKENING
  // ============================================
  if (level >= 10 && level <= 20) {
    return (
      <motion.svg
        width={size * microScale}
        height={size * microScale}
        viewBox="0 0 100 100"
        animate={features.hasBouncyIdle && isTimerActive ? {
          y: [0, -4, 0],
          rotate: [-1, 1, -1]
        } : {
          rotate: [-1.5, 1.5, -1.5]
        }}
        transition={
          features.hasBouncyIdle && isTimerActive
            ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <defs>
          <radialGradient id="pearGradient" cx="45%" cy="40%">
            <stop offset="0%" stopColor="#D9F99D" />
            <stop offset="50%" stopColor="#84CC16" />
            <stop offset="100%" stopColor="#65A30D" />
          </radialGradient>
          <radialGradient id="heartbeatGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(251, 191, 36, 0.8)" />
            <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
          </radialGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="50" cy="88" rx="24" ry="6" fill="rgba(0,0,0,0.15)" />

        {/* Spirit wisps - Level 12 */}
        {features.hasSpiritWisps && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.circle
                key={i}
                r="2"
                fill="rgba(167, 139, 250, 0.6)"
                animate={{
                  cx: [30 + i * 20, 35 + i * 20, 30 + i * 20],
                  cy: [30 + i * 10, 25 + i * 10, 30 + i * 10],
                  opacity: [0.3, 0.7, 0.3]
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.5
                }}
              />
            ))}
          </>
        )}

        {/* Pear-shaped body */}
        <motion.path
          d="M 38 35 Q 34 45, 32 55 Q 30 65, 35 72 Q 40 78, 50 80 Q 60 78, 65 72 Q 70 65, 68 55 Q 66 45, 62 35 Q 58 28, 50 28 Q 42 28, 38 35 Z"
          fill="url(#pearGradient)"
          animate={{
            d: [
              "M 38 35 Q 34 45, 32 55 Q 30 65, 35 72 Q 40 78, 50 80 Q 60 78, 65 72 Q 70 65, 68 55 Q 66 45, 62 35 Q 58 28, 50 28 Q 42 28, 38 35 Z",
              "M 39 36 Q 35 45, 33 55 Q 31 64, 36 71 Q 41 77, 50 79 Q 59 77, 64 71 Q 69 64, 67 55 Q 65 45, 61 36 Q 58 29, 50 29 Q 43 29, 39 36 Z",
              "M 38 35 Q 34 45, 32 55 Q 30 65, 35 72 Q 40 78, 50 80 Q 60 78, 65 72 Q 70 65, 68 55 Q 66 45, 62 35 Q 58 28, 50 28 Q 42 28, 38 35 Z"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Heartbeat glow - Level 11 */}
        {features.hasHeartbeat && (
          <motion.circle
            cx="50"
            cy="55"
            r="8"
            fill="url(#heartbeatGlow)"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Arms with hands - Level 13 adds hands */}
        <motion.g>
          <motion.ellipse
            cx="26"
            cy="55"
            rx="6"
            ry="9"
            fill="#84CC16"
            animate={{ cx: [26, 25, 26], cy: [55, 58, 55] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          {features.hasHands && (
            <>
              <circle cx="22" cy="60" r="2.5" fill="#A3E635" />
              <circle cx="24" cy="63" r="2" fill="#A3E635" />
              <circle cx="20" cy="63" r="2" fill="#A3E635" />
            </>
          )}
        </motion.g>

        <motion.g>
          <motion.ellipse
            cx="74"
            cy="55"
            rx="6"
            ry="9"
            fill="#84CC16"
            animate={{ cx: [74, 75, 74], cy: [55, 58, 55] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
          {features.hasHands && (
            <>
              <circle cx="78" cy="60" r="2.5" fill="#A3E635" />
              <circle cx="76" cy="63" r="2" fill="#A3E635" />
              <circle cx="80" cy="63" r="2" fill="#A3E635" />
            </>
          )}
        </motion.g>

        {/* Leaves on head */}
        <motion.g
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M 40 20 Q 33 14, 28 12 Q 25 10, 22 12 Q 19 16, 24 24 Q 32 28, 40 25 Z"
            fill="#10B981"
          />
          <path d="M 40 20 Q 33 16, 28 14" stroke="#059669" strokeWidth="0.5" fill="none" />
        </motion.g>

        <motion.g
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          <path
            d="M 60 20 Q 67 14, 72 12 Q 75 10, 78 12 Q 81 16, 76 24 Q 68 28, 60 25 Z"
            fill="#10B981"
          />
          <path d="M 60 20 Q 67 16, 72 14" stroke="#059669" strokeWidth="0.5" fill="none" />
        </motion.g>

        {/* Head bud - Level 15 */}
        {features.hasHeadBud && (
          <motion.circle
            cx="50"
            cy="18"
            r="3"
            fill="#FCA5A5"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* FACIAL FEATURES - PROPERLY GROUPED */}
        <motion.g>
          <motion.ellipse cx="42" cy="48" rx="3.5" ry={isBlinking ? "0.3" : "4.5"} fill="#065F46" transition={{ duration: 0.1 }} />
          {!isBlinking && <ellipse cx="43" cy="46.5" rx="1.2" ry="1.5" fill="white" opacity="0.9" />}

          <motion.ellipse cx="58" cy="48" rx="3.5" ry={isBlinking ? "0.3" : "4.5"} fill="#065F46" transition={{ duration: 0.1 }} />
          {!isBlinking && <ellipse cx="59" cy="46.5" rx="1.2" ry="1.5" fill="white" opacity="0.9" />}

          <path d="M 40 58 Q 50 63, 60 58" stroke="#065F46" strokeWidth="2" strokeLinecap="round" fill="none" />

          <ellipse cx="33" cy="54" rx="4.5" ry="3" fill="rgba(252, 165, 165, 0.6)" />
          <ellipse cx="67" cy="54" rx="4.5" ry="3" fill="rgba(252, 165, 165, 0.6)" />
        </motion.g>
      </motion.svg>
    );
  }

  // ============================================
  // LEVELS 21-30: FLOWER BLOOM + GUARDIAN'S ASCENDANCE
  // ============================================
  if (level >= 21 && level <= 30) {
    return (
      <motion.svg
        width={size * microScale}
        height={size * microScale}
        viewBox="0 0 100 100"
        animate={features.isHovering ? {
          y: [-2, 2, -2]
        } : {
          rotate: [-1.5, 1.5, -1.5]
        }}
        transition={
          features.isHovering
            ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <defs>
          <radialGradient id="bloomGradient" cx="45%" cy="40%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#A3E635" />
            <stop offset="100%" stopColor="#65A30D" />
          </radialGradient>
          <radialGradient id="focusAura" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(167, 139, 250, 0.4)" />
            <stop offset="100%" stopColor="rgba(167, 139, 250, 0)" />
          </radialGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="50" cy="88" rx="24" ry="6" fill="rgba(0,0,0,0.15)" />

        {/* Focus aura ring - Level 25 */}
        {features.hasFocusAura && (
          <motion.ellipse
            cx="50"
            cy="88"
            rx="35"
            ry="8"
            fill="url(#focusAura)"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Pollen particles - Level 27 */}
        {features.hasPollenParticles && (
          <>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.circle
                key={i}
                r="1.5"
                fill="#FDE047"
                animate={{
                  cx: [45 + i * 2, 48 + i * 2, 45 + i * 2],
                  cy: [20 + i * 3, 15 + i * 3, 20 + i * 3],
                  opacity: [0.4, 0.8, 0.4]
                }}
                transition={{
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.2
                }}
              />
            ))}
          </>
        )}

        {/* Leaf capes - Level 23 */}
        {features.hasLeafCapes && (
          <>
            <motion.path
              d="M 32 45 Q 20 50, 15 55 Q 18 60, 28 58 Z"
              fill="#10B981"
              opacity="0.8"
              animate={{
                d: [
                  "M 32 45 Q 20 50, 15 55 Q 18 60, 28 58 Z",
                  "M 32 45 Q 18 52, 13 57 Q 16 62, 28 60 Z",
                  "M 32 45 Q 20 50, 15 55 Q 18 60, 28 58 Z"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.path
              d="M 68 45 Q 80 50, 85 55 Q 82 60, 72 58 Z"
              fill="#10B981"
              opacity="0.8"
              animate={{
                d: [
                  "M 68 45 Q 80 50, 85 55 Q 82 60, 72 58 Z",
                  "M 68 45 Q 82 52, 87 57 Q 84 62, 72 60 Z",
                  "M 68 45 Q 80 50, 85 55 Q 82 60, 72 58 Z"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
          </>
        )}

        {/* Body */}
        <motion.path
          d="M 38 35 Q 34 45, 32 55 Q 30 65, 35 72 Q 40 78, 50 80 Q 60 78, 65 72 Q 70 65, 68 55 Q 66 45, 62 35 Q 58 28, 50 28 Q 42 28, 38 35 Z"
          fill="url(#bloomGradient)"
          animate={{
            d: [
              "M 38 35 Q 34 45, 32 55 Q 30 65, 35 72 Q 40 78, 50 80 Q 60 78, 65 72 Q 70 65, 68 55 Q 66 45, 62 35 Q 58 28, 50 28 Q 42 28, 38 35 Z",
              "M 39 36 Q 35 45, 33 55 Q 31 64, 36 71 Q 41 77, 50 79 Q 59 77, 64 71 Q 69 64, 67 55 Q 65 45, 61 36 Q 58 29, 50 29 Q 43 29, 39 36 Z",
              "M 38 35 Q 34 45, 32 55 Q 30 65, 35 72 Q 40 78, 50 80 Q 60 78, 65 72 Q 70 65, 68 55 Q 66 45, 62 35 Q 58 28, 50 28 Q 42 28, 38 35 Z"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Arms */}
        <motion.ellipse cx="26" cy="55" rx="6" ry="9" fill="#84CC16" animate={{ cx: [26, 25, 26], cy: [55, 58, 55] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.ellipse cx="74" cy="55" rx="6" ry="9" fill="#84CC16" animate={{ cx: [74, 75, 74], cy: [55, 58, 55] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }} />

        {/* Flower on head - rotating petals at level 21, larger at 27 */}
        <motion.g
          animate={features.hasRotatingFlower ? {
            rotate: [0, 360],
            scale: features.hasLargeFlower ? [1.5, 1.55, 1.5] : [1, 1.05, 1]
          } : {
            scale: features.hasLargeFlower ? [1.5, 1.55, 1.5] : [1, 1.05, 1]
          }}
          transition={features.hasRotatingFlower ? {
            rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          } : {
            duration: 3, repeat: Infinity, ease: 'easeInOut'
          }}
          style={{ transformOrigin: '50px 16px' }}
        >
          <circle cx="50" cy="16" r="4.5" fill="#FCA5A5" />
          <circle cx="44" cy="18" r="4.5" fill="#FCA5A5" />
          <circle cx="56" cy="18" r="4.5" fill="#FCA5A5" />
          <circle cx="46" cy="22" r="4.5" fill="#FCA5A5" />
          <circle cx="54" cy="22" r="4.5" fill="#FCA5A5" />
          <circle cx="50" cy="19" r="3.5" fill="#FDE047" />
        </motion.g>

        {/* FACIAL FEATURES - PROPERLY GROUPED */}
        <motion.g>
          {/* Sparkle eyes with trails - Level 22 */}
          <motion.g>
            <motion.ellipse cx="42" cy="48" rx="4" ry={isBlinking ? "0.3" : "5"} fill="#065F46" transition={{ duration: 0.1 }} />
            {!isBlinking && (
              <>
                <ellipse cx="43" cy="46" rx="1.5" ry="2" fill="white" opacity="0.9" />
                <motion.circle
                  cx="41"
                  cy="50"
                  r="0.8"
                  fill="white"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                {features.hasSparkleTrails && (
                  <>
                    <motion.circle cx="38" cy="48" r="1" fill="#FDE047" animate={{ opacity: [0, 0.6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
                    <motion.circle cx="40" cy="45" r="0.8" fill="#FDE047" animate={{ opacity: [0, 0.6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }} />
                  </>
                )}
              </>
            )}
          </motion.g>

          <motion.g>
            <motion.ellipse cx="58" cy="48" rx="4" ry={isBlinking ? "0.3" : "5"} fill="#065F46" transition={{ duration: 0.1 }} />
            {!isBlinking && (
              <>
                <ellipse cx="59" cy="46" rx="1.5" ry="2" fill="white" opacity="0.9" />
                <motion.circle
                  cx="57"
                  cy="50"
                  r="0.8"
                  fill="white"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                />
                {features.hasSparkleTrails && (
                  <>
                    <motion.circle cx="62" cy="48" r="1" fill="#FDE047" animate={{ opacity: [0, 0.6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
                    <motion.circle cx="60" cy="45" r="0.8" fill="#FDE047" animate={{ opacity: [0, 0.6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}  />
                  </>
                )}
              </>
            )}
          </motion.g>

          <path d="M 40 58 Q 50 63, 60 58" stroke="#065F46" strokeWidth="2" strokeLinecap="round" fill="none" />

          <ellipse cx="33" cy="54" rx="5" ry="3.5" fill="rgba(252, 165, 165, 0.7)" />
          <ellipse cx="67" cy="54" rx="5" ry="3.5" fill="rgba(252, 165, 165, 0.7)" />
        </motion.g>
      </motion.svg>
    );
  }

  // ============================================
  // LEVEL 30+: TRANSCENDENT FORM WITH LEVEL 33 AURA
  // ============================================
  return (
    <motion.svg
      width={size * microScale}
      height={size * microScale}
      viewBox="0 0 100 100"
      animate={{ y: [-3, 3, -3] }}
      transition={{ y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
    >
      <defs>
        <radialGradient id="transcendentGradient" cx="45%" cy="40%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="50%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
        <radialGradient id="haloGradient" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(251, 191, 36, 0.7)" />
          <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
        </radialGradient>
        <radialGradient id="transcendentAura" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(251, 191, 36, 0.5)" />
          <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
        </radialGradient>
      </defs>

      {/* Golden Halo */}
      <motion.circle
        cx="50"
        cy="45"
        r="42"
        fill="url(#haloGradient)"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.9, 0.6]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Transcendent aura floor ring - Level 33 */}
      {features.hasTranscendentAura && (
        <motion.ellipse
          cx="50"
          cy="88"
          rx="40"
          ry="10"
          fill="url(#transcendentAura)"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <ellipse cx="50" cy="88" rx="26" ry="6" fill="rgba(0,0,0,0.2)" />

      {/* Lotus-like body */}
      <motion.g
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path
          d="M 50 30 Q 45 40, 42 50 Q 40 60, 43 68 Q 47 75, 50 78 Q 53 75, 57 68 Q 60 60, 58 50 Q 55 40, 50 30 Z"
          fill="url(#transcendentGradient)"
        />
        <path
          d="M 42 50 Q 35 48, 30 50 Q 25 52, 25 58 Q 28 65, 35 68 Q 40 65, 42 60 Z"
          fill="#FCD34D"
          opacity="0.9"
        />
        <path
          d="M 58 50 Q 65 48, 70 50 Q 75 52, 75 58 Q 72 65, 65 68 Q 60 65, 58 60 Z"
          fill="#FCD34D"
          opacity="0.9"
        />
      </motion.g>

      {/* Sacred eye */}
      <motion.g
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ellipse cx="50" cy="52" rx="8" ry="10" fill="#F59E0B" opacity="0.3" />
        <ellipse cx="50" cy="52" rx="5" ry="6" fill="#65A30D" />
        {!isBlinking && <ellipse cx="50" cy="50" rx="2" ry="3" fill="white" opacity="0.95" />}
      </motion.g>

      {/* Crown leaves */}
      <motion.g
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M 50 25 Q 45 18, 42 15 Q 40 12, 38 14 Q 36 18, 40 24 Q 45 27, 50 26 Z" fill="#FCD34D" />
        <path d="M 50 25 Q 55 18, 58 15 Q 60 12, 62 14 Q 64 18, 60 24 Q 55 27, 50 26 Z" fill="#FCD34D" />
      </motion.g>

      {/* Sparkles */}
      {[
        { cx: 30, cy: 35, delay: 0 },
        { cx: 70, cy: 40, delay: 0.5 },
        { cx: 50, cy: 20, delay: 1 }
      ].map((sparkle, i) => (
        <motion.circle
          key={i}
          cx={sparkle.cx}
          cy={sparkle.cy}
          r="2"
          fill="#FDE047"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: sparkle.delay }}
        />
      ))}
    </motion.svg>
  );
};
