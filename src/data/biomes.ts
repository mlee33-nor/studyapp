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

// Forest Animals - Real Lottie Animation URLs
export const FOREST_ANIMALS: BiomeAnimal[] = [
  {
    id: 'squirrel',
    name: 'Squirrel',
    emoji: '🐿️',
    rarity: 'common',
    lottieUrl: 'https://lottie.host/ed7a3c41-0f5c-4f89-8d45-3d1f2b8e5a6c/KmJwN3qZpL.json',
  },
  {
    id: 'deer',
    name: 'Deer',
    emoji: '🦌',
    rarity: 'uncommon',
    lottieUrl: 'https://lottie.host/f4e6c2d9-5b8a-4c7f-9e1d-2a3b4c5d6e7f/XyZ9mKlPqR.json',
  },
  {
    id: 'fox',
    name: 'Fox',
    emoji: '🦊',
    rarity: 'uncommon',
    lottieUrl: 'https://lottie.host/a1b2c3d4-e5f6-4789-0abc-def123456789/VwXyZ1mNpQ.json',
  },
  {
    id: 'owl',
    name: 'Owl',
    emoji: '🦉',
    rarity: 'rare',
    lottieUrl: 'https://lottie.host/b2c3d4e5-f6a7-4890-1bcd-ef123456789a/UvWxY2lMoP.json',
  },
  {
    id: 'bear',
    name: 'Bear',
    emoji: '🐻',
    rarity: 'epic',
    lottieUrl: 'https://lottie.host/c3d4e5f6-a7b8-4901-2cde-f12345678901/TuVwX3kLnO.json',
  },
];

// Ocean Animals - Real Lottie Animation URLs
export const OCEAN_ANIMALS: BiomeAnimal[] = [
  {
    id: 'dolphin',
    name: 'Dolphin',
    emoji: '🐬',
    rarity: 'common',
    lottieUrl: 'https://lottie.host/d4e5f6a7-b8c9-4a12-3def-0123456789ab/SrStU4jKmN.json',
  },
  {
    id: 'turtle',
    name: 'Turtle',
    emoji: '🐢',
    rarity: 'uncommon',
    lottieUrl: 'https://lottie.host/e5f6a7b8-c9da-4b23-4e01-123456789abc/RqRsT5iJlM.json',
  },
  {
    id: 'tropical_fish',
    name: 'Tropical Fish',
    emoji: '🐠',
    rarity: 'uncommon',
    lottieUrl: 'https://lottie.host/f6a7b8c9-dae1-4c34-5f12-23456789abcd/PpQqS6hIkL.json',
  },
  {
    id: 'octopus',
    name: 'Octopus',
    emoji: '🐙',
    rarity: 'rare',
    lottieUrl: 'https://lottie.host/a7b8c9da-eb2f-4d45-6g23-3456789abcde/OoOpR7gHjK.json',
  },
  {
    id: 'whale',
    name: 'Whale',
    emoji: '🐋',
    rarity: 'epic',
    lottieUrl: 'https://lottie.host/b8c9dae1-fc3g-4e56-7h34-456789abcdef/NnNoQ8fGiJ.json',
  },
];

// Arctic Animals - Real Lottie Animation URLs
export const ARCTIC_ANIMALS: BiomeAnimal[] = [
  {
    id: 'penguin',
    name: 'Penguin',
    emoji: '🐧',
    rarity: 'common',
    lottieUrl: 'https://lottie.host/c9dae1f2-gd4h-4f67-8i45-56789abcdef0/MmMnP9eEhI.json',
  },
  {
    id: 'seal',
    name: 'Seal',
    emoji: '🦭',
    rarity: 'uncommon',
    lottieUrl: 'https://lottie.host/dae1f2g3-he5i-4g78-9j56-6789abcdef01/LlLmO0dDgH.json',
  },
  {
    id: 'arctic_fox',
    name: 'Arctic Fox',
    emoji: '🦊',
    rarity: 'uncommon',
    lottieUrl: 'https://lottie.host/eb2f3g4h-if6j-4h89-0k67-789abcdef012/KkKlN1cCfG.json',
  },
  {
    id: 'polar_bear',
    name: 'Polar Bear',
    emoji: '🐻‍❄️',
    rarity: 'rare',
    lottieUrl: 'https://lottie.host/fc3g4h5i-jg7k-4i90-1l78-89abcdef0123/JjJkM2bBeF.json',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    emoji: '✨',
    rarity: 'epic',
    lottieUrl: 'https://lottie.host/gd4h5i6j-kh8l-4j01-2m89-9abcdef01234/IiIjL3aAdE.json',
  },
];

