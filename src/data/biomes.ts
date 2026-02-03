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
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/de40ba3c-8eef-11ed-8a72-0242ac120002/pBxICCRm0w.json',
  },
  {
    id: 'elephant',
    name: 'Elephant',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/61b3f91d-9053-11ed-9e5c-d3a8aaa71d4c/vLzLgXtaMf.json',
  },
  {
    id: 'zebra',
    name: 'Zebra',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/e6e20e35-bfb3-11ed-b2b2-02b7a2a6ff73/mRxfcCGj4K.json',
  },
  {
    id: 'lion',
    name: 'Lion',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/35ab8b26-c1be-11ed-b2b2-02b7a2a6ff73/IKCzw3xC6B.json',
  },
  {
    id: 'flamingo',
    name: 'Flamingo',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/ee17f1ec-d053-11ed-b2b2-02b7a2a6ff73/hZ0FiOz7Ng.json',
  },
];

// Forest Animals - Real Lottie Animation URLs
export const FOREST_ANIMALS: BiomeAnimal[] = [
  {
    id: 'squirrel',
    name: 'Squirrel',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/7ba0c728-117a-11ee-9eb8-cba5cf43b9a9/SeYh6q2ap3.json',
  },
  {
    id: 'deer',
    name: 'Deer',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/b3859ba2-1150-11ee-8f51-2bfeee9af832/5MDZDPhpLm.json',
  },
  {
    id: 'fox',
    name: 'Fox',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/9c4b280c-116f-11ee-8e54-17fdd56ae6ce/nZEIpQEdUZ.json',
  },
  {
    id: 'owl',
    name: 'Owl',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/1a7311d2-1165-11ee-bdc1-b7e695e8e5eb/n3r1YeRfcK.json',
  },
  {
    id: 'bear',
    name: 'Bear',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/7b36d6ac-3cb7-11ee-a573-175a0b884d98/yFrEbfbfVT.json',
  },
];

// Ocean Animals - Real Lottie Animation URLs
export const OCEAN_ANIMALS: BiomeAnimal[] = [
  {
    id: 'dolphin',
    name: 'Dolphin',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/b9ef8c12-1161-11ee-90f5-a3680064bf0c/Ki9m8yyudV.json',
  },
  {
    id: 'turtle',
    name: 'Turtle',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/ff3e331e-1151-11ee-be8d-8bfdaec50b6c/8dbUivXsqR.json',
  },
  {
    id: 'tropical_fish',
    name: 'Tropical Fish',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/86f8990e-1169-11ee-a6f1-bb14d7c44c2d/lf3mtlvPIx.json',
  },
  {
    id: 'octopus',
    name: 'Octopus',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/90babb16-1150-11ee-b77d-ebc1778b3173/815709gE5u.json',
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
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/a57156f0-1150-11ee-a172-2bd10c970bb4/BDf0YnNLA1.json',
  },
  {
    id: 'seal',
    name: 'Seal',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/ff3e331e-1151-11ee-be8d-8bfdaec50b6c/8dbUivXsqR.json',
  },
  {
    id: 'arctic_fox',
    name: 'Arctic Fox',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/45a7c3d8-1152-11ee-b338-e3b7676f76d8/4VQ09D21yX.json',
  },
  {
    id: 'polar_bear',
    name: 'Polar Bear',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/57bf975c-1153-11ee-9894-77feb79c4931/g7QuM6qVSV.json',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/b64ba894-1188-11ee-ad71-17472cd0978f/svrPtOox1A.json',
  },
];

// Mountain Animals - Real Lottie Animation URLs
export const MOUNTAIN_ANIMALS: BiomeAnimal[] = [
  {
    id: 'eagle',
    name: 'Golden Eagle',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/b30d3932-1173-11ee-af4b-3731ed1db57c/KOjD1FrTn8.json',
  },
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
  },
  {
    id: 'hedgehog',
    name: 'Hedgehog',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/217eea54-1152-11ee-80aa-bb89673ffc3b/GtbajlQ7yk.json',
  },
  {
    id: 'ladybug',
    name: 'Ladybug',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/86f8990e-1169-11ee-a6f1-bb14d7c44c2d/lf3mtlvPIx.json',
  },
  {
    id: 'unicorn',
    name: 'Unicorn',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/331cb362-1171-11ee-a9e7-5344551976a1/2vP342VdfO.json',
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
