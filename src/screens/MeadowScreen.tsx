import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useUserData } from '../hooks/useUserData';
import { updateAnimalPosition, getUserData, saveUserData } from '../utils/storage';
import type { MeadowAnimal } from '../types';

// Meadow dimensions and safe zones
const MEADOW_WIDTH = 400;
const MEADOW_HEIGHT = 450;
const ANIMAL_SIZE = 60;

// Depth zones - animals can't go into the sky (top 180px is sky area)
const MIN_Y = 185; // Start on first color of green
const MAX_Y = MEADOW_HEIGHT - ANIMAL_SIZE - 20; // Bottom boundary with padding

// Safe horizontal bounds
const MIN_X = 10;

const MeadowScreen: React.FC = () => {
  const { userData, refreshData } = useUserData();
  const [loadedAnimations, setLoadedAnimations] = useState<Record<string, any>>({});
  const [draggingAnimalId, setDraggingAnimalId] = useState<string | null>(null);
  const meadowRef = useRef<HTMLDivElement>(null);

  const grassBlades = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      bottom: Math.random() * 60,
      left: (i / 25) * 100,
      height: 25 + Math.random() * 30,
      rotation: -15 + Math.random() * 30,
      depth: Math.random() * 10,
    })), []);

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

  return (
    <div className="min-h-screen pb-24 pt-8 px-6" style={{ background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)' }}>
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Your Meadow 🌱</h1>
        <p className="text-text-secondary mb-6">
          Collect adorable animals as you study!
        </p>

        {/* Stats Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Today's Collection</p>
              <p className="text-2xl font-bold text-text-primary">
                {userData.meadowAnimals.length} Animals
              </p>
            </div>
            <div className="text-4xl">🐰</div>
          </div>
        </div>

        {/* 3D Meadow Diorama Container */}
        <div style={{ marginBottom: '20px', borderRadius: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 10px 30px rgba(0,0,0,0.1)' }}>
          <div style={{ perspective: '1200px' }}>
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
                background: 'linear-gradient(165deg, #87CEEB 0%, #98D8E8 30%, #90EE90 60%, #76B583 100%)',
                position: 'relative',
                height: `${MEADOW_HEIGHT}px`,
                borderRadius: '28px',
                overflow: 'hidden',
                boxShadow: 'inset 0 -10px 40px rgba(0,0,0,0.1)'
              }}
            >
              {/* Sky with clouds */}
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
                    background: 'rgba(255,255,255,0.5)',
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
                background: 'linear-gradient(to bottom, rgba(60, 179, 113, 0.3) 0%, rgba(46, 139, 87, 0.2) 100%)',
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
                background: 'linear-gradient(to bottom, rgba(124, 252, 0, 0.3) 0%, rgba(34, 139, 34, 0.5) 100%)',
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
                  rgba(34, 139, 34, 0.05) 2px,
                  rgba(34, 139, 34, 0.05) 4px
                )`,
                zIndex: 3,
                pointerEvents: 'none'
              }} />

              {/* 3D Grass blades */}
              {grassBlades.map((blade, i) => (
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
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌱</div>
                  <div style={{
                    fontSize: '16px',
                    color: 'rgba(255,255,255,0.95)',
                    fontFamily: "'Quicksand', sans-serif",
                    fontWeight: 600,
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    Your meadow awaits...
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
                    dragElastic={0}
                    dragConstraints={meadowRef}
                    onDragStart={() => setDraggingAnimalId(animal.id)}
                    onDragEnd={(event, info) => handleDragEnd(animal.id, event, info)}
                    onClick={() => handleAnimalTap(animal.id)}
                    animate={draggingAnimalId !== animal.id ? { x: animal.x, y: animal.y } : undefined}
                    transition={{
                      type: "tween",
                      duration: 0.2
                    }}
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
        </div>

        {/* Instructions */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4">
          <p className="text-sm text-text-secondary text-center">
            🌿 Drag to move animals • Hover for 3D effect • Tap to flip direction
          </p>
          <p className="text-xs text-text-secondary text-center mt-2">
            Your meadow resets daily at midnight • Complete study sessions to collect more friends!
          </p>
        </div>
      </div>
    </div>
  );
};

export default MeadowScreen;
