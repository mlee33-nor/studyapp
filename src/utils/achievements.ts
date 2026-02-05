import type { UserData } from '../types';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  progress: number; // 0-100
  requirement: number;
  category: 'sessions' | 'streak' | 'collection' | 'level' | 'special';
}

// Achievement Definitions
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_session',
    name: 'Getting Started',
    description: 'Complete your first study session',
    emoji: '📚',
    unlocked: false,
    progress: 0,
    requirement: 1,
    category: 'sessions',
  },
  {
    id: 'ten_sessions',
    name: 'Dedicated Studier',
    description: 'Complete 10 study sessions',
    emoji: '📖',
    unlocked: false,
    progress: 0,
    requirement: 10,
    category: 'sessions',
  },
  {
    id: 'fifty_sessions',
    name: 'Study Warrior',
    description: 'Complete 50 study sessions',
    emoji: '⚔️',
    unlocked: false,
    progress: 0,
    requirement: 50,
    category: 'sessions',
  },
  {
    id: 'hundred_sessions',
    name: 'Century Master',
    description: 'Complete 100 study sessions',
    emoji: '💯',
    unlocked: false,
    progress: 0,
    requirement: 100,
    category: 'sessions',
  },
  {
    id: 'seven_day_streak',
    name: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    emoji: '🔥',
    unlocked: false,
    progress: 0,
    requirement: 7,
    category: 'streak',
  },
  {
    id: 'thirty_day_streak',
    name: 'Month Master',
    description: 'Maintain a 30-day study streak',
    emoji: '🌟',
    unlocked: false,
    progress: 0,
    requirement: 30,
    category: 'streak',
  },
  {
    id: 'five_animals',
    name: 'Pet Collector',
    description: 'Collect 5 animals',
    emoji: '🐾',
    unlocked: false,
    progress: 0,
    requirement: 5,
    category: 'collection',
  },
  {
    id: 'twenty_animals',
    name: 'Animal Park',
    description: 'Collect 20 animals',
    emoji: '🦁',
    unlocked: false,
    progress: 0,
    requirement: 20,
    category: 'collection',
  },
  {
    id: 'level_ten',
    name: 'Rising Scholar',
    description: 'Reach level 10',
    emoji: '📈',
    unlocked: false,
    progress: 0,
    requirement: 10,
    category: 'level',
  },
  {
    id: 'level_twenty',
    name: 'Master Scholar',
    description: 'Reach level 20',
    emoji: '🎓',
    unlocked: false,
    progress: 0,
    requirement: 20,
    category: 'level',
  },
  {
    id: 'level_thirty',
    name: 'Legendary Scholar',
    description: 'Reach level 30',
    emoji: '✨',
    unlocked: false,
    progress: 0,
    requirement: 30,
    category: 'level',
  },
];

// Get achievements with updated progress based on user data
export const getAchievementsWithProgress = (userData: UserData): Achievement[] => {
  // Safely get values with defaults to prevent NaN
  const totalSessions = userData?.totalCompletedSessions ?? 0;
  const streak = userData?.studyStreak ?? 0;
  const collectionLength = userData?.permanentCollection?.length ?? 0;
  const level = userData?.level ?? 1;

  return ACHIEVEMENTS.map(achievement => {
    let progress = 0;
    let unlocked = false;

    switch (achievement.id) {
      case 'first_session':
      case 'ten_sessions':
      case 'fifty_sessions':
      case 'hundred_sessions':
        progress = Math.min(totalSessions, achievement.requirement);
        unlocked = totalSessions >= achievement.requirement;
        break;

      case 'seven_day_streak':
      case 'thirty_day_streak':
        progress = Math.min(streak, achievement.requirement);
        unlocked = streak >= achievement.requirement;
        break;

      case 'five_animals':
      case 'twenty_animals':
        progress = Math.min(collectionLength, achievement.requirement);
        unlocked = collectionLength >= achievement.requirement;
        break;

      case 'level_ten':
      case 'level_twenty':
      case 'level_thirty':
        progress = Math.min(level, achievement.requirement);
        unlocked = level >= achievement.requirement;
        break;

      default:
        break;
    }

    return {
      ...achievement,
      unlocked,
      progress: Math.min((progress / achievement.requirement) * 100, 100),
    };
  });
};

// Get achievement statistics
export const getAchievementStats = (userData: UserData) => {
  const achievements = getAchievementsWithProgress(userData);
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return {
    unlockedCount,
    totalCount,
    unlockedPercentage: (unlockedCount / totalCount) * 100,
    achievements,
  };
};

// Get next achievement to work towards
export const getNextAchievements = (userData: UserData, limit = 3): Achievement[] => {
  const achievements = getAchievementsWithProgress(userData);
  return achievements
    .filter(a => !a.unlocked)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, limit);
};
