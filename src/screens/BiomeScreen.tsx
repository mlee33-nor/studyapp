import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { useUserData } from '../hooks/useUserData';
import BiomeBackgrounds from '../components/BiomeBackgrounds';
import type { BiomeType, CollectedAnimal } from '../types';
import { getAnimalScale, BIOME_CONFIG } from '../data/biomes';
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subWeeks,
  subMonths,
  subYears,
  addWeeks,
  addMonths,
  addYears,
  eachDayOfInterval,
  isSameDay,
  isAfter,
  isBefore,
} from 'date-fns';

// Biome container dimensions
const BIOME_HEIGHT = 450;
const ANIMAL_SIZE = 60;

type TimelineViewMode = 'weekly' | 'monthly' | 'yearly';

interface BiomeScreenProps {
  biomeId: BiomeType;
}

// Walking speed for wolves in biome view (pixels per second)
const WALKING_SPEED = 30;

const WALKING_ANIMAL_NAMES = new Set(['Wolf']);

interface WalkingInstance {
  x: number;
  direction: 1 | -1;
  el: HTMLDivElement | null;
  flipped: boolean;
}

/**
 * BiomeScreen Component
 * Displays a specific biome with its background and animals
 * Supports drag/drop and interaction with biome-specific creatures
 */
const BiomeScreen: React.FC<BiomeScreenProps> = ({ biomeId }) => {
  const { userData } = useUserData();
  const [loadedAnimations, setLoadedAnimations] = useState<Record<string, any>>({});
  const [draggingAnimalId, setDraggingAnimalId] = useState<string | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<CollectedAnimal | null>(null);
  const [timelineView, setTimelineView] = useState<TimelineViewMode>('monthly');
  const [timelineDate, setTimelineDate] = useState(new Date());
  const biomeRef = useRef<HTMLDivElement>(null);
  const walkingInstancesRef = useRef<Record<string, WalkingInstance>>({});

  const biomeConfig = BIOME_CONFIG[biomeId];

  // Generate grass blades for depth effect
  const grassBlades = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      bottom: Math.random() * 60,
      left: (i / 25) * 100,
      height: 25 + Math.random() * 30,
      rotation: -15 + Math.random() * 30,
      depth: Math.random() * 10,
    })), []);

  // Get ALL animals for this biome from permanent collection
  const biomeAnimals = useMemo(() => {
    if (!userData.permanentCollection) return [];
    return userData.permanentCollection.filter(animal => animal.biome === biomeId);
  }, [userData.permanentCollection, biomeId]);

  // Get unique animal species in this biome with counts
  const animalSpecies = useMemo(() => {
    const counts: Record<string, {
      count: number;
      name: string;
      lottieUrl: string;
      firstCollected: string;
      lastCollected: string;
      dates: string[];
    }> = {};
    biomeAnimals.forEach(animal => {
      // Group by species (name), not instance id (which is unique per collection)
      const speciesKey = animal.name;
      if (!counts[speciesKey]) {
        counts[speciesKey] = {
          count: 0,
          name: animal.name,
          lottieUrl: animal.lottieUrl,
          firstCollected: animal.collectedAt,
          lastCollected: animal.collectedAt,
          dates: [],
        };
      }
      counts[speciesKey].count++;
      counts[speciesKey].dates.push(animal.collectedAt);
      if (animal.collectedAt < counts[speciesKey].firstCollected) {
        counts[speciesKey].firstCollected = animal.collectedAt;
      }
      if (animal.collectedAt > counts[speciesKey].lastCollected) {
        counts[speciesKey].lastCollected = animal.collectedAt;
      }
    });
    return Object.entries(counts).sort(([, a], [, b]) => b.count - a.count);
  }, [biomeAnimals]);

  // Timeline data based on view mode
  const timelineData = useMemo(() => {
    let start: Date;
    let end: Date;

    if (timelineView === 'weekly') {
      start = startOfWeek(timelineDate, { weekStartsOn: 0 });
      end = endOfWeek(timelineDate, { weekStartsOn: 0 });
    } else if (timelineView === 'monthly') {
      start = startOfMonth(timelineDate);
      end = endOfMonth(timelineDate);
    } else {
      start = startOfYear(timelineDate);
      end = endOfYear(timelineDate);
    }

    const days = eachDayOfInterval({ start, end });

    // Count collections per day in this biome
    const dayMap: Record<string, { date: Date; animals: CollectedAnimal[]; count: number }> = {};
    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      dayMap[key] = { date: day, animals: [], count: 0 };
    });

    biomeAnimals.forEach(animal => {
      if (!animal.collectedAt) return;
      const d = parseISO(animal.collectedAt);
      const key = format(d, 'yyyy-MM-dd');
      if (dayMap[key]) {
        dayMap[key].animals.push(animal);
        dayMap[key].count++;
      }
    });

    // Get animals collected in this time range for breakdown
    const rangeAnimals = biomeAnimals.filter(a => {
      if (!a.collectedAt) return false;
      const d = parseISO(a.collectedAt);
      return !isBefore(d, start) && !isAfter(d, end);
    });

    // Per-species counts in range
    const speciesCounts: Record<string, { count: number; name: string; lottieUrl: string }> = {};
    rangeAnimals.forEach(a => {
      const speciesKey = a.name;
      if (!speciesCounts[speciesKey]) {
        speciesCounts[speciesKey] = { count: 0, name: a.name, lottieUrl: a.lottieUrl };
      }
      speciesCounts[speciesKey].count++;
    });

    return {
      days: Object.values(dayMap),
      start,
      end,
      totalInRange: rangeAnimals.length,
      speciesInRange: Object.entries(speciesCounts).sort(([, a], [, b]) => b.count - a.count),
    };
  }, [biomeAnimals, timelineDate, timelineView]);

  // Load Lottie animations
  useEffect(() => {
    const loadAnimations = async () => {
      const toLoad = biomeAnimals.filter(a => !loadedAnimations[a.id]);
      const uniqueToLoad = toLoad.filter((a, i, arr) => arr.findIndex(b => b.lottieUrl === a.lottieUrl) === i);
      const results = await Promise.all(
        uniqueToLoad.map(async (animal) => {
          try {
            const response = await fetch(animal.lottieUrl);
            const data = await response.json();
            return { id: animal.id, lottieUrl: animal.lottieUrl, data };
          } catch (error) {
            console.error('Error loading animation:', animal.id, error);
            return null;
          }
        })
      );

      const animations: Record<string, any> = {};
      for (const result of results) {
        if (result) {
          animations[result.id] = result.data;
          // Also map other animals with the same URL
          toLoad.forEach(a => {
            if (a.lottieUrl === result.lottieUrl) {
              animations[a.id] = result.data;
            }
          });
        }
      }
      if (Object.keys(animations).length > 0) {
        setLoadedAnimations(prev => ({ ...prev, ...animations }));
      }
    };

    loadAnimations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biomeAnimals.length]);

  // Walking animal horizontal movement — pure DOM, no React re-renders
  useEffect(() => {
    const walkers = biomeAnimals.filter(a => WALKING_ANIMAL_NAMES.has(a.name));

    // Initialize instances for new walking animals
    for (const walker of walkers) {
      if (!walkingInstancesRef.current[walker.id]) {
        walkingInstancesRef.current[walker.id] = {
          x: Math.random() * 200 + 50,
          direction: Math.random() > 0.5 ? 1 : -1 as 1 | -1,
          el: null,
          flipped: false,
        };
      }
    }

    // Clean up removed walking animals
    const walkerIds = new Set(walkers.map(w => w.id));
    for (const id of Object.keys(walkingInstancesRef.current)) {
      if (!walkerIds.has(id)) {
        delete walkingInstancesRef.current[id];
      }
    }

    if (walkers.length === 0) return;

    let lastTime = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const containerWidth = biomeRef.current?.offsetWidth ?? 400;
      const maxX = containerWidth - ANIMAL_SIZE * 2;
      const minX = ANIMAL_SIZE / 2;

      for (const id of Object.keys(walkingInstancesRef.current)) {
        const inst = walkingInstancesRef.current[id];
        if (!inst.el) continue;

        inst.x += inst.direction * WALKING_SPEED * dt;

        if (inst.x >= maxX) {
          inst.x = maxX;
          inst.direction = -1;
          inst.flipped = true;
        } else if (inst.x <= minX) {
          inst.x = minX;
          inst.direction = 1;
          inst.flipped = false;
        }

        inst.el.style.transform = `translateX(${inst.x}px) scaleX(${inst.flipped ? -1 : 1})`;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [biomeAnimals]);

  // Load lottie for species breakdown (uses lottieUrl as key)
  const [speciesLottie, setSpeciesLottie] = useState<Record<string, any>>({});
  const speciesUrls = animalSpecies.map(([, info]) => info.lottieUrl).join(',');

  useEffect(() => {
    if (animalSpecies.length === 0) return;
    const toLoad = animalSpecies.filter(([, info]) => !speciesLottie[info.lottieUrl]);
    if (toLoad.length === 0) return;
    Promise.all(
      toLoad.map(([, info]) =>
        fetch(info.lottieUrl)
          .then(r => r.json())
          .then(data => ({ url: info.lottieUrl, data }))
          .catch(() => null)
      )
    ).then(results => {
      const newData: Record<string, any> = {};
      results.forEach(r => { if (r) newData[r.url] = r.data; });
      if (Object.keys(newData).length > 0) {
        setSpeciesLottie(prev => ({ ...prev, ...newData }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speciesUrls]);

  // Handle drag end with smooth constraints
  const handleDragEnd = (_animalId: string, _event: any) => {
    setDraggingAnimalId(null);
  };

  // Handle animal tap - show popup
  const handleAnimalTap = (animal: CollectedAnimal) => {
    setSelectedAnimal(animal);
  };

  // Get count for a specific animal species (by name, since id is unique per instance)
  const getAnimalCount = (animalName: string) => {
    return biomeAnimals.filter(a => a.name === animalName).length;
  };

  // Timeline navigation
  const navigatePrev = () => {
    if (timelineView === 'weekly') setTimelineDate(d => subWeeks(d, 1));
    else if (timelineView === 'monthly') setTimelineDate(d => subMonths(d, 1));
    else setTimelineDate(d => subYears(d, 1));
  };

  const navigateNext = () => {
    if (timelineView === 'weekly') setTimelineDate(d => addWeeks(d, 1));
    else if (timelineView === 'monthly') setTimelineDate(d => addMonths(d, 1));
    else setTimelineDate(d => addYears(d, 1));
  };

  const getTimelineLabel = () => {
    if (timelineView === 'weekly') {
      return `${format(timelineData.start, 'MMM d')} - ${format(timelineData.end, 'MMM d, yyyy')}`;
    } else if (timelineView === 'monthly') {
      return format(timelineDate, 'MMMM yyyy');
    }
    return format(timelineDate, 'yyyy');
  };

  // Max count for heatmap scaling
  const maxDayCount = Math.max(1, ...timelineData.days.map(d => d.count));

  return (
    <div className="min-h-screen pb-24 pt-8 px-6" style={{ background: '#f8f9fa' }}>
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Your {biomeConfig.name}
        </h1>
        <p className="text-text-secondary mb-6">
          Explore and admire your collected animals
        </p>

        {/* Stats Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Animals Here</p>
              <p className="text-2xl font-bold text-text-primary">
                {biomeAnimals.length}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="text-sm text-text-secondary">
                {animalSpecies.length} species
              </span>
              <span className="text-4xl">{biomeConfig.emoji}</span>
            </div>
          </div>
        </div>

        {/* 3D Biome Diorama Container */}
        <div style={{
          perspective: '1200px',
          marginBottom: '20px',
          filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.15)) drop-shadow(0 10px 15px rgba(0,0,0,0.08))'
        }}>
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
              ref={biomeRef}
              style={{
                position: 'relative',
                height: `${BIOME_HEIGHT}px`,
                borderRadius: '28px',
                overflow: 'hidden',
                boxShadow: 'inset 0 -10px 40px rgba(0,0,0,0.1)',
              }}
            >
              {/* Background */}
              <BiomeBackgrounds biomeId={biomeId} />

              {/* Grass blades for depth (only for meadow/safari) */}
              {(biomeId === 'meadow' || biomeId === 'safari') && grassBlades.map((blade, i) => (
                <div
                  key={`grass-${i}`}
                  style={{
                    position: 'absolute',
                    bottom: blade.bottom,
                    left: `${blade.left}%`,
                    width: '3px',
                    height: `${blade.height}px`,
                    background: 'linear-gradient(to top, rgba(34, 139, 34, 0.6), rgba(124, 252, 0, 0.3))',
                    borderRadius: '3px',
                    transform: `rotate(${blade.rotation}deg) translateZ(${blade.depth}px)`,
                    boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 4,
                    pointerEvents: 'none'
                  }}
                />
              ))}

              {/* Empty state */}
              {biomeAnimals.length === 0 ? (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  zIndex: 10
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>✨</div>
                  <div style={{
                    fontSize: '16px',
                    color: 'rgba(0,0,0,0.7)',
                    fontFamily: "'Quicksand', sans-serif",
                    fontWeight: 600,
                    textShadow: '0 2px 4px rgba(255,255,255,0.5)'
                  }}>
                    No animals here yet
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(0,0,0,0.6)',
                    marginTop: '8px',
                    fontFamily: "'Quicksand', sans-serif",
                    textShadow: '0 1px 2px rgba(255,255,255,0.5)'
                  }}>
                    Collect animals from study sessions!
                  </div>
                </div>
              ) : (
                biomeAnimals.map((animal) => {
                  const isWalker = WALKING_ANIMAL_NAMES.has(animal.name);
                  const animalScale = getAnimalScale(animal.lottieUrl);
                  const scaledSize = animalScale ? ANIMAL_SIZE * animalScale : ANIMAL_SIZE;

                  if (isWalker) {
                    return (
                      <div
                        key={`${animal.id}-${animal.collectedAt}`}
                        ref={(el) => {
                          if (el && walkingInstancesRef.current[animal.id]) {
                            walkingInstancesRef.current[animal.id].el = el;
                          }
                        }}
                        onClick={() => handleAnimalTap(animal)}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '55%',
                          width: `${ANIMAL_SIZE}px`,
                          height: `${ANIMAL_SIZE}px`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 6,
                          cursor: 'pointer',
                          willChange: 'transform',
                        }}
                      >
                        <div style={{ width: `${scaledSize}px`, height: `${scaledSize}px`, flexShrink: 0 }}>
                          {loadedAnimations[animal.id] && (
                            <Lottie
                              animationData={loadedAnimations[animal.id]}
                              loop={true}
                              style={{
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <motion.div
                      key={`${animal.id}-${animal.collectedAt}`}
                      drag
                      dragMomentum={false}
                      dragElastic={0}
                      dragConstraints={biomeRef}
                      onDragStart={() => setDraggingAnimalId(animal.id + animal.collectedAt)}
                      onDragEnd={(event) => handleDragEnd(animal.id, event)}
                      onClick={() => handleAnimalTap(animal)}
                      animate={draggingAnimalId !== animal.id + animal.collectedAt ? { x: 0, y: 0 } : undefined}
                      transition={draggingAnimalId === animal.id + animal.collectedAt ? { duration: 0 } : { type: "tween", duration: 0.2 }}
                      className="absolute cursor-grab active:cursor-grabbing"
                      style={{
                        position: 'absolute',
                        left: `${Math.random() * 50 + 25}%`,
                        top: `${Math.random() * 40 + 30}%`,
                        width: `${ANIMAL_SIZE}px`,
                        height: `${ANIMAL_SIZE}px`,
                        overflow: 'visible',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 6,
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                      }}
                      whileHover={{
                        scale: 1.05,
                        filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))'
                      }}
                      whileTap={{ scale: 0.95, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
                    >
                      {loadedAnimations[animal.id] && (
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
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-6">
          <p className="text-sm text-text-secondary text-center">
            🐾 Tap an animal for details • Drag to move
          </p>
        </div>

        {/* Animal Species Breakdown */}
        {animalSpecies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(100, 116, 139, 0.15)',
              padding: '20px',
              marginBottom: '16px'
            }}
          >
            <div style={{
              fontSize: '0.8rem',
              color: 'rgba(100, 116, 139, 0.7)',
              marginBottom: '16px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {biomeConfig.emoji} Species Breakdown
            </div>

            {/* Donut chart */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <AnimalDonutChart
                species={animalSpecies}
                total={biomeAnimals.length}
                biomeColor={biomeConfig.primaryColor}
              />
            </div>

            {/* Species list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {animalSpecies.map(([animalId, info], i) => {
                const percent = biomeAnimals.length > 0 ? Math.round((info.count / biomeAnimals.length) * 100) : 0;
                return (
                  <div key={animalId} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px',
                    borderRadius: '12px',
                    background: i === 0 ? `${biomeConfig.primaryColor}10` : 'transparent',
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: `${biomeConfig.primaryColor}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}>
                      {speciesLottie[info.lottieUrl] ? (
                        <Lottie
                          animationData={speciesLottie[info.lottieUrl]}
                          loop={true}
                          autoplay={true}
                          style={{ width: '34px', height: '34px' }}
                        />
                      ) : (
                        <span style={{ fontSize: '1.2rem' }}>{biomeConfig.emoji}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: 'rgba(15, 23, 42, 0.95)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {info.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(100, 116, 139, 0.7)' }}>
                        First: {format(parseISO(info.firstCollected), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'rgba(100, 116, 139, 0.7)',
                      }}>
                        {percent}%
                      </span>
                      <div style={{
                        textAlign: 'center',
                        padding: '4px 10px',
                        borderRadius: '10px',
                        background: `${biomeConfig.primaryColor}15`,
                      }}>
                        <div style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: biomeConfig.primaryColor,
                        }}>
                          {info.count}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Collection Timeline */}
        {biomeAnimals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(100, 116, 139, 0.15)',
              padding: '20px',
              marginBottom: '16px'
            }}
          >
            <div style={{
              fontSize: '0.8rem',
              color: 'rgba(100, 116, 139, 0.7)',
              marginBottom: '16px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Collection Timeline
            </div>

            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              gap: '4px',
              padding: '4px',
              borderRadius: '12px',
              background: 'rgba(0,0,0,0.04)',
              marginBottom: '16px',
            }}>
              {(['weekly', 'monthly', 'yearly'] as TimelineViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setTimelineView(mode)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: timelineView === mode ? 'white' : 'transparent',
                    color: timelineView === mode ? biomeConfig.primaryColor : 'rgba(100, 116, 139, 0.7)',
                    boxShadow: timelineView === mode ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Time Navigator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <button
                onClick={navigatePrev}
                style={{
                  background: 'rgba(0,0,0,0.04)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: 'rgba(51, 65, 85, 0.8)',
                }}
              >
                &#8249;
              </button>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'rgba(15, 23, 42, 0.95)',
              }}>
                {getTimelineLabel()}
              </span>
              <button
                onClick={navigateNext}
                style={{
                  background: 'rgba(0,0,0,0.04)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: 'rgba(51, 65, 85, 0.8)',
                }}
              >
                &#8250;
              </button>
            </div>

            {/* Animal Tag Breakdown for selected period */}
            {timelineData.speciesInRange.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Donut Chart */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AnimalDonutChart
                    species={timelineData.speciesInRange}
                    total={timelineData.totalInRange}
                    biomeColor={biomeConfig.primaryColor}
                  />
                </div>

                {/* Species List (tag breakdown style) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {timelineData.speciesInRange.map(([speciesKey, info], i) => {
                    const percent = timelineData.totalInRange > 0
                      ? Math.round((info.count / timelineData.totalInRange) * 100)
                      : 0;
                    return (
                      <div key={speciesKey} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '14px',
                        background: i === 0 ? `${biomeConfig.primaryColor}08` : 'transparent',
                        borderBottom: i < timelineData.speciesInRange.length - 1
                          ? '1px solid rgba(100, 116, 139, 0.08)'
                          : 'none',
                      }}>
                        {/* Animal avatar */}
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: `${biomeConfig.primaryColor}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}>
                          {speciesLottie[info.lottieUrl] ? (
                            <Lottie
                              animationData={speciesLottie[info.lottieUrl]}
                              loop={true}
                              autoplay={true}
                              style={{ width: '36px', height: '36px' }}
                            />
                          ) : (
                            <span style={{ fontSize: '1.2rem' }}>{biomeConfig.emoji}</span>
                          )}
                        </div>
                        {/* Name + progress bar */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: 'rgba(15, 23, 42, 0.95)',
                            marginBottom: '4px',
                          }}>
                            {info.name}
                          </div>
                          {/* Mini progress bar */}
                          <div style={{
                            height: '6px',
                            borderRadius: '3px',
                            background: 'rgba(0,0,0,0.06)',
                            overflow: 'hidden',
                          }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              style={{
                                height: '100%',
                                borderRadius: '3px',
                                background: `linear-gradient(90deg, ${biomeConfig.primaryColor}, ${biomeConfig.secondaryColor})`,
                              }}
                            />
                          </div>
                        </div>
                        {/* Percentage */}
                        <span style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: 'rgba(100, 116, 139, 0.6)',
                          minWidth: '36px',
                          textAlign: 'right',
                        }}>
                          {percent}%
                        </span>
                        {/* Count */}
                        <div style={{
                          textAlign: 'center',
                          padding: '4px 10px',
                          borderRadius: '10px',
                          background: `${biomeConfig.primaryColor}12`,
                          flexShrink: 0,
                        }}>
                          <div style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: biomeConfig.primaryColor,
                          }}>
                            {info.count}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Activity calendar (compact, below the breakdown) */}
                <div style={{
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(100, 116, 139, 0.1)',
                }}>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'rgba(100, 116, 139, 0.5)',
                    marginBottom: '8px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}>
                    Activity
                  </div>
                  {timelineView === 'yearly' ? (
                    <YearlyHeatmapGrid
                      days={timelineData.days}
                      maxCount={maxDayCount}
                      biomeColor={biomeConfig.primaryColor}
                    />
                  ) : timelineView === 'weekly' ? (
                    /* Weekly: Horizontal day strip */
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {timelineData.days.map((day, i) => {
                        const isToday = isSameDay(day.date, new Date());
                        const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                        const intensity = day.count > 0 ? Math.min(day.count / maxDayCount, 1) : 0;
                        return (
                          <div key={i} style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            <span style={{
                              fontSize: '0.6rem',
                              fontWeight: 600,
                              color: isToday ? biomeConfig.primaryColor : 'rgba(100, 116, 139, 0.5)',
                            }}>
                              {dayLabels[day.date.getDay()]}
                            </span>
                            <div style={{
                              width: '100%',
                              aspectRatio: '1',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: day.count > 0
                                ? `${biomeConfig.primaryColor}${Math.round((0.15 + intensity * 0.5) * 255).toString(16).padStart(2, '0')}`
                                : 'rgba(0,0,0,0.03)',
                              border: isToday ? `2px solid ${biomeConfig.primaryColor}` : '1px solid rgba(0,0,0,0.04)',
                            }}>
                              {day.count > 0 ? (
                                <span style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  color: biomeConfig.primaryColor,
                                }}>
                                  {day.count}
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.6rem',
                                  color: 'rgba(100, 116, 139, 0.3)',
                                }}>
                                  {format(day.date, 'd')}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Monthly: Compact calendar grid */
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '3px',
                    }}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} style={{
                          textAlign: 'center',
                          fontSize: '0.55rem',
                          fontWeight: 600,
                          color: 'rgba(100, 116, 139, 0.4)',
                          padding: '2px 0',
                        }}>
                          {d}
                        </div>
                      ))}
                      {(() => {
                        const firstDayOfWeek = timelineData.days[0]?.date.getDay() ?? 0;
                        const paddingCells = Array.from({ length: firstDayOfWeek }, (_, i) => (
                          <div key={`pad-${i}`} />
                        ));
                        const dayCells = timelineData.days.map((day, i) => {
                          const isToday = isSameDay(day.date, new Date());
                          const intensity = day.count > 0 ? Math.min(day.count / maxDayCount, 1) : 0;
                          return (
                            <div
                              key={i}
                              style={{
                                aspectRatio: '1',
                                borderRadius: '4px',
                                background: day.count > 0
                                  ? `${biomeConfig.primaryColor}${Math.round((0.2 + intensity * 0.6) * 255).toString(16).padStart(2, '0')}`
                                  : 'rgba(0,0,0,0.03)',
                                border: isToday ? `1.5px solid ${biomeConfig.primaryColor}` : 'none',
                              }}
                              title={`${format(day.date, 'MMM d')}: ${day.count} animals`}
                            />
                          );
                        });
                        return [...paddingCells, ...dayCells];
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Empty state for this period */
              <div style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: 'rgba(100, 116, 139, 0.5)',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>
                  No animals collected
                </div>
                <div style={{ fontSize: '0.8rem' }}>
                  {timelineView === 'weekly' ? 'this week' : timelineView === 'monthly' ? 'this month' : 'this year'}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Animal Detail Popup */}
      <AnimatePresence>
        {selectedAnimal && (
          <AnimalPopup
            animal={selectedAnimal}
            count={getAnimalCount(selectedAnimal.name)}
            biomeConfig={biomeConfig}
            lottieData={loadedAnimations[selectedAnimal.id] || speciesLottie[selectedAnimal.lottieUrl]}
            onClose={() => setSelectedAnimal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Animal detail popup component
const AnimalPopup: React.FC<{
  animal: CollectedAnimal;
  count: number;
  biomeConfig: { name: string; emoji: string; primaryColor: string; secondaryColor: string };
  lottieData: any;
  onClose: () => void;
}> = ({ animal, count, biomeConfig, lottieData, onClose }) => {
  const collectedDate = animal.collectedAt ? format(parseISO(animal.collectedAt), 'MMM d, yyyy') : 'Unknown';

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
        }}
      />
      {/* Popup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          position: 'fixed',
          bottom: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '85%',
          maxWidth: '360px',
          background: 'white',
          borderRadius: '24px',
          padding: '24px',
          zIndex: 101,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0,0,0,0.06)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(0,0,0,0.4)',
          }}
        >
          x
        </button>

        {/* Animal animation */}
        <div style={{
          width: '100px',
          height: '100px',
          margin: '0 auto 16px',
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${biomeConfig.primaryColor}25, ${biomeConfig.secondaryColor}25)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {lottieData ? (
            <Lottie
              animationData={lottieData}
              loop={true}
              autoplay={true}
              style={{ width: '85px', height: '85px' }}
            />
          ) : (
            <span style={{ fontSize: '3rem' }}>{biomeConfig.emoji}</span>
          )}
        </div>

        {/* Animal name */}
        <h3 style={{
          textAlign: 'center',
          fontSize: '1.3rem',
          fontWeight: 700,
          color: '#0f172a',
          margin: '0 0 4px',
        }}>
          {animal.name}
        </h3>
        <p style={{
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'rgba(100, 116, 139, 0.7)',
          margin: '0 0 20px',
        }}>
          {biomeConfig.emoji} {biomeConfig.name} Biome
        </p>

        {/* Stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
        }}>
          <div style={{
            textAlign: 'center',
            padding: '12px',
            borderRadius: '14px',
            background: `${biomeConfig.primaryColor}10`,
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: biomeConfig.primaryColor }}>
              {count}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(100, 116, 139, 0.7)', fontWeight: 600, marginTop: '2px' }}>
              Times Earned
            </div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: '12px',
            borderRadius: '14px',
            background: 'rgba(0,0,0,0.03)',
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
              {collectedDate}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(100, 116, 139, 0.7)', fontWeight: 600, marginTop: '2px' }}>
              This One Collected
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

// Donut chart for species breakdown
const AnimalDonutChart: React.FC<{
  species: [string, { count: number; name: string; lottieUrl: string }][];
  total: number;
  biomeColor: string;
}> = ({ species, total, biomeColor }) => {
  const size = 130;
  const radius = 45;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  // Generate distinct colors based on biome primary
  const colors = species.map((_, i) => {
    const hueShift = i * 35;
    return `hsl(${(parseInt(biomeColor.slice(1, 3), 16) + hueShift) % 360}, 60%, ${55 + i * 5}%)`;
  });

  let cumulativePercent = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.04)"
        strokeWidth={strokeWidth}
      />
      {species.map(([, info], i) => {
        const percent = total > 0 ? (info.count / total) * 100 : 0;
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
            stroke={colors[i]}
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
        fill="#0f172a"
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
        fill="rgba(100, 116, 139, 0.7)"
        fontSize="9"
        fontFamily="'Quicksand', sans-serif"
      >
        Total
      </text>
    </svg>
  );
};

// Yearly heatmap grid (GitHub-style)
const YearlyHeatmapGrid: React.FC<{
  days: { date: Date; count: number }[];
  maxCount: number;
  biomeColor: string;
}> = ({ days, maxCount, biomeColor }) => {
  // Build weeks array
  const weeks: { date: Date; count: number }[][] = [];
  let currentWeek: { date: Date; count: number }[] = [];

  if (days.length > 0) {
    const firstDay = days[0].date.getDay();
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: new Date(0), count: -1 }); // placeholder
    }
  }

  days.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: new Date(0), count: -1 });
    }
    weeks.push(currentWeek);
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: '3px', minWidth: 'fit-content' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {week.map((day, di) => {
              if (day.count < 0) {
                return <div key={di} style={{ width: '11px', height: '11px' }} />;
              }
              const intensity = day.count > 0 ? Math.min(day.count / maxCount, 1) : 0;
              const isToday = isSameDay(day.date, new Date());
              return (
                <div
                  key={di}
                  title={`${format(day.date, 'MMM d')}: ${day.count} animals`}
                  style={{
                    width: '11px',
                    height: '11px',
                    borderRadius: '2px',
                    background: day.count > 0
                      ? `${biomeColor}${Math.round((0.25 + intensity * 0.75) * 255).toString(16).padStart(2, '0')}`
                      : 'rgba(0,0,0,0.06)',
                    border: isToday ? `2px solid ${biomeColor}` : 'none',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      {/* Month labels */}
      <div style={{ display: 'flex', marginTop: '6px', fontSize: '0.55rem', color: 'rgba(100, 116, 139, 0.5)' }}>
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
          <span key={i} style={{ flex: 1, textAlign: 'center' }}>{m}</span>
        ))}
      </div>
    </div>
  );
};

export default BiomeScreen;
