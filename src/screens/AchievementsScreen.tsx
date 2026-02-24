import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { UserData } from '../types';
import type { Achievement } from '../utils/achievements';
import { getAchievementStats, getNextAchievements } from '../utils/achievements';

interface AchievementsScreenProps {
  userData: UserData;
  theme: 'morning' | 'midnight';
}

const getTextColor = (theme: 'morning' | 'midnight', type: 'primary' | 'secondary' | 'tertiary') => {
  const isDarkText = theme === 'morning';

  const colorMap = {
    dark: {
      primary: 'rgba(15, 23, 42, 0.95)',
      secondary: 'rgba(51, 65, 85, 0.8)',
      tertiary: 'rgba(100, 116, 139, 0.7)'
    },
    light: {
      primary: 'rgba(255, 255, 255, 0.9)',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.5)'
    }
  };

  return isDarkText ? colorMap.dark[type] : colorMap.light[type];
};

const getCardBackground = (theme: 'morning' | 'midnight', type: 'primary' | 'secondary' | 'unlocked' | 'locked') => {
  const isLightTheme = theme === 'morning';

  const colorMap = {
    light: {
      primary: 'rgba(255, 255, 255, 0.7)',
      secondary: 'rgba(255, 255, 255, 0.5)',
      unlocked: 'linear-gradient(135deg, rgba(167, 139, 250, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)',
      locked: 'rgba(255, 255, 255, 0.4)'
    },
    dark: {
      primary: 'rgba(167, 139, 250, 0.25)',
      secondary: 'rgba(167, 139, 250, 0.2)',
      unlocked: 'linear-gradient(135deg, rgba(167, 139, 250, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)',
      locked: 'rgba(167, 139, 250, 0.15)'
    }
  };

  return isLightTheme ? colorMap.light[type] : colorMap.dark[type];
};

const getCardBorder = (theme: 'morning' | 'midnight', type: 'primary' | 'secondary' | 'unlocked' | 'locked') => {
  const isLightTheme = theme === 'morning';

  const colorMap = {
    light: {
      primary: 'rgba(255, 255, 255, 0.6)',
      secondary: 'rgba(255, 255, 255, 0.4)',
      unlocked: 'rgba(167, 139, 250, 0.4)',
      locked: 'rgba(255, 255, 255, 0.3)'
    },
    dark: {
      primary: 'rgba(167, 139, 250, 0.4)',
      secondary: 'rgba(167, 139, 250, 0.35)',
      unlocked: 'rgba(167, 139, 250, 0.5)',
      locked: 'rgba(167, 139, 250, 0.3)'
    }
  };

  return isLightTheme ? colorMap.light[type] : colorMap.dark[type];
};

const getCardShadow = (theme: 'morning' | 'midnight', type?: 'primary' | 'unlocked') => {
  const isLightTheme = theme === 'morning';

  if (type === 'unlocked') {
    return isLightTheme ? '0 4px 15px rgba(167, 139, 250, 0.15)' : '0 4px 15px rgba(167, 139, 250, 0.2)';
  }

  return isLightTheme ? '0 8px 32px rgba(147, 197, 253, 0.15)' : '0 8px 32px rgba(167, 139, 250, 0.2)';
};

