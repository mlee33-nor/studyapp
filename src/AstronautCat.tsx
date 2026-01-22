import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AstronautCatProps {
  size?: number;
  level: number;
  isTimerActive?: boolean;
  theme: 'morning' | 'twilight' | 'golden' | 'midnight';
}

export const AstronautCat: React.FC<AstronautCatProps> = ({
  size = 80,
  isTimerActive = false,
  theme
}) => {
  const [isBlinking, setIsBlinking] = useState(false);

  // Animation speed increases when timer is active
  const floatDuration = isTimerActive ? 2 : 3.5;

  // Get theme accent color for stars
  const getStarColor = () => {
    const starMap = {
      morning: '#A78BFA',
      twilight: '#F472B6',
      golden: '#FBBF24',
      midnight: '#3B82F6'
    };
    return starMap[theme];
  };

  const starColor = getStarColor();

  // Blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, Math.random() * 3000 + 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Star positions around the cat
  const stars = [
    { x: 20, y: 20, size: 6, delay: 0 },
    { x: 80, y: 25, size: 8, delay: 0.3 },
    { x: 15, y: 50, size: 5, delay: 0.6 },
    { x: 85, y: 55, size: 7, delay: 0.9 },
    { x: 50, y: 10, size: 6, delay: 1.2 },
  ];

  const sparkles = [
    { x: 30, y: 35, delay: 0.2 },
    { x: 70, y: 40, delay: 0.5 },
    { x: 25, y: 65, delay: 0.8 },
    { x: 75, y: 70, delay: 1.1 },
  ];

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      animate={{
        y: [0, -8, 0]
      }}
      transition={{
        duration: floatDuration,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {/* Twinkling Stars */}
      {stars.map((star, i) => (
        <motion.g
          key={`star-${i}`}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: star.delay
          }}
          style={{ transformOrigin: `${star.x}px ${star.y}px` }}
        >
          {/* Star shape */}
          <path
            d={`M ${star.x} ${star.y - star.size / 2}
                L ${star.x + star.size * 0.2} ${star.y - star.size * 0.15}
                L ${star.x + star.size / 2} ${star.y}
                L ${star.x + star.size * 0.2} ${star.y + star.size * 0.15}
                L ${star.x} ${star.y + star.size / 2}
                L ${star.x - star.size * 0.2} ${star.y + star.size * 0.15}
                L ${star.x - star.size / 2} ${star.y}
                L ${star.x - star.size * 0.2} ${star.y - star.size * 0.15} Z`}
            fill={starColor}
          />
        </motion.g>
      ))}

      {/* Sparkles (small white dots) */}
      {sparkles.map((sparkle, i) => (
        <motion.circle
          key={`sparkle-${i}`}
          cx={sparkle.x}
          cy={sparkle.y}
          r="1.5"
          fill="white"
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: sparkle.delay
          }}
        />
      ))}

      {/* Shadow */}
      <ellipse cx="50" cy="90" rx="18" ry="4" fill="rgba(0,0,0,0.15)" />

      {/* Cat Body (Orange) */}
      <g>
        {/* Main body */}
        <ellipse cx="50" cy="65" rx="14" ry="16" fill="#FF9E5C" />

        {/* Arms */}
        <ellipse cx="38" cy="68" rx="4" ry="8" fill="#FF9E5C" />
        <ellipse cx="62" cy="68" rx="4" ry="8" fill="#FF9E5C" />

        {/* Legs */}
        <ellipse cx="45" cy="78" rx="4" ry="6" fill="#FF9E5C" />
        <ellipse cx="55" cy="78" rx="4" ry="6" fill="#FF9E5C" />

        {/* Tail */}
        <motion.path
          d="M 36 65 Q 28 66, 25 70"
          stroke="#FF9E5C"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          animate={{
            d: [
              "M 36 65 Q 28 66, 25 70",
              "M 36 65 Q 26 64, 23 68",
              "M 36 65 Q 28 66, 25 70"
            ]
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </g>

      {/* White Spacesuit Details */}
      <g>
        {/* Chest panel */}
        <rect x="45" y="62" width="10" height="8" fill="white" rx="2" />

        {/* Control panel details */}
        <rect x="47" y="64" width="2" height="2" fill={starColor} rx="0.5" />
        <rect x="51" y="64" width="2" height="2" fill={starColor} rx="0.5" />
        <rect x="47" y="67" width="6" height="1" fill="#D1D5DB" rx="0.5" />

        {/* Gloves */}
        <circle cx="38" cy="73" r="3" fill="white" />
        <circle cx="62" cy="73" r="3" fill="white" />

        {/* Boots */}
        <ellipse cx="45" cy="82" rx="4.5" ry="3" fill="white" />
        <ellipse cx="55" cy="82" rx="4.5" ry="3" fill="white" />
      </g>

      {/* Helmet */}
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
        {/* Helmet bubble */}
        <circle
          cx="50"
          cy="45"
          r="18"
          fill="rgba(255, 255, 255, 0.2)"
          stroke="white"
          strokeWidth="2.5"
        />

        {/* Helmet shine/reflection */}
        <motion.ellipse
          cx="44"
          cy="38"
          rx="6"
          ry="9"
          fill="rgba(255, 255, 255, 0.4)"
          animate={{
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Helmet rim */}
        <ellipse cx="50" cy="58" rx="16" ry="5" fill="white" />
      </motion.g>

      {/* Cat Face Inside Helmet */}
      <g>
        {/* Head */}
        <circle cx="50" cy="45" r="13" fill="#FF9E5C" />

        {/* Ears */}
        <path d="M 40 38 L 37 32 L 43 36 Z" fill="#FF9E5C" />
        <path d="M 60 38 L 63 32 L 57 36 Z" fill="#FF9E5C" />

        {/* Inner ears */}
        <path d="M 40 37 L 39 34 L 42 36 Z" fill="#FFB380" />
        <path d="M 60 37 L 61 34 L 58 36 Z" fill="#FFB380" />

        {/* Kawaii Eyes (^_^) */}
        <motion.path
          d="M 42 45 Q 44 47, 46 45"
          stroke="#2D3748"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          animate={{
            d: isBlinking
              ? "M 42 45 L 46 45"
              : "M 42 45 Q 44 47, 46 45"
          }}
          transition={{ duration: 0.1 }}
        />
        <motion.path
          d="M 54 45 Q 56 47, 58 45"
          stroke="#2D3748"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          animate={{
            d: isBlinking
              ? "M 54 45 L 58 45"
              : "M 54 45 Q 56 47, 58 45"
          }}
          transition={{ duration: 0.1 }}
        />

        {/* Cute nose */}
        <path d="M 50 50 L 48 52 L 52 52 Z" fill="#FF6B9D" />

        {/* Smile */}
        <path
          d="M 46 54 Q 50 56, 54 54"
          stroke="#2D3748"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cheek blushes */}
        <ellipse cx="40" cy="50" rx="3" ry="2" fill="#FFB380" opacity="0.5" />
        <ellipse cx="60" cy="50" rx="3" ry="2" fill="#FFB380" opacity="0.5" />

        {/* Whiskers */}
        <line x1="35" y1="48" x2="39" y2="48" stroke="#2D3748" strokeWidth="0.8" />
        <line x1="35" y1="51" x2="39" y2="50" stroke="#2D3748" strokeWidth="0.8" />
        <line x1="61" y1="48" x2="65" y2="48" stroke="#2D3748" strokeWidth="0.8" />
        <line x1="61" y1="50" x2="65" y2="51" stroke="#2D3748" strokeWidth="0.8" />
      </g>
    </motion.svg>
  );
};
