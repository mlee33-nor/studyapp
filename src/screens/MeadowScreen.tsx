import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useUserData } from '../hooks/useUserData';
import { updateAnimalPosition, getUserData, saveUserData } from '../utils/storage';
import type { MeadowAnimal } from '../types';

// Meadow dimensions and safe zones
const MEADOW_WIDTH = 400;
const MEADOW_HEIGHT = 450;
const ANIMAL_SIZE = 80;

// Depth zones - animals can't go into the far back (top 30% is restricted)
const MIN_Y = MEADOW_HEIGHT * 0.3; // Can't place above 30% (too far back)
const MAX_Y = MEADOW_HEIGHT - ANIMAL_SIZE - 20; // Bottom boundary with padding

// Safe horizontal bounds
const MIN_X = 10;
const MAX_X = MEADOW_WIDTH - ANIMAL_SIZE - 10;

// Biome definitions
export type BiomeKey = 'meadows' | 'forest' | 'tundra' | 'desert' | 'coral_reef';

export interface BiomeConfig {
  name: string;
  emoji: string;
  unlockLevel: number;
  background: string;
  skyOverlay: string;
  cloudColor: string;
  hillColor: string;
  hillSecondary: string;
  groundColor: string;
  groundSecondary: string;
  grassColor: string;
  grassTip: string;
  textureColor: string;
  emptyIcon: string;
  emptyText: string;
}

export const BIOME_CONFIGS: Record<BiomeKey, BiomeConfig> = {
  meadows: {
    name: 'Meadows',
    emoji: '🌱',
    unlockLevel: 0,
    background: 'linear-gradient(165deg, #87CEEB 0%, #98D8E8 30%, #90EE90 60%, #76B583 100%)',
    skyOverlay: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, transparent 100%)',
    cloudColor: 'rgba(255,255,255,0.5)',
    hillColor: 'rgba(60, 179, 113, 0.3)',
    hillSecondary: 'rgba(46, 139, 87, 0.2)',
    groundColor: 'rgba(124, 252, 0, 0.3)',
    groundSecondary: 'rgba(34, 139, 34, 0.5)',
    grassColor: 'rgba(34, 139, 34, 0.6)',
    grassTip: 'rgba(124, 252, 0, 0.3)',
    textureColor: 'rgba(34, 139, 34, 0.05)',
    emptyIcon: '🌱',
    emptyText: 'Your meadow awaits...',
  },
  forest: {
    name: 'Enchanted Forest',
    emoji: '🌲',
    unlockLevel: 5,
    background: 'linear-gradient(165deg, #2D5A27 0%, #1A3C2A 30%, #0F2B1E 60%, #0A1F15 100%)',
    skyOverlay: 'linear-gradient(180deg, rgba(100,180,100,0.15) 0%, rgba(50,100,50,0.05) 40%, transparent 100%)',
    cloudColor: 'rgba(200,230,200,0.2)',
    hillColor: 'rgba(20, 80, 30, 0.5)',
    hillSecondary: 'rgba(15, 60, 25, 0.4)',
    groundColor: 'rgba(30, 100, 30, 0.4)',
    groundSecondary: 'rgba(20, 70, 20, 0.6)',
    grassColor: 'rgba(20, 80, 30, 0.7)',
    grassTip: 'rgba(60, 140, 60, 0.4)',
    textureColor: 'rgba(20, 60, 20, 0.08)',
    emptyIcon: '🌲',
    emptyText: 'The forest awaits its creatures...',
  },
  tundra: {
    name: 'Frozen Tundra',
    emoji: '❄️',
    unlockLevel: 15,
    background: 'linear-gradient(165deg, #B0C4DE 0%, #87CEEB 30%, #E8EFF5 60%, #D6E5F0 100%)',
    skyOverlay: 'linear-gradient(180deg, rgba(200,220,255,0.4) 0%, rgba(200,220,255,0.1) 40%, transparent 100%)',
    cloudColor: 'rgba(220,235,255,0.6)',
    hillColor: 'rgba(180, 200, 220, 0.5)',
    hillSecondary: 'rgba(160, 185, 210, 0.4)',
    groundColor: 'rgba(230, 240, 250, 0.6)',
    groundSecondary: 'rgba(200, 220, 240, 0.7)',
    grassColor: 'rgba(180, 200, 220, 0.5)',
    grassTip: 'rgba(220, 240, 255, 0.4)',
    textureColor: 'rgba(180, 200, 220, 0.08)',
    emptyIcon: '❄️',
    emptyText: 'The tundra is quiet and still...',
  },
  desert: {
    name: 'Golden Desert',
    emoji: '🏜️',
    unlockLevel: 25,
    background: 'linear-gradient(165deg, #FFB347 0%, #FF8C00 30%, #DEB887 60%, #D2B48C 100%)',
    skyOverlay: 'linear-gradient(180deg, rgba(255,220,150,0.3) 0%, rgba(255,200,100,0.1) 40%, transparent 100%)',
    cloudColor: 'rgba(255,240,200,0.3)',
    hillColor: 'rgba(210, 170, 100, 0.4)',
    hillSecondary: 'rgba(190, 150, 80, 0.3)',
    groundColor: 'rgba(230, 190, 130, 0.5)',
    groundSecondary: 'rgba(200, 160, 100, 0.6)',
    grassColor: 'rgba(180, 140, 80, 0.5)',
    grassTip: 'rgba(220, 190, 120, 0.3)',
    textureColor: 'rgba(180, 140, 80, 0.06)',
    emptyIcon: '🌵',
    emptyText: 'The desert sands await visitors...',
  },
  coral_reef: {
    name: 'Coral Reef',
    emoji: '🐠',
    unlockLevel: 35,
    background: 'linear-gradient(165deg, #006994 0%, #0088A8 30%, #40E0D0 60%, #20B2AA 100%)',
    skyOverlay: 'linear-gradient(180deg, rgba(0,150,200,0.2) 0%, rgba(0,100,150,0.1) 40%, transparent 100%)',
    cloudColor: 'rgba(150,230,255,0.25)',
    hillColor: 'rgba(0, 120, 150, 0.4)',
    hillSecondary: 'rgba(0, 100, 130, 0.3)',
    groundColor: 'rgba(30, 180, 170, 0.4)',
    groundSecondary: 'rgba(20, 140, 130, 0.5)',
    grassColor: 'rgba(0, 150, 140, 0.5)',
    grassTip: 'rgba(60, 210, 200, 0.4)',
    textureColor: 'rgba(0, 130, 120, 0.06)',
    emptyIcon: '🐠',
    emptyText: 'The reef awaits its swimmers...',
  },
};

