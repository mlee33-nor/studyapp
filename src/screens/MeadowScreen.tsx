import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, motionValue } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import Lottie from 'lottie-react';
import confetti from 'canvas-confetti';
import { useUserData } from '../hooks/useUserData';
import { updateAnimalPosition, getUserData, saveUserData } from '../utils/storage';
import type { MeadowAnimal, BiomeType, CollectedAnimal } from '../types';
import { BIOME_CONFIG, getAnimalScale, getBiomeCost } from '../data/biomes';
import { fetchAnimation, getAllCached } from '../utils/lottieCache';
import { Lock } from 'lucide-react';
import { BiomeUnlockCelebration } from '../animations/BiomeUnlockAnimation';
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
import farmBg from '../assets/biomes/farm.jpg';

// Meadow dimensions and safe zones
const MEADOW_WIDTH = 400;
const MEADOW_HEIGHT = 450;
const ANIMAL_SIZE = 60;
const EMOJI_SIZE = 90; // Larger size for emoji fallback animals

// Per-biome ground barrier — forest has more vertical space due to tree canopy
const BIOME_MIN_Y: Record<string, number> = {
  forest: 200,
  meadow: 220,
  ocean: 240,
  safari: 200,
  farm: 170,
};

// Safe horizontal bounds
const MIN_X = 10;

// Horizontal walking movement
const WALKING_SPEED = 30; // pixels per second

interface WalkingAnimalInstance {
  x: MotionValue<number>;
  y: MotionValue<number>;
  direction: 1 | -1;
  paused: boolean;
  dragStartX: number;
  dragStartY: number;
  resumeTimer: ReturnType<typeof setTimeout> | null;
}

const WALKING_ANIMAL_NAMES = new Set(['Monkey', 'Tiger', 'Wolf']);
const VERTICAL_WALKING_ANIMAL_NAMES = new Set<string>([]);
const isWalkingAnimal = (animal: MeadowAnimal) =>
  WALKING_ANIMAL_NAMES.has(animal.name) || VERTICAL_WALKING_ANIMAL_NAMES.has(animal.name);

type SanctuaryViewMode = 'today' | 'weekly' | 'monthly' | 'yearly';

// Timeline caps — max animals shown per view before oldest are dropped
const TIMELINE_CAPS = { weekly: 40, monthly: 100, yearly: 365 };

// Dynamic timeline layout based on view mode and animal count
function getTimelineLayout(viewMode: SanctuaryViewMode, count: number) {
  let cols: number, size: number, gap: number, showName: boolean | 'small';

  if (viewMode === 'weekly') {
    if (count <= 6)       { cols = 3; size = 80; gap = 16; showName = true; }
    else if (count <= 15) { cols = 4; size = 65; gap = 12; showName = true; }
    else if (count <= 25) { cols = 5; size = 52; gap = 10; showName = 'small'; }
    else                  { cols = 6; size = 42; gap = 8;  showName = false; }
  } else if (viewMode === 'monthly') {
    if (count <= 10)      { cols = 4; size = 65; gap = 14; showName = true; }
    else if (count <= 25) { cols = 5; size = 55; gap = 10; showName = 'small'; }
    else if (count <= 50) { cols = 6; size = 42; gap = 8;  showName = false; }
    else                  { cols = 8; size = 32; gap = 6;  showName = false; }
  } else {
    // yearly
    if (count <= 20)       { cols = 5;  size = 55; gap = 10; showName = false; }
    else if (count <= 60)  { cols = 8;  size = 32; gap = 6;  showName = false; }
    else if (count <= 150) { cols = 10; size = 26; gap = 4;  showName = false; }
    else                   { cols = 14; size = 18; gap = 2;  showName = false; }
  }

  const fontSize = showName === 'small' ? '9px' : showName ? '13px' : '0px';

  return {
    gridColumns: `repeat(${cols}, 1fr)`,
    lottieSize: size,
    gap: `${gap}px`,
    gapPx: gap,
    cols,
    showName: showName !== false,
    fontSize,
    smallName: showName === 'small',
  };
}

