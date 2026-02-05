import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import type { BiomeType, CollectedAnimal } from '../types';
import { getBiomeConfig, BIOME_CONFIG, getAnimalScale } from '../data/biomes';

interface GalleryScreenProps {
  collection: CollectedAnimal[];
  theme: 'morning' | 'twilight' | 'golden' | 'midnight';
}

interface GroupedAnimal {
  name: string;
  biome: BiomeType;
  lottieUrl: string;
  count: number;
}

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

const GalleryScreen: React.FC<GalleryScreenProps> = ({ collection, theme }) => {
  const [selectedBiome, setSelectedBiome] = useState<BiomeType | 'all'>('all');
  const [loadedAnimations, setLoadedAnimations] = useState<Record<string, any>>({});

  const biomes = Object.keys(BIOME_CONFIG) as BiomeType[];
  const filteredCollection = selectedBiome === 'all'
    ? collection
    : collection.filter(animal => animal.biome === selectedBiome);

  // Group animals by name+biome, counting duplicates
  const groupedAnimals = useMemo(() => {
    const groups: Record<string, GroupedAnimal> = {};
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

  // Load Lottie animations for unique animals
  useEffect(() => {
    const urlsToLoad = groupedAnimals
      .map(a => a.lottieUrl)
      .filter(url => url && !loadedAnimations[url]);

    for (const url of urlsToLoad) {
      fetch(url)
        .then(res => res.json())
        .then(data => {
          setLoadedAnimations(prev => ({ ...prev, [url]: data }));
        })
        .catch(() => {});
    }
  }, [groupedAnimals]);

  const totalCount = filteredCollection.length;

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
        Collection Gallery
      </h1>

      {/* Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          borderRadius: '32px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 8px 32px rgba(147, 197, 253, 0.2)',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              color: getTextColor(theme, 'primary'),
              fontFamily: "'Quicksand', sans-serif"
            }}>
              {totalCount} Animals
            </div>
            <div style={{
              fontSize: '13px',
              color: getTextColor(theme, 'secondary'),
              fontFamily: "'Quicksand', sans-serif"
            }}>
              Total Collected
            </div>
          </div>
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
                background: isActive ? 'rgba(167, 139, 250, 0.3)' : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: isActive ? '2px solid rgba(167, 139, 250, 0.6)' : '1px solid rgba(255, 255, 255, 0.3)',
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

      {/* Gallery Grid */}
      {groupedAnimals.length === 0 ? (
        <div style={{
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          borderRadius: '32px',
          padding: '60px 24px',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 8px 32px rgba(147, 197, 253, 0.2)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {selectedBiome === 'all' ? '🌍' : getBiomeConfig(selectedBiome as BiomeType)?.emoji}
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            color: getTextColor(theme, 'primary'),
            marginBottom: '8px',
            fontFamily: "'Quicksand', sans-serif"
          }}>
            No animals collected yet
          </div>
          <div style={{
            fontSize: '13px',
            color: getTextColor(theme, 'secondary'),
            fontFamily: "'Quicksand', sans-serif"
          }}>
            Complete study sessions to collect animals!
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '16px'
        }}>
          {groupedAnimals.map((animal, index) => {
            const scale = getAnimalScale(animal.lottieUrl);
            const lottieSize = 80;
            const innerSize = scale ? lottieSize * scale : lottieSize;

            return (
              <motion.div
                key={`${animal.name}-${animal.biome}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(25px)',
                  WebkitBackdropFilter: 'blur(25px)',
                  borderRadius: '24px',
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 8px 32px rgba(147, 197, 253, 0.2)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {/* Lottie Animation */}
                <div style={{
                  width: `${lottieSize}px`,
                  height: `${lottieSize}px`,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '16px',
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
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(167, 139, 250, 0.15)',
                    }} />
                  )}
                </div>

                {/* Animal Name with Multiplier */}
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: getTextColor(theme, 'primary'),
                  fontFamily: "'Quicksand', sans-serif",
                }}>
                  {animal.name}{animal.count > 1 && (
                    <span style={{
                      color: getTextColor(theme, 'secondary'),
                      fontWeight: 500,
                      marginLeft: '4px',
                    }}>
                      x{animal.count}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default GalleryScreen;
