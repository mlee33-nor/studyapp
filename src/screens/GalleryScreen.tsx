import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  isSameWeek,
  isSameMonth,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BiomeType, CollectedAnimal } from '../types';
import { getBiomeConfig, BIOME_CONFIG, getAnimalScale } from '../data/biomes';

// Donut chart for species breakdown
const AnimalDonutChart: React.FC<{
  species: { name: string; count: number }[];
  total: number;
  theme: 'morning' | 'midnight';
}> = ({ species, total, theme }) => {
  const size = 130;
  const radius = 45;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  const isDark = theme === 'midnight';

  const colors = [
    '#a78bfa', '#f472b6', '#60a5fa', '#34d399', '#fbbf24',
    '#fb923c', '#c084fc', '#22d3ee', '#f87171', '#a3e635',
  ];

  let cumulativePercent = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
        strokeWidth={strokeWidth}
      />
      {species.map((s, i) => {
        const percent = total > 0 ? (s.count / total) * 100 : 0;
        const offset = circumference - (circumference * cumulativePercent) / 100;
        const length = (circumference * percent) / 100;
        cumulativePercent += percent;
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors[i % colors.length]}
            strokeWidth={strokeWidth}
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'all 0.5s ease' }}
          />
        );
      })}
      <text
        x={size / 2}
        y={size / 2 - 6}
        textAnchor="middle"
        fill={isDark ? 'rgba(255,255,255,0.9)' : '#0f172a'}
        fontSize="16"
        fontWeight="700"
        fontFamily="'Quicksand', sans-serif"
      >
        {total}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 10}
        textAnchor="middle"
        fill={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(100, 116, 139, 0.7)'}
        fontSize="9"
        fontFamily="'Quicksand', sans-serif"
      >
        Total
      </text>
    </svg>
  );
};

type TimelineViewMode = 'weekly' | 'monthly' | 'yearly';

interface GalleryScreenProps {
  collection: CollectedAnimal[];
  theme: 'morning' | 'midnight';
}

const SOFT_SPRING = { type: "spring" as const, stiffness: 100, damping: 20 };

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

const getCardBackground = (theme: 'morning' | 'midnight', type: 'primary' | 'secondary' | 'active' | 'inactive') => {
  const isLightTheme = theme === 'morning';

  const colorMap = {
    light: {
      primary: 'rgba(255, 255, 255, 0.7)',
      secondary: 'rgba(255, 255, 255, 0.5)',
      active: 'rgba(167, 139, 250, 0.25)',
      inactive: 'rgba(255, 255, 255, 0.4)'
    },
    dark: {
      primary: 'rgba(167, 139, 250, 0.25)',
      secondary: 'rgba(167, 139, 250, 0.2)',
      active: 'rgba(167, 139, 250, 0.3)',
      inactive: 'rgba(167, 139, 250, 0.15)'
    }
  };

  return isLightTheme ? colorMap.light[type] : colorMap.dark[type];
};

const getCardBorder = (theme: 'morning' | 'midnight', type: 'primary' | 'secondary' | 'active' | 'inactive') => {
  const isLightTheme = theme === 'morning';

  const colorMap = {
    light: {
      primary: 'rgba(255, 255, 255, 0.6)',
      secondary: 'rgba(255, 255, 255, 0.4)',
      active: 'rgba(167, 139, 250, 0.6)',
      inactive: 'rgba(255, 255, 255, 0.3)'
    },
    dark: {
      primary: 'rgba(167, 139, 250, 0.4)',
      secondary: 'rgba(167, 139, 250, 0.35)',
      active: 'rgba(167, 139, 250, 0.6)',
      inactive: 'rgba(167, 139, 250, 0.3)'
    }
  };

  return isLightTheme ? colorMap.light[type] : colorMap.dark[type];
};

const getCardShadow = (theme: 'morning' | 'midnight') => {
  const isLightTheme = theme === 'morning';
  return isLightTheme ? '0 8px 32px rgba(147, 197, 253, 0.15)' : '0 8px 32px rgba(167, 139, 250, 0.2)';
};

const getGradient = (theme: 'morning' | 'midnight') => {
  const isLightTheme = theme === 'morning';
  return isLightTheme
    ? 'linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(244, 114, 182, 0.15) 100%)'
    : 'linear-gradient(135deg, rgba(167, 139, 250, 0.3) 0%, rgba(244, 114, 182, 0.3) 100%)';
};