// Biome background components
const biomeBackgroundStyle = (bgImage: string): React.CSSProperties => ({
  backgroundImage: `url(${bgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center bottom',
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
});

const BiomeBackgrounds: Record<BiomeType, React.FC> = {
  meadow: () => <div style={biomeBackgroundStyle(meadowBg)} />,
  safari: () => <div style={biomeBackgroundStyle(safariBg)} />,
  forest: () => <div style={biomeBackgroundStyle(forestBg)} />,
  ocean: () => <div style={biomeBackgroundStyle(oceanBg)} />,
  farm: () => <div style={biomeBackgroundStyle(farmBg)} />,
};

const ALL_BIOME_IDS: BiomeType[] = ['meadow', 'safari', 'forest', 'ocean', 'farm'];

interface MeadowScreenProps {
  onBiomeRevealChange?: (active: boolean) => void;
}

const MeadowScreen: React.FC<MeadowScreenProps> = ({ onBiomeRevealChange }) => {
  const { userData, refreshData } = useUserData();
  const [loadedAnimations, setLoadedAnimations] = useState<Record<string, any>>(getAllCached);
  const [failedAnimations, setFailedAnimations] = useState<Set<string>>(new Set());
  const meadowRef = useRef<HTMLDivElement>(null);
  const [sceneHeight, setSceneHeight] = useState(MEADOW_HEIGHT);
  const [activeBiome, setActiveBiome] = useState<BiomeType>(userData.activeBiome as BiomeType);
  const MIN_Y = BIOME_MIN_Y[activeBiome] ?? 220;

  // Theme detection
  const storedTheme = localStorage.getItem('selectedTheme');
  const isDark = storedTheme !== 'morning';

  // Walking animal horizontal movement state
  const walkingInstancesRef = useRef<Record<string, WalkingAnimalInstance>>({});
  const [walkingFlips, setWalkingFlips] = useState<Record<string, boolean>>({});

  // Biome purchase confirmation modal state
  const [biomePurchaseTarget, setBiomePurchaseTarget] = useState<{ biomeId: BiomeType; cost: number } | null>(null);
  // Crystal seed tap-to-reveal state
  const [biomeReveal, setBiomeReveal] = useState<{ biomeId: BiomeType; stage: number } | null>(null);

  useEffect(() => {
    onBiomeRevealChange?.(biomeReveal !== null);
  }, [biomeReveal, onBiomeRevealChange]);

  const triggerHapticFeedback = (duration = 20) => {
    if (navigator.vibrate) navigator.vibrate(duration);
  };

  const handleBiomeRevealTap = useCallback(() => {
    if (!biomeReveal) return;
    const next = biomeReveal.stage + 1;
    if (next <= 3) {
      triggerHapticFeedback(20);
      setBiomeReveal(prev => prev ? { ...prev, stage: next } : null);
      if (next === 3) {
        // Fire biome-colored confetti (3 bursts like animal chest)
        const biomeColor = BIOME_CONFIG[biomeReveal.biomeId].primaryColor;
        const biomeColor2 = BIOME_CONFIG[biomeReveal.biomeId].secondaryColor;
        const colors = [biomeColor, biomeColor2, '#FFFFFF'];
        confetti({ particleCount: 60, spread: 160, origin: { y: 0.45, x: 0.5 }, colors, shapes: ['circle'], gravity: 1.2, scalar: 0.9 });
        setTimeout(() => {
          confetti({ particleCount: 50, spread: 140, origin: { y: 0.5, x: 0.3 }, colors, shapes: ['circle'], gravity: 1.3, scalar: 0.7 });
        }, 150);
        setTimeout(() => {
          confetti({ particleCount: 40, spread: 180, origin: { y: 0.4, x: 0.7 }, colors, shapes: ['circle'], gravity: 1.5, scalar: 0.8 });
        }, 300);
        // Auto-dismiss after 2.8s
        setTimeout(() => {
          setBiomeReveal(null);
        }, 2800);
      }
    }
  }, [biomeReveal]);

  // Timeline state
  const [viewMode, setViewMode] = useState<SanctuaryViewMode>('today');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Always refresh data from storage when the component mounts (e.g. tab switch)
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Track actual rendered scene height so animal bounds stay correct when the
  // scene grows to fill available space on different device sizes.
  useEffect(() => {
    const el = meadowRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        if (h > 0) setSceneHeight(h);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Unlocked biomes come from storage (coin-purchased)
  const unlockedBiomes: BiomeType[] = (userData.unlockedBiomes as BiomeType[]) || ['meadow'];
  const biomeAnimals = userData.meadowAnimals.filter(a => a.biome === activeBiome);
  const BiomeBackground = BiomeBackgrounds[activeBiome];
  // Dynamic bottom boundary that adjusts when the scene grows on larger screens
  const effectiveMaxY = sceneHeight - ANIMAL_SIZE - 20;

  // Timeline: filter permanentCollection by date range and active biome, with cap
  const timelineData = useMemo(() => {
    if (viewMode === 'today') return { displayAnimals: [] as CollectedAnimal[], totalCount: 0 };

    let start: Date;
    let end: Date;

    if (viewMode === 'weekly') {
      // Weekly view always shows current week (not navigable)
      const now = new Date();
      start = startOfWeek(now);
      end = endOfWeek(now);
    } else if (viewMode === 'monthly') {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    } else {
      start = startOfYear(currentDate);
      end = endOfYear(currentDate);
    }

    const collection = userData.permanentCollection || [];
    const filtered = collection.filter((animal: CollectedAnimal) => {
      const collectedDate = new Date(animal.collectedAt);
      const inRange = isWithinInterval(collectedDate, { start, end });
      const matchesBiome = animal.biome === activeBiome;
      return inRange && matchesBiome;
    });

    // Sort by collectedAt ascending, keep most recent N
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.collectedAt).getTime() - new Date(b.collectedAt).getTime()
    );
    const cap = TIMELINE_CAPS[viewMode as keyof typeof TIMELINE_CAPS] || sorted.length;
    const displayAnimals = sorted.length > cap ? sorted.slice(-cap) : sorted;

    return { displayAnimals, totalCount: sorted.length };
  }, [viewMode, currentDate, userData.permanentCollection, activeBiome]);

  const timelineAnimals = timelineData.displayAnimals;
  const timelineTotalCount = timelineData.totalCount;

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

  const handleBiomePurchase = (biomeId: BiomeType, cost: number) => {
    const currentData = getUserData();
    if ((currentData.coins ?? 0) < cost) return;
    const newUnlocked = [...new Set([...(currentData.unlockedBiomes || ['meadow']), biomeId])];
    const newData = {
      ...currentData,
      coins: (currentData.coins ?? 0) - cost,
      unlockedBiomes: newUnlocked,
      activeBiome: biomeId,
    };
    saveUserData(newData);
    refreshData();
    setActiveBiome(biomeId);
    setBiomeReveal({ biomeId, stage: 0 });
  };

  // Load Lottie animations for today's diorama
  useEffect(() => {
    let cancelled = false;
    const loadAnimations = async () => {
      const toLoad = userData.meadowAnimals.filter(
        a => !loadedAnimations[a.id] && !failedAnimations.has(a.id)
      );
      if (toLoad.length === 0) return;

      const results = await Promise.all(
        toLoad.map(async (animal) => {
          try {
            const data = await fetchAnimation(animal.id, animal.lottieUrl);
            return { id: animal.id, data, failed: false };
          } catch {
            return { id: animal.id, data: null, failed: true };
          }
        })
      );

      if (cancelled) return;

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
    return () => { cancelled = true; };
  }, [userData.meadowAnimals]); // eslint-disable-line react-hooks/exhaustive-deps

  // Walking animal horizontal movement animation loop
  useEffect(() => {
    const walkers = biomeAnimals.filter(isWalkingAnimal);

    // Initialize instances for new walking animals
    for (const walker of walkers) {
      if (!walkingInstancesRef.current[walker.id]) {
        walkingInstancesRef.current[walker.id] = {
          x: motionValue(walker.x),
          y: motionValue(walker.y),
          direction: Math.random() > 0.5 ? 1 : -1,
          paused: false,
          dragStartX: walker.x,
          dragStartY: walker.y,
          resumeTimer: null,
        };
        // Set initial flip to match direction
        setWalkingFlips(prev => ({
          ...prev,
          [walker.id]: walkingInstancesRef.current[walker.id].direction === -1,
        }));
      }
    }

    // Clean up removed walking animals
    const walkerIds = new Set(walkers.map(w => w.id));
    for (const id of Object.keys(walkingInstancesRef.current)) {
      if (!walkerIds.has(id)) {
        const inst = walkingInstancesRef.current[id];
        if (inst.resumeTimer) clearTimeout(inst.resumeTimer);
        delete walkingInstancesRef.current[id];
      }
    }

    if (walkers.length === 0) return;

    let lastTime = performance.now();
    let rafId: number;

    const animateWalkers = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const meadowWidth = meadowRef.current?.offsetWidth ?? MEADOW_WIDTH;
      const maxX = meadowWidth - ANIMAL_SIZE - 10;
      const meadowHeight = meadowRef.current?.offsetHeight ?? MEADOW_HEIGHT;
      const dynamicMaxY = meadowHeight - ANIMAL_SIZE - 20;

      let flipsChanged = false;
      const newFlips: Record<string, boolean> = {};

      for (const id of Object.keys(walkingInstancesRef.current)) {
        const inst = walkingInstancesRef.current[id];
        if (inst.paused) continue;

        // Check if this is a vertical walker
        const walker = walkers.find(w => w.id === id);
        const isVertical = walker && VERTICAL_WALKING_ANIMAL_NAMES.has(walker.name);

        if (isVertical) {
          const currentY = inst.y.get();
          let newY = currentY + inst.direction * WALKING_SPEED * delta;

          if (newY >= dynamicMaxY) {
            newY = dynamicMaxY;
            inst.direction = -1;
            newFlips[id] = true;
            flipsChanged = true;
          } else if (newY <= MIN_Y) {
            newY = MIN_Y;
            inst.direction = 1;
            newFlips[id] = false;
            flipsChanged = true;
          }

          inst.y.set(newY);
        } else {
          const currentX = inst.x.get();
          let newX = currentX + inst.direction * WALKING_SPEED * delta;

          if (newX >= maxX) {
            newX = maxX;
            inst.direction = -1;
            newFlips[id] = true;
            flipsChanged = true;
          } else if (newX <= MIN_X) {
            newX = MIN_X;
            inst.direction = 1;
            newFlips[id] = false;
            flipsChanged = true;
          }

          inst.x.set(newX);
        }
      }

      if (flipsChanged) {
        setWalkingFlips(prev => ({ ...prev, ...newFlips }));
      }

      rafId = requestAnimationFrame(animateWalkers);
    };

    rafId = requestAnimationFrame(animateWalkers);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [biomeAnimals]);

  // Animals not bound to the ground (can roam into sky/water area)
  const FREE_ROAM_NAMES = new Set(['Butterfly', 'Turtle', 'Tropical Fish', 'Octopus', 'Bee']);
  const isFreeRoam = (animal: MeadowAnimal) => FREE_ROAM_NAMES.has(animal.name);

  // Get dynamic bounds based on actual container size
  const getBounds = (flying = false) => {
    const meadowWidth = meadowRef.current?.offsetWidth ?? MEADOW_WIDTH;
    const maxX = meadowWidth - ANIMAL_SIZE - 10;
    return { minX: MIN_X, maxX, minY: flying ? 0 : MIN_Y, maxY: effectiveMaxY };
  };

  // Constrain position to valid bounds
  const constrainPosition = (x: number, y: number, flying = false) => {
    const { minX, maxX, minY, maxY } = getBounds(flying);
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y))
    };
  };

  // Handle drag end — drop exactly where released, only clamped to meadow bounds
  const handleDragEnd = (animalId: string, _event: any, info: any) => {
    const currentAnimal = userData.meadowAnimals.find(a => a.id === animalId);
    if (!currentAnimal) return;

    const constrained = constrainPosition(
      currentAnimal.x + info.offset.x,
      currentAnimal.y + info.offset.y,
      isFreeRoam(currentAnimal)
    );

    updateAnimalPosition(animalId, constrained.x, constrained.y);
    refreshData();
    window.dispatchEvent(new CustomEvent('meadow-animal-dragged'));
  };

  // Walking animal drag handlers — pause movement during drag, resume after drop
  const handleWalkingDragStart = (animalId: string) => {
    const inst = walkingInstancesRef.current[animalId];
    if (inst) {
      // Capture the actual visual position before pausing
      inst.dragStartX = inst.x.get();
      inst.dragStartY = inst.y.get();
      inst.paused = true;
      if (inst.resumeTimer) {
        clearTimeout(inst.resumeTimer);
        inst.resumeTimer = null;
      }
    }
  };

  const handleWalkingDragEnd = (animalId: string, _event: any, info: any) => {
    const inst = walkingInstancesRef.current[animalId];
    if (!inst) {
      handleDragEnd(animalId, _event, info);
      return;
    }

    // Compute drop position from where the animal visually was, not stored position
    const constrained = constrainPosition(
      inst.dragStartX + info.offset.x,
      inst.dragStartY + info.offset.y
    );

    updateAnimalPosition(animalId, constrained.x, constrained.y);
    refreshData();

    // Sync motionValue to the saved position and resume immediately
    inst.x.set(constrained.x);
    inst.y.set(constrained.y);
    inst.paused = false;
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
      window.dispatchEvent(new CustomEvent('meadow-animal-flipped'));
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
      // Weekly always shows current week
      const now = new Date();
      const ws = startOfWeek(now);
      const we = endOfWeek(now);
      return `This Week: ${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`;
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

  // Dynamic timeline grid layout based on animal count
  const timelineLayout = useMemo(
    () => getTimelineLayout(viewMode, timelineAnimals.length),
    [viewMode, timelineAnimals.length]
  );

  // Dynamic container height based on rows
  const timelineContainerHeight = useMemo(() => {
    if (timelineAnimals.length === 0) return 450;
    const rows = Math.ceil(timelineAnimals.length / timelineLayout.cols);
    const computed = rows * (timelineLayout.lottieSize + (timelineLayout.showName ? 20 : 0) + timelineLayout.gapPx) + 40;
    return Math.max(450, Math.min(computed, 600));
  }, [timelineAnimals.length, timelineLayout]);

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: '1rem',
      paddingBottom: 'calc(68px + max(12px, env(safe-area-inset-bottom, 12px)))',
      paddingLeft: '1.5rem',
      paddingRight: '1.5rem',
      overflow: 'hidden',
    }}>
      <div style={{ maxWidth: '32rem', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h1 className="text-2xl font-bold text-text-primary mb-1">Your Sanctuary</h1>

        {/* Biome Carousel — shows all 6 biomes, locked ones show cost */}
        <div style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          marginBottom: '8px',
          paddingBottom: '4px',
          scrollBehavior: 'smooth'
        }}>
          {(() => {
            const storageCoins = getUserData().coins ?? 0;
            const appCoins = (() => { try { const d = JSON.parse(localStorage.getItem('userData') || '{}'); return d.coins ?? 0; } catch { return 0; } })();
            const currentCoins = Math.max(storageCoins, appCoins);
            const sortedBiomeIds = [...ALL_BIOME_IDS].sort((a, b) => {
              const aUnlocked = unlockedBiomes.includes(a);
              const bUnlocked = unlockedBiomes.includes(b);
              if (aUnlocked && !bUnlocked) return -1;
              if (!aUnlocked && bUnlocked) return 1;
              return 0;
            });
            return sortedBiomeIds.map((biomeId) => {
            const biomeConfig = BIOME_CONFIG[biomeId];
            const isActive = activeBiome === biomeId;
            const isUnlocked = unlockedBiomes.includes(biomeId);
            const cost = getBiomeCost(biomeId);
            const canAffordBiome = currentCoins >= cost;
            return (
              <motion.button
                key={biomeId}
                onClick={() => {
                  if (isUnlocked) {
                    handleBiomeSwitch(biomeId);
                  } else if (canAffordBiome) {
                    setBiomePurchaseTarget({ biomeId, cost });
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  border: isActive
                    ? '2px solid rgba(167, 139, 250, 0.6)'
                    : isUnlocked
                      ? '2px solid rgba(200, 200, 200, 0.3)'
                      : '2px solid rgba(150, 150, 150, 0.2)',
                  background: isActive
                    ? 'rgba(167, 139, 250, 0.2)'
                    : isUnlocked
                      ? 'rgba(100, 116, 139, 0.45)'
                      : 'rgba(0, 0, 0, 0.08)',
                  backdropFilter: 'blur(10px)',
                  cursor: isUnlocked || canAffordBiome ? 'pointer' : 'default',
                  minWidth: '64px',
                  opacity: !isUnlocked && !canAffordBiome ? 0.55 : 1,
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: '24px', position: 'relative' }}>
                  {biomeConfig.emoji}
                  {!isUnlocked && (
                    <div style={{
                      position: 'absolute',
                      top: -4, right: -6,
                      background: 'rgba(0,0,0,0.55)',
                      borderRadius: '50%',
                      width: '16px', height: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Lock size={9} color="white" strokeWidth={2.5} />
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: isUnlocked ? (isDark ? '#FFFFFF' : 'rgba(15, 23, 42, 0.95)') : 'rgba(100, 116, 139, 0.7)'
                }}>
                  {biomeConfig.name}
                </div>
                {!isUnlocked && (
                  <div style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: canAffordBiome ? '#CA8A04' : '#DC2626',
                    background: 'rgba(167, 139, 250, 0.3)',
                    padding: '1px 6px',
                    borderRadius: '8px',
                    fontFamily: "'Quicksand', sans-serif",
                  }}>
                    <span style={{ filter: 'sepia(1) saturate(3) brightness(1.1) hue-rotate(15deg)' }}>🪙</span> {cost.toLocaleString()}
                  </div>
                )}
              </motion.button>
            );
          });
          })()}
        </div>

        {/* View Mode Toggle: Today / Weekly / Monthly / Yearly */}
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '8px',
          padding: '4px',
          background: 'transparent',
          borderRadius: '16px',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
        }}>
          {(['today', 'weekly', 'monthly', 'yearly'] as SanctuaryViewMode[]).map(mode => (
            <motion.button
              key={mode}
              onClick={() => setViewMode(mode)}
              whileTap={{ scale: 0.95 }}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: '12px',
                border: 'none',
                background: viewMode === mode
                  ? 'rgba(167, 139, 250, 0.25)'
                  : 'transparent',
                color: viewMode === mode
                  ? (isDark ? '#FFFFFF' : 'rgba(15, 23, 42, 0.95)')
                  : (isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(100, 116, 139, 0.6)'),
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

        {/* Time Navigator (only for monthly and yearly modes) */}
        {(viewMode === 'monthly' || viewMode === 'yearly') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              padding: '10px 14px',
              background: 'transparent',
              borderRadius: '16px',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
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
                color: isDark ? 'rgba(203, 213, 225, 0.9)' : 'rgba(51, 65, 85, 0.8)',
                fontSize: '20px',
              }}
            >
              ‹
            </motion.button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: isDark ? '#FFFFFF' : 'rgba(15, 23, 42, 0.9)',
                fontFamily: "'Quicksand', sans-serif"
              }}>
                {getDisplayText()}
              </span>
              {!isCurrentPeriod() && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToday}
                  style={{
                    background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.3) 0%, rgba(244, 114, 182, 0.2) 100%)',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: isDark ? '#FFFFFF' : 'rgba(15, 23, 42, 0.9)',
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
                color: isDark ? 'rgba(203, 213, 225, 0.9)' : 'rgba(51, 65, 85, 0.8)',
                fontSize: '20px',
              }}
            >
              ›
            </motion.button>
          </motion.div>
        )}

        {/* Stats Card — context-aware */}
        <div style={{ background: 'transparent', border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)' }} className="rounded-3xl p-3 mb-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(100, 116, 139, 0.7)' }}>
                {viewMode === 'today'
                  ? `Today in ${BIOME_CONFIG[activeBiome].name}`
                  : `${BIOME_CONFIG[activeBiome].name} — ${periodLabel}`
                }
              </p>
              <p className="text-2xl font-bold" style={{ color: isDark ? '#FFFFFF' : 'rgba(15, 23, 42, 0.95)' }}>
                {viewMode === 'today'
                  ? `${biomeAnimals.length} Animals`
                  : timelineTotalCount > timelineAnimals.length
                    ? `${timelineAnimals.length} of ${timelineTotalCount} Animals`
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
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              <div style={{ perspective: '1200px', flex: 1, display: 'flex', flexDirection: 'column', filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.15)) drop-shadow(0 10px 15px rgba(0,0,0,0.08))' }}>
                <div
                  style={{
                    padding: '0',
                    overflow: 'hidden',
                    borderRadius: '28px',
                    transform: 'rotateX(8deg)',
                    transformStyle: 'preserve-3d',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    ref={meadowRef}
                    style={{
                      position: 'relative',
                      flex: 1,
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
                          color: 'rgba(0,0,0,0.85)',
                          fontFamily: "'Quicksand', sans-serif",
                          fontWeight: 600,
                          textShadow: 'none'
                        }}>
                          Explore {BIOME_CONFIG[activeBiome].name}...
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: 'rgba(0,0,0,0.6)',
                          marginTop: '8px',
                          fontFamily: "'Quicksand', sans-serif",
                          textShadow: 'none'
                        }}>
                          Complete study sessions to discover animals here!
                        </div>
                      </div>
                    ) : (
                      biomeAnimals.map((animal: MeadowAnimal) => {
                        const hasLottie = !!loadedAnimations[animal.id];
                        const size = hasLottie ? ANIMAL_SIZE : EMOJI_SIZE;
                        const isWalker = isWalkingAnimal(animal);
                        const walkingInst = isWalker ? walkingInstancesRef.current[animal.id] : null;
                        const walkFlip = !!walkingFlips[animal.id];
                        const isVertical = VERTICAL_WALKING_ANIMAL_NAMES.has(animal.name);
                        const flipped = isWalker && !isVertical
                          ? (animal.name === 'Tiger' ? !walkFlip : walkFlip)
                          : !isVertical && !!animal.flipped;
                        const verticalFlipped = isVertical && walkFlip;
                        return (
                        <motion.div
                          key={animal.id}
                          data-tutorial-target="meadow-animal"
                          drag
                          dragMomentum={false}
                          dragElastic={0}
                          dragConstraints={{
                            left: MIN_X,
                            right: (meadowRef.current?.offsetWidth ?? MEADOW_WIDTH) - size - 10,
                            top: isFreeRoam(animal) ? 0 : MIN_Y,
                            bottom: effectiveMaxY,
                          }}
                          onDragStart={() => { if (isWalker) handleWalkingDragStart(animal.id); }}
                          onDragEnd={(event, info) => {
                            if (isWalker) {
                              handleWalkingDragEnd(animal.id, event, info);
                            } else {
                              handleDragEnd(animal.id, event, info);
                            }
                          }}
                          onTap={() => handleAnimalTap(animal.id)}
                          animate={isWalker ? undefined : { x: animal.x, y: animal.y }}
                          transition={isWalker ? undefined : { duration: 0.1, ease: 'easeOut' }}
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
                            scaleX: flipped ? -1 : 1,
                            scaleY: verticalFlipped ? -1 : 1,
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                            x: walkingInst ? walkingInst.x : animal.x,
                            y: walkingInst ? walkingInst.y : animal.y,
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
                              const isLion = animal.name === 'Lion';
                              return (
                                <div style={{ width: `${scaledSize}px`, height: `${scaledSize}px`, flexShrink: 0 }}>
                                  <Lottie
                                    animationData={loadedAnimations[animal.id]}
                                    loop={!isLion}
                                    autoplay={!isLion}
                                    initialSegment={animal.name === 'Wolf' ? [0, 60] : undefined}
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
            /* ===== TIMELINE: Fixed Grid on Biome Background ===== */
            <motion.div
              key={`timeline-${viewMode}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              style={{ paddingBottom: 'calc(68px + max(12px, env(safe-area-inset-bottom, 12px)))' }}
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
                    style={{
                      position: 'relative',
                      minHeight: `${timelineContainerHeight}px`,
                      borderRadius: '28px',
                      overflow: 'hidden',
                      boxShadow: 'inset 0 -10px 40px rgba(0,0,0,0.1)'
                    }}
                  >
                    {/* Biome Background */}
                    <BiomeBackground />

                    {timelineAnimals.length === 0 ? (
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
                          No animals collected {periodLabel}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: 'rgba(255,255,255,0.8)',
                          marginTop: '8px',
                          fontFamily: "'Quicksand', sans-serif",
                          textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }}>
                          Start a study session to fill your sanctuary!
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        position: 'relative',
                        padding: '20px',
                        display: 'grid',
                        gridTemplateColumns: timelineLayout.gridColumns,
                        gap: timelineLayout.gap,
                        alignContent: 'start',
                      }}>
                        {timelineAnimals.map((animal: CollectedAnimal, index: number) => {
                          const animalScale = getAnimalScale(animal.lottieUrl);
                          const lottieSize = timelineLayout.lottieSize;
                          const innerSize = animalScale ? lottieSize * animalScale : lottieSize;
                          const isDense = timelineAnimals.length > 60;
                          const isSmall = lottieSize < 40;

                          return (
                            <motion.div
                              key={`${animal.id}-${index}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: Math.min(index * (isDense ? 0.01 : 0.02), 0.3) }}
                              whileHover={isSmall ? undefined : { scale: 1.08 }}
                              title={animal.name}
                              style={{
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: timelineLayout.showName ? '4px' : '0px',
                                filter: isDense ? undefined : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                              }}
                            >
                              <div style={{
                                width: `${lottieSize}px`,
                                height: `${lottieSize}px`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                {timelineLoadedAnimations[animal.lottieUrl] ? (
                                  <div style={{
                                    width: `${innerSize}px`,
                                    height: `${innerSize}px`,
                                    flexShrink: 0,
                                  }}>
                                    <Lottie
                                      animationData={timelineLoadedAnimations[animal.lottieUrl]}
                                      loop={!isDense}
                                      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                                    />
                                  </div>
                                ) : (
                                  <div style={{
                                    width: `${lottieSize * 0.5}px`,
                                    height: `${lottieSize * 0.5}px`,
                                    borderRadius: '50%',
                                    background: 'rgba(167, 139, 250, 0.3)',
                                  }} />
                                )}
                              </div>

                              {timelineLayout.showName && (
                                <div style={{
                                  fontSize: timelineLayout.fontSize,
                                  fontWeight: 700,
                                  color: 'rgba(255, 255, 255, 0.95)',
                                  fontFamily: "'Quicksand', sans-serif",
                                  textShadow: '0 2px 4px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.4)',
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
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
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Biome Purchase Confirmation Modal */}
      <AnimatePresence>
        {biomePurchaseTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBiomePurchaseTarget(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(255, 255, 255, 0.97)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                padding: '28px 24px',
                border: '1px solid rgba(200, 200, 220, 0.5)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
                width: '100%',
                maxWidth: '300px',
                textAlign: 'center',
              }}
            >
              {/* Biome emoji */}
              <div style={{ fontSize: '64px', marginBottom: '12px', lineHeight: 1 }}>
                {BIOME_CONFIG[biomePurchaseTarget.biomeId].emoji}
              </div>

              {/* Biome name */}
              <div style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'rgba(15, 23, 42, 0.95)',
                fontFamily: "'Quicksand', sans-serif",
                marginBottom: '6px',
              }}>
                Unlock {BIOME_CONFIG[biomePurchaseTarget.biomeId].name}?
              </div>

              {/* Description */}
              <div style={{
                fontSize: '13px',
                color: 'rgba(100, 116, 139, 0.85)',
                fontFamily: "'Quicksand', sans-serif",
                marginBottom: '14px',
                lineHeight: 1.4,
              }}>
                {BIOME_CONFIG[biomePurchaseTarget.biomeId].description}
              </div>

              {/* Cost badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 14px',
                background: 'rgba(167, 139, 250, 0.3)',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 700,
                color: '#7C3AED',
                fontFamily: "'Quicksand', sans-serif",
                marginBottom: '20px',
              }}>
                <span style={{ filter: 'sepia(1) saturate(3) brightness(1.1) hue-rotate(15deg)' }}>🪙</span> {biomePurchaseTarget.cost.toLocaleString()}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setBiomePurchaseTarget(null)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '16px',
                    border: '1px solid rgba(200, 200, 220, 0.4)',
                    background: 'transparent',
                    color: 'rgba(100, 116, 139, 0.8)',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: "'Quicksand', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    handleBiomePurchase(biomePurchaseTarget.biomeId, biomePurchaseTarget.cost);
                    setBiomePurchaseTarget(null);
                  }}
                  style={{
                    flex: 1.5,
                    padding: '12px 16px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.9) 0%, rgba(245, 158, 11, 0.9) 100%)',
                    color: '#78350F',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: "'Quicksand', sans-serif",
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(251, 191, 36, 0.4)',
                  }}
                >
                  Unlock Biome
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crystal Seed Biome Unlock Celebration */}
      <AnimatePresence>
        {biomeReveal && (
          <BiomeUnlockCelebration
            biomeId={biomeReveal.biomeId}
            stage={biomeReveal.stage}
            onTap={handleBiomeRevealTap}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MeadowScreen;
