import type { UserData, UserSettings, CollectedAnimal, BiomeType } from '../types';
import { getStarterAnimalIds, getAllAnimalIds } from '../data/biomes';

const STORAGE_KEY = 'pomodoroStudyApp';

const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true,
  notificationsEnabled: true,
  focusModeEnabled: false,
  studyDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  dailyGoalMinutes: 60,
  selectedTheme: 'purple',
  devModeEnabled: false,
};

const DEFAULT_USER_DATA: UserData = {
  totalCompletedSessions: 0,
  dailyStats: {},
  weeklyStats: {},
  studyStreak: 0,
  lastStudyDate: null,
  settings: DEFAULT_SETTINGS,
  meadowAnimals: [],
  lastResetDate: null,
  // Collection and Biome fields
  permanentCollection: [],
  activeBiome: 'meadow',
  unlockedBiomes: ['meadow'],
  lastDailyReset: null,
  // Selected animal for pomodoro
  selectedAnimal: {
    id: 'bunny',
    name: 'Bunny',
    biome: 'meadow',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/935dfeb0-118b-11ee-9126-43e3de286e2f/1X7rBzXV9L.json',
  },
  // Failed session tracking
  dailyFailedSessions: {},
  // Coin economy
  coins: 0,
  purchasedAnimals: [],
  // Legacy fields for compatibility
  currentStage: 1,
};

export const getUserData = (): UserData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Merge with defaults to ensure all fields exist
      const merged = {
        ...DEFAULT_USER_DATA,
        ...parsed,
        settings: {
          ...DEFAULT_SETTINGS,
          ...parsed.settings,
        },
      };
      // Migration: grant starter animals to existing users
      if (!parsed.purchasedAnimals) {
        merged.purchasedAnimals = getStarterAnimalIds();
        saveUserData(merged);
      }
      return merged;
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
  return { ...DEFAULT_USER_DATA, purchasedAnimals: getStarterAnimalIds() };
};

export const saveUserData = (data: UserData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

export const updateUserData = (updates: Partial<UserData>): UserData => {
  const currentData = getUserData();
  const newData = { ...currentData, ...updates };
  saveUserData(newData);
  return newData;
};

export const updateSettings = (settings: Partial<UserSettings>): void => {
  const currentData = getUserData();
  const newSettings = { ...currentData.settings, ...settings };
  updateUserData({ settings: newSettings });
};

const ANIMAL_LOTTIE_URLS = [
  'https://assets-v2.lottiefiles.com/a/935dfeb0-118b-11ee-9126-43e3de286e2f/1X7rBzXV9L.json', // Bunny (transparent, idle)
  'https://assets-v2.lottiefiles.com/a/d126e028-1171-11ee-bcab-873488686e7a/Mn5Jina31g.json', // Cat (idle)
  'https://assets-v2.lottiefiles.com/a/f049f0d0-1167-11ee-a923-67dbc9989221/EQDE7OOv8Q.json', // Dog (full body corgi)
];

export const checkAndResetMeadow = (): UserData => {
  const currentData = getUserData();
  const today = new Date().toISOString().split('T')[0];
  if (currentData.lastResetDate !== today) {
    return updateUserData({ meadowAnimals: [], lastResetDate: today });
  }
  return currentData;
};

export const getRandomAnimalUrl = (): string => {
  return ANIMAL_LOTTIE_URLS[Math.floor(Math.random() * ANIMAL_LOTTIE_URLS.length)];
};

export const updateAnimalPosition = (animalId: string, x: number, y: number): void => {
  const currentData = getUserData();
  const meadowAnimals = currentData.meadowAnimals.map(animal =>
    animal.id === animalId ? { ...animal, x, y } : animal
  );
  updateUserData({ meadowAnimals });
};

export const toggleAnimalFlip = (animalId: string): void => {
  const currentData = getUserData();
  const meadowAnimals = currentData.meadowAnimals.map(animal =>
    animal.id === animalId ? { ...animal, flipped: !animal.flipped } : animal
  );
  updateUserData({ meadowAnimals });
};

// Hybrid collection logic - Adds animal to permanent collection
export const addToCollection = (
  name: string,
  biome: BiomeType,
  lottieUrl: string
): CollectedAnimal => {
  const animal: CollectedAnimal = {
    id: `${Date.now()}-${Math.random()}`,
    name,
    biome,
    lottieUrl,
    collectedAt: new Date().toISOString(),
  };

  const currentData = getUserData();
  const updatedCollection = [...currentData.permanentCollection, animal];
  updateUserData({ permanentCollection: updatedCollection });

  return animal;
};

export const addCompletedSession = (minutes: number, animalUrl?: string): UserData => {
  const currentData = getUserData();
  const today = new Date().toISOString().split('T')[0];

  // Update daily stats
  const dailyStats = { ...currentData.dailyStats };
  dailyStats[today] = (dailyStats[today] || 0) + minutes;

  // Update weekly stats
  const weekStart = getWeekStart(new Date());
  const weeklyStats = { ...currentData.weeklyStats };
  weeklyStats[weekStart] = (weeklyStats[weekStart] || 0) + minutes;

  // Update streak
  let studyStreak = currentData.studyStreak;
  const lastStudyDate = currentData.lastStudyDate;

  if (lastStudyDate) {
    const daysSinceLastStudy = getDaysDifference(new Date(lastStudyDate), new Date());
    if (daysSinceLastStudy === 0) {
      // Same day, keep streak
    } else if (daysSinceLastStudy === 1) {
      // Consecutive day, increment streak
      studyStreak += 1;
    } else {
      // Streak broken, reset to 1
      studyStreak = 1;
    }
  } else {
    studyStreak = 1;
  }

  // Spawn new meadow animal with collision-free positioning
  const MEADOW_WIDTH = 400;
  const MEADOW_HEIGHT = 450;
  const ANIMAL_SIZE = 60;
  const MIN_Y = 185; // Start on first color of green
  const MAX_Y = MEADOW_HEIGHT - ANIMAL_SIZE - 20;
  const MIN_X = 10;
  const MAX_X = MEADOW_WIDTH - ANIMAL_SIZE - 10;

  // Animals not bound to the ground (can spawn anywhere including sky/water)
  const FREE_ROAM_NAMES = new Set(['Butterfly', 'Turtle', 'Tropical Fish', 'Octopus']);

  // Find a valid spawn position that doesn't overlap with existing animals
  const findValidSpawnPosition = (animalName?: string): { x: number; y: number } => {
    const COLLISION_THRESHOLD = 55; // Allows close proximity, auto-repels when overlapping
    const MAX_ATTEMPTS = 20;
    const spawnMinY = animalName && FREE_ROAM_NAMES.has(animalName) ? 0 : MIN_Y;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const x = MIN_X + Math.random() * (MAX_X - MIN_X);
      const y = spawnMinY + Math.random() * (MAX_Y - spawnMinY);

      // Check if this position collides with any existing animal
      let hasCollision = false;
      for (const animal of currentData.meadowAnimals) {
        const dx = x - animal.x;
        const dy = y - animal.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < COLLISION_THRESHOLD) {
          hasCollision = true;
          break;
        }
      }

      if (!hasCollision) {
        return { x, y };
      }
    }

    // If all attempts failed, place in center with slight randomness
    return {
      x: MEADOW_WIDTH / 2 - ANIMAL_SIZE / 2 + (Math.random() - 0.5) * 100,
      y: (MIN_Y + MAX_Y) / 2 + (Math.random() - 0.5) * 100
    };
  };

  // Use the user's selected animal, or default to bunny if not set
  const selectedAnimalData = currentData.selectedAnimal || {
    id: 'bunny',
    name: 'Bunny',
    biome: 'meadow',
    lottieUrl: 'https://assets-v2.lottiefiles.com/a/935dfeb0-118b-11ee-9126-43e3de286e2f/1X7rBzXV9L.json',
  };

  const selectedUrl = animalUrl || selectedAnimalData.lottieUrl;

  // Add to permanent collection
  const collectedAnimal = addToCollection(selectedAnimalData.name, selectedAnimalData.biome, selectedUrl);

  const spawnPos = findValidSpawnPosition(collectedAnimal.name);

  // Create meadow display animal with metadata from collected animal
  const newAnimal = {
    id: collectedAnimal.id,
    name: collectedAnimal.name,
    lottieUrl: selectedUrl,
    x: spawnPos.x,
    y: spawnPos.y,
    flipped: Math.random() > 0.5, // Random initial flip
    biome: collectedAnimal.biome,
  };
  const meadowAnimals = [...currentData.meadowAnimals, newAnimal];

  const totalCompletedSessions = currentData.totalCompletedSessions + 1;

  const updatedData = updateUserData({
    totalCompletedSessions,
    dailyStats,
    weeklyStats,
    studyStreak,
    lastStudyDate: today,
    meadowAnimals,
    coins: (currentData.coins || 0) + minutes,
  });

  // Add collected animal to returned data for UI feedback
  return {
    ...updatedData,
    collectedAnimal,
  } as any;
};