// View mode grid/size configuration
const VIEW_CONFIG = {
  weekly: {
    gridColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    lottieSize: 80,
    gap: '16px',
    padding: '16px',
    borderRadius: '24px',
    showName: true,
    fontSize: '14px',
  },
  monthly: {
    gridColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
    lottieSize: 50,
    gap: '10px',
    padding: '10px',
    borderRadius: '16px',
    showName: true,
    fontSize: '11px',
  },
  yearly: {
    gridColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
    lottieSize: 32,
    gap: '6px',
    padding: '6px',
    borderRadius: '12px',
    showName: false,
    fontSize: '0px',
  },
};

// View Mode Toggle
const ViewModeToggle: React.FC<{
  viewMode: TimelineViewMode;
  setViewMode: (mode: TimelineViewMode) => void;
  theme: 'morning' | 'midnight';
}> = ({ viewMode, setViewMode, theme }) => {
  const modes: TimelineViewMode[] = ['weekly', 'monthly', 'yearly'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SOFT_SPRING}
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        padding: '6px',
        background: getCardBackground(theme, 'primary'),
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: `1px solid ${getCardBorder(theme, 'primary')}`,
      }}
    >
      {modes.map(mode => (
        <motion.button
          key={mode}
          onClick={() => setViewMode(mode)}
          whileTap={{ scale: 0.95 }}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            background: viewMode === mode ? getGradient(theme) : 'transparent',
            color: viewMode === mode ? getTextColor(theme, 'primary') : getTextColor(theme, 'tertiary'),
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textTransform: 'capitalize',
            fontFamily: "'Quicksand', sans-serif"
          }}
        >
          {mode}
        </motion.button>
      ))}
    </motion.div>
  );
};

// Time Navigator
const TimeNavigator: React.FC<{
  viewMode: TimelineViewMode;
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  theme: 'morning' | 'midnight';
}> = ({ viewMode, currentDate, onPrevious, onNext, onToday, theme }) => {
  let displayText: string;
  let isCurrentPeriod: boolean;

  if (viewMode === 'weekly') {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    displayText = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;
    isCurrentPeriod = isSameWeek(currentDate, new Date());
  } else if (viewMode === 'monthly') {
    displayText = format(currentDate, 'MMMM yyyy');
    isCurrentPeriod = isSameMonth(currentDate, new Date());
  } else {
    displayText = format(currentDate, 'yyyy');
    isCurrentPeriod = currentDate.getFullYear() === new Date().getFullYear();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SOFT_SPRING}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        padding: '12px 16px',
        background: getCardBackground(theme, 'primary'),
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: `1px solid ${getCardBorder(theme, 'primary')}`,
      }}
    >
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onPrevious}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: getTextColor(theme, 'secondary')
        }}
      >
        <ChevronLeft size={20} />
      </motion.button>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: getTextColor(theme, 'primary'),
          fontFamily: "'Quicksand', sans-serif"
        }}>
          {displayText}
        </span>
        {!isCurrentPeriod && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToday}
            style={{
              background: getGradient(theme),
              border: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: getTextColor(theme, 'primary'),
              fontFamily: "'Quicksand', sans-serif"
            }}
          >
            Today
          </motion.button>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: getTextColor(theme, 'secondary')
        }}
      >
        <ChevronRight size={20} />
      </motion.button>
    </motion.div>
  );
};

