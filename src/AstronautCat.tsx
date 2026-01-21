import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Evolution stages
const getEvolutionStage = (level: number) => {
  if (level >= 30) return 'starwalker';
  if (level >= 20) return 'commander';
  if (level >= 10) return 'pilot';
  return 'cadet';
};

interface AstronautCatProps {
  size?: number;
  level: number;
  isTimerActive?: boolean;
  theme: 'morning' | 'twilight' | 'golden' | 'midnight';
}

export const AstronautCat: React.FC<AstronautCatProps> = ({
  size = 80,
  level,
  isTimerActive = false,
  theme
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const stage = getEvolutionStage(level);

  // Animation speed increases when timer is active
  const floatDuration = isTimerActive ? 2.5 : 4;

  // Get theme accent color
  const getAccentColor = () => {
    const accentMap = {
      morning: 'rgba(167, 139, 250, 0.8)',
      twilight: '#F472B6',
      golden: 'rgba(251, 191, 36, 0.8)',
      midnight: 'rgba(59, 130, 246, 0.8)'
    };
    return accentMap[theme];
  };

  // Get theme-aware fur color (dark for light themes)
  const getFurColor = () => {
    const isDarkTheme = theme === 'twilight' || theme === 'midnight';
    return isDarkTheme ? '#E5E7EB' : '#1E3A8A'; // Light gray for dark themes, ink blue for light themes
  };

  const accentColor = getAccentColor();
  const furColor = getFurColor();

  // Blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, Math.random() * 2000 + 3000);
    return () => clearInterval(blinkInterval);
  }, []);

  // ============================================
  // LEVEL 1-9: THE CADET (Cardboard Box Helmet)
  // ============================================
  if (stage === 'cadet') {
    return (
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        animate={{
          y: [0, -10, 0]
        }}
        transition={{
          duration: floatDuration,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        {/* Shadow */}
        <ellipse cx="50" cy="88" rx="22" ry="5" fill="rgba(0,0,0,0.2)" />

        {/* Cat body */}
        <motion.g>
          {/* Body */}
          <ellipse cx="50" cy="68" rx="16" ry="18" fill={furColor} />

          {/* Paws */}
          <ellipse cx="43" cy="82" rx="5" ry="7" fill={furColor} />
          <ellipse cx="57" cy="82" rx="5" ry="7" fill={furColor} />

          {/* Tail */}
          <motion.path
            d="M 35 68 Q 25 70, 22 75"
            stroke={furColor}
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            animate={{
              d: [
                "M 35 68 Q 25 70, 22 75",
                "M 35 68 Q 23 68, 20 73",
                "M 35 68 Q 25 70, 22 75"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.g>

        {/* Cardboard Box Helmet */}
        <motion.g
          animate={{
            y: [0, -2, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {/* Box */}
          <rect
            x="35"
            y="35"
            width="30"
            height="28"
            fill="#8B4513"
            stroke="#654321"
            strokeWidth="1.5"
            rx="2"
          />

          {/* Tape strips */}
          <rect x="38" y="45" width="24" height="2" fill="rgba(200, 200, 180, 0.6)" />
          <rect x="38" y="52" width="24" height="2" fill="rgba(200, 200, 180, 0.6)" />

          {/* Viewing window (rough cut) */}
          <motion.rect
            x="40"
            y="40"
            width="20"
            height="15"
            fill="rgba(135, 206, 250, 0.3)"
            stroke="#654321"
            strokeWidth="1"
            animate={{
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Cat face visible through window */}
          <g>
            {/* Ears inside box */}
            <path d="M 42 36 L 39 30 L 46 36 Z" fill={furColor} />
            <path d="M 58 36 L 61 30 L 54 36 Z" fill={furColor} />

            {/* Eyes */}
            <motion.ellipse
              cx="44"
              cy="48"
              rx="2"
              ry={isBlinking ? "0.3" : "2.5"}
              fill="#1F2937"
              transition={{ duration: 0.1 }}
            />
            {!isBlinking && <circle cx="44.5" cy="47.5" r="0.8" fill="white" opacity="0.9" />}

            <motion.ellipse
              cx="56"
              cy="48"
              rx="2"
              ry={isBlinking ? "0.3" : "2.5"}
              fill="#1F2937"
              transition={{ duration: 0.1 }}
            />
            {!isBlinking && <circle cx="56.5" cy="47.5" r="0.8" fill="white" opacity="0.9" />}

            {/* Nose */}
            <path d="M 50 51 L 48 53 L 52 53 Z" fill="#EC4899" />

            {/* Whiskers */}
            <line x1="38" y1="50" x2="42" y2="50" stroke={furColor} strokeWidth="0.5" />
            <line x1="38" y1="52" x2="42" y2="51" stroke={furColor} strokeWidth="0.5" />
            <line x1="58" y1="50" x2="62" y2="50" stroke={furColor} strokeWidth="0.5" />
            <line x1="58" y1="51" x2="62" y2="52" stroke={furColor} strokeWidth="0.5" />
          </g>
        </motion.g>

        {/* "SPACE CADET" label on box */}
        <text x="50" y="60" fontSize="4" fill="#654321" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
          CADET
        </text>
      </motion.svg>
    );
  }

  // ============================================
  // LEVEL 10-19: THE PILOT (Glassmorphism Helmet + Jetpack)
  // ============================================
  if (stage === 'pilot') {
    return (
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        animate={{
          y: [0, -10, 0]
        }}
        transition={{
          duration: floatDuration,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <defs>
          <radialGradient id="glassGradient" cx="50%" cy="30%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.05)" />
          </radialGradient>
          <filter id="blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>

        {/* Shadow */}
        <ellipse cx="50" cy="88" rx="24" ry="5" fill="rgba(0,0,0,0.2)" />

        {/* Jetpack smoke particles */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            r="2"
            fill="rgba(200, 200, 200, 0.5)"
            animate={{
              cx: [42 + i * 8, 42 + i * 8],
              cy: [78, 88],
              opacity: [0.6, 0],
              r: [2, 4]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
              delay: i * 0.3
            }}
          />
        ))}

        {/* Cat body */}
        <motion.g>
          {/* Body */}
          <ellipse cx="50" cy="68" rx="18" ry="20" fill={furColor} />

          {/* Arms */}
          <ellipse cx="36" cy="68" rx="5" ry="10" fill={furColor} />
          <ellipse cx="64" cy="68" rx="5" ry="10" fill={furColor} />

          {/* Paws */}
          <ellipse cx="43" cy="82" rx="5" ry="7" fill={furColor} />
          <ellipse cx="57" cy="82" rx="5" ry="7" fill={furColor} />

          {/* Tail */}
          <motion.path
            d="M 35 68 Q 25 70, 22 75"
            stroke={furColor}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            animate={{
              d: [
                "M 35 68 Q 25 70, 22 75",
                "M 35 68 Q 23 68, 20 73",
                "M 35 68 Q 25 70, 22 75"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.g>

        {/* Jetpack */}
        <g>
          <rect x="42" y="70" width="6" height="12" fill="#374151" rx="2" />
          <rect x="52" y="70" width="6" height="12" fill="#374151" rx="2" />
          <circle cx="45" cy="76" r="2" fill={accentColor} />
          <circle cx="55" cy="76" r="2" fill={accentColor} />
        </g>

        {/* Glassmorphism Helmet */}
        <motion.g
          animate={{
            scale: [1, 1.02, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {/* Helmet dome */}
          <circle
            cx="50"
            cy="48"
            r="20"
            fill="url(#glassGradient)"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1.5"
            style={{ backdropFilter: 'blur(5px)' }}
          />

          {/* Helmet reflection */}
          <motion.ellipse
            cx="45"
            cy="40"
            rx="8"
            ry="12"
            fill="rgba(255, 255, 255, 0.2)"
            animate={{
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Cat face inside helmet */}
          <g>
            {/* Ears */}
            <path d="M 38 38 L 34 30 L 42 36 Z" fill={furColor} />
            <path d="M 62 38 L 66 30 L 58 36 Z" fill={furColor} />

            {/* Eyes */}
            <motion.ellipse
              cx="44"
              cy="48"
              rx="2.5"
              ry={isBlinking ? "0.3" : "3"}
              fill="#1F2937"
              transition={{ duration: 0.1 }}
            />
            {!isBlinking && <circle cx="44.5" cy="47" r="1" fill="white" opacity="0.9" />}

            <motion.ellipse
              cx="56"
              cy="48"
              rx="2.5"
              ry={isBlinking ? "0.3" : "3"}
              fill="#1F2937"
              transition={{ duration: 0.1 }}
            />
            {!isBlinking && <circle cx="56.5" cy="47" r="1" fill="white" opacity="0.9" />}

            {/* Nose */}
            <path d="M 50 52 L 48 54 L 52 54 Z" fill="#EC4899" />

            {/* Smile */}
            <path
              d="M 46 56 Q 50 58, 54 56"
              stroke={furColor}
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        </motion.g>
      </motion.svg>
    );
  }

  // ============================================
  // LEVEL 20-29: THE COMMANDER (Mechanical Suit + Floating Aura)
  // ============================================
  if (stage === 'commander') {
    return (
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        animate={{
          y: [0, -10, 0]
        }}
        transition={{
          duration: floatDuration,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <defs>
          <radialGradient id="auraGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor={`${accentColor}40`} />
            <stop offset="100%" stopColor={`${accentColor}00`} />
          </radialGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="50" cy="88" rx="26" ry="5" fill="rgba(0,0,0,0.25)" />

        {/* Floating Aura */}
        <motion.ellipse
          cx="50"
          cy="58"
          rx="36"
          ry="40"
          fill="url(#auraGradient)"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Mechanical Suit Body */}
        <g>
          {/* Torso */}
          <rect x="38" y="62" width="24" height="20" fill="#374151" rx="3" />

          {/* Chest panel */}
          <rect x="42" y="66" width="16" height="12" fill="#1F2937" rx="2" />

          {/* Glowing buttons */}
          <motion.circle
            cx="46"
            cy="70"
            r="1.5"
            fill={accentColor}
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="50"
            cy="70"
            r="1.5"
            fill={accentColor}
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
          <motion.circle
            cx="54"
            cy="70"
            r="1.5"
            fill={accentColor}
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          />

          {/* Arms */}
          <rect x="30" y="64" width="7" height="16" fill="#4B5563" rx="2" />
          <rect x="63" y="64" width="7" height="16" fill="#4B5563" rx="2" />

          {/* Shoulder pads */}
          <rect x="32" y="62" width="8" height="5" fill="#6B7280" rx="1" />
          <rect x="60" y="62" width="8" height="5" fill="#6B7280" rx="1" />

          {/* Legs */}
          <rect x="42" y="80" width="6" height="8" fill="#4B5563" rx="2" />
          <rect x="52" y="80" width="6" height="8" fill="#4B5563" rx="2" />
        </g>

        {/* Advanced Helmet */}
        <motion.g
          animate={{
            scale: [1, 1.015, 1]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {/* Helmet dome */}
          <circle
            cx="50"
            cy="48"
            r="22"
            fill="url(#glassGradient)"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="2"
          />

          {/* Visor */}
          <ellipse
            cx="50"
            cy="50"
            rx="18"
            ry="10"
            fill="rgba(100, 200, 255, 0.2)"
            stroke={accentColor}
            strokeWidth="1"
          />

          {/* Cat face */}
          <g>
            {/* Ears */}
            <path d="M 36 36 L 32 28 L 40 34 Z" fill={furColor} />
            <path d="M 64 36 L 68 28 L 60 34 Z" fill={furColor} />

            {/* Eyes with glow */}
            <motion.ellipse
              cx="44"
              cy="48"
              rx="3"
              ry={isBlinking ? "0.3" : "3.5"}
              fill={accentColor}
              animate={{
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.ellipse
              cx="56"
              cy="48"
              rx="3"
              ry={isBlinking ? "0.3" : "3.5"}
              fill={accentColor}
              animate={{
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            />

            {/* Nose */}
            <path d="M 50 53 L 48 55 L 52 55 Z" fill="#EC4899" />
          </g>

          {/* Antenna */}
          <line x1="50" y1="26" x2="50" y2="20" stroke={accentColor} strokeWidth="1.5" />
          <motion.circle
            cx="50"
            cy="20"
            r="2"
            fill={accentColor}
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.g>
      </motion.svg>
    );
  }

  // ============================================
  // LEVEL 30+: THE STAR-WALKER (Constellation Pattern + Ancient Armor)
  // ============================================
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      animate={{
        y: [0, -10, 0]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      <defs>
        <radialGradient id="goldenHalo" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(251, 191, 36, 0.6)" />
          <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
        </radialGradient>
        <pattern id="constellationPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#1E1B4B" />
          <circle cx="5" cy="5" r="0.5" fill="white" opacity="0.8" />
          <circle cx="15" cy="8" r="0.3" fill="white" opacity="0.6" />
          <circle cx="10" cy="15" r="0.4" fill="white" opacity="0.7" />
          <circle cx="3" cy="17" r="0.3" fill="white" opacity="0.5" />
        </pattern>
      </defs>

      {/* Golden Halo */}
      <motion.circle
        cx="50"
        cy="45"
        r="45"
        fill="url(#goldenHalo)"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* Shadow */}
      <ellipse cx="50" cy="88" rx="28" ry="6" fill="rgba(0,0,0,0.3)" />

      {/* Floating sparkles */}
      {[
        { cx: 25, cy: 35, delay: 0 },
        { cx: 75, cy: 40, delay: 0.5 },
        { cx: 50, cy: 20, delay: 1 },
        { cx: 30, cy: 60, delay: 1.5 }
      ].map((sparkle, i) => (
        <motion.circle
          key={i}
          cx={sparkle.cx}
          cy={sparkle.cy}
          r="1.5"
          fill="#FDE047"
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.3, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: sparkle.delay
          }}
        />
      ))}

      {/* Ancient Armor Body */}
      <g>
        {/* Ornate chest piece */}
        <rect x="36" y="60" width="28" height="24" fill="#2C1A5F" rx="4" />
        <rect x="38" y="62" width="24" height="20" fill="#3B2A6F" rx="3" />

        {/* Geometric patterns */}
        <motion.path
          d="M 42 68 L 50 64 L 58 68 L 50 72 Z"
          fill="url(#goldenHalo)"
          stroke="#FBBF24"
          strokeWidth="0.5"
          animate={{
            opacity: [0.6, 1, 0.6]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Shoulder guards */}
        <path d="M 28 62 L 36 60 L 36 68 L 30 70 Z" fill="#4C3A7F" stroke="#FBBF24" strokeWidth="0.5" />
        <path d="M 72 62 L 64 60 L 64 68 L 70 70 Z" fill="#4C3A7F" stroke="#FBBF24" strokeWidth="0.5" />

        {/* Arms with constellation pattern */}
        <rect x="28" y="64" width="8" height="18" fill="url(#constellationPattern)" rx="2" />
        <rect x="64" y="64" width="8" height="18" fill="url(#constellationPattern)" rx="2" />

        {/* Legs */}
        <rect x="40" y="82" width="8" height="8" fill="#3B2A6F" rx="2" />
        <rect x="52" y="82" width="8" height="8" fill="#3B2A6F" rx="2" />
      </g>

      {/* Majestic Helmet */}
      <motion.g
        animate={{
          scale: [1, 1.01, 1]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        {/* Helmet base with constellation pattern */}
        <circle
          cx="50"
          cy="46"
          r="24"
          fill="url(#constellationPattern)"
          stroke="#FBBF24"
          strokeWidth="2"
        />

        {/* Golden trim */}
        <motion.circle
          cx="50"
          cy="46"
          r="24"
          fill="none"
          stroke="#FBBF24"
          strokeWidth="1"
          strokeDasharray="4 2"
          animate={{
            rotate: [0, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{ transformOrigin: '50px 46px' }}
        />

        {/* Ornate visor */}
        <ellipse
          cx="50"
          cy="48"
          rx="20"
          ry="12"
          fill="rgba(251, 191, 36, 0.2)"
          stroke="#FBBF24"
          strokeWidth="1.5"
        />

        {/* Cat face with cosmic eyes */}
        <g>
          {/* Ears */}
          <path d="M 34 32 L 30 22 L 38 30 Z" fill="url(#constellationPattern)" stroke="#FBBF24" strokeWidth="0.5" />
          <path d="M 66 32 L 70 22 L 62 30 Z" fill="url(#constellationPattern)" stroke="#FBBF24" strokeWidth="0.5" />

          {/* Cosmic eyes */}
          <motion.g>
            <ellipse
              cx="43"
              cy="46"
              rx="4"
              ry={isBlinking ? "0.3" : "5"}
              fill="#FBBF24"
              filter="url(#blur)"
            />
            <motion.circle
              cx="43"
              cy="46"
              r="2"
              fill="white"
              animate={{
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.g>

          <motion.g>
            <ellipse
              cx="57"
              cy="46"
              rx="4"
              ry={isBlinking ? "0.3" : "5"}
              fill="#FBBF24"
              filter="url(#blur)"
            />
            <motion.circle
              cx="57"
              cy="46"
              r="2"
              fill="white"
              animate={{
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
          </motion.g>

          {/* Nose */}
          <path d="M 50 52 L 48 54 L 52 54 Z" fill="#FBBF24" />
        </g>

        {/* Crown ornaments */}
        <motion.g
          animate={{
            y: [0, -2, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <path d="M 44 22 L 42 16 L 46 20 Z" fill="#FBBF24" />
          <path d="M 50 20 L 48 14 L 52 18 Z" fill="#FBBF24" />
          <path d="M 56 22 L 54 16 L 58 20 Z" fill="#FBBF24" />
        </motion.g>
      </motion.g>

      {/* Mystic symbols floating around */}
      {['◇', '✦', '◈'].map((symbol, i) => (
        <motion.text
          key={i}
          x={30 + i * 20}
          y={30 + i * 10}
          fontSize="8"
          fill="#FBBF24"
          opacity="0.6"
          animate={{
            y: [30 + i * 10, 25 + i * 10, 30 + i * 10],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5
          }}
        >
          {symbol}
        </motion.text>
      ))}
    </motion.svg>
  );
};
