import React from 'react';
import { motion } from 'framer-motion';
import type { RarityType } from '../types';
import { RARITY_COLORS, RARITY_TEXT_COLORS } from '../data/biomes';

interface RarityDisplayProps {
  rarity: RarityType;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  animated?: boolean;
}

export const RarityDisplay: React.FC<RarityDisplayProps> = ({
  rarity,
  size = 'medium',
  showLabel = true,
  animated = true,
}) => {
  const sizeConfig = {
    small: { padding: '4px 8px', fontSize: '11px' },
    medium: { padding: '6px 12px', fontSize: '13px' },
    large: { padding: '8px 16px', fontSize: '15px' },
  };

  const rarityLabels = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
  };

  const rarityEmojis = {
    common: '⚪',
    uncommon: '🟢',
    rare: '🔵',
    epic: '🟣',
    legendary: '🟠',
  };

  const backgroundColor = RARITY_COLORS[rarity];
  const textColor = RARITY_TEXT_COLORS[rarity];

  const animationVariants: Record<RarityType, any> = {
    common: {},
    uncommon: {},
    rare: {},
    legendary: {
      boxShadow: [
        `0 0 10px ${backgroundColor}`,
        `0 0 20px ${backgroundColor}`,
        `0 0 10px ${backgroundColor}`,
      ],
    },
    epic: {
      boxShadow: [
        `0 0 8px ${backgroundColor}`,
        `0 0 16px ${backgroundColor}`,
        `0 0 8px ${backgroundColor}`,
      ],
    },
  };

  const animationConfig = animated && (rarity === 'legendary' || rarity === 'epic') ? {
    animate: animationVariants[rarity],
    transition: { duration: 2, repeat: Infinity },
  } : {};

  return (
    <motion.div
      {...animationConfig}
      style={{
        background: backgroundColor,
        color: textColor,
        padding: sizeConfig[size].padding,
        borderRadius: '12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 600,
        fontSize: sizeConfig[size].fontSize,
        fontFamily: "'Quicksand', sans-serif",
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1px solid ${backgroundColor}40`,
      }}
    >
      <span>{rarityEmojis[rarity]}</span>
      {showLabel && <span>{rarityLabels[rarity]}</span>}
    </motion.div>
  );
};