export const addFailedSession = (): UserData => {
  const currentData = getUserData();
  const today = new Date().toISOString().split('T')[0];
  const dailyFailedSessions = { ...currentData.dailyFailedSessions };
  dailyFailedSessions[today] = (dailyFailedSessions[today] || 0) + 1;
  return updateUserData({ dailyFailedSessions });
};

const getWeekStart = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday as week start
  const weekStart = new Date(d.setDate(diff));
  return weekStart.toISOString().split('T')[0];
};

const getDaysDifference = (date1: Date, date2: Date): number => {
  const d1 = new Date(date1.toISOString().split('T')[0]);
  const d2 = new Date(date2.toISOString().split('T')[0]);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const getWeeklyMinutes = (): number => {
  const data = getUserData();
  const weekStart = getWeekStart(new Date());
  return data.weeklyStats[weekStart] || 0;
};

export const getWeeklyData = (): number[] => {
  const data = getUserData();
  const today = new Date();
  const weekData: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    weekData.push(data.dailyStats[dateStr] || 0);
  }

  return weekData;
};

// Reset all stats while keeping user settings
export const resetAllStats = (): UserData => {
  const currentData = getUserData();
  const newData: UserData = {
    ...DEFAULT_USER_DATA,
    settings: currentData.settings, // Preserve settings
  };
  saveUserData(newData);
  return newData;
};

// Purchase an animal with coins
export const purchaseAnimal = (animalId: string, price: number): UserData | null => {
  const data = getUserData();
  if (data.coins < price || data.purchasedAnimals.includes(animalId)) return null;
  return updateUserData({
    coins: data.coins - price,
    purchasedAnimals: [...data.purchasedAnimals, animalId],
  });
};

// Dev Mode: Unlock all biomes and animals
export const unlockAllBiomes = (): UserData => {
  const biomeIds: BiomeType[] = ['meadow', 'safari', 'forest', 'ocean', 'mountain'];
  const newData = updateUserData({
    unlockedBiomes: biomeIds,
    activeBiome: 'meadow',
    coins: 9999,
    purchasedAnimals: getAllAnimalIds(),
  });
  return newData;
};