const GalleryScreen: React.FC<GalleryScreenProps> = ({ collection, theme }) => {
  const [selectedBiome, setSelectedBiome] = useState<BiomeType | 'all'>('all');
  const [viewMode, setViewMode] = useState<TimelineViewMode>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loadedAnimations, setLoadedAnimations] = useState<Record<string, any>>({});

  const biomes = Object.keys(BIOME_CONFIG) as BiomeType[];

  // Filter collection by date range
  const dateFilteredCollection = useMemo(() => {
    let start: Date;
    let end: Date;

    if (viewMode === 'weekly') {
      start = startOfWeek(currentDate);
      end = endOfWeek(currentDate);
    } else if (viewMode === 'monthly') {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    } else {
      start = startOfYear(currentDate);
      end = endOfYear(currentDate);
    }

    return collection.filter(animal => {
      const collectedDate = new Date(animal.collectedAt);
      return isWithinInterval(collectedDate, { start, end });
    });
  }, [collection, viewMode, currentDate]);

  // Apply biome filter on top of date filter
  const filteredCollection = selectedBiome === 'all'
    ? dateFilteredCollection
    : dateFilteredCollection.filter(animal => animal.biome === selectedBiome);

  // Group animals by name+biome with count (e.g. Bunny x5)
  const groupedAnimals = useMemo(() => {
    const groups: Record<string, { name: string; biome: string; lottieUrl: string; count: number }> = {};
    for (const animal of filteredCollection) {
      const key = `${animal.name}-${animal.biome}`;
      if (groups[key]) {
        groups[key].count += 1;
      } else {
        groups[key] = {
          name: animal.name,
          biome: animal.biome,
          lottieUrl: animal.lottieUrl,
          count: 1,
        };
      }
    }
    return Object.values(groups);
  }, [filteredCollection]);

  // Collect unique lottie URLs to load
  const uniqueUrls = useMemo(() => {
    const urls = new Set<string>();
    for (const animal of groupedAnimals) {
      if (animal.lottieUrl) urls.add(animal.lottieUrl);
    }
    return Array.from(urls);
  }, [groupedAnimals]);

  // Load Lottie animations
  useEffect(() => {
    const urlsToLoad = uniqueUrls.filter(url => !loadedAnimations[url]);

    for (const url of urlsToLoad) {
      fetch(url)
        .then(res => res.json())
        .then(data => {
          setLoadedAnimations(prev => ({ ...prev, [url]: data }));
        })
        .catch(() => {});
    }
  }, [uniqueUrls]);

  // Navigation handlers
  const handlePrevious = () => {
    if (viewMode === 'weekly') {
      setCurrentDate(prev => subWeeks(prev, 1));
    } else if (viewMode === 'monthly') {
      setCurrentDate(prev => subMonths(prev, 1));
    } else {
      setCurrentDate(prev => subYears(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'weekly') {
      setCurrentDate(prev => addWeeks(prev, 1));
    } else if (viewMode === 'monthly') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else {
      setCurrentDate(prev => addYears(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Period label for stats summary
  const periodLabel = viewMode === 'weekly' ? 'this week' : viewMode === 'monthly' ? 'this month' : 'this year';

  const config = VIEW_CONFIG[viewMode];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '0 24px calc(68px + max(12px, env(safe-area-inset-bottom, 12px)))', position: 'relative', zIndex: 1 }}
    >
      {/* View Mode Toggle */}
      <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} theme={theme} />

      {/* Time Navigator */}
      <TimeNavigator
        viewMode={viewMode}
        currentDate={currentDate}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
        theme={theme}
      />

      {/* Stats Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: getCardBackground(theme, 'primary'),
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          borderRadius: '20px',
          padding: '12px 16px',
          marginBottom: '12px',
          border: `1px solid ${getCardBorder(theme, 'primary')}`,
          boxShadow: getCardShadow(theme),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: getTextColor(theme, 'primary'),
            fontFamily: "'Quicksand', sans-serif"
          }}>
            {filteredCollection.length} {filteredCollection.length === 1 ? 'Animal' : 'Animals'}
          </div>
          <div style={{
            fontSize: '13px',
            color: getTextColor(theme, 'secondary'),
            fontFamily: "'Quicksand', sans-serif"
          }}>
            Collected {periodLabel}
          </div>
        </div>
        <div style={{
          fontSize: '13px',
          color: getTextColor(theme, 'tertiary'),
          fontFamily: "'Quicksand', sans-serif",
          textAlign: 'right',
        }}>
          {collection.length} total all time
        </div>
      </motion.div>

      {/* Biome Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        overflowX: 'auto',
        paddingBottom: '8px'
      }}>
        {['all' as const, ...biomes].map(biomeId => {
          const isActive = selectedBiome === biomeId;
          const biomeConfig = biomeId === 'all' ? null : getBiomeConfig(biomeId);
          const label = biomeId === 'all' ? 'All' : biomeConfig?.name;
          const emoji = biomeId === 'all' ? '🌍' : biomeConfig?.emoji;

          return (
            <motion.button
              key={biomeId}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedBiome(biomeId)}
              style={{
                background: getCardBackground(theme, isActive ? 'active' : 'inactive'),
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: isActive ? `2px solid ${getCardBorder(theme, 'active')}` : `1px solid ${getCardBorder(theme, 'inactive')}`,
                borderRadius: '20px',
                padding: '8px 16px',
                cursor: 'pointer',
                color: getTextColor(theme, 'primary'),
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: "'Quicksand', sans-serif",
                boxShadow: isActive ? '0 4px 15px rgba(167, 139, 250, 0.2)' : 'none',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Species Breakdown + Gallery */}
      {groupedAnimals.length === 0 ? (
        <div style={{
          background: getCardBackground(theme, 'primary'),
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          borderRadius: '32px',
          padding: '60px 24px',
          textAlign: 'center',
          border: `1px solid ${getCardBorder(theme, 'primary')}`,
          boxShadow: getCardShadow(theme),
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {selectedBiome === 'all' ? '🌿' : getBiomeConfig(selectedBiome as BiomeType)?.emoji}
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            color: getTextColor(theme, 'primary'),
            marginBottom: '8px',
            fontFamily: "'Quicksand', sans-serif"
          }}>
            No animals collected {periodLabel} yet
          </div>
          <div style={{
            fontSize: '13px',
            color: getTextColor(theme, 'secondary'),
            fontFamily: "'Quicksand', sans-serif"
          }}>
            Start a study session to collect animals!
          </div>
        </div>
      ) : (
        <>
          {/* Donut Chart + Species Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: getCardBackground(theme, 'primary'),
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              borderRadius: '24px',
              padding: '20px',
              marginBottom: '12px',
              border: `1px solid ${getCardBorder(theme, 'primary')}`,
              boxShadow: getCardShadow(theme),
            }}
          >
            {/* Donut Chart */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <AnimalDonutChart
                species={groupedAnimals.map(a => ({ name: a.name, count: a.count }))}
                total={filteredCollection.length}
                theme={theme}
              />
            </div>

            {/* Species List with Progress Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {groupedAnimals
                .sort((a, b) => b.count - a.count)
                .map((animal, i) => {
                  const percent = filteredCollection.length > 0
                    ? Math.round((animal.count / filteredCollection.length) * 100)
                    : 0;
                  const colors = [
                    '#a78bfa', '#f472b6', '#60a5fa', '#34d399', '#fbbf24',
                    '#fb923c', '#c084fc', '#22d3ee', '#f87171', '#a3e635',
                  ];
                  const color = colors[i % colors.length];

                  return (
                    <div key={`${animal.name}-${animal.biome}`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '14px',
                      background: i === 0 ? `${color}10` : 'transparent',
                      borderBottom: i < groupedAnimals.length - 1
                        ? `1px solid ${theme === 'midnight' ? 'rgba(255,255,255,0.06)' : 'rgba(100,116,139,0.08)'}`
                        : 'none',
                    }}>
                      {/* Animal avatar */}
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: `${color}18`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}>
                        {loadedAnimations[animal.lottieUrl] ? (
                          <Lottie
                            animationData={loadedAnimations[animal.lottieUrl]}
                            loop={true}
                            autoplay={true}
                            style={{ width: '32px', height: '32px' }}
                          />
                        ) : (
                          <span style={{ fontSize: '1rem' }}>
                            {getBiomeConfig(animal.biome as BiomeType)?.emoji || '🐾'}
                          </span>
                        )}
                      </div>
                      {/* Name + progress bar */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: getTextColor(theme, 'primary'),
                          marginBottom: '4px',
                          fontFamily: "'Quicksand', sans-serif",
                        }}>
                          {animal.name}
                        </div>
                        <div style={{
                          height: '5px',
                          borderRadius: '3px',
                          background: theme === 'midnight' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                          overflow: 'hidden',
                        }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            style={{
                              height: '100%',
                              borderRadius: '3px',
                              background: color,
                            }}
                          />
                        </div>
                      </div>
                      {/* Percentage */}
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: getTextColor(theme, 'tertiary'),
                        minWidth: '32px',
                        textAlign: 'right',
                        fontFamily: "'Quicksand', sans-serif",
                      }}>
                        {percent}%
                      </span>
                      {/* Count badge */}
                      <div style={{
                        padding: '3px 8px',
                        borderRadius: '8px',
                        background: `${color}18`,
                        flexShrink: 0,
                      }}>
                        <span style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: color,
                          fontFamily: "'Quicksand', sans-serif",
                        }}>
                          {animal.count}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>

          {/* Animal Grid */}
          <BiomeGalleryGrid
            groupedAnimals={groupedAnimals}
            selectedBiome={selectedBiome}
            viewMode={viewMode}
            config={config}
            loadedAnimations={loadedAnimations}
            theme={theme}
          />
        </>
      )}
    </motion.div>
  );
};

