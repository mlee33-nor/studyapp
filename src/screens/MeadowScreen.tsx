import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import Lottie from 'lottie-react';
import { useUserData } from '../hooks/useUserData';
import { updateAnimalPosition, getUserData, saveUserData } from '../utils/storage';
import type { MeadowAnimal, BiomeType, CollectedAnimal } from '../types';
import { BIOME_CONFIG, getUnlockedBiomes, getAnimalScale } from '../data/biomes';
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
import meadowBg from '../assets/biomes/meadows.jpg';
import safariBg from '../assets/biomes/safari.jpg';
import forestBg from '../assets/biomes/forest.jpg';
import oceanBg from '../assets/biomes/ocean.jpg';
import arcticBg from '../assets/biomes/arctic.jpg';
import mountainBg from '../assets/biomes/mountains.jpg';

// Meadow dimensions and safe zones
const MEADOW_WIDTH = 400;
const MEADOW_HEIGHT = 450;
const ANIMAL_SIZE = 60;
const EMOJI_SIZE = 90; // Larger size for emoji fallback animals

// Depth zones - animals can't go into the sky (top 180px is sky area)
const MIN_Y = 185; // Start on first color of green
const MAX_Y = MEADOW_HEIGHT - ANIMAL_SIZE - 20; // Bottom boundary with padding

// Safe horizontal bounds
const MIN_X = 10;

type SanctuaryViewMode = 'today' | 'weekly' | 'monthly' | 'yearly';

// Timeline grid config — scales down as time range grows
const TIMELINE_CONFIG = {
  weekly: {
    gridColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    lottieSize: 70,
    gap: '12px',
    padding: '12px',
    borderRadius: '20px',
    showName: true,
    fontSize: '12px',
  },
  monthly: {
    gridColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
    lottieSize: 44,
    gap: '8px',
    padding: '8px',
    borderRadius: '14px',
    showName: true,
    fontSize: '10px',
  },
  yearly: {
    gridColumns: 'repeat(auto-fill, minmax(38px, 1fr))',
    lottieSize: 30,
    gap: '5px',
    padding: '5px',
    borderRadius: '10px',
    showName: false,
    fontSize: '0px',
  },
};

