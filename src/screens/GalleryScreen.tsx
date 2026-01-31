import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { BiomeType, CollectedAnimal } from '../types';
import { RarityDisplay } from '../components/RarityDisplay';
import { getBiomeConfig, BIOME_CONFIG } from '../data/biomes';

interface GalleryScreenProps {
  collection: CollectedAnimal[];
  theme: 'morning' | 'twilight' | 'golden' | 'midnight';
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

  const biomes = Object.keys(BIOME_CONFIG) as BiomeType[];
  const filteredCollection = selectedBiome === 'all'
    ? collection
    : collection.filter(animal => animal.biome === selectedBiome);

  const rarityCount = {
    common: filteredCollection.filter(a => a.rarity === 'common').length,
    uncommon: filteredCollection.filter(a => a.rarity === 'uncommon').length,
    rare: filteredCollection.filter(a => a.rarity === 'rare').length,
    epic: filteredCollection.filter(a => a.rarity === 'epic').length,
    legendary: filteredCollection.filter(a => a.rarity === 'legendary').length,
  };

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
              {filteredCollection.length} Animals
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

        {/* Rarity Breakdown */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px'
        }}>
          {Object.entries(rarityCount).map(([rarity, count]) => (
            <div
              key={rarity}
              style={{
                background: 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                padding: '12px 8px',
                borderRadius: '16px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <div style={{
                fontSize: '18px',
                fontWeight: 600,
                color: getTextColor(theme, 'primary'),
                fontFamily: "'Quicksand', sans-serif"
              }}>
                {count}
              </div>
              <div style={{
                fontSize: '11px',
                color: getTextColor(theme, 'secondary'),
                marginTop: '4px',
                textTransform: 'capitalize',
                fontFamily: "'Quicksand', sans-serif"
              }}>
                {rarity}
              </div>
            </div>
          ))}
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
      {filteredCollection.length === 0 ? (
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
          {filteredCollection.map((animal, index) => (
            <motion.div
              key={animal.id}
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
                cursor: 'pointer'
              }}
            >
              {/* Animal Name */}
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: getTextColor(theme, 'primary'),
                marginBottom: '12px',
                fontFamily: "'Quicksand', sans-serif"
              }}>
                {animal.name}
              </div>

              {/* Rarity Badge */}
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                <RarityDisplay rarity={animal.rarity} size="small" showLabel={false} animated={true} />
              </div>

              {/* Collected Date */}
              <div style={{
                fontSize: '11px',
                color: getTextColor(theme, 'tertiary'),
                fontFamily: "'Quicksand', sans-serif"
              }}>
                {new Date(animal.collectedAt).toLocaleDateString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default GalleryScreen;
