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

// Safari Animals - Using working CDN URLs (original -11ed- batch URLs were broken)
export const SAFARI_ANIMALS: BiomeAnimal[] = [
  {
    id: 'corgi',
    name: 'Corgi',
    lottieUrl: 'https://lottie.host/fa46edd8-fe5d-4204-a103-c6c96515d942/Ct0AEttiW0.json',
  },
  {
    id: 'safari_bear',
    name: 'Bear',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/7b36d6ac-3cb7-11ee-a573-175a0b884d98/yFrEbfbfVT.json',
  },
  {
    id: 'safari_eagle',
    name: 'Eagle',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/b30d3932-1173-11ee-af4b-3731ed1db57c/KOjD1FrTn8.json',
    scale: 2.5,
  },
  {
    id: 'parrot',
    name: 'Parrot',
    lottieUrl: 'https://lottie.host/44a757d3-3161-4c8e-9026-bfbc684f2ee3/iFOeAFQMyt.json',
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
    lottieUrl: 'https://lottie.host/a6cc2cb5-934a-4637-bcc9-9f0c1147e82b/3uiijvVcIR.json',
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
    lottieUrl: 'https://lottie.host/48a2faaa-163a-4cb4-acd1-37e90bf015bc/762D1b9pb1.json',
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
    lottieUrl: 'https://lottie.host/3b760413-869e-41dd-b2f1-23970e2cb311/kFKn3tyA3E.json',
  },
  {
    id: 'seal',
    name: 'Seal',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/ff3e331e-1151-11ee-be8d-8bfdaec50b6c/8dbUivXsqR.json',
  },
  {
    id: 'arctic_fox',
    name: 'Arctic Fox',
    lottieUrl: 'https://lottie.host/5bce72d6-1650-4822-b6d6-910d93a3122e/EEMUntSED3.json',
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
