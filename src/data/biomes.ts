import type { BiomeType } from '../types';

export interface BiomeConfig {
  id: BiomeType;
  name: string;
  emoji: string;
  unlockLevel: number; // kept for backwards compat, unused
  unlockCost: number;  // coins required to unlock
  primaryColor: string;
  secondaryColor: string;
  description: string;
}

export interface BiomeAnimal {
  id: string;
  name: string;
  lottieUrl: string;
  scale?: number; // Optional scale factor for animations that render too small
  price: number; // 0 = free starter animal, >0 = must purchase with coins
}

// Biome Definitions
export const BIOME_CONFIG: Record<BiomeType, BiomeConfig> = {
  meadow: {
    id: 'meadow',
    name: 'Meadow',
    emoji: '🌿',
    unlockLevel: 0,
    unlockCost: 0,
    primaryColor: '#10B981',
    secondaryColor: '#34D399',
    description: 'Your peaceful starting meadow with friendly animals.',
  },
  safari: {
    id: 'safari',
    name: 'Safari',
    emoji: '🦁',
    unlockLevel: 10,
    unlockCost: 2000,
    primaryColor: '#F59E0B',
    secondaryColor: '#FBBF24',
    description: 'A wild savanna biome with majestic African animals.',
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    unlockLevel: 20,
    unlockCost: 4000,
    primaryColor: '#059669',
    secondaryColor: '#10B981',
    description: 'An enchanted forest filled with mysterious creatures.',
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    unlockLevel: 30,
    unlockCost: 6000,
    primaryColor: '#0369A1',
    secondaryColor: '#06B6D4',
    description: 'A tropical ocean biome with aquatic life.',
  },
  farm: {
    id: 'farm',
    name: 'Barn',
    emoji: '🏡',
    unlockLevel: 50,
    unlockCost: 8000,
    primaryColor: '#B45309',
    secondaryColor: '#D97706',
    description: 'A cozy barn with friendly farm animals.',
  },
};

// Safari Animals - Animated African savanna animals (verified working URLs)
export const SAFARI_ANIMALS: BiomeAnimal[] = [
  {
    id: 'giraffe',
    name: 'Giraffe',
    lottieUrl: 'https://lottie.host/d51d7735-dc7b-4b46-af53-5270e44c6bac/I99tf6X8vb.json',
    scale: 1.4,
    price: 0,
  },
  {
    id: 'lion',
    name: 'Lion',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/e0d520ae-1165-11ee-8596-1bcd321f9665/6gtyvPUYur.json',
    scale: 1.3,
    price: 0,
  },
  {
    id: 'elephant',
    name: 'Elephant',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/7ad2abee-8ab1-11ee-8fae-d7b22e00dcc5/Q3wSZsw2nW.json',
    scale: 1.4,
    price: 800,
  },
  {
    id: 'monkey',
    name: 'Monkey',
    lottieUrl: 'https://lottie.host/bb7f5f88-4b2f-44be-a11e-bde846e63553/xu4hfxE8ir.json',
    scale: 2.0,
    price: 800,
  },
];

// Forest Animals - Real Lottie Animation URLs
export const FOREST_ANIMALS: BiomeAnimal[] = [
  {
    id: 'squirrel',
    name: 'Squirrel',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/7ba0c728-117a-11ee-9eb8-cba5cf43b9a9/SeYh6q2ap3.json',
    scale: 1.5,
    price: 0,
  },
  {
    id: 'deer',
    name: 'Deer',
    lottieUrl: '/studyapp/animations/deer.json',
    scale: 2,
    price: 0,
  },
  {
    id: 'fox',
    name: 'Fox',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/9c4b280c-116f-11ee-8e54-17fdd56ae6ce/nZEIpQEdUZ.json',
    scale: 1.5,
    price: 800,
  },
  {
    id: 'owl',
    name: 'Owl',
    lottieUrl: 'https://lottie.host/5fb4e584-73fa-4b28-8318-a9c9e7fc8c7c/vozoNTRjeE.json',
    price: 800,
  },
  {
    id: 'hedgehog',
    name: 'Hedgehog',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/217eea54-1152-11ee-80aa-bb89673ffc3b/GtbajlQ7yk.json',
    price: 800,
  },
];

// Ocean Animals - Real Lottie Animation URLs
export const OCEAN_ANIMALS: BiomeAnimal[] = [
  {
    id: 'turtle',
    name: 'Turtle',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/ff3e331e-1151-11ee-be8d-8bfdaec50b6c/8dbUivXsqR.json',
    scale: 2,
    price: 0,
  },
  {
    id: 'tropical_fish',
    name: 'Tropical Fish',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/86f8990e-1169-11ee-a6f1-bb14d7c44c2d/lf3mtlvPIx.json',
    price: 0,
  },
  {
    id: 'octopus',
    name: 'Octopus',
    lottieUrl: 'https://lottie.host/47b9c759-50cb-4bc5-9461-b649b5e9d4a8/Wm0OQMHHjm.json',
    price: 800,
  },
  {
    id: 'crab',
    name: 'Crab',
    lottieUrl: 'https://lottie.host/7ff67520-fa49-4f49-b25b-b0848519bff3/cJaovJYx2d.json',
    price: 800,
  },
];

// Farm Animals - Local Lottie Animation Files
export const FARM_ANIMALS: BiomeAnimal[] = [
  {
    id: 'chicken',
    name: 'Chicken',
    lottieUrl: '/studyapp/animations/chicken.json',
    scale: 1.3,
    price: 0,
  },
  {
    id: 'meditating_cow',
    name: 'Meditating Cow',
    lottieUrl: '/studyapp/animations/meditating_cow.json',
    price: 0,
  },
  {
    id: 'pig',
    name: 'Pig',
    lottieUrl: '/studyapp/animations/pig.json',
    scale: 0.8,
    price: 800,
  },
  {
    id: 'bee',
    name: 'Bee',
    lottieUrl: '/studyapp/animations/bee_lounging.json',
    scale: 0.8,
    price: 800,
  },
];

// Meadow Animals - Real Lottie Animation URLs (for Level 0)
export const MEADOW_ANIMALS: BiomeAnimal[] = [
  {
    id: 'bunny',
    name: 'Bunny',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/935dfeb0-118b-11ee-9126-43e3de286e2f/1X7rBzXV9L.json',
    price: 0,
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/eb7d7328-1177-11ee-84cc-cb9110efefbf/C6YQhXqNZO.json',
    scale: 3.5,
    price: 0,
  },
  {
    id: 'kitten',
    name: 'Kitten',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/d126e028-1171-11ee-bcab-873488686e7a/Mn5Jina31g.json',
    price: 800,
  },
  {
    id: 'dog',
    name: 'Dog',
    lottieUrl: 'https://lottie.host/8dfb9eb5-a82b-46e7-9f99-f219f965289f/aNZrfBaezt.json',
    scale: 2,
    price: 800,
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
    case 'farm':
      return FARM_ANIMALS;
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
  ...FARM_ANIMALS, ...MEADOW_ANIMALS,
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

// Get all starter (free) animal IDs across all biomes
export const getStarterAnimalIds = (): string[] => {
  return ALL_BIOME_ANIMALS()
    .filter(a => a.price === 0)
    .map(a => a.id);
};

// Get all animal IDs across all biomes (for dev unlock)
export const getAllAnimalIds = (): string[] => {
  return ALL_BIOME_ANIMALS().map(a => a.id);
};

// Get coin cost to unlock a biome
export const getBiomeCost = (biomeId: BiomeType): number => {
  return BIOME_CONFIG[biomeId]?.unlockCost ?? 0;
};
