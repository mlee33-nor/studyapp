import type { UserData } from '../types';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  progress: number; // 0-100
  requirement: number;
  category: 'sessions' | 'streak' | 'collection' | 'level' | 'time' | 'perfect' | 'special';
}

// Achievement Definitions
export const ACHIEVEMENTS: Achievement[] = [
  // Session Achievements
  {
    id: 'first_session',
    name: 'First Step',
    description: 'Complete your first study session',
    emoji: '🎯',
    unlocked: false,
    progress: 0,
    requirement: 1,
    category: 'sessions',
  },
  {
    id: 'ten_sessions',
    name: 'Building Momentum',
    description: 'Complete 10 study sessions',
    emoji: '📚',
    unlocked: false,
    progress: 0,
    requirement: 10,
    category: 'sessions',
  },
  {
    id: 'fifty_sessions',
    name: 'Dedicated Learner',
    description: 'Complete 50 study sessions',
    emoji: '🏆',
    unlocked: false,
    progress: 0,
    requirement: 50,
    category: 'sessions',
  },
  {
    id: 'hundred_sessions',
    name: 'Study Veteran',
    description: 'Complete 100 study sessions',
    emoji: '💯',
    unlocked: false,
    progress: 0,
    requirement: 100,
    category: 'sessions',
  },
  {
    id: 'two_fifty_sessions',
    name: 'Academic Powerhouse',
    description: 'Complete 250 study sessions',
    emoji: '⚡',
    unlocked: false,
    progress: 0,
    requirement: 250,
    category: 'sessions',
  },

  // Streak Achievements
  {
    id: 'three_day_streak',
    name: 'Starting Strong',
    description: 'Study for 3 days in a row',
    emoji: '🔥',
    unlocked: false,
    progress: 0,
    requirement: 3,
    category: 'streak',
  },
  {
    id: 'seven_day_streak',
    name: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    emoji: '📅',
    unlocked: false,
    progress: 0,
    requirement: 7,
    category: 'streak',
  },
  {
    id: 'thirty_day_streak',
    name: 'Monthly Marathon',
    description: 'Study every day for a month',
    emoji: '🌟',
    unlocked: false,
    progress: 0,
    requirement: 30,
    category: 'streak',
  },
  {
    id: 'sixty_day_streak',
    name: 'Unstoppable Force',
    description: 'Maintain a 60-day study streak',
    emoji: '💪',
    unlocked: false,
    progress: 0,
    requirement: 60,
    category: 'streak',
  },
  {
    id: 'hundred_day_streak',
    name: 'Century of Dedication',
    description: 'Study for 100 consecutive days',
    emoji: '🏅',
    unlocked: false,
    progress: 0,
    requirement: 100,
    category: 'streak',
  },

  // Time-based Achievements
  {
    id: 'ten_hours',
    name: 'Time Investment',
    description: 'Study for 10 total hours',
    emoji: '⏰',
    unlocked: false,
    progress: 0,
    requirement: 600, // minutes
    category: 'time',
  },
  {
    id: 'fifty_hours',
    name: 'Dedicated Scholar',
    description: 'Accumulate 50 hours of study time',
    emoji: '📖',
    unlocked: false,
    progress: 0,
    requirement: 3000,
    category: 'time',
  },
  {
    id: 'hundred_hours',
    name: 'Master of Time',
    description: 'Reach 100 hours of total study time',
    emoji: '⌛',
    unlocked: false,
    progress: 0,
    requirement: 6000,
    category: 'time',
  },

  // Perfect Day Achievements
  {
    id: 'first_perfect',
    name: 'Perfect Execution',
    description: 'Complete a day without failing a Pomodoro',
    emoji: '✨',
    unlocked: false,
    progress: 0,
    requirement: 1,
    category: 'perfect',
  },
  {
    id: 'ten_perfect',
    name: 'Excellence Habit',
    description: 'Achieve 10 perfect study days',
    emoji: '🌈',
    unlocked: false,
    progress: 0,
    requirement: 10,
    category: 'perfect',
  },
  {
    id: 'thirty_perfect',
    name: 'Perfectionist',
    description: 'Complete 30 perfect study days',
    emoji: '💎',
    unlocked: false,
    progress: 0,
    requirement: 30,
    category: 'perfect',
  },

  // Collection Achievements
  {
    id: 'five_animals',
    name: 'Animal Friend',
    description: 'Collect 5 study companions',
    emoji: '🐾',
    unlocked: false,
    progress: 0,
    requirement: 5,
    category: 'collection',
  },
  {
    id: 'ten_animals',
    name: 'Growing Menagerie',
    description: 'Collect 10 unique animals',
    emoji: '🦊',
    unlocked: false,
    progress: 0,
    requirement: 10,
    category: 'collection',
  },
  {
    id: 'twenty_animals',
    name: 'Wildlife Sanctuary',
    description: 'Collect 20 different animals',
    emoji: '🦁',
    unlocked: false,
    progress: 0,
    requirement: 20,
    category: 'collection',
  },

  // Level Achievements
  {
    id: 'level_five',
    name: 'Novice Scholar',
    description: 'Reach level 5',
    emoji: '📝',
    unlocked: false,
    progress: 0,
    requirement: 5,
    category: 'level',
  },
  {
    id: 'level_ten',
    name: 'Rising Star',
    description: 'Reach level 10',
    emoji: '⭐',
    unlocked: false,
    progress: 0,
    requirement: 10,
    category: 'level',
  },
  {
    id: 'level_twenty',
    name: 'Expert Learner',
    description: 'Reach level 20',
    emoji: '🎓',
    unlocked: false,
    progress: 0,
    requirement: 20,
    category: 'level',
  },
  {
    id: 'level_thirty',
    name: 'Academic Elite',
    description: 'Reach level 30',
    emoji: '👑',
    unlocked: false,
    progress: 0,
    requirement: 30,
    category: 'level',
  },
  {
    id: 'level_fifty',
    name: 'Legendary Scholar',
    description: 'Reach the legendary level 50',
    emoji: '🌟',
    unlocked: false,
    progress: 0,
    requirement: 50,
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

  // Calculate total study time from daily stats
  const totalMinutes = Object.values(userData?.dailyStats ?? {}).reduce((sum, mins) => sum + mins, 0);

  // Perfect days: past days with at least one completed session and zero failures
  // (today excluded — day isn't over yet)
  const today = new Date().toISOString().split('T')[0];
  const failedByDay = userData?.dailyFailedSessions ?? {};
  const perfectDays = Object.entries(userData?.dailyStats ?? {})
    .filter(([date, mins]) => date !== today && mins > 0 && !(failedByDay[date] > 0)).length;

  return ACHIEVEMENTS.map(achievement => {
    let progress = 0;
    let unlocked = false;

    switch (achievement.category) {
      case 'sessions':
        progress = Math.min(totalSessions, achievement.requirement);
        unlocked = totalSessions >= achievement.requirement;
        break;

      case 'streak':
        progress = Math.min(streak, achievement.requirement);
        unlocked = streak >= achievement.requirement;
        break;

      case 'collection':
        progress = Math.min(collectionLength, achievement.requirement);
        unlocked = collectionLength >= achievement.requirement;
        break;

      case 'level':
        progress = Math.min(level, achievement.requirement);
        unlocked = level >= achievement.requirement;
        break;

      case 'time':
        progress = Math.min(totalMinutes, achievement.requirement);
        unlocked = totalMinutes >= achievement.requirement;
        break;

      case 'perfect':
        progress = Math.min(perfectDays, achievement.requirement);
        unlocked = perfectDays >= achievement.requirement;
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

// Check for newly unlocked achievements by comparing before/after user data
export const getNewlyUnlocked = (before: UserData, after: UserData): Achievement[] => {
  const beforeAchievements = getAchievementsWithProgress(before);
  const afterAchievements = getAchievementsWithProgress(after);

  const beforeUnlockedIds = new Set(
    beforeAchievements.filter(a => a.unlocked).map(a => a.id)
  );

  return afterAchievements.filter(a => a.unlocked && !beforeUnlockedIds.has(a.id));
};

// Get next achievement to work towards
export const getNextAchievements = (userData: UserData, limit = 3): Achievement[] => {
  const achievements = getAchievementsWithProgress(userData);
  return achievements
    .filter(a => !a.unlocked)
    .sort((a, b) => {
      // Prioritize single-action achievements (req=1) so they show first for new users
      if (a.requirement === 1 && b.requirement !== 1) return -1;
      if (b.requirement === 1 && a.requirement !== 1) return 1;
      return b.progress - a.progress;
    })
    .slice(0, limit);
};