const AchievementsScreen: React.FC<AchievementsScreenProps> = ({ userData, theme }) => {
  const stats = getAchievementStats(userData);
  const nextAchievements = getNextAchievements(userData, 3);
  const unlockedAchievements = stats.achievements.filter(a => a.unlocked);
  const lockedAchievements = stats.achievements.filter(a => !a.unlocked);
  const [flippedCard, setFlippedCard] = useState<string | null>(null);

  const handleCardClick = (achievementId: string) => {
    setFlippedCard(flippedCard === achievementId ? null : achievementId);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '0 24px calc(68px + max(12px, env(safe-area-inset-bottom, 12px)))', position: 'relative', zIndex: 1 }}
    >
      {/* Overall Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: getCardBackground(theme, 'primary'),
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          borderRadius: '32px',
          padding: '24px',
          marginBottom: '24px',
          border: `1px solid ${getCardBorder(theme, 'primary')}`,
          boxShadow: getCardShadow(theme),
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{
              fontSize: '28px',
              fontWeight: 700,
              color: getTextColor(theme, 'primary'),
              fontFamily: "'Quicksand', sans-serif"
            }}>
              {stats.unlockedCount} / {stats.totalCount}
            </div>
            <div style={{
              fontSize: '13px',
              color: getTextColor(theme, 'secondary'),
              fontFamily: "'Quicksand', sans-serif"
            }}>
              Achievements Unlocked
            </div>
          </div>
          <div style={{
            fontSize: '48px'
          }}>
            🏆
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '12px',
            color: getTextColor(theme, 'secondary'),
            fontWeight: 600,
            fontFamily: "'Quicksand', sans-serif"
          }}>
            <span>Progress</span>
            <span>{Math.round(stats.unlockedPercentage)}%</span>
          </div>
          <div style={{
            width: '100%',
            height: '12px',
            background: 'rgba(100, 116, 139, 0.2)',
            borderRadius: '100px',
            overflow: 'hidden'
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.unlockedPercentage}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, rgba(244, 114, 182, 0.8) 0%, rgba(168, 85, 247, 0.8) 100%)',
                boxShadow: '0 2px 10px rgba(244, 114, 182, 0.5)'
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Next Achievements Section */}
      {nextAchievements.length > 0 && (
        <>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: getTextColor(theme, 'primary'),
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: "'Quicksand', sans-serif"
          }}>
            Next Objectives
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {nextAchievements.map((achievement: Achievement, index: number) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  background: getCardBackground(theme, 'secondary'),
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  padding: '16px',
                  borderRadius: '20px',
                  border: `1px solid ${getCardBorder(theme, 'secondary')}`,
                  boxShadow: getCardShadow(theme, 'unlocked'),
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center'
                  }}>
                    <div style={{ fontSize: '24px' }}>
                      {achievement.emoji}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: getTextColor(theme, 'primary'),
                        fontFamily: "'Quicksand', sans-serif"
                      }}>
                        {achievement.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: getTextColor(theme, 'tertiary'),
                        fontFamily: "'Quicksand', sans-serif"
                      }}>
                        {achievement.description}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'rgba(139, 92, 246, 0.9)',
                    fontFamily: "'Quicksand', sans-serif"
                  }}>
                    {Math.round(achievement.progress)}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(100, 116, 139, 0.2)',
                  borderRadius: '100px',
                  overflow: 'hidden'
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${achievement.progress}%` }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, rgba(167, 139, 250, 0.6) 0%, rgba(139, 92, 246, 0.6) 100%)',
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Unlocked Achievements Section */}
      {unlockedAchievements.length > 0 && (
        <>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: getTextColor(theme, 'primary'),
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: "'Quicksand', sans-serif"
          }}>
            Unlocked ({unlockedAchievements.length})
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}>
            {unlockedAchievements.map((achievement: Achievement, index: number) => {
              const isFlipped = flippedCard === achievement.id;
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleCardClick(achievement.id)}
                  style={{
                    perspective: '1000px',
                    cursor: 'pointer',
                    height: '140px'
                  }}
                >
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    {/* Front of card */}
                    <div
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        background: getCardBackground(theme, 'unlocked'),
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        padding: '16px 12px',
                        borderRadius: '20px',
                        border: `1px solid ${getCardBorder(theme, 'unlocked')}`,
                        boxShadow: getCardShadow(theme, 'unlocked'),
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                        {achievement.emoji}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: getTextColor(theme, 'primary'),
                        marginBottom: '4px',
                        fontFamily: "'Quicksand', sans-serif"
                      }}>
                        {achievement.name}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: 'rgba(139, 92, 246, 0.8)',
                        fontFamily: "'Quicksand', sans-serif"
                      }}>
                        ✓ Unlocked
                      </div>
                    </div>

                    {/* Back of card */}
                    <div
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: getCardBackground(theme, 'unlocked'),
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        padding: '16px 12px',
                        borderRadius: '20px',
                        border: `1px solid ${getCardBorder(theme, 'unlocked')}`,
                        boxShadow: getCardShadow(theme, 'unlocked'),
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        color: getTextColor(theme, 'primary'),
                        marginBottom: '8px',
                        fontFamily: "'Quicksand', sans-serif",
                        lineHeight: '1.4'
                      }}>
                        {achievement.description}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: 'rgba(139, 92, 246, 0.8)',
                        fontFamily: "'Quicksand', sans-serif"
                      }}>
                        Tap to flip back
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Locked Achievements Section */}
      {lockedAchievements.length > 0 && (
        <>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: getTextColor(theme, 'primary'),
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: "'Quicksand', sans-serif"
          }}>
            Locked ({lockedAchievements.length})
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '12px'
          }}>
            {lockedAchievements.map((achievement: Achievement) => (
              <motion.div
                key={achievement.id}
                style={{
                  background: getCardBackground(theme, 'locked'),
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  padding: '16px 12px',
                  borderRadius: '20px',
                  border: `1px solid ${getCardBorder(theme, 'locked')}`,
                  textAlign: 'center',
                  opacity: 0.6
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px', filter: 'grayscale(100%)' }}>
                  {achievement.emoji}
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: getTextColor(theme, 'primary'),
                  marginBottom: '4px',
                  fontFamily: "'Quicksand', sans-serif"
                }}>
                  {achievement.name}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: getTextColor(theme, 'secondary'),
                  marginBottom: '4px',
                  fontFamily: "'Quicksand', sans-serif",
                  lineHeight: '1.3'
                }}>
                  {achievement.description}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: getTextColor(theme, 'tertiary'),
                  fontFamily: "'Quicksand', sans-serif"
                }}>
                  {Math.round(achievement.progress)}% Complete
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default AchievementsScreen;
