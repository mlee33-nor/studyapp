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
import BiomeBackgrounds from '../components/BiomeBackgrounds';

type TimelineViewMode = 'weekly' | 'monthly' | 'yearly';

interface GalleryScreenProps {
  collection: CollectedAnimal[];
  theme: 'morning' | 'twilight' | 'golden' | 'midnight';
}

const SOFT_SPRING = { type: "spring" as const, stiffness: 100, damping: 20 };

const getTextColor = (theme: 'morning' | 'twilight' | 'golden' | 'midnight', type: 'primary' | 'secondary' | 'tertiary') => {
  const isDarkText = theme === 'morning' || theme === 'golden' ? true : false;

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

const getCardBackground = (theme: 'morning' | 'twilight' | 'golden' | 'midnight', type: 'primary' | 'secondary' | 'active' | 'inactive') => {
  const isLightTheme = theme === 'morning' || theme === 'golden';

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

const getCardBorder = (theme: 'morning' | 'twilight' | 'golden' | 'midnight', type: 'primary' | 'secondary' | 'active' | 'inactive') => {
  const isLightTheme = theme === 'morning' || theme === 'golden';

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

const getCardShadow = (theme: 'morning' | 'twilight' | 'golden' | 'midnight') => {
  const isLightTheme = theme === 'morning' || theme === 'golden';
  return isLightTheme ? '0 8px 32px rgba(147, 197, 253, 0.15)' : '0 8px 32px rgba(167, 139, 250, 0.2)';
};

const getGradient = (theme: 'morning' | 'twilight' | 'golden' | 'midnight') => {
  const isLightTheme = theme === 'morning' || theme === 'golden';
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
  theme: 'morning' | 'twilight' | 'golden' | 'midnight';
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
  theme: 'morning' | 'twilight' | 'golden' | 'midnight';
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
      style={{ padding: '40px 24px 160px', position: 'relative', zIndex: 1 }}
    >
      {/* Header */}
      <h1 style={{
        fontSize: '1.5rem',
        fontWeight: 500,
        color: getTextColor(theme, 'primary'),
        marginBottom: '24px',
        letterSpacing: '0.05em',
        fontFamily: "'Quicksand', sans-serif"
      }}>
        Animal Sanctuary
      </h1>

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
          borderRadius: '32px',
          padding: '20px 24px',
          marginBottom: '20px',
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
        marginBottom: '24px',
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

      {/* Gallery Grid - Animals on Biome Backgrounds */}
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
        <BiomeGalleryGrid
          groupedAnimals={groupedAnimals}
          selectedBiome={selectedBiome}
          viewMode={viewMode}
          config={config}
          loadedAnimations={loadedAnimations}
          theme={theme}
        />
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
  theme: 'morning' | 'twilight' | 'golden' | 'midnight';
}> = ({ groupedAnimals, selectedBiome, viewMode, config, loadedAnimations, theme }) => {
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

          {/* Biome Container with Background */}
          <div style={{
            position: 'relative',
            borderRadius: '32px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          }}>
            {/* Biome Background - positioned absolutely behind content */}
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
            }}>
              <BiomeBackgrounds biomeId={biome} />
            </div>

            {/* Animals Grid - establishes container height */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              padding: '24px',
              display: 'grid',
              gridTemplateColumns: config.gridColumns,
              gap: config.gap,
              alignContent: 'start',
              minHeight: viewMode === 'weekly' ? '400px' : viewMode === 'monthly' ? '300px' : '200px',
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
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
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

                    {/* Animal Name (with text shadow for visibility) */}
                    {config.showName && (
                      <div style={{
                        fontSize: config.fontSize,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        fontFamily: "'Quicksand', sans-serif",
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 4px rgba(0, 0, 0, 0.6)',
                        background: 'rgba(0, 0, 0, 0.4)',
                        padding: '2px 8px',
                        borderRadius: '8px',
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