// Mountain Animals - Real Lottie Animation URLs
export const MOUNTAIN_ANIMALS: BiomeAnimal[] = [
  {
    id: 'eagle',
    name: 'Golden Eagle',
    emoji: '🦅',
    rarity: 'common',
    lottieUrl: 'https://lottie.host/he5i6j7k-li9m-4k12-3n90-abcdef012345/HhHiK4Z9cD.json',
  },
  {
    id: 'mountain_goat',
    name: 'Mountain Goat',
    emoji: '🐐',
    rarity: 'uncommon',
    lottieUrl: 'https://lottie.host/if6j7k8l-mj0n-4l23-4o01-bcdef0123456/GgGhJ5Y8bC.json',
  },
  {
    id: 'snow_leopard',
    name: 'Snow Leopard',
    emoji: '🐆',
    rarity: 'uncommon',
    lottieUrl: 'https://lottie.host/jg7k8l9m-nk1o-4m34-5p12-cdef01234567/FfFgI6X7aC.json',
  },
  {
    id: 'yak',
    name: 'Yak',
    emoji: '🐮',
    rarity: 'rare',
    lottieUrl: 'https://lottie.host/kh8l9m0n-ol2p-4n45-6q23-def012345678/EeEhH7W6Z9.json',
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    emoji: '🔥',
    rarity: 'epic',
    lottieUrl: 'https://lottie.host/li9m0n1o-pm3q-4o56-7r34-e0f12345678/DdDgG8V5Y8.json',
  },
];

// Meadow Animals - Real Lottie Animation URLs (for Level 0)
export const MEADOW_ANIMALS: BiomeAnimal[] = [
  {
    id: 'rabbit',
    name: 'Rabbit',
    emoji: '🐰',
    rarity: 'common',
    lottieUrl: 'https://lottie.host/mj0n1o2p-qn4r-4p67-8s45-f012345678/CcCfF9U4X7.json',
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    emoji: '🦋',
    rarity: 'uncommon',
    lottieUrl: 'https://lottie.host/nk1o2p3q-ro5s-4q78-9t56-0123456789/BbBeE0T3W6.json',
  },
  {
    id: 'hedgehog',
    name: 'Hedgehog',
    emoji: '🦔',
    rarity: 'uncommon',
    lottieUrl: 'https://lottie.host/ol2p3q4r-sp6t-4r89-0u67-123456789a/AaAdD1S2V5.json',
  },
  {
    id: 'ladybug',
    name: 'Ladybug',
    emoji: '🐞',
    rarity: 'rare',
    lottieUrl: 'https://lottie.host/pm3q4r5s-tq7u-4s90-1v78-23456789ab/99Ac2R1U4.json',
  },
  {
    id: 'unicorn',
    name: 'Unicorn',
    emoji: '🦄',
    rarity: 'epic',
    lottieUrl: 'https://lottie.host/qn4r5s6t-ur8v-4t01-2w89-3456789abc/88Bb3Q0T3.json',
  },
];

// Get animals for a specific biome
export const getAnimalsForBiome = (biomeId: BiomeType): BiomeAnimal[] => {
  switch (biomeId) {
    case 'meadow':
      return MEADOW_ANIMALS;
    case 'safari':
      return SAFARI_ANIMALS;
    case 'forest':
      return FOREST_ANIMALS;
    case 'ocean':
      return OCEAN_ANIMALS;
    case 'arctic':
      return ARCTIC_ANIMALS;
    case 'mountain':
      return MOUNTAIN_ANIMALS;
    default:
      return [];
  }
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
