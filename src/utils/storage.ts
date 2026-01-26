import type { UserData, UserSettings } from '../types';

const STORAGE_KEY = 'pomodoroStudyApp';

const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true,
  notificationsEnabled: true,
  focusModeEnabled: false,
  studyDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  selectedTheme: 'purple',
};

const DEFAULT_USER_DATA: UserData = {
  totalCompletedSessions: 0,
  currentStage: 1,
  dailyStats: {},
  weeklyStats: {},
  studyStreak: 0,
  lastStudyDate: null,
  settings: DEFAULT_SETTINGS,
  xp: 0,
  level: 1,
};

export const getUserData = (): UserData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Merge with defaults to ensure all fields exist
      return {
        ...DEFAULT_USER_DATA,
        ...parsed,
        settings: {
          ...DEFAULT_SETTINGS,
          ...parsed.settings,
        },
      };
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
  return DEFAULT_USER_DATA;
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

export const addCompletedSession = (minutes: number): UserData => {
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

  // Calculate new stage and XP
  const totalCompletedSessions = currentData.totalCompletedSessions + 1;
  const xp = currentData.xp + 100; // 100 XP per session
  const level = Math.floor(xp / 500) + 1; // Level up every 500 XP
  const currentStage = calculateStage(totalCompletedSessions);

  return updateUserData({
    totalCompletedSessions,
    currentStage,
    dailyStats,
    weeklyStats,
    studyStreak,
    lastStudyDate: today,
    xp,
    level,
  });
};

const calculateStage = (completedSessions: number): number => {
  if (completedSessions >= 51) return 4;
  if (completedSessions >= 26) return 3;
  if (completedSessions >= 11) return 2;
  return 1;
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
