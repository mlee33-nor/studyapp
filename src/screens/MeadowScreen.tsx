import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useUserData } from '../hooks/useUserData';
import { updateAnimalPosition, getUserData, saveUserData } from '../utils/storage';
import type { MeadowAnimal, BiomeType } from '../types';
import { BIOME_CONFIG, getUnlockedBiomes } from '../data/biomes';

// Meadow dimensions and safe zones
const MEADOW_WIDTH = 400;
const MEADOW_HEIGHT = 450;
const ANIMAL_SIZE = 60;

// Depth zones - animals can't go into the sky (top 180px is sky area)
const MIN_Y = 185; // Start on first color of green
const MAX_Y = MEADOW_HEIGHT - ANIMAL_SIZE - 20; // Bottom boundary with padding

// Safe horizontal bounds
const MIN_X = 10;

// Biome background components
const BiomeBackgrounds: Record<BiomeType, React.FC> = {
  meadow: () => (
    <div style={{
      background: 'linear-gradient(165deg, #87CEEB 0%, #98D8E8 30%, #90EE90 60%, #76B583 100%)',
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Sky */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '180px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      {/* Clouds */}
      {[...Array(3)].map((_, i) => (
        <div key={`cloud-${i}`} style={{
          position: 'absolute',
          top: 20 + i * 40,
          left: `${20 + i * 30}%`,
          width: `${60 + i * 20}px`,
          height: '30px',
          background: 'rgba(255,255,255,0.5)',
          borderRadius: '50px',
          filter: 'blur(8px)',
          zIndex: 1,
          pointerEvents: 'none'
        }} />
      ))}
      {/* Ground */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        background: 'linear-gradient(to bottom, rgba(124, 252, 0, 0.3) 0%, rgba(34, 139, 34, 0.5) 100%)',
        pointerEvents: 'none',
        zIndex: 3
      }} />
    </div>
  ),
  safari: () => (
    <div style={{
      background: 'linear-gradient(135deg, #F4A460 0%, #DEB887 40%, #D2B48C 100%)',
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Sky with heat haze */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '180px',
        background: 'linear-gradient(180deg, rgba(255,200,0,0.2) 0%, rgba(255,150,0,0.1) 40%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      {/* Sun */}
      <div style={{
        position: 'absolute',
        top: 30,
        right: '10%',
        width: '60px',
        height: '60px',
        background: 'radial-gradient(circle, #FFD700 0%, rgba(255,215,0,0.3) 100%)',
        borderRadius: '50%',
        filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.5))',
        zIndex: 2,
        pointerEvents: 'none'
      }} />
      {/* Acacia trees */}
      {[...Array(2)].map((_, i) => (
        <div key={`tree-${i}`} style={{
          position: 'absolute',
          bottom: '30%',
          left: `${i * 60}%`,
          width: '80px',
          height: '120px',
          zIndex: 2,
          pointerEvents: 'none'
        }}>
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '6px',
            height: '60px',
            background: '#8B6F47'
          }} />
          <div style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '70px',
            height: '70px',
            background: 'radial-gradient(circle, #BDB76B 0%, #9B8C3A 100%)',
            borderRadius: '50%',
            filter: 'drop-shadow(-5px 5px 8px rgba(0,0,0,0.2))'
          }} />
        </div>
      ))}
      {/* Ground */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        background: 'linear-gradient(to bottom, rgba(210, 180, 140, 0.3) 0%, rgba(160, 120, 80, 0.5) 100%)',
        pointerEvents: 'none',
        zIndex: 3
      }} />
    </div>
  ),
  forest: () => (
    <div style={{
      background: 'linear-gradient(135deg, #1B4D3E 0%, #2D5F4F 40%, #0D3B2D 100%)',
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Sky */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '180px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(100,150,100,0.2) 40%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      {/* Pine trees background */}
      {[...Array(3)].map((_, i) => (
        <div key={`pine-${i}`} style={{
          position: 'absolute',
          bottom: '25%',
          left: `${i * 40}%`,
          width: '60px',
          height: '140px',
          zIndex: 2,
          pointerEvents: 'none'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #0D3B2D 0%, #1B4D3E 50%, #0D3B2D 100%)',
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            filter: 'drop-shadow(-3px 3px 5px rgba(0,0,0,0.3))'
          }} />
        </div>
      ))}
      {/* Ground */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        background: 'linear-gradient(to bottom, rgba(47, 79, 47, 0.4) 0%, rgba(25, 40, 25, 0.6) 100%)',
        pointerEvents: 'none',
        zIndex: 3
      }} />
    </div>
  ),
  ocean: () => (
    <div style={{
      background: 'linear-gradient(135deg, #0369A1 0%, #06B6D4 40%, #06B6D4 100%)',
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Sky */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '180px',
        background: 'linear-gradient(180deg, rgba(135,206,235,0.4) 0%, rgba(100,180,220,0.2) 40%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      {/* Waves */}
      {[...Array(4)].map((_, i) => (
        <div key={`wave-${i}`} style={{
          position: 'absolute',
          bottom: `${i * 15}%`,
          left: 0,
          right: 0,
          height: '20px',
          borderTop: '2px solid rgba(255,255,255,0.3)',
          borderBottom: '2px solid rgba(0,0,0,0.1)',
          pointerEvents: 'none',
          zIndex: 2
        }} />
      ))}
      {/* Ground */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        background: 'linear-gradient(to bottom, rgba(6, 182, 212, 0.3) 0%, rgba(3, 105, 161, 0.5) 100%)',
        pointerEvents: 'none',
        zIndex: 3
      }} />
    </div>
  ),
  arctic: () => (
    <div style={{
      background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 40%, #7DD3FC 100%)',
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Aurora effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '140px',
        background: 'linear-gradient(135deg, rgba(165,113,250,0.2) 0%, rgba(139,92,246,0.1) 50%, rgba(59,130,246,0.2) 100%)',
        filter: 'blur(30px)',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      {/* Snow peaks */}
      {[...Array(3)].map((_, i) => (
        <div key={`peak-${i}`} style={{
          position: 'absolute',
          bottom: '30%',
          left: `${i * 35}%`,
          width: '70px',
          height: '100px',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #E0F2FE 50%, #7DD3FC 100%)',
          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
          filter: 'drop-shadow(-2px 2px 4px rgba(0,0,0,0.2))',
          zIndex: 2,
          pointerEvents: 'none'
        }} />
      ))}
      {/* Ground */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        background: 'linear-gradient(to bottom, rgba(220,240,255,0.4) 0%, rgba(180,220,255,0.6) 100%)',
        pointerEvents: 'none',
        zIndex: 3
      }} />
    </div>
  ),
  mountain: () => (
    <div style={{
      background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 40%, #6366F1 100%)',
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Sky */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '180px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(200,150,255,0.1) 40%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      {/* Mountain peaks */}
      {[...Array(4)].map((_, i) => (
        <div key={`peak-${i}`} style={{
          position: 'absolute',
          bottom: `${20 - i * 5}%`,
          left: `${i * 25}%`,
          width: `${80 + i * 10}px`,
          height: `${120 + i * 20}px`,
          background: i % 2 === 0 ? 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)' : 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
          filter: 'drop-shadow(-3px 3px 6px rgba(0,0,0,0.3))',
          zIndex: 1 + i,
          pointerEvents: 'none'
        }} />
      ))}
      {/* Ground */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        background: 'linear-gradient(to bottom, rgba(124, 58, 237, 0.3) 0%, rgba(99, 102, 241, 0.5) 100%)',
        pointerEvents: 'none',
        zIndex: 5
      }} />
    </div>
  )
};

const MeadowScreen: React.FC = () => {
  const { userData, refreshData } = useUserData();
  const [loadedAnimations, setLoadedAnimations] = useState<Record<string, any>>({});
  const [draggingAnimalId, setDraggingAnimalId] = useState<string | null>(null);
  const meadowRef = useRef<HTMLDivElement>(null);
  const [activeBiome, setActiveBiome] = useState<BiomeType>(userData.activeBiome as BiomeType);

  const unlockedBiomes = getUnlockedBiomes(userData.level);
  const biomeAnimals = userData.meadowAnimals.filter(a => a.biome === activeBiome);
  const BiomeBackground = BiomeBackgrounds[activeBiome];

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

  // Check if position overlaps with existing animals
  const checkCollision = (animalId: string, newX: number, newY: number) => {
    const COLLISION_THRESHOLD = 35; // Minimum distance - allows close proximity, auto-repels when overlapping

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
    // Get current animal to find its starting position
    const currentAnimal = userData.meadowAnimals.find(a => a.id === animalId);
    if (!currentAnimal) {
      setDraggingAnimalId(null);
      return;
    }

    // Calculate new position based on offset from start (relative movement)
    let newX = currentAnimal.x + info.offset.x;
    let newY = currentAnimal.y + info.offset.y;

    // Apply constraints
    const constrained = constrainPosition(newX, newY);
    newX = constrained.x;
    newY = constrained.y;

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
        newX = currentAnimal.x;
        newY = currentAnimal.y;
      }
    }

    updateAnimalPosition(animalId, newX, newY);
    setDraggingAnimalId(null);
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
                biomeAnimals.map((animal: MeadowAnimal) => (
                  <motion.div
                    key={animal.id}
                    drag
                    dragMomentum={false}
                    dragElastic={0}
                    dragConstraints={meadowRef}
                    onDragStart={() => setDraggingAnimalId(animal.id)}
                    onDragEnd={(event, info) => handleDragEnd(animal.id, event, info)}
                    onClick={() => handleAnimalTap(animal.id)}
                    animate={draggingAnimalId !== animal.id ? { x: animal.x, y: animal.y } : undefined}
                    transition={draggingAnimalId === animal.id ? { duration: 0 } : { type: "tween", duration: 0.2 }}
                    className="absolute cursor-grab active:cursor-grabbing"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: `${ANIMAL_SIZE}px`,
                      height: `${ANIMAL_SIZE}px`,
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
            🌍 Switch biomes • 🐾 Drag animals • 👆 Tap to flip
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
