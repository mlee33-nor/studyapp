import type { BiomeType } from '../types';

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
  lottieUrl: string;
  scale?: number; // Optional scale factor for animations that render too small
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

// Safari Animals - Animated African savanna animals (verified working URLs)
export const SAFARI_ANIMALS: BiomeAnimal[] = [
  {
    id: 'giraffe',
    name: 'Giraffe',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/8942ad9c-1189-11ee-8b52-3f0a09f0ff93/IiSumWkAzb.json',
    scale: 1.4,
  },
  {
    id: 'lion',
    name: 'Lion',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/e0d520ae-1165-11ee-8596-1bcd321f9665/6gtyvPUYur.json',
    scale: 1.3,
  },
  {
    id: 'elephant',
    name: 'Elephant',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/7ad2abee-8ab1-11ee-8fae-d7b22e00dcc5/Q3wSZsw2nW.json',
    scale: 1.4,
  },
  {
    id: 'monkey',
    name: 'Monkey',
    lottieUrl: 'https://lottie.host/bb7f5f88-4b2f-44be-a11e-bde846e63553/xu4hfxE8ir.json',
    scale: 2.0,
  },
];

// Forest Animals - Real Lottie Animation URLs
export const FOREST_ANIMALS: BiomeAnimal[] = [
  {
    id: 'squirrel',
    name: 'Squirrel',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/7ba0c728-117a-11ee-9eb8-cba5cf43b9a9/SeYh6q2ap3.json',
    scale: 1.5,
  },
  {
    id: 'deer',
    name: 'Deer',
    lottieUrl: '/studyapp/animations/deer.json',
    scale: 2,
  },
  {
    id: 'fox',
    name: 'Fox',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/9c4b280c-116f-11ee-8e54-17fdd56ae6ce/nZEIpQEdUZ.json',
    scale: 1.5,
  },
  {
    id: 'owl',
    name: 'Owl',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/1a7311d2-1165-11ee-bdc1-b7e695e8e5eb/n3r1YeRfcK.json',
  },
  {
    id: 'hedgehog',
    name: 'Hedgehog',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/217eea54-1152-11ee-80aa-bb89673ffc3b/GtbajlQ7yk.json',
  },
];

// Ocean Animals - Real Lottie Animation URLs
export const OCEAN_ANIMALS: BiomeAnimal[] = [
  {
    id: 'turtle',
    name: 'Turtle',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/ff3e331e-1151-11ee-be8d-8bfdaec50b6c/8dbUivXsqR.json',
    scale: 2,
  },
  {
    id: 'tropical_fish',
    name: 'Tropical Fish',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/86f8990e-1169-11ee-a6f1-bb14d7c44c2d/lf3mtlvPIx.json',
  },
  {
    id: 'octopus',
    name: 'Octopus',
    lottieUrl: 'https://lottie.host/47b9c759-50cb-4bc5-9461-b649b5e9d4a8/Wm0OQMHHjm.json',
  },
  {
    id: 'whale',
    name: 'Whale',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/432126fa-1151-11ee-81d6-fbec6e0e68cb/yvKkYB9pgL.json',
  },
];

// Arctic Animals - Real Lottie Animation URLs
export const ARCTIC_ANIMALS: BiomeAnimal[] = [
  {
    id: 'penguin',
    name: 'Penguin',
    lottieUrl: 'https://lottie.host/d914f30d-98b8-49b6-9b30-45d41c744b26/1gVkyH9G4b.json',
  },
  {
    id: 'seal',
    name: 'Seal',
    lottieUrl: 'https://lottie.host/7002f4f6-50e9-4117-92e7-fdd0b848d031/JBfJzJJicn.json',
  },
  {
    id: 'arctic_fox',
    name: 'Arctic Fox',
    lottieUrl: 'https://lottie.host/d3c1b1e1-a463-4a0f-b1df-f272da956d77/lfzKlyXeao.json',
  },
  {
    id: 'polar_bear',
    name: 'Polar Bear',
    lottieUrl: 'https://lottie.host/22db9151-bf0a-411d-b178-8a906267b28c/wP2cRjqZ4n.json',
  },
];

// Mountain Animals - Real Lottie Animation URLs
export const MOUNTAIN_ANIMALS: BiomeAnimal[] = [
  {
    id: 'mountain_goat',
    name: 'Mountain Goat',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/21454c8c-116f-11ee-b8b8-f3543a0944a1/psaUM4k0xd.json',
  },
  {
    id: 'snow_leopard',
    name: 'Snow Leopard',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/bbbf7156-1170-11ee-a909-976822febe92/oGgjhV63HT.json',
  },
  {
    id: 'yak',
    name: 'Yak',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/71feb22a-0620-11ef-a850-9ba4d00d4ca9/jtmaGxZkus.json',
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/c9471362-117d-11ee-9f06-d76a368bf2f8/C3dWG6j7NP.json',
  },
];

// Meadow Animals - Real Lottie Animation URLs (for Level 0)
export const MEADOW_ANIMALS: BiomeAnimal[] = [
  {
    id: 'bunny',
    name: 'Bunny',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/935dfeb0-118b-11ee-9126-43e3de286e2f/1X7rBzXV9L.json',
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/eb7d7328-1177-11ee-84cc-cb9110efefbf/C6YQhXqNZO.json',
    scale: 3.5,
  },
  {
    id: 'kitten',
    name: 'Kitten',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/d126e028-1171-11ee-bcab-873488686e7a/Mn5Jina31g.json',
  },
  {
    id: 'dog',
    name: 'Dog',
    lottieUrl: 'https://lottie.host/8dfb9eb5-a82b-46e7-9f99-f219f965289f/aNZrfBaezt.json',
    scale: 2,
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

// Get scale factor for an animal by its lottieUrl
const ALL_BIOME_ANIMALS = () => [
  ...SAFARI_ANIMALS, ...FOREST_ANIMALS, ...OCEAN_ANIMALS,
  ...ARCTIC_ANIMALS, ...MOUNTAIN_ANIMALS, ...MEADOW_ANIMALS,
];

export const getAnimalScale = (lottieUrl: string): number | undefined => {
  return ALL_BIOME_ANIMALS().find(a => a.lottieUrl === lottieUrl)?.scale;
};

// Get next biome to unlock
export const getNextBiomeToUnlock = (level: number): BiomeConfig | null => {
  const nextBiome = Object.values(BIOME_CONFIG)
    .filter(biome => biome.unlockLevel > level)
    .sort((a, b) => a.unlockLevel - b.unlockLevel)[0];
  return nextBiome || null;
};