// Biome Gallery Grid Component - Shows animals on biome backgrounds
const BiomeGalleryGrid: React.FC<{
  groupedAnimals: { name: string; biome: string; lottieUrl: string; count: number }[];
  selectedBiome: BiomeType | 'all';
  viewMode: TimelineViewMode;
  config: typeof VIEW_CONFIG[TimelineViewMode];
  loadedAnimations: Record<string, any>;
  theme: 'morning' | 'midnight';
}> = ({ groupedAnimals, selectedBiome, viewMode: _viewMode, config, loadedAnimations, theme }) => {
  // Group animals by biome when 'all' is selected
  const biomeGroups = useMemo(() => {
    if (selectedBiome !== 'all') {
      return [{ biome: selectedBiome, animals: groupedAnimals }];
    }

    const groups: Record<string, typeof groupedAnimals> = {};
    for (const animal of groupedAnimals) {
      if (!groups[animal.biome]) {
        groups[animal.biome] = [];
      }
      groups[animal.biome].push(animal);
    }

    return Object.entries(groups).map(([biome, animals]) => ({
      biome: biome as BiomeType,
      animals
    }));
  }, [groupedAnimals, selectedBiome]);

  return (
    <>
      {biomeGroups.map(({ biome, animals }) => (
        <motion.div
          key={biome}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            marginBottom: selectedBiome === 'all' ? '32px' : '0',
          }}
        >
          {/* Biome Label (only when showing all biomes) */}
          {selectedBiome === 'all' && (
            <div style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: getTextColor(theme, 'primary'),
              marginBottom: '12px',
              fontFamily: "'Quicksand', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{getBiomeConfig(biome)?.emoji}</span>
              <span>{getBiomeConfig(biome)?.name}</span>
            </div>
          )}

          {/* Biome Container */}
          <div style={{
            position: 'relative',
            borderRadius: '32px',
            overflow: 'hidden',
            boxShadow: getCardShadow(theme),
            display: 'flex',
            flexDirection: 'column',
            background: getCardBackground(theme, 'primary'),
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            border: `1px solid ${getCardBorder(theme, 'primary')}`,
          }}>
            {/* Animals Grid */}
            <div style={{
              position: 'relative',
              padding: '24px',
              display: 'grid',
              gridTemplateColumns: config.gridColumns,
              gap: config.gap,
              alignContent: 'start',
            }}>
              {animals.map((animal, index) => {
                const animalScale = getAnimalScale(animal.lottieUrl);
                const lottieSize = config.lottieSize;
                const innerSize = animalScale ? lottieSize * animalScale : lottieSize;

                return (
                  <motion.div
                    key={`${animal.name}-${animal.biome}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(index * 0.03, 1) }}
                    whileHover={{ scale: 1.1 }}
                    title={`${animal.name}${animal.count > 1 ? ` x${animal.count}` : ''}`}
                    style={{
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: config.showName ? '6px' : '0px',
                      filter: 'none',
                    }}
                  >
                    {/* Lottie Animation */}
                    <div style={{
                      width: `${lottieSize}px`,
                      height: `${lottieSize}px`,
                      overflow: 'visible',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}>
                      {loadedAnimations[animal.lottieUrl] ? (
                        <div style={{
                          width: `${innerSize}px`,
                          height: `${innerSize}px`,
                          flexShrink: 0,
                        }}>
                          <Lottie
                            animationData={loadedAnimations[animal.lottieUrl]}
                            loop={true}
                            style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                          />
                        </div>
                      ) : (
                        <div style={{
                          width: `${lottieSize * 0.5}px`,
                          height: `${lottieSize * 0.5}px`,
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.3)',
                        }} />
                      )}

                      {/* Count badge overlay */}
                      {animal.count > 1 && (
                        <div style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          background: 'rgba(0, 0, 0, 0.7)',
                          borderRadius: '12px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          fontFamily: "'Quicksand', sans-serif",
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                        }}>
                          x{animal.count}
                        </div>
                      )}
                    </div>

                    {/* Animal Name */}
                    {config.showName && (
                      <div style={{
                        fontSize: config.fontSize,
                        fontWeight: 700,
                        color: getTextColor(theme, 'primary'),
                        fontFamily: "'Quicksand', sans-serif",
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                      }}>
                        {animal.name}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      ))}
    </>
  );
};

export default GalleryScreen;
