export interface MeadowAnimal {
  id: string;
  name: string;
  lottieUrl: string;
  x: number;
  y: number;
  flipped?: boolean;
  biome: BiomeType;
}

// Biome and Collection Types
export type BiomeType = 'meadow' | 'safari' | 'forest' | 'ocean' | 'arctic' | 'mountain';

export interface CollectedAnimal {
  id: string;
  name: string;
  biome: BiomeType;
  lottieUrl: string;
  collectedAt: string; // ISO date string
}

export interface SelectedAnimal {
  id: string;
  name: string;
  biome: BiomeType;
  lottieUrl: string;
}

export interface UserData {
  totalCompletedSessions: number;
  dailyStats: DailyStats;
  weeklyStats: WeeklyStats;
  studyStreak: number;
  lastStudyDate: string | null;
  settings: UserSettings;
  meadowAnimals: MeadowAnimal[];
  lastResetDate: string | null;
  // Collection and Biome fields
  permanentCollection: CollectedAnimal[];
  activeBiome: BiomeType;
  unlockedBiomes: BiomeType[];
  lastDailyReset: string | null;
  // Selected animal for pomodoro session
  selectedAnimal: SelectedAnimal | null;
  // Failed session tracking
  dailyFailedSessions: DailyFailedSessions;
  // Coin economy
  coins: number;
  purchasedAnimals: string[];
  // Legacy fields (for compatibility with unused screen files)
  currentStage: number;
}

export interface DailyStats {
  [date: string]: number; // date (YYYY-MM-DD) -> minutes studied
}

export interface DailyFailedSessions {
  [date: string]: number; // date (YYYY-MM-DD) -> number of failed pomodoros
}

export interface WeeklyStats {
  [weekStart: string]: number; // week start date -> total minutes
}

export interface UserSettings {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  focusModeEnabled: boolean;
  studyDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  selectedTheme: ThemeColor;
  devModeEnabled?: boolean;
}

export type ThemeColor = 'blue' | 'green' | 'purple' | 'peach' | 'beige';

export type TimerMode = 'study' | 'shortBreak' | 'longBreak';

// Legacy compatibility (not used in main app)
export interface CharacterStage {
  stage: number;
  name: string;
  requiredSessions: number;
  color: string;
  description: string;
}

export const CHARACTER_STAGES: CharacterStage[] = [
  {
    stage: 1,
    name: 'Sprout',
    requiredSessions: 0,
    color: '#C8E4C8',
    description: 'A tiny sprout just beginning to grow',
  },
  {
    stage: 2,
    name: 'Seedling',
    requiredSessions: 11,
    color: '#B4D9B4',
    description: 'Growing stronger with each session',
  },
  {
    stage: 3,
    name: 'Young Plant',
    requiredSessions: 26,
    color: '#9FC59F',
    description: 'Thriving and reaching new heights',
  },
  {
    stage: 4,
    name: 'Blooming',
    requiredSessions: 51,
    color: '#7DB87D',
    description: 'Fully bloomed and flourishing',
  },
];