// Biome background components
const biomeBackgroundStyle = (bgImage: string): React.CSSProperties => ({
  backgroundImage: `url(${bgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center bottom',
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
});

const BiomeBackgrounds: Record<BiomeType, React.FC> = {
  meadow: () => <div style={biomeBackgroundStyle(meadowBg)} />,
  safari: () => <div style={biomeBackgroundStyle(safariBg)} />,
  forest: () => <div style={biomeBackgroundStyle(forestBg)} />,
  ocean: () => <div style={biomeBackgroundStyle(oceanBg)} />,
  arctic: () => <div style={biomeBackgroundStyle(arcticBg)} />,
  mountain: () => <div style={biomeBackgroundStyle(mountainBg)} />,
};

const ALL_BIOME_IDS: BiomeType[] = ['meadow', 'safari', 'forest', 'ocean', 'arctic', 'mountain'];

const MeadowScreen: React.FC = () => {
  const { userData, refreshData } = useUserData();
  const [loadedAnimations, setLoadedAnimations] = useState<Record<string, any>>({});
  const [failedAnimations, setFailedAnimations] = useState<Set<string>>(new Set());
  const meadowRef = useRef<HTMLDivElement>(null);
  const [activeBiome, setActiveBiome] = useState<BiomeType>(userData.activeBiome as BiomeType);
  const [allUnlocked, setAllUnlocked] = useState<boolean>(false);

  // Giraffe auto-movement
  const giraffeX = useMotionValue(0);
  const [giraffeFlipped, setGiraffeFlipped] = useState(false);
  const giraffeStateRef = useRef<{
    direction: 1 | -1;
    isDragging: boolean;
    initialized: boolean;
  }>({ direction: 1, isDragging: false, initialized: false });

  // Timeline state
  const [viewMode, setViewMode] = useState<SanctuaryViewMode>('today');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Always refresh data from storage when the component mounts (e.g. tab switch)
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Determine unlocked biomes: if user pressed unlock button, show all; otherwise derive from level
  const unlockedBiomes: BiomeType[] = allUnlocked
    ? ALL_BIOME_IDS
    : getUnlockedBiomes(userData.level);
  const biomeAnimals = userData.meadowAnimals.filter(a => a.biome === activeBiome);
  const BiomeBackground = BiomeBackgrounds[activeBiome];

  // Timeline: filter permanentCollection by date range and active biome
  const timelineAnimals = useMemo(() => {
    if (viewMode === 'today') return [];

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

    const collection = userData.permanentCollection || [];
    return collection.filter((animal: CollectedAnimal) => {
      const collectedDate = new Date(animal.collectedAt);
      const inRange = isWithinInterval(collectedDate, { start, end });
      const matchesBiome = animal.biome === activeBiome;
      return inRange && matchesBiome;
    });
  }, [viewMode, currentDate, userData.permanentCollection, activeBiome]);

  // Collect unique lottie URLs for timeline animals
  const timelineUrls = useMemo(() => {
    const urls = new Set<string>();
    for (const animal of timelineAnimals) {
      if (animal.lottieUrl) urls.add(animal.lottieUrl);
    }
    return Array.from(urls);
  }, [timelineAnimals]);

  // Load timeline Lottie animations (keyed by URL)
  const [timelineLoadedAnimations, setTimelineLoadedAnimations] = useState<Record<string, any>>({});
  useEffect(() => {
    const urlsToLoad = timelineUrls.filter(url => !timelineLoadedAnimations[url]);
    for (const url of urlsToLoad) {
      fetch(url)
        .then(res => res.json())
        .then(data => {
          setTimelineLoadedAnimations(prev => ({ ...prev, [url]: data }));
        })
        .catch(() => {});
    }
  }, [timelineUrls]);

  const handleUnlockAllBiomes = () => {
    setAllUnlocked(true);
    const currentData = getUserData();
    saveUserData({
      ...currentData,
      level: 50,
      unlockedBiomes: ALL_BIOME_IDS,
    });
    refreshData();
  };

  // Load Lottie animations for today's diorama
  useEffect(() => {
    const loadAnimations = async () => {
      const toLoad = userData.meadowAnimals.filter(
        a => !loadedAnimations[a.id] && !failedAnimations.has(a.id)
      );
      const results = await Promise.all(
        toLoad.map(async (animal) => {
          try {
            const response = await fetch(animal.lottieUrl);
            if (!response.ok) return { id: animal.id, failed: true };
            const data = await response.json();
            return { id: animal.id, data, failed: false };
          } catch {
            return { id: animal.id, failed: true };
          }
        })
      );

      const animations: Record<string, any> = {};
      const failed: string[] = [];
      for (const result of results) {
        if (result.failed) {
          failed.push(result.id);
        } else {
          animations[result.id] = result.data;
        }
      }
      if (Object.keys(animations).length > 0) {
        setLoadedAnimations(prev => ({ ...prev, ...animations }));
      }
      if (failed.length > 0) {
        setFailedAnimations(prev => new Set([...prev, ...failed]));
      }
    };

    loadAnimations();
  }, [userData.meadowAnimals]);

  // Giraffe auto-movement animation loop
  useEffect(() => {
    const giraffe = biomeAnimals.find(a => a.name === 'Giraffe');
    if (!giraffe) {
      giraffeStateRef.current.initialized = false;
      return;
    }

    if (!giraffeStateRef.current.initialized) {
      giraffeX.set(giraffe.x);
      giraffeStateRef.current.initialized = true;
    }

    let lastTime = performance.now();
    let animId: number;
    const GIRAFFE_SPEED = 70; // pixels per second

    const step = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (!giraffeStateRef.current.isDragging) {
        const meadowWidth = meadowRef.current?.offsetWidth ?? MEADOW_WIDTH;
        const maxX = meadowWidth - ANIMAL_SIZE - 10;
        let newX = giraffeX.get() + giraffeStateRef.current.direction * GIRAFFE_SPEED * delta;

        if (newX >= maxX) {
          newX = maxX;
          if (giraffeStateRef.current.direction !== -1) {
            giraffeStateRef.current.direction = -1;
            setGiraffeFlipped(true);
          }
        } else if (newX <= MIN_X) {
          newX = MIN_X;
          if (giraffeStateRef.current.direction !== 1) {
            giraffeStateRef.current.direction = 1;
            setGiraffeFlipped(false);
          }
        }

        giraffeX.set(newX);
      }

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [biomeAnimals]);

  // Get dynamic bounds based on actual container size
  const getBounds = () => {
    const meadowWidth = meadowRef.current?.offsetWidth ?? MEADOW_WIDTH;
    const maxX = meadowWidth - ANIMAL_SIZE - 10;
    return { minX: MIN_X, maxX, minY: MIN_Y, maxY: MAX_Y };
  };

  // Constrain position to valid bounds
  const constrainPosition = (x: number, y: number) => {
    const { minX, maxX, minY, maxY } = getBounds();
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y))
    };
  };

  // Check if position is in a valid zone (not in sky, not too close to another animal)
  const isValidPosition = (animalId: string, newX: number, newY: number): boolean => {
    const SKY_THRESHOLD = MIN_Y;
    if (newY < SKY_THRESHOLD) return false;

    const COLLISION_THRESHOLD = 45;
    for (const animal of userData.meadowAnimals) {
      if (animal.id === animalId) continue;
      const dx = newX - animal.x;
      const dy = newY - animal.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < COLLISION_THRESHOLD) return false;
    }

    return true;
  };

  // Handle drag end
  const handleDragEnd = (animalId: string, _event: any, info: any) => {
    const currentAnimal = userData.meadowAnimals.find(a => a.id === animalId);
    if (!currentAnimal) return;

    let newX = currentAnimal.x + info.offset.x;
    let newY = currentAnimal.y + info.offset.y;

    const constrained = constrainPosition(newX, newY);
    newX = constrained.x;
    newY = constrained.y;

    if (!isValidPosition(animalId, newX, newY)) {
      const attempts = [
        { dx: 0, dy: 0 },
        { dx: 30, dy: 0 },
        { dx: -30, dy: 0 },
        { dx: 0, dy: 30 },
        { dx: 0, dy: -20 },
        { dx: 30, dy: 30 },
        { dx: -30, dy: 30 },
      ];

      let foundValid = false;
      for (const attempt of attempts) {
        const testX = constrained.x + attempt.dx;
        const testY = constrained.y + attempt.dy;
        const finalConstrained = constrainPosition(testX, testY);

        if (isValidPosition(animalId, finalConstrained.x, finalConstrained.y)) {
          newX = finalConstrained.x;
          newY = finalConstrained.y;
          foundValid = true;
          break;
        }
      }

      if (!foundValid) {
        newX = currentAnimal.x;
        newY = currentAnimal.y;
      }
    }

    updateAnimalPosition(animalId, newX, newY);
    refreshData();

    // Resume giraffe auto-movement from constrained position
    if (currentAnimal.name === 'Giraffe') {
      giraffeX.set(newX);
      giraffeStateRef.current.isDragging = false;
    }
  };

  // Double-tap detection for flipping animals
  const lastTapRef = useRef<Record<string, number>>({});

  const handleAnimalTap = (animalId: string) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[animalId] || 0;

    if (now - lastTap < 300) {
      const currentData = getUserData();
      const updatedAnimals = currentData.meadowAnimals.map(animal =>
        animal.id === animalId ? { ...animal, flipped: !animal.flipped } : animal
      );
      saveUserData({ ...currentData, meadowAnimals: updatedAnimals });
      refreshData();
      lastTapRef.current[animalId] = 0;
    } else {
      lastTapRef.current[animalId] = now;
    }
  };

  const getZIndex = (y: number) => Math.floor(y / 10) + 5;

  const handleBiomeSwitch = (biomeId: BiomeType) => {
    setActiveBiome(biomeId);
    const currentData = getUserData();
    saveUserData({ ...currentData, activeBiome: biomeId });
  };

  // Timeline navigation
  const handlePrevious = () => {
    if (viewMode === 'weekly') setCurrentDate(prev => subWeeks(prev, 1));
    else if (viewMode === 'monthly') setCurrentDate(prev => subMonths(prev, 1));
    else setCurrentDate(prev => subYears(prev, 1));
  };

  const handleNext = () => {
    if (viewMode === 'weekly') setCurrentDate(prev => addWeeks(prev, 1));
    else if (viewMode === 'monthly') setCurrentDate(prev => addMonths(prev, 1));
    else setCurrentDate(prev => addYears(prev, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  // Period display text
  const getDisplayText = () => {
    if (viewMode === 'weekly') {
      const ws = startOfWeek(currentDate);
      const we = endOfWeek(currentDate);
      return `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`;
    }
    if (viewMode === 'monthly') return format(currentDate, 'MMMM yyyy');
    return format(currentDate, 'yyyy');
  };

  const isCurrentPeriod = () => {
    if (viewMode === 'weekly') return isSameWeek(currentDate, new Date());
    if (viewMode === 'monthly') return isSameMonth(currentDate, new Date());
    return currentDate.getFullYear() === new Date().getFullYear();
  };

  const periodLabel = viewMode === 'weekly' ? 'this week' : viewMode === 'monthly' ? 'this month' : 'this year';

  return (
    <div className="min-h-screen pb-24 pt-8 px-6" style={{ background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)' }}>
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Your Sanctuary</h1>
        <p className="text-text-secondary mb-4">
          Explore different biomes and collect unique animals
        </p>

        {/* Unlock All Biomes Button */}
        {unlockedBiomes.length < ALL_BIOME_IDS.length && (
          <motion.button
            onClick={handleUnlockAllBiomes}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%',
              padding: '12px 16px',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
              border: 'none',
              borderRadius: '16px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: "'Quicksand', sans-serif",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
            }}
          >
            Unlock All Biomes
          </motion.button>
        )}

        {/* Biome Carousel */}
        <div style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          marginBottom: '16px',
          paddingBottom: '8px',
          scrollBehavior: 'smooth'
        }}>
          {(unlockedBiomes as BiomeType[]).map((biomeId) => {
            const biomeConfig = BIOME_CONFIG[biomeId];
            const isActive = activeBiome === biomeId;
            return (
              <motion.button
                key={biomeId}
                onClick={() => handleBiomeSwitch(biomeId)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '20px',
                  border: isActive ? '2px solid rgba(167, 139, 250, 0.6)' : '2px solid rgba(200, 200, 200, 0.3)',
                  background: isActive ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(10px)',
                  cursor: 'pointer',
                  minWidth: '80px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '32px' }}>{biomeConfig.emoji}</div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isActive ? 'rgba(15, 23, 42, 0.95)' : 'rgba(100, 116, 139, 0.7)'
                }}>
                  {biomeConfig.name}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* View Mode Toggle: Today / Weekly / Monthly / Yearly */}
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '16px',
          padding: '5px',
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.4)',
        }}>
          {(['today', 'weekly', 'monthly', 'yearly'] as SanctuaryViewMode[]).map(mode => (
            <motion.button
              key={mode}
              onClick={() => setViewMode(mode)}
              whileTap={{ scale: 0.95 }}
              style={{
                flex: 1,
                padding: '10px 4px',
                borderRadius: '12px',
                border: 'none',
                background: viewMode === mode
                  ? 'linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(244, 114, 182, 0.2) 100%)'
                  : 'transparent',
                color: viewMode === mode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(100, 116, 139, 0.6)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'capitalize',
                fontFamily: "'Quicksand', sans-serif"
              }}
            >
              {mode}
            </motion.button>
          ))}
        </div>

        {/* Time Navigator (only for non-today modes) */}
        {viewMode !== 'today' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            }}
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handlePrevious}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(51, 65, 85, 0.8)',
                fontSize: '20px',
              }}
            >
              ‹
            </motion.button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'rgba(15, 23, 42, 0.9)',
                fontFamily: "'Quicksand', sans-serif"
              }}>
                {getDisplayText()}
              </span>
              {!isCurrentPeriod() && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToday}
                  style={{
                    background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(244, 114, 182, 0.2) 100%)',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: 'rgba(15, 23, 42, 0.9)',
                    fontFamily: "'Quicksand', sans-serif"
                  }}
                >
                  Today
                </motion.button>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleNext}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(51, 65, 85, 0.8)',
                fontSize: '20px',
              }}
            >
              ›
            </motion.button>
          </motion.div>
        )}

        {/* Stats Card — context-aware */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">
                {viewMode === 'today'
                  ? `Today in ${BIOME_CONFIG[activeBiome].name}`
                  : `${BIOME_CONFIG[activeBiome].name} — ${periodLabel}`
                }
              </p>
              <p className="text-2xl font-bold text-text-primary">
                {viewMode === 'today'
                  ? `${biomeAnimals.length} Animals`
                  : `${timelineAnimals.length} Animals`
                }
              </p>
            </div>
            <div className="text-4xl">{BIOME_CONFIG[activeBiome].emoji}</div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'today' ? (
            /* ===== TODAY: Interactive 3D Diorama ===== */
            <motion.div
              key="today-diorama"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{ perspective: '1200px', marginBottom: '20px', filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.15)) drop-shadow(0 10px 15px rgba(0,0,0,0.08))' }}>
                <div
                  style={{
                    padding: '0',
                    overflow: 'hidden',
                    borderRadius: '28px',
                    transform: 'rotateX(8deg)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div
                    ref={meadowRef}
                    style={{
                      position: 'relative',
                      height: `${MEADOW_HEIGHT}px`,
                      borderRadius: '28px',
                      overflow: 'hidden',
                      boxShadow: 'inset 0 -10px 40px rgba(0,0,0,0.1)'
                    }}
                  >
                    <BiomeBackground />

                    {biomeAnimals.length === 0 ? (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        zIndex: 10
                      }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>{BIOME_CONFIG[activeBiome].emoji}</div>
                        <div style={{
                          fontSize: '16px',
                          color: 'rgba(255,255,255,0.95)',
                          fontFamily: "'Quicksand', sans-serif",
                          fontWeight: 600,
                          textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                          Explore {BIOME_CONFIG[activeBiome].name}...
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: 'rgba(255,255,255,0.8)',
                          marginTop: '8px',
                          fontFamily: "'Quicksand', sans-serif",
                          textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }}>
                          Complete study sessions to discover animals here!
                        </div>
                      </div>
                    ) : (
                      biomeAnimals.map((animal: MeadowAnimal) => {
                        const hasLottie = !!loadedAnimations[animal.id];
                        const size = hasLottie ? ANIMAL_SIZE : EMOJI_SIZE;
                        const isGiraffe = animal.name === 'Giraffe';
                        const flipped = isGiraffe ? giraffeFlipped : !!animal.flipped;
                        return (
                        <motion.div
                          key={animal.id}
                          drag
                          dragMomentum={false}
                          dragElastic={0}
                          dragConstraints={{
                            left: MIN_X,
                            right: (meadowRef.current?.offsetWidth ?? MEADOW_WIDTH) - size - 10,
                            top: MIN_Y,
                            bottom: MAX_Y,
                          }}
                          onDragStart={() => {
                            if (isGiraffe) {
                              giraffeStateRef.current.isDragging = true;
                            }
                          }}
                          onDragEnd={(event, info) => handleDragEnd(animal.id, event, info)}
                          onTap={() => handleAnimalTap(animal.id)}
                          animate={isGiraffe ? { y: animal.y } : { x: animal.x, y: animal.y }}
                          transition={{ duration: 0.1, ease: 'easeOut' }}
                          className="absolute cursor-grab active:cursor-grabbing"
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: `${size}px`,
                            height: `${size}px`,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: getZIndex(animal.y),
                            transform: flipped ? 'scaleX(-1)' : 'scaleX(1)',
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                            x: isGiraffe ? giraffeX : animal.x,
                            y: animal.y
                          }}
                          whileHover={{
                            scale: 1.05,
                            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))'
                          }}
                          whileTap={{ scale: 0.95, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
                        >
                          {loadedAnimations[animal.id] ? (
                            (() => {
                              const animalScale = getAnimalScale(animal.lottieUrl);
                              const scaledSize = animalScale ? size * animalScale : size;
                              return (
                                <div style={{ width: `${scaledSize}px`, height: `${scaledSize}px`, flexShrink: 0 }}>
                                  <Lottie
                                    animationData={loadedAnimations[animal.id]}
                                    loop={true}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      pointerEvents: 'none',
                                    }}
                                  />
                                </div>
                              );
                            })()
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                              pointerEvents: 'none',
                              color: '#666',
                              textAlign: 'center',
                              fontWeight: 600
                            }}>
                              {animal.name}
                            </div>
                          )}
                        </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ===== TIMELINE: Scaled Grid of All Animals ===== */
            <motion.div
              key={`timeline-${viewMode}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              style={{ marginBottom: '20px' }}
            >
              {timelineAnimals.length === 0 ? (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(25px)',
                  borderRadius: '28px',
                  padding: '50px 24px',
                  textAlign: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 8px 32px rgba(147, 197, 253, 0.15)',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                    {BIOME_CONFIG[activeBiome].emoji}
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'rgba(15, 23, 42, 0.9)',
                    marginBottom: '8px',
                    fontFamily: "'Quicksand', sans-serif"
                  }}>
                    No animals collected {periodLabel}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(100, 116, 139, 0.7)',
                    fontFamily: "'Quicksand', sans-serif"
                  }}>
                    Start a study session to fill your sanctuary!
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '28px',
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 8px 32px rgba(147, 197, 253, 0.12)',
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: TIMELINE_CONFIG[viewMode as keyof typeof TIMELINE_CONFIG].gridColumns,
                    gap: TIMELINE_CONFIG[viewMode as keyof typeof TIMELINE_CONFIG].gap,
                  }}>
                    {timelineAnimals.map((animal: CollectedAnimal, index: number) => {
                      const cfg = TIMELINE_CONFIG[viewMode as keyof typeof TIMELINE_CONFIG];
                      const animalScale = getAnimalScale(animal.lottieUrl);
                      const lottieSize = cfg.lottieSize;
                      const innerSize = animalScale ? lottieSize * animalScale : lottieSize;

                      return (
                        <motion.div
                          key={`${animal.id}-${index}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: Math.min(index * 0.02, 0.8) }}
                          whileHover={{ scale: 1.1 }}
                          title={animal.name}
                          style={{
                            background: 'rgba(255, 255, 255, 0.6)',
                            borderRadius: cfg.borderRadius,
                            padding: cfg.padding,
                            border: '1px solid rgba(255, 255, 255, 0.5)',
                            boxShadow: '0 2px 8px rgba(147, 197, 253, 0.1)',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: cfg.showName ? '4px' : '0px',
                          }}
                        >
                          <div style={{
                            width: `${lottieSize}px`,
                            height: `${lottieSize}px`,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: viewMode === 'yearly' ? '6px' : '12px',
                          }}>
                            {timelineLoadedAnimations[animal.lottieUrl] ? (
                              <div style={{
                                width: `${innerSize}px`,
                                height: `${innerSize}px`,
                                flexShrink: 0,
                              }}>
                                <Lottie
                                  animationData={timelineLoadedAnimations[animal.lottieUrl]}
                                  loop={true}
                                  style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                                />
                              </div>
                            ) : (
                              <div style={{
                                width: `${lottieSize * 0.5}px`,
                                height: `${lottieSize * 0.5}px`,
                                borderRadius: '50%',
                                background: 'rgba(167, 139, 250, 0.15)',
                              }} />
                            )}
                          </div>

                          {cfg.showName && (
                            <div style={{
                              fontSize: cfg.fontSize,
                              fontWeight: 600,
                              color: 'rgba(15, 23, 42, 0.85)',
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
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4">
          <p className="text-sm text-text-secondary text-center">
            {viewMode === 'today'
              ? '🌍 Switch biomes • 🐾 Drag animals • 👆 Double-tap to flip'
              : '🌍 Switch biomes • ‹ › Navigate time • See your full collection'
            }
          </p>
          <p className="text-xs text-text-secondary text-center mt-2">
            {viewMode === 'today'
              ? 'Collect animals daily • Unlock biomes by leveling up • Your collection resets at midnight'
              : `Viewing all ${BIOME_CONFIG[activeBiome].name} animals collected ${periodLabel}`
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default MeadowScreen;
