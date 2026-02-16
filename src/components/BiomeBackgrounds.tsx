import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { BiomeType } from '../types';

interface BiomeBackgroundProps {
  biomeId: BiomeType;
}

/**
 * Forest Background Component
 * Dark green/brown color scheme with animated elements
 */
const ForestBackground: React.FC = () => {
  const trees = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      left: (i / 6) * 100,
      height: 150 + Math.random() * 100,
      delay: i * 0.1,
    })), []);

  const fireflies = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      left: Math.random() * 100,
      top: 30 + Math.random() * 40,
      delay: i * 0.3,
    })), []);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, #1a3a1a 0%, #2d5016 30%, #3d4a1f 60%, #2d3d1a 100%)',
      overflow: 'hidden',
    }}>
      {/* Far trees - silhouettes */}
      {trees.map((tree, i) => (
        <div
          key={`far-tree-${i}`}
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: `${tree.left}%`,
            width: '60px',
            height: `${tree.height}px`,
            background: 'linear-gradient(to top, #0a1a0a 0%, #1a2a1a 50%, transparent 100%)',
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            filter: 'blur(2px)',
            opacity: 0.7,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Mid-ground foliage */}
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: '-5%',
        width: '110%',
        height: '40%',
        background: 'linear-gradient(to bottom, rgba(45, 80, 22, 0.6) 0%, rgba(35, 60, 15, 0.8) 100%)',
        borderRadius: '50% 50% 0 0 / 30% 30% 0 0',
        pointerEvents: 'none',
        zIndex: 3,
      }} />

      {/* Mushrooms scattered */}
      {[...Array(5)].map((_, i) => (
        <div
          key={`mushroom-${i}`}
          style={{
            position: 'absolute',
            bottom: '20%',
            left: `${15 + i * 18}%`,
            width: '20px',
            height: '18px',
            background: `hsl(${i * 30}, 70%, 45%)`,
            borderRadius: '50% 50% 0 0',
            zIndex: 4,
            pointerEvents: 'none',
          }}
        >
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '2px',
            height: '6px',
            background: '#8B6914',
          }} />
        </div>
      ))}

      {/* Animated fireflies */}
      {fireflies.map((fly, i) => (
        <motion.div
          key={`firefly-${i}`}
          style={{
            position: 'absolute',
            left: `${fly.left}%`,
            top: `${fly.top}%`,
            width: '4px',
            height: '4px',
            background: '#FFD700',
            borderRadius: '50%',
            filter: 'blur(1px)',
            zIndex: 5,
            pointerEvents: 'none',
            boxShadow: '0 0 6px #FFD700',
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: fly.delay,
          }}
        />
      ))}

      {/* Ground layer */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '20%',
        background: 'linear-gradient(to bottom, rgba(61, 74, 31, 0.8) 0%, #1a2408 100%)',
        pointerEvents: 'none',
        zIndex: 6,
      }} />

      {/* Fallen logs */}
      {[...Array(3)].map((_, i) => (
        <div
          key={`log-${i}`}
          style={{
            position: 'absolute',
            bottom: `${8 + i * 3}%`,
            left: `${10 + i * 30}%`,
            width: '80px',
            height: '8px',
            background: 'linear-gradient(to bottom, #5D4E37 0%, #3E2723 100%)',
            borderRadius: '4px',
            transform: `rotate(${-5 + i * 8}deg)`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
};

/**
 * Ocean Background Component
 * Ocean blue/teal gradient with animated waves and bubbles
 */
const OceanBackground: React.FC = () => {
  const bubbles = useMemo(() =>
    Array.from({ length: 12 }, () => ({
      left: Math.random() * 100,
      size: 3 + Math.random() * 7,
      duration: 3 + Math.random() * 3,
      delay: Math.random() * 2,
    })), []);

  const corals = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      left: (i / 6) * 100,
      height: 40 + Math.random() * 60,
      delay: i * 0.15,
    })), []);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, #0A6BA8 0%, #1B8FC7 40%, #2D7A99 70%, #1A4D5C 100%)',
      overflow: 'hidden',
    }}>
      {/* Sunlight rays */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`ray-${i}`}
          style={{
            position: 'absolute',
            top: -100,
            left: `${10 + i * 25}%`,
            width: '2px',
            height: '150%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
            opacity: 0.4,
            zIndex: 2,
            pointerEvents: 'none',
          }}
          animate={{
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Animated waves - upper */}
      <motion.div
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        style={{
          position: 'absolute',
          top: '20%',
          left: 0,
          right: 0,
          height: '15px',
          background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1200 120\'%3E%3Cpath d=\'M0,60 Q150,30 300,60 T600,60 T900,60 T1200,60 L1200,120 L0,120 Z\' fill=\'rgba(255,255,255,0.15)\'/%3E%3C/svg%3E")',
          backgroundSize: '600px 120px',
          backgroundRepeat: 'repeat-x',
          zIndex: 4,
          pointerEvents: 'none',
        }}
        animate={{
          backgroundPosition: ['0px 0px', '600px 0px'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Animated waves - lower */}
      <motion.div
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        style={{
          position: 'absolute',
          top: '40%',
          left: 0,
          right: 0,
          height: '20px',
          background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1200 120\'%3E%3Cpath d=\'M0,40 Q200,10 400,40 T800,40 T1200,40 L1200,120 L0,120 Z\' fill=\'rgba(255,255,255,0.1)\'/%3E%3C/svg%3E")',
          backgroundSize: '800px 120px',
          backgroundRepeat: 'repeat-x',
          zIndex: 5,
          pointerEvents: 'none',
        }}
        animate={{
          backgroundPosition: ['-800px 0px', '0px 0px'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Coral formations */}
      {corals.map((coral, _i) => (
        <div
          key={`coral-${coral.left}`}
          style={{
            position: 'absolute',
            bottom: '5%',
            left: `${coral.left}%`,
            width: '30px',
            height: `${coral.height}px`,
            background: `linear-gradient(to top, hsl(${350 + coral.left * 15}, 70%, 40%) 0%, hsl(${350 + coral.left * 15}, 80%, 50%) 100%)`,
            borderRadius: '50% 50% 30% 30% / 60% 60% 40% 40%',
            opacity: 0.7,
            zIndex: 3,
            pointerEvents: 'none',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          }}
        />
      ))}

      {/* Sand/seabed */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '15%',
        background: 'linear-gradient(to bottom, #D4A574 0%, #A0826D 100%)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />

      {/* Animated bubbles */}
      {bubbles.map((bubble, i) => (
        <motion.div
          key={`bubble-${i}`}
          style={{
            position: 'absolute',
            left: `${bubble.left}%`,
            bottom: '-10px',
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(173,216,230,0.3))',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.3)',
            zIndex: 4,
            pointerEvents: 'none',
          }}
          animate={{
            y: [0, -window.innerHeight],
            x: [0, 20 - Math.random() * 40],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: bubble.duration,
            delay: bubble.delay,
            repeat: Infinity,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Arctic Background Component
 * White/ice blue gradient with aurora and snowflakes
 */
const ArcticBackground: React.FC = () => {
  const snowflakes = useMemo(() =>
    Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 3,
    })), []);

  const auroraWaves = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      delay: i * 0.5,
      color: ['#00FF88', '#00FFDD', '#0088FF', '#AA00FF', '#FF0088'][i],
    })), []);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, #E0F7FF 0%, #B3E5FC 25%, #81D4FA 50%, #4FC3F7 75%, #29B6F6 100%)',
      overflow: 'hidden',
    }}>
      {/* Aurora borealis - wave 1 */}
      {auroraWaves.map((wave, i) => (
        <motion.div
          key={`aurora-${i}`}
          style={{
            position: 'absolute',
            top: `${20 + i * 10}%`,
            left: 0,
            right: 0,
            height: '8px',
            background: `linear-gradient(90deg, transparent 0%, ${wave.color} 50%, transparent 100%)`,
            opacity: 0.3,
            filter: 'blur(15px)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
          animate={{
            opacity: [0.2, 0.6, 0.2],
            transform: ['skewY(0deg)', 'skewY(1deg)', 'skewY(0deg)'],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: wave.delay,
          }}
        />
      ))}

      {/* Snow drifts - background */}
      <div style={{
        position: 'absolute',
        bottom: '30%',
        left: '-5%',
        width: '110%',
        height: '40%',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(220,240,255,0.6) 100%)',
        borderRadius: '50% 50% 0 0 / 20% 20% 0 0',
        pointerEvents: 'none',
        zIndex: 3,
      }} />

      {/* Ice formations */}
      {[...Array(4)].map((_, i) => (
        <div
          key={`ice-${i}`}
          style={{
            position: 'absolute',
            bottom: '10%',
            left: `${10 + i * 22}%`,
            width: '40px',
            height: '80px',
            background: 'linear-gradient(135deg, rgba(200,240,255,0.6) 0%, rgba(150,220,255,0.4) 100%)',
            clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            zIndex: 4,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Ground layer - snow */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '25%',
        background: 'linear-gradient(to bottom, #FFFFFF 0%, #F0F8FF 50%, #E0F4FF 100%)',
        pointerEvents: 'none',
        zIndex: 5,
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)',
      }} />

      {/* Snowflakes */}
      {snowflakes.map((flake, i) => (
        <motion.div
          key={`snowflake-${i}`}
          style={{
            position: 'absolute',
            left: `${flake.left}%`,
            top: '-10px',
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            background: '#FFFFFF',
            borderRadius: '50%',
            filter: 'blur(0.5px)',
            opacity: 0.8,
            zIndex: 4,
            pointerEvents: 'none',
            boxShadow: `0 0 ${flake.size}px rgba(255,255,255,0.8)`,
          }}
          animate={{
            y: [0, window.innerHeight],
            x: [0, 30 - Math.random() * 60],
            opacity: [0.8, 0.4, 0],
          }}
          transition={{
            duration: flake.duration,
            delay: flake.delay,
            repeat: Infinity,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Safari Background Component
 * Golden savanna with acacia trees and grass
 */
const SafariBackground: React.FC = () => {
  const acaciaTrees = useMemo(() =>
    Array.from({ length: 4 }, (_, i) => ({
      left: 15 + (i / 4) * 70,
      height: 80 + Math.random() * 60,
      delay: i * 0.2,
    })), []);

  const grassClumps = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      left: (i / 15) * 100,
      height: 20 + Math.random() * 25,
    })), []);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, #87CEEB 0%, #F4D03F 40%, #D4A574 70%, #C19A6B 100%)',
      overflow: 'hidden',
    }}>
      {/* Sun */}
      <div style={{
        position: 'absolute',
        top: '15%',
        right: '15%',
        width: '60px',
        height: '60px',
        background: 'radial-gradient(circle, #FFD700 0%, #FFA500 100%)',
        borderRadius: '50%',
        boxShadow: '0 0 40px rgba(255, 215, 0, 0.6)',
        zIndex: 2,
        pointerEvents: 'none',
      }} />

      {/* Distant hills */}
      <div style={{
        position: 'absolute',
        bottom: '30%',
        left: '-5%',
        width: '110%',
        height: '35%',
        background: 'linear-gradient(to bottom, rgba(218, 165, 32, 0.4) 0%, rgba(184, 134, 11, 0.5) 100%)',
        borderRadius: '50% 50% 0 0 / 30% 30% 0 0',
        pointerEvents: 'none',
        zIndex: 2,
      }} />

      {/* Acacia trees */}
      {acaciaTrees.map((tree, i) => (
        <div
          key={`acacia-${i}`}
          style={{
            position: 'absolute',
            bottom: '25%',
            left: `${tree.left}%`,
            width: '2px',
            height: `${tree.height}px`,
            background: 'linear-gradient(to top, #5D4E37 0%, #8B6914 100%)',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          {/* Canopy */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '50px',
            height: '35px',
            background: 'radial-gradient(ellipse at center, rgba(107, 142, 35, 0.7) 0%, rgba(85, 107, 47, 0.5) 100%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />
        </div>
      ))}

      {/* Savanna grass */}
      {grassClumps.map((grass, i) => (
        <div
          key={`grass-${i}`}
          style={{
            position: 'absolute',
            bottom: '15%',
            left: `${grass.left}%`,
            width: '3px',
            height: `${grass.height}px`,
            background: 'linear-gradient(to top, rgba(218, 165, 32, 0.8) 0%, rgba(189, 183, 107, 0.6) 100%)',
            borderRadius: '3px',
            transform: `rotate(${-10 + Math.random() * 20}deg)`,
            zIndex: 4,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Ground layer */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '20%',
        background: 'linear-gradient(to bottom, #D4A574 0%, #C19A6B 100%)',
        pointerEvents: 'none',
        zIndex: 5,
      }} />

      {/* Rocks scattered */}
      {[...Array(5)].map((_, i) => (
        <div
          key={`rock-${i}`}
          style={{
            position: 'absolute',
            bottom: `${12 + i * 2}%`,
            left: `${8 + i * 18}%`,
            width: `${12 + Math.random() * 8}px`,
            height: `${8 + Math.random() * 6}px`,
            background: 'linear-gradient(135deg, #8B7355 0%, #6B5644 100%)',
            borderRadius: '40%',
            zIndex: 5,
            pointerEvents: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        />
      ))}
    </div>
  );
};

/**
 * Meadow Background Component
 * Green meadow with flowers and grass
 */
const MeadowBackground: React.FC = () => {
  const flowers = useMemo(() =>
    Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      bottom: 15 + Math.random() * 35,
      color: ['#FF69B4', '#FFD700', '#FF6347', '#9370DB', '#00CED1'][Math.floor(Math.random() * 5)],
      size: 8 + Math.random() * 6,
    })), []);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, #87CEEB 0%, #B4E5F9 30%, #90EE90 60%, #7CCD7C 100%)',
      overflow: 'hidden',
    }}>
      {/* Clouds */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`cloud-${i}`}
          style={{
            position: 'absolute',
            top: `${10 + i * 12}%`,
            left: `${20 + i * 30}%`,
            width: '80px',
            height: '30px',
            background: 'rgba(255,255,255,0.8)',
            borderRadius: '50px',
            filter: 'blur(6px)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
          animate={{
            x: [0, 50, 0],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Rolling hills background */}
      <div style={{
        position: 'absolute',
        bottom: '25%',
        left: '-5%',
        width: '110%',
        height: '45%',
        background: 'linear-gradient(to bottom, rgba(124, 205, 124, 0.6) 0%, rgba(107, 142, 35, 0.7) 100%)',
        borderRadius: '50% 50% 0 0 / 25% 25% 0 0',
        pointerEvents: 'none',
        zIndex: 3,
      }} />

      {/* Flowers scattered */}
      {flowers.map((flower, i) => (
        <div
          key={`flower-${i}`}
          style={{
            position: 'absolute',
            bottom: `${flower.bottom}%`,
            left: `${flower.left}%`,
            width: `${flower.size}px`,
            height: `${flower.size}px`,
            zIndex: 4,
            pointerEvents: 'none',
          }}
        >
          {/* Petals */}
          {[...Array(5)].map((_, p) => (
            <div
              key={p}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: `${flower.size * 0.6}px`,
                height: `${flower.size * 0.6}px`,
                background: flower.color,
                borderRadius: '50%',
                transform: `translate(-50%, -50%) rotate(${p * 72}deg) translateY(-${flower.size * 0.3}px)`,
              }}
            />
          ))}
          {/* Center */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${flower.size * 0.4}px`,
            height: `${flower.size * 0.4}px`,
            background: '#FFD700',
            borderRadius: '50%',
          }} />
          {/* Stem */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '1px',
            height: `${flower.size}px`,
            background: '#228B22',
          }} />
        </div>
      ))}

      {/* Ground layer - lush grass */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '20%',
        background: 'linear-gradient(to bottom, #7CCD7C 0%, #6B8E23 100%)',
        pointerEvents: 'none',
        zIndex: 5,
      }} />

      {/* Grass blades */}
      {[...Array(25)].map((_, i) => (
        <div
          key={`grass-blade-${i}`}
          style={{
            position: 'absolute',
            bottom: `${Math.random() * 25}%`,
            left: `${(i / 25) * 100}%`,
            width: '2px',
            height: `${15 + Math.random() * 20}px`,
            background: 'linear-gradient(to top, rgba(34, 139, 34, 0.7), rgba(124, 252, 0, 0.4))',
            borderRadius: '2px',
            transform: `rotate(${-15 + Math.random() * 30}deg)`,
            zIndex: 6,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
};

/**
 * Mountain Background Component
 * Gray/purple peaks with snow and animated clouds
 */
const MountainBackground: React.FC = () => {
  const clouds = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      top: 20 + i * 15,
      left: Math.random() * 80,
      delay: i * 0.3,
    })), []);

  const peaks = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      left: (i / 5) * 120 - 10,
      height: 200 + Math.random() * 150,
      color: `hsl(${240 + i * 10}, ${30 + i * 5}%, ${50 + i * 3}%)`,
    })), []);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, #87CEEB 0%, #B0D9E0 30%, #9DBBC4 60%, #A39FB3 100%)',
      overflow: 'hidden',
    }}>
      {/* Background peaks - far */}
      {peaks.map((peak, i) => (
        <div
          key={`peak-far-${i}`}
          style={{
            position: 'absolute',
            bottom: 0,
            left: `${peak.left}%`,
            width: '200px',
            height: `${peak.height * 0.6}px`,
            background: `linear-gradient(135deg, ${peak.color} 0%, ${peak.color}dd 50%, #4A5568 100%)`,
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            opacity: 0.5,
            filter: 'blur(2px)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Mid-ground peaks */}
      {peaks.map((peak, i) => (
        <div
          key={`peak-mid-${i}`}
          style={{
            position: 'absolute',
            bottom: 0,
            left: `${peak.left + 5}%`,
            width: '180px',
            height: `${peak.height * 0.8}px`,
            background: `linear-gradient(135deg, ${peak.color}aa 0%, #5D6D7B 50%, #2D3748 100%)`,
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            opacity: 0.7,
            zIndex: 3,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Snow caps */}
      {peaks.map((peak, i) => (
        <div
          key={`snowcap-${i}`}
          style={{
            position: 'absolute',
            bottom: `${peak.height * 0.5}px`,
            left: `${peak.left + 5}%`,
            width: '180px',
            height: `${peak.height * 0.25}px`,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F8FF 50%, #E6F5FF 100%)',
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            opacity: 0.9,
            zIndex: 4,
            pointerEvents: 'none',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
          }}
        />
      ))}

      {/* Animated clouds */}
      {clouds.map((cloud, i) => (
        <motion.div
          key={`cloud-${i}`}
          style={{
            position: 'absolute',
            top: `${cloud.top}%`,
            left: `${cloud.left}%`,
            width: '100px',
            height: '40px',
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '50px',
            filter: 'blur(8px)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
          animate={{
            x: [0, 100, 0],
          }}
          transition={{
            duration: 15 + i * 3,
            repeat: Infinity,
            ease: 'linear',
            delay: cloud.delay,
          }}
        />
      ))}

      {/* Ground - rocky terrain */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '15%',
        background: 'linear-gradient(to bottom, #8B9BA8 0%, #5D6D7B 100%)',
        pointerEvents: 'none',
        zIndex: 5,
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
      }} />

      {/* Alpine vegetation patches */}
      {[...Array(6)].map((_, i) => (
        <div
          key={`vegetation-${i}`}
          style={{
            position: 'absolute',
            bottom: '15%',
            left: `${10 + i * 15}%`,
            width: '30px',
            height: '20px',
            background: 'rgba(76, 110, 50, 0.6)',
            borderRadius: '50%',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
};

export const BiomeBackgrounds: React.FC<BiomeBackgroundProps> = ({ biomeId }) => {
  switch (biomeId) {
    case 'forest':
      return <ForestBackground />;
    case 'ocean':
      return <OceanBackground />;
    case 'arctic':
      return <ArcticBackground />;
    case 'mountain':
      return <MountainBackground />;
    case 'safari':
      return <SafariBackground />;
    case 'meadow':
      return <MeadowBackground />;
    default:
      return <MeadowBackground />;
  }
};

export default BiomeBackgrounds;
