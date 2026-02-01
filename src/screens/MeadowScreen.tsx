import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useUserData } from '../hooks/useUserData';
import { updateAnimalPosition, getUserData, saveUserData } from '../utils/storage';
import type { MeadowAnimal, BiomeType } from '../types';
import { BIOME_CONFIG, getUnlockedBiomes, getAnimalsForBiome } from '../data/biomes';
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

  const handleUnlockAllBiomes = () => {
    setAllUnlocked(true);
    // Also persist to storage so it survives tab switches
    const currentData = getUserData();
    saveUserData({
      ...currentData,
      level: 50,
      unlockedBiomes: ALL_BIOME_IDS,
    });
    refreshData();
  };

  // Helper: look up emoji for an animal by name from biome data
  const getAnimalEmoji = (animal: MeadowAnimal): string => {
    const biomeAnimals = getAnimalsForBiome(animal.biome);
    const match = biomeAnimals.find(a => a.name === animal.name);
    return match?.emoji || '🐾';
  };

  // Load Lottie animations
  useEffect(() => {
    const loadAnimations = async () => {
      const animations: Record<string, any> = {};
      const failed: string[] = [];

      for (const animal of userData.meadowAnimals) {
        if (!loadedAnimations[animal.id] && !failedAnimations.has(animal.id)) {
          try {
            const response = await fetch(animal.lottieUrl);
            if (!response.ok) {
              failed.push(animal.id);
              continue;
            }
            const data = await response.json();
            animations[animal.id] = data;
          } catch (error) {
            failed.push(animal.id);
          }
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
    // Sky threshold - animals must be below this line
    const SKY_THRESHOLD = MIN_Y;
    if (newY < SKY_THRESHOLD) return false;

    // Collision threshold - must be at least this far from other animals
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

  // Handle drag end - place exactly where user drops, allow close positioning
  const handleDragEnd = (animalId: string, _event: any, info: any) => {
    const currentAnimal = userData.meadowAnimals.find(a => a.id === animalId);
    if (!currentAnimal) {
      return;
    }

    // Calculate desired position based on drag offset
    let newX = currentAnimal.x + info.offset.x;
    let newY = currentAnimal.y + info.offset.y;

    // Apply boundary constraints first
    const constrained = constrainPosition(newX, newY);
    newX = constrained.x;
    newY = constrained.y;

    // Check if position is valid (not in sky, not directly on another animal)
    if (!isValidPosition(animalId, newX, newY)) {
      // Try nearby positions in priority order
      const attempts = [
        { dx: 0, dy: 0 },      // Try exact position first
        { dx: 30, dy: 0 },     // Try slightly right
        { dx: -30, dy: 0 },    // Try slightly left
        { dx: 0, dy: 30 },     // Try down
        { dx: 0, dy: -20 },    // Try up slightly
        { dx: 30, dy: 30 },    // Diagonal
        { dx: -30, dy: 30 },   // Diagonal
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

      // If still no valid position, keep original position
      if (!foundValid) {
        newX = currentAnimal.x;
        newY = currentAnimal.y;
      }
    }

    // Update position and refresh
    updateAnimalPosition(animalId, newX, newY);
    refreshData();
  };

  // Double-tap detection for flipping animals
  const lastTapRef = useRef<Record<string, number>>({});

  // Toggle flip on double tap
  const handleAnimalTap = (animalId: string) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[animalId] || 0;

    if (now - lastTap < 300) {
      // Double tap detected — flip the animal
      const currentData = getUserData();
      const updatedAnimals = currentData.meadowAnimals.map(animal =>
        animal.id === animalId ? { ...animal, flipped: !animal.flipped } : animal
      );
      saveUserData({ ...currentData, meadowAnimals: updatedAnimals });
      refreshData();
      lastTapRef.current[animalId] = 0; // Reset to avoid triple-tap
    } else {
      lastTapRef.current[animalId] = now;
    }
  };

  // Calculate z-index based on y position (animals further back have lower z-index)
  const getZIndex = (y: number) => Math.floor(y / 10) + 5;

  const handleBiomeSwitch = (biomeId: BiomeType) => {
    setActiveBiome(biomeId);
    const currentData = getUserData();
    saveUserData({ ...currentData, activeBiome: biomeId });
  };

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

        {/* Stats Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Today in {BIOME_CONFIG[activeBiome].name}</p>
              <p className="text-2xl font-bold text-text-primary">
                {biomeAnimals.length} Animals
              </p>
            </div>
            <div className="text-4xl">{BIOME_CONFIG[activeBiome].emoji}</div>
          </div>
        </div>

        {/* 3D Biome Diorama Container */}
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

              {/* Animals */}
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
                    onDragStart={() => {}}
                    onDragEnd={(event, info) => handleDragEnd(animal.id, event, info)}
                    onClick={() => handleAnimalTap(animal.id)}
                    animate={{ x: animal.x, y: animal.y }}
                    transition={{ duration: 0.1, ease: 'easeOut' }}
                    className="absolute cursor-grab active:cursor-grabbing"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: `${size}px`,
                      height: `${size}px`,
                      zIndex: getZIndex(animal.y),
                      transform: animal.flipped ? 'scaleX(-1)' : 'scaleX(1)',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                      x: animal.x,
                      y: animal.y
                    }}
                    whileHover={{
                      scale: 1.05,
                      filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))'
                    }}
                    whileTap={{ scale: 0.95, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
                  >
                    {loadedAnimations[animal.id] ? (
                      <Lottie
                        animationData={loadedAnimations[animal.id]}
                        loop={true}
                        style={{
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '54px',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                        pointerEvents: 'none',
                      }}>
                        {getAnimalEmoji(animal)}
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
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4">
          <p className="text-sm text-text-secondary text-center">
            🌍 Switch biomes • 🐾 Drag animals • 👆 Double-tap to flip
          </p>
          <p className="text-xs text-text-secondary text-center mt-2">
            Collect animals daily • Unlock biomes by leveling up • Your collection resets at midnight
          </p>
        </div>
      </div>
    </div>
  );
};

export default MeadowScreen;
