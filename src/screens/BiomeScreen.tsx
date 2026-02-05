import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useUserData } from '../hooks/useUserData';
import BiomeBackgrounds from '../components/BiomeBackgrounds';
import type { BiomeType } from '../types';
import { getAnimalScale } from '../data/biomes';

// Biome container dimensions
const BIOME_HEIGHT = 450;
const ANIMAL_SIZE = 60;

interface BiomeScreenProps {
  biomeId: BiomeType;
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
  const biomeRef = useRef<HTMLDivElement>(null);

  // Generate grass blades for depth effect
  const grassBlades = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      bottom: Math.random() * 60,
      left: (i / 25) * 100,
      height: 25 + Math.random() * 30,
      rotation: -15 + Math.random() * 30,
      depth: Math.random() * 10,
    })), []);

  // Get animals for this biome from permanent collection
  const biomeAnimals = useMemo(() => {
    if (!userData.permanentCollection) return [];
    return userData.permanentCollection.filter(animal => animal.biome === biomeId);
  }, [userData.permanentCollection, biomeId]);

  // Load Lottie animations
  useEffect(() => {
    const loadAnimations = async () => {
      const animations: Record<string, any> = {};

      for (const animal of biomeAnimals) {
        if (!loadedAnimations[animal.id]) {
          try {
            const response = await fetch(animal.lottieUrl);
            const data = await response.json();
            animations[animal.id] = data;
          } catch (error) {
            console.error('Error loading animation:', animal.id, error);
          }
        }
      }

      if (Object.keys(animations).length > 0) {
        setLoadedAnimations(prev => ({ ...prev, ...animations }));
      }
    };

    loadAnimations();
  }, [biomeAnimals, loadedAnimations]);

  // Handle drag end with smooth constraints
  const handleDragEnd = (_animalId: string, _event: any) => {
    // For now, we don't persist position changes for permanent collection
    // This can be enhanced with a position tracking system
    setDraggingAnimalId(null);
  };

  // Toggle flip on tap
  const handleAnimalTap = () => {
    // Optional: add tap feedback animation
  };

  return (
    <div className="min-h-screen pb-24 pt-8 px-6" style={{ background: '#f8f9fa' }}>
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Your {biomeId.charAt(0).toUpperCase() + biomeId.slice(1)}
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
            <div className="text-4xl">
              {biomeId === 'forest' && '🌲'}
              {biomeId === 'ocean' && '🌊'}
              {biomeId === 'arctic' && '❄️'}
              {biomeId === 'mountain' && '⛰️'}
              {biomeId === 'safari' && '🦁'}
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
                biomeAnimals.map((animal) => (
                  <motion.div
                    key={animal.id}
                    drag
                    dragMomentum={false}
                    dragElastic={0}
                    dragConstraints={biomeRef}
                    onDragStart={() => setDraggingAnimalId(animal.id)}
                    onDragEnd={(event) => handleDragEnd(animal.id, event)}
                    onClick={() => handleAnimalTap()}
                    animate={draggingAnimalId !== animal.id ? { x: 0, y: 0 } : undefined}
                    transition={draggingAnimalId === animal.id ? { duration: 0 } : { type: "tween", duration: 0.2 }}
                    className="absolute cursor-grab active:cursor-grabbing"
                    style={{
                      position: 'absolute',
                      left: `${Math.random() * 50 + 25}%`,
                      top: `${Math.random() * 40 + 30}%`,
                      width: `${ANIMAL_SIZE}px`,
                      height: `${ANIMAL_SIZE}px`,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 6,
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                      transform: 'translate(-50%, -50%)',
                    }}
                    whileHover={{
                      scale: 1.05,
                      filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))'
                    }}
                    whileTap={{ scale: 0.95, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
                  >
                    {loadedAnimations[animal.id] && (
                      (() => {
                        const animalScale = getAnimalScale(animal.lottieUrl);
                        const scaledSize = animalScale ? ANIMAL_SIZE * animalScale : ANIMAL_SIZE;
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
            🐾 Drag to move animals • Hover for 3D effect
          </p>
          <p className="text-xs text-text-secondary text-center mt-2">
            Your collection is permanent - return anytime to visit your friends!
          </p>
        </div>
      </div>
    </div>
  );
};

export default BiomeScreen;
