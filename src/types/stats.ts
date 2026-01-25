// Enhanced Category System with Emoji and Theme Colors
export interface StudyCategory {
  id: string;
  title: string;
  emoji: string;
  themeColor: string;
  accentColor: string;
  createdAt: string;
  lastUsed: string;
}

// Enhanced Focus Session with Category Metadata
export interface EnhancedFocusSession {
  id: number;
  categoryId: string;
  category: string; // For backward compatibility
  emoji: string;
  themeColor: string;
  duration: number;
  date: string;
  timestamp: number;
  successStatus: boolean;
}

// Analytics Data Structures
export interface DayData {
  date: Date;
  totalMinutes: number;
  sessions: EnhancedFocusSession[];
  categories: string[];
  hasSession: boolean;
  isToday: boolean;
  isPerfectDay: boolean;
}

export interface CategoryStats {
  categoryId: string;
  title: string;
  emoji: string;
  themeColor: string;
  totalMinutes: number;
  sessionCount: number;
  currentStreak: number;
  bestStreak: number;
  perfectDays: number;
  weeklyGoal: number;
  weeklyProgress: number;
  monthlyData: DayData[];
}

export interface OverallStats {
  totalMinutes: number;
  totalSessions: number;
  currentStreak: number;
  bestStreak: number;
  perfectDays: number;
  successRate: number;
  dailyGoalMinutes: number;
  categoriesCount: number;
  monthlyData: DayData[];
  yearlyData: DayData[];
}

export type ViewMode = 'weekly' | 'monthly' | 'yearly';
