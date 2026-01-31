import type { BiomeType, RarityType } from '../types';

export interface BiomeConfig {
  id: BiomeType;
  name: string;
  emoji: string;
  unlockLevel: number;
  primaryColor: string;
  secondaryColor: string;
  description: string;
}

export interface BiomeAnimal {
  id: string;
  name: string;
  emoji: string;
  rarity: RarityType;
  lottieUrl: string;
}

// Biome Definitions
export const BIOME_CONFIG: Record<BiomeType, BiomeConfig> = {
  meadow: {
    id: 'meadow',
    name: 'Meadow',
    emoji: '🌿',
    unlockLevel: 0,
    primaryColor: '#10B981',
    secondaryColor: '#34D399',
    description: 'Your peaceful starting meadow with friendly animals.',
  },
  safari: {
    id: 'safari',
    name: 'Safari',
    emoji: '🦁',
    unlockLevel: 10,
    primaryColor: '#F59E0B',
    secondaryColor: '#FBBF24',
    description: 'A wild savanna biome with majestic African animals.',
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    unlockLevel: 20,
    primaryColor: '#059669',
    secondaryColor: '#10B981',
    description: 'An enchanted forest filled with mysterious creatures.',
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    unlockLevel: 30,
    primaryColor: '#0369A1',
    secondaryColor: '#06B6D4',
    description: 'A tropical ocean biome with aquatic life.',
  },
  arctic: {
    id: 'arctic',
    name: 'Arctic',
    emoji: '❄️',
    unlockLevel: 40,
    primaryColor: '#60A5FA',
    secondaryColor: '#93C5FD',
    description: 'A frozen arctic tundra with polar creatures.',
  },
  mountain: {
    id: 'mountain',
    name: 'Mountain',
    emoji: '⛰️',
    unlockLevel: 50,
    primaryColor: '#8B5CF6',
    secondaryColor: '#A78BFA',
    description: 'A majestic mountain peak with highland animals.',
  },
};

// Safari Animals - Real Lottie Animation URLs
export const SAFARI_ANIMALS: BiomeAnimal[] = [
  {
    id: 'giraffe',
    name: 'Giraffe',
    emoji: '🦒',
    rarity: 'common',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/de40ba3c-8eef-11ed-8a72-0242ac120002/pBxICCRm0w.json',
  },
  {
    id: 'elephant',
    name: 'Elephant',
    emoji: '🐘',
    rarity: 'uncommon',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/61b3f91d-9053-11ed-9e5c-d3a8aaa71d4c/vLzLgXtaMf.json',
  },
  {
    id: 'zebra',
    name: 'Zebra',
    emoji: '🦓',
    rarity: 'uncommon',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/e6e20e35-bfb3-11ed-b2b2-02b7a2a6ff73/mRxfcCGj4K.json',
  },
  {
    id: 'lion',
    name: 'Lion',
    emoji: '🦁',
    rarity: 'rare',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/35ab8b26-c1be-11ed-b2b2-02b7a2a6ff73/IKCzw3xC6B.json',
  },
  {
    id: 'flamingo',
    name: 'Flamingo',
    emoji: '🦩',
    rarity: 'epic',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/ee17f1ec-d053-11ed-b2b2-02b7a2a6ff73/hZ0FiOz7Ng.json',
  },
];

// Get animals for a specific biome
export const getAnimalsForBiome = (biomeId: BiomeType): BiomeAnimal[] => {
  if (biomeId === 'safari') {
    return SAFARI_ANIMALS;
  }
  // Return empty array for other biomes until they are implemented
  return [];
};

// Get biome configuration
export const getBiomeConfig = (biomeId: BiomeType): BiomeConfig | null => {
  return BIOME_CONFIG[biomeId] || null;
};

// Get biomes unlocked at or below a given level
export const getUnlockedBiomes = (level: number): BiomeType[] => {
  return Object.values(BIOME_CONFIG)
    .filter(biome => biome.unlockLevel <= level)
    .map(biome => biome.id);
};

// Get next biome to unlock
export const getNextBiomeToUnlock = (level: number): BiomeConfig | null => {
  const nextBiome = Object.values(BIOME_CONFIG)
    .filter(biome => biome.unlockLevel > level)
    .sort((a, b) => a.unlockLevel - b.unlockLevel)[0];
  return nextBiome || null;
};

// Rarity tier colors for UI
export const RARITY_COLORS: Record<RarityType, string> = {
  common: '#8B5CF6',      // Purple
  uncommon: '#10B981',    // Green
  rare: '#0369A1',        // Blue
  epic: '#9333EA',        // Violet
  legendary: '#EA580C',   // Orange
};

// Rarity text colors for contrast
export const RARITY_TEXT_COLORS: Record<RarityType, string> = {
  common: '#FFFFFF',
  uncommon: '#FFFFFF',
  rare: '#FFFFFF',
  epic: '#FFFFFF',
  legendary: '#FFFFFF',
};