export const BIOME_KEYS: BiomeKey[] = ['meadows', 'forest', 'tundra', 'desert', 'coral_reef'];

// Storage helpers for biome selection
const getSelectedBiome = (): BiomeKey => {
  const stored = localStorage.getItem('selectedBiome');
  if (stored && stored in BIOME_CONFIGS) return stored as BiomeKey;
  return 'meadows';
};

const setSelectedBiomeStorage = (biome: BiomeKey) => {
  localStorage.setItem('selectedBiome', biome);
};

export const getAllBiomesUnlocked = (): boolean => {
  return localStorage.getItem('allBiomesUnlocked') === 'true';
};

export const setAllBiomesUnlocked = (unlocked: boolean) => {
  localStorage.setItem('allBiomesUnlocked', unlocked ? 'true' : 'false');
};

export const isBiomeUnlocked = (biome: BiomeKey, level: number): boolean => {
  if (getAllBiomesUnlocked()) return true;
  return level >= BIOME_CONFIGS[biome].unlockLevel;
};

const MeadowScreen: React.FC = () => {
  const { userData, refreshData } = useUserData();
  const [loadedAnimations, setLoadedAnimations] = useState<Record<string, any>>({});
  const [selectedBiome, setSelectedBiome] = useState<BiomeKey>(getSelectedBiome());

  const biome = BIOME_CONFIGS[selectedBiome];

  // Get user level from the App-level userData stored in localStorage
  const appUserData = useMemo(() => {
    try {
      const data = localStorage.getItem('userData');
      if (data) return JSON.parse(data);
    } catch {}
    return { level: 1 };
  }, []);

  const userLevel = appUserData.level || 1;

  const handleBiomeSelect = (key: BiomeKey) => {
    if (isBiomeUnlocked(key, userLevel)) {
      setSelectedBiome(key);
      setSelectedBiomeStorage(key);
    }
  };

  // Load Lottie animations
  useEffect(() => {
    const loadAnimations = async () => {
      const animations: Record<string, any> = {};

      for (const animal of userData.meadowAnimals) {
        if (!loadedAnimations[animal.id]) {
          try {
            const response = await fetch(animal.lottieUrl);
            const data = await response.json();
            animations[animal.id] = data;
          } catch (error) {
            console.error('Error loading animation:', error);
          }
        }
      }

      if (Object.keys(animations).length > 0) {
        setLoadedAnimations(prev => ({ ...prev, ...animations }));
      }
    };

    loadAnimations();
  }, [userData.meadowAnimals, loadedAnimations]);

  // Constrain position to valid bounds
  const constrainPosition = (x: number, y: number) => {
    return {
      x: Math.max(MIN_X, Math.min(MAX_X, x)),
      y: Math.max(MIN_Y, Math.min(MAX_Y, y))
    };
  };

  // Check if position overlaps with existing animals
  const checkCollision = (animalId: string, newX: number, newY: number) => {
    const COLLISION_THRESHOLD = 60; // Minimum distance between animals

    for (const animal of userData.meadowAnimals) {
      if (animal.id === animalId) continue;

      const dx = newX - animal.x;
      const dy = newY - animal.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < COLLISION_THRESHOLD) {
        return true; // Collision detected
      }
    }
    return false;
  };

  // Handle drag end with smooth constraints
  const handleDragEnd = (animalId: string, _event: any, info: any) => {
    let { x: newX, y: newY } = constrainPosition(info.point.x, info.point.y);

    // If collision detected, try to find nearby valid position
    if (checkCollision(animalId, newX, newY)) {
      // Try small adjustments to find valid position
      const adjustments = [
        { dx: 70, dy: 0 },
        { dx: -70, dy: 0 },
        { dx: 0, dy: 70 },
        { dx: 0, dy: -70 },
        { dx: 50, dy: 50 },
        { dx: -50, dy: -50 }
      ];

      let validPositionFound = false;
      for (const adj of adjustments) {
        const testX = newX + adj.dx;
        const testY = newY + adj.dy;
        const constrained = constrainPosition(testX, testY);

        if (!checkCollision(animalId, constrained.x, constrained.y)) {
          newX = constrained.x;
          newY = constrained.y;
          validPositionFound = true;
          break;
        }
      }

      // If no valid position found, snap back to original position
      if (!validPositionFound) {
        const currentAnimal = userData.meadowAnimals.find(a => a.id === animalId);
        if (currentAnimal) {
          newX = currentAnimal.x;
          newY = currentAnimal.y;
        }
      }
    }

    updateAnimalPosition(animalId, newX, newY);
    refreshData();
  };

  // Toggle flip on tap
  const handleAnimalTap = (animalId: string) => {
    const currentData = getUserData();
    const updatedAnimals = currentData.meadowAnimals.map(animal =>
      animal.id === animalId ? { ...animal, flipped: !animal.flipped } : animal
    );
    saveUserData({ ...currentData, meadowAnimals: updatedAnimals });
    refreshData();
  };

  // Calculate z-index based on y position (animals further back have lower z-index)
  const getZIndex = (y: number) => Math.floor(y / 10) + 5;

  return (
    <div className="min-h-screen pb-24 pt-8 px-6" style={{ background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)' }}>
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Your Sanctuary</h1>
        <p className="text-text-secondary mb-6">
          Collect adorable animals as you study!
        </p>

        {/* Biome Selector */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 mb-6 shadow-soft">
          <p style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#64748b',
            marginBottom: '10px',
            fontFamily: "'Quicksand', sans-serif"
          }}>
            Choose Your Biome
          </p>
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}>
            {BIOME_KEYS.map((key) => {
              const cfg = BIOME_CONFIGS[key];
              const unlocked = isBiomeUnlocked(key, userLevel);
              const isActive = selectedBiome === key;

              return (
                <motion.button
                  key={key}
                  whileTap={unlocked ? { scale: 0.95 } : {}}
                  onClick={() => handleBiomeSelect(key)}
                  style={{
                    flex: '0 0 auto',
                    padding: '8px 14px',
                    borderRadius: '14px',
                    border: isActive ? '2px solid rgba(167, 139, 250, 0.8)' : '2px solid rgba(200, 220, 255, 0.4)',
                    background: isActive ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255,255,255,0.6)',
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                    opacity: unlocked ? 1 : 0.45,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    minWidth: '72px',
                    position: 'relative',
                    fontFamily: "'Quicksand', sans-serif",
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{cfg.emoji}</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isActive ? '#7c3aed' : '#64748b',
                    whiteSpace: 'nowrap',
                  }}>
                    {cfg.name}
                  </span>
                  {!unlocked && (
                    <span style={{
                      fontSize: '9px',
                      color: '#94a3b8',
                      whiteSpace: 'nowrap',
                    }}>
                      Lv {cfg.unlockLevel}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Today's Collection</p>
              <p className="text-2xl font-bold text-text-primary">
                {userData.meadowAnimals.length} Animals
              </p>
            </div>
            <div className="text-4xl">{biome.emoji}</div>
          </div>
        </div>

        {/* 3D Meadow Diorama Container */}
        <div style={{ perspective: '1200px', marginBottom: '20px' }}>
          <div
            style={{
              padding: '0',
              overflow: 'visible',
              transform: 'rotateX(8deg)',
              transformStyle: 'preserve-3d',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 10px 30px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                background: biome.background,
                position: 'relative',
                height: `${MEADOW_HEIGHT}px`,
                borderRadius: '28px',
                overflow: 'hidden',
                boxShadow: 'inset 0 -10px 40px rgba(0,0,0,0.1)',
                transition: 'background 0.6s ease',
              }}
            >
              {/* Sky with clouds */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '180px',
                background: biome.skyOverlay,
                pointerEvents: 'none',
                zIndex: 1
              }} />

              {/* Floating clouds */}
              {[...Array(3)].map((_, i) => (
                <div
                  key={`cloud-${i}`}
                  style={{
                    position: 'absolute',
                    top: 20 + i * 40,
                    left: `${20 + i * 30}%`,
                    width: `${60 + i * 20}px`,
                    height: '30px',
                    background: biome.cloudColor,
                    borderRadius: '50px',
                    filter: 'blur(8px)',
                    zIndex: 1,
                    pointerEvents: 'none'
                  }}
                />
              ))}

              {/* Hills/Mountains in background */}
              <div style={{
                position: 'absolute',
                bottom: '35%',
                left: '-10%',
                width: '120%',
                height: '200px',
                background: `linear-gradient(to bottom, ${biome.hillColor} 0%, ${biome.hillSecondary} 100%)`,
                borderRadius: '50% 50% 0 0',
                transform: 'translateZ(-50px)',
                zIndex: 2,
                pointerEvents: 'none'
              }} />

              {/* Ground layer */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '60%',
                background: `linear-gradient(to bottom, ${biome.groundColor} 0%, ${biome.groundSecondary} 100%)`,
                pointerEvents: 'none',
                zIndex: 3
              }} />

              {/* Grass texture pattern */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: `repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 2px,
                  ${biome.textureColor} 2px,
                  ${biome.textureColor} 4px
                )`,
                zIndex: 3,
                pointerEvents: 'none'
              }} />

              {/* 3D Grass blades */}
              {[...Array(25)].map((_, i) => (
                <div
                  key={`grass-${i}`}
                  style={{
                    position: 'absolute',
                    bottom: Math.random() * 60,
                    left: `${(i / 25) * 100}%`,
                    width: '3px',
                    height: `${25 + Math.random() * 30}px`,
                    background: `linear-gradient(to top, ${biome.grassColor}, ${biome.grassTip})`,
                    borderRadius: '3px',
                    transform: `rotate(${-15 + Math.random() * 30}deg) translateZ(${Math.random() * 10}px)`,
                    boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 4,
                    pointerEvents: 'none'
                  }}
                />
              ))}

              {/* Animals */}
              {userData.meadowAnimals.length === 0 ? (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  zIndex: 10
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>{biome.emptyIcon}</div>
                  <div style={{
                    fontSize: '16px',
                    color: 'rgba(255,255,255,0.95)',
                    fontFamily: "'Quicksand', sans-serif",
                    fontWeight: 600,
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    {biome.emptyText}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.8)',
                    marginTop: '8px',
                    fontFamily: "'Quicksand', sans-serif",
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}>
                    Complete a study session to meet your first friend!
                  </div>
                </div>
              ) : (
                userData.meadowAnimals.map((animal: MeadowAnimal) => (
                  <motion.div
                    key={animal.id}
                    drag
                    dragMomentum={false}
                    dragElastic={0.1}
                    dragTransition={{
                      power: 0.1,
                      timeConstant: 200,
                      bounceStiffness: 300,
                      bounceDamping: 20
                    }}
                    dragConstraints={{
                      left: MIN_X,
                      right: MAX_X,
                      top: MIN_Y,
                      bottom: MAX_Y,
                    }}
                    onDragEnd={(event, info) => handleDragEnd(animal.id, event, info)}
                    onClick={() => handleAnimalTap(animal.id)}
                    initial={{ x: animal.x, y: animal.y }}
                    animate={{ x: animal.x, y: animal.y }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }}
                    className="absolute cursor-grab active:cursor-grabbing"
                    style={{
                      width: `${ANIMAL_SIZE}px`,
                      height: `${ANIMAL_SIZE}px`,
                      zIndex: getZIndex(animal.y),
                      transform: animal.flipped ? 'scaleX(-1)' : 'scaleX(1)',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                    }}
                    whileHover={{
                      scale: 1.05,
                      filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))'
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loadedAnimations[animal.id] && (
                      <Lottie
                        animationData={loadedAnimations[animal.id]}
                        loop={true}
                        style={{
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none'
                        }}
                      />
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4">
          <p className="text-sm text-text-secondary text-center">
            🌿 Drag to move animals • Hover for 3D effect • Tap to flip direction
          </p>
          <p className="text-xs text-text-secondary text-center mt-2">
            Your sanctuary resets daily at midnight • Complete study sessions to collect more friends!
          </p>
        </div>
      </div>
    </div>
  );
};

export default MeadowScreen;
