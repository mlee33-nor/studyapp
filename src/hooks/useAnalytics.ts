import { useMemo } from 'react';
import {
  startOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  differenceInDays,
  addDays,
  subDays
} from 'date-fns';
import type {
  EnhancedFocusSession,
  DayData,
  CategoryStats,
  OverallStats,
  ViewMode
} from '../types/stats';
import { getEnhancedSessions, getCategories } from '../utils/categoryManager';

export const useAnalytics = (_viewMode: ViewMode = 'monthly', dailyGoalMinutes: number = 60) => {
  const sessions = useMemo(() => getEnhancedSessions(), []);
  const categories = useMemo(() => getCategories(), []);

  // Calculate overall statistics
  const overallStats = useMemo((): OverallStats => {
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalSessions = sessions.length;

    // Calculate streaks
    const { currentStreak, bestStreak } = calculateStreaks(sessions, dailyGoalMinutes);

    // Calculate perfect days (days where goal was met)
    const perfectDays = calculatePerfectDays(sessions, dailyGoalMinutes);

    // Success rate (percentage of sessions completed successfully)
    const successfulSessions = sessions.filter(s => s.successStatus).length;
    const successRate = totalSessions > 0 ? (successfulSessions / totalSessions) * 100 : 0;

    // Generate monthly data
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const monthlyData = generateDayData(sessions, monthStart, monthEnd, dailyGoalMinutes);

    // Generate yearly data
    const yearStart = startOfYear(new Date());
    const yearEnd = endOfYear(new Date());
    const yearlyData = generateDayData(sessions, yearStart, yearEnd, dailyGoalMinutes);

    return {
      totalMinutes,
      totalSessions,
      currentStreak,
      bestStreak,
      perfectDays,
      successRate,
      dailyGoalMinutes,
      categoriesCount: new Set(sessions.map(s => s.categoryId)).size,
      monthlyData,
      yearlyData
    };
  }, [sessions, dailyGoalMinutes]);

  // Calculate category-specific statistics
  const categoryStats = useMemo((): CategoryStats[] => {
    const categoriesWithSessions = categories.filter(cat =>
      sessions.some(s => s.categoryId === cat.id)
    );

    return categoriesWithSessions.map(cat => {
      const categorySessions = sessions.filter(s => s.categoryId === cat.id);
      const totalMinutes = categorySessions.reduce((sum, s) => sum + s.duration, 0);

      // Calculate category-specific streaks
      const { currentStreak, bestStreak } = calculateStreaks(categorySessions, 0); // Any session counts for category

      // Perfect days for this category (days with at least one session)
      const perfectDays = new Set(categorySessions.map(s => parseISO(s.date).toDateString())).size;

      // Weekly goal and progress
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
      const weekEnd = addDays(weekStart, 6);
      const weekSessions = categorySessions.filter(s => {
        const sessionDate = parseISO(s.date);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });
      const weeklyMinutes = weekSessions.reduce((sum, s) => sum + s.duration, 0);
      const weeklyGoal = 180; // 3 hours per week per category
      const weeklyProgress = (weeklyMinutes / weeklyGoal) * 100;

      // Generate monthly data for this category
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      const monthlyData = generateDayData(categorySessions, monthStart, monthEnd, 0);

      return {
        categoryId: cat.id,
        title: cat.title,
        emoji: cat.emoji,
        themeColor: cat.themeColor,
        totalMinutes,
        sessionCount: categorySessions.length,
        currentStreak,
        bestStreak,
        perfectDays,
        weeklyGoal,
        weeklyProgress: Math.min(weeklyProgress, 100),
        monthlyData
      };
    });
  }, [sessions, categories]);

  return {
    overallStats,
    categoryStats,
    sessions,
    categories
  };
};

// Helper: Generate day data for a date range
export const generateDayData = (
  sessions: EnhancedFocusSession[],
  startDate: Date,
  endDate: Date,
  goalMinutes: number
): DayData[] => {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return days.map(date => {
    const daySessions = sessions.filter(s => isSameDay(parseISO(s.date), date));
    const totalMinutes = daySessions.reduce((sum, s) => sum + s.duration, 0);
    const categories = [...new Set(daySessions.map(s => s.categoryId))];

    return {
      date,
      totalMinutes,
      sessions: daySessions,
      categories,
      hasSession: daySessions.length > 0,
      isToday: isSameDay(date, new Date()),
      isPerfectDay: goalMinutes > 0 ? totalMinutes >= goalMinutes : daySessions.length > 0
    };
  });
};

// Helper: Calculate current and best streaks
export const calculateStreaks = (sessions: EnhancedFocusSession[], goalMinutes: number, referenceDate?: Date) => {
  if (sessions.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Group sessions by day
  const sessionsByDay = new Map<string, number>();
  sessions.forEach(s => {
    const dayKey = parseISO(s.date).toDateString();
    sessionsByDay.set(dayKey, (sessionsByDay.get(dayKey) || 0) + s.duration);
  });

  // Sort days
  const sortedDays = Array.from(sessionsByDay.keys())
    .map(k => new Date(k))
    .sort((a, b) => a.getTime() - b.getTime());

  // Calculate current streak
  let currentStreak = 0;
  let today = referenceDate || new Date();
  let checkDate = today;

  while (true) {
    const dayKey = checkDate.toDateString();
    const dayMinutes = sessionsByDay.get(dayKey) || 0;

    if (goalMinutes > 0 ? dayMinutes >= goalMinutes : dayMinutes > 0) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    } else if (isSameDay(checkDate, today)) {
      // If today has no session yet, check yesterday
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  // Calculate best streak
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  sortedDays.forEach(date => {
    const dayMinutes = sessionsByDay.get(date.toDateString()) || 0;
    const meetsGoal = goalMinutes > 0 ? dayMinutes >= goalMinutes : dayMinutes > 0;

    if (!meetsGoal) return;

    if (prevDate === null || differenceInDays(date, prevDate) === 1) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }

    prevDate = date;
  });

  return { currentStreak, bestStreak };
};

// Helper: Calculate perfect days
export const calculatePerfectDays = (sessions: EnhancedFocusSession[], goalMinutes: number): number => {
  const sessionsByDay = new Map<string, number>();
  sessions.forEach(s => {
    const dayKey = parseISO(s.date).toDateString();
    sessionsByDay.set(dayKey, (sessionsByDay.get(dayKey) || 0) + s.duration);
  });

  let perfectDays = 0;
  sessionsByDay.forEach(minutes => {
    if (minutes >= goalMinutes) {
      perfectDays++;
    }
  });

  return perfectDays;
};
