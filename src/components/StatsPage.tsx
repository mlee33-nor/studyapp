import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  getDay,
  isSameDay,
  startOfYear,
  endOfYear,
  addMonths,
  subMonths,
  addYears,
  subYears,
  isToday,
  parseISO,
  subDays
} from 'date-fns';
import Lottie from 'lottie-react';
import { useAnalytics, calculateStreaks, calculatePerfectDays, generateDayData } from '../hooks/useAnalytics';
import type { ViewMode, DayData, CategoryStats as CategoryStatsType, EnhancedFocusSession } from '../types/stats';
import { TrendingUp, Award, Flame, Target, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryDetail } from './CategoryDetail';
import { getUserData } from '../utils/storage';
import { BIOME_CONFIG } from '../data/biomes';
import type { BiomeType } from '../types';

const SOFT_SPRING = { type: "spring" as const, stiffness: 100, damping: 20 };

type Theme = 'morning' | 'midnight';

// Theme-Adaptive Color System
const getThemeColors = (theme: Theme) => {
  const themeMap = {
    morning: {
      background: 'transparent',
      cardBg: 'rgba(255, 255, 255, 0.8)',
      border: 'rgba(100, 116, 139, 0.15)',
      headerTextColor: '#000000',  // Solid black for morning theme
      text: {
        primary: 'rgba(15, 23, 42, 0.95)',
        secondary: 'rgba(51, 65, 85, 0.8)',
        tertiary: 'rgba(100, 116, 139, 0.7)'
      },
      heatmap: {
        empty: '#E2E8F0',          // Light grey for empty state
        emptyBorder: '#CBD5E1',     // Border for empty squares
        levels: [
          'rgba(167, 139, 250, 0.15)',   // Level 1
          'rgba(167, 139, 250, 0.35)',   // Level 2
          'rgba(167, 139, 250, 0.55)',   // Level 3
          'rgba(167, 139, 250, 0.75)',   // Level 4
          'rgba(167, 139, 250, 0.95)'    // Level 5
        ],
        currentDayBorder: 'rgba(139, 92, 246, 0.8)',
        selectedBorder: 'rgba(244, 114, 182, 0.9)'
      },
      gradient: 'linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(244, 114, 182, 0.15) 100%)',
      isDark: false
    },
    midnight: {
      background: '#0A0A0A',
      cardBg: 'rgba(26, 26, 26, 0.95)',
      border: 'rgba(255, 255, 255, 0.1)',
      headerTextColor: '#FFFFFF',  // White for midnight theme
      text: {
        primary: 'rgba(255, 255, 255, 0.95)',
        secondary: 'rgba(255, 255, 255, 0.7)',
        tertiary: 'rgba(255, 255, 255, 0.5)'
      },
      heatmap: {
        empty: 'rgba(255, 255, 255, 0.05)',
        emptyBorder: 'rgba(255, 255, 255, 0.08)',
        levels: [
          'rgba(59, 130, 246, 0.2)',
          'rgba(59, 130, 246, 0.4)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(59, 130, 246, 1)'
        ],
        currentDayBorder: '#3B82F6',
        selectedBorder: '#8B5CF6'
      },
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)',
      isDark: true
    }
  };

  return themeMap[theme];
};

const getIntensity = (minutes: number, goalMinutes: number = 60): number => {
  if (minutes === 0) return 0;
  const pct = minutes / goalMinutes;
  if (pct < 0.25) return 1;
  if (pct < 0.5) return 2;
  if (pct < 0.75) return 3;
  if (pct < 1) return 4;
  return 5;
};

type NavigationView = 'main' | 'daily' | 'category';

export const StatsPage: React.FC<{ theme: Theme }> = ({ theme }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [navigationView, setNavigationView] = useState<NavigationView>('main');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryStatsType | null>(null);
  const { overallStats, sessions } = useAnalytics(viewMode, 60);

  const colors = getThemeColors(theme);
  const userData = getUserData();
  const dailyGoal = userData.settings.dailyGoalMinutes || 60;
  const todayMinutes = useMemo(() => {
    const today = new Date();
    return sessions
      .filter(s => s.successStatus && isSameDay(parseISO(s.date), today))
      .reduce((sum, s) => sum + s.duration, 0);
  }, [sessions]);

  // Compute month-specific stats for the monthly view
  const monthlyStats = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const today = new Date();

    // Generate monthlyData for the selected month (used by heatmap)
    const monthlyData = generateDayData(sessions, monthStart, monthEnd, dailyGoal);

    // If the entire month is in the future, return zeros
    if (monthStart > today) {
      return {
        ...overallStats,
        totalMinutes: 0,
        totalSessions: 0,
        currentStreak: 0,
        bestStreak: 0,
        perfectDays: 0,
        successRate: 0,
        categoriesCount: 0,
        monthlyData,
      };
    }

    // Filter sessions to selected month
    const monthSessions = sessions.filter(s => {
      const sessionDate = parseISO(s.date);
      return sessionDate >= monthStart && sessionDate <= monthEnd;
    });

    if (monthSessions.length === 0) {
      return {
        ...overallStats,
        totalMinutes: 0,
        totalSessions: 0,
        currentStreak: 0,
        bestStreak: 0,
        perfectDays: 0,
        successRate: 0,
        categoriesCount: 0,
        monthlyData,
      };
    }

    const totalMinutes = monthSessions.filter(s => s.successStatus).reduce((sum, s) => sum + s.duration, 0);
    const totalSessions = monthSessions.length;

    // Success rate: percentage of sessions completed successfully
    const successfulSessions = monthSessions.filter(s => s.successStatus).length;
    const successRate = totalSessions > 0 ? (successfulSessions / totalSessions) * 100 : 0;

    // Streaks within this month - use end of month or today as reference
    const streakRef = monthEnd > today ? today : monthEnd;
    const { currentStreak, bestStreak } = calculateStreaks(monthSessions, dailyGoal, streakRef);

    // Perfect days in this month
    const perfectDays = calculatePerfectDays(monthSessions, dailyGoal);

    return {
      ...overallStats,
      totalMinutes,
      totalSessions,
      currentStreak,
      bestStreak,
      perfectDays,
      successRate,
      categoriesCount: new Set(monthSessions.map(s => s.categoryId)).size,
      monthlyData,
    };
  }, [sessions, currentDate, overallStats]);

  const handlePrevious = () => {
    if (viewMode === 'monthly') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === 'yearly') {
      setCurrentDate(subYears(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'monthly') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'yearly') {
      setCurrentDate(addYears(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setNavigationView('daily');
  };


  const handleBackToMain = () => {
    setNavigationView('main');
    setSelectedDate(null);
    setSelectedCategory(null);
  };

  // Render category detail drill-down
  if (navigationView === 'category' && selectedCategory) {
    return (
      <CategoryDetail
        category={selectedCategory}
        theme={theme}
        viewMode={viewMode === 'daily' ? 'monthly' : viewMode}
        onClose={handleBackToMain}
      />
    );
  }

  // Render day drill-down inline (reuses daily view cards for any date)
  if (navigationView === 'daily' && selectedDate) {
    const selectedDaySessions = sessions.filter(s => isSameDay(parseISO(s.date), selectedDate));
    const selectedDayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const selectedDayEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59);

    return (
      <div style={{
        minHeight: '100dvh',
        color: colors.text.primary,
        padding: '24px 16px calc(68px + max(12px, env(safe-area-inset-bottom, 12px)))',
        fontFamily: "'Quicksand', sans-serif"
      }}>
        {/* Back + Date Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SOFT_SPRING}
          style={{ marginBottom: '16px' }}
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBackToMain}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: colors.text.secondary,
              fontSize: '0.85rem',
              fontWeight: 600,
              fontFamily: "'Quicksand', sans-serif",
              marginBottom: '12px'
            }}
          >
            <ChevronLeft size={18} />
            Back
          </motion.button>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            margin: '0 0 4px 0',
            color: colors.headerTextColor,
            textShadow: !colors.isDark ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none'
          }}>
            {format(selectedDate, 'EEEE, MMMM d')}
          </h1>
          <p style={{ margin: 0, color: colors.text.tertiary, fontSize: '0.875rem' }}>
            {selectedDaySessions.length} session{selectedDaySessions.length !== 1 ? 's' : ''} · {selectedDaySessions.reduce((s, sess) => s + sess.duration, 0)} minutes
          </p>
        </motion.div>

        {/* Reuse daily cards scoped to the selected date */}
        <FocusedTimeDistributionForDate sessions={sessions} date={selectedDate} colors={colors} />
        <TagAnimalBreakdown
          sessions={sessions}
          colors={colors}
          label="Tag Breakdown"
          filterStart={selectedDayStart}
          filterEnd={selectedDayEnd}
          animationDelay={0.1}
        />
      </div>
    );
  }

  // Main view
  return (
    <div style={{
      minHeight: '100dvh',
      color: colors.text.primary,
      padding: '24px 16px calc(68px + max(12px, env(safe-area-inset-bottom, 12px)))',
      fontFamily: "'Quicksand', sans-serif"
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SOFT_SPRING}
        style={{ marginBottom: '16px' }}
      >
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 700,
          margin: '0 0 8px 0',
          color: colors.headerTextColor,
          textShadow: !colors.isDark ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none'
        }}>
          Your Progress
        </h1>
        <p style={{ margin: 0, color: colors.text.tertiary, fontSize: '0.875rem' }}>
          Track your study journey and celebrate your wins
        </p>
      </motion.div>

      {/* View Mode Toggle */}
      <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} colors={colors} />

      {/* Time Travel Navigation */}
      {(viewMode === 'monthly' || viewMode === 'yearly') && (
        <TimeNavigator
          viewMode={viewMode}
          currentDate={currentDate}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
          colors={colors}
        />
      )}

      {/* Daily View: Today's Detailed Analytics */}
      {viewMode === 'daily' && (
        <>
          <FocusedTimeDistribution sessions={sessions} colors={colors} />
          <FocusTrendCard sessions={sessions} colors={colors} />
          <TagAnimalBreakdown sessions={sessions} colors={colors} />
        </>
      )}

      {/* Yearly View: Compact Activity Overview */}
      {viewMode === 'yearly' && (
        <>
          {/* Overall Yearly Heatmap */}
          <YearlyHeatmap
            yearlyData={overallStats.yearlyData}
            currentDate={currentDate}
            colors={colors}
            onDateClick={handleDateClick}
            dailyGoal={dailyGoal}
          />

          {/* Yearly Summary Stats */}
          <YearlySummaryStats
            overallStats={overallStats}
            colors={colors}
          />
        </>
      )}

      {/* Weekly View: 7-Day Calendar Strip */}
      {viewMode === 'weekly' && (
        <WeeklyCalendarStrip
          currentDate={currentDate}
          colors={colors}
          stats={overallStats}
          onDateClick={handleDateClick}
        />
      )}

      {/* Today's Daily Goal Progress */}
      {viewMode === 'monthly' && (
        <DailyGoalCard
          todayMinutes={todayMinutes}
          dailyGoal={dailyGoal}
          colors={colors}
        />
      )}

      {/* Overall Dashboard */}
      {viewMode === 'monthly' && (
        <OverallDashboard
          stats={monthlyStats}
          currentDate={currentDate}
          colors={colors}
          onDateClick={handleDateClick}
          dailyGoal={dailyGoal}
        />
      )}

      {/* Tag & Animal Breakdown for weekly/monthly/yearly */}
      {viewMode === 'weekly' && (
        <TagAnimalBreakdown
          sessions={sessions}
          colors={colors}
          label="This Week's Breakdown"
          filterStart={startOfWeek(new Date(), { weekStartsOn: 0 })}
          filterEnd={endOfWeek(new Date(), { weekStartsOn: 0 })}
          animationDelay={0.1}
        />
      )}
      {viewMode === 'monthly' && (
        <TagAnimalBreakdown
          sessions={sessions}
          colors={colors}
          label={`${format(currentDate, 'MMMM')} Breakdown`}
          filterStart={startOfMonth(currentDate)}
          filterEnd={endOfMonth(currentDate)}
          animationDelay={0.1}
        />
      )}
      {viewMode === 'yearly' && (
        <TagAnimalBreakdown
          sessions={sessions}
          colors={colors}
          label={`${format(currentDate, 'yyyy')} Breakdown`}
          filterStart={startOfYear(currentDate)}
          filterEnd={endOfYear(currentDate)}
          animationDelay={0.1}
        />
      )}
    </div>
  );
};

// Weekly Calendar Strip Component
const WeeklyCalendarStrip: React.FC<{
  currentDate: Date;
  colors: ReturnType<typeof getThemeColors>;
  stats: any;
  onDateClick: (date: Date) => void;
}> = ({ colors, stats, onDateClick }) => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SOFT_SPRING}
      style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
        padding: '20px',
        marginBottom: '24px'
      }}
    >
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        marginBottom: '16px',
        color: colors.text.primary
      }}>
        This Week
      </h2>

      {/* Week day labels and squares */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        maxWidth: '420px',
        margin: '0 auto'
      }}>
        {weekDays.map((day, index) => {
          const dayData = stats.monthlyData.find((d: DayData) => isSameDay(d.date, day));
          const hasSession = dayData?.hasSession || false;
          const isTodayDate = isToday(day);

          // Get category colors for this day
          const categoryColors = dayData && dayData.sessions.length > 0
            ? Array.from(new Set(dayData.sessions.map((s: any) => s.themeColor)))
            : [];

          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => hasSession && onDateClick(day)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: hasSession ? 'pointer' : 'default'
              }}
            >
              {/* Day label */}
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: isTodayDate ? colors.headerTextColor : colors.text.tertiary,
                textTransform: 'uppercase'
              }}>
                {format(day, 'EEE')[0]}
              </div>

              {/* Day square with pie chart */}
              <div style={{
                width: '100%',
                aspectRatio: '1',
                maxWidth: '56px',
                borderRadius: '12px',
                background: (categoryColors.length === 0 ? colors.heatmap.empty : 'transparent') as string,
                border: isTodayDate
                  ? `3px solid ${colors.headerTextColor}`
                  : `2px solid ${hasSession ? 'transparent' : colors.heatmap.emptyBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: isTodayDate ? 700 : 500,
                color: (hasSession ? '#FFFFFF' : colors.text.tertiary) as string,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Pie chart background for multiple categories */}
                {categoryColors.length === 1 ? (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: categoryColors[0] as string
                  }} />
                ) : categoryColors.length === 2 ? (
                  <>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '50%',
                      height: '100%',
                      background: categoryColors[0] as string
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '50%',
                      height: '100%',
                      background: categoryColors[1] as string
                    }} />
                  </>
                ) : categoryColors.length === 3 ? (
                  <>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '50%',
                      height: '50%',
                      background: categoryColors[0] as string
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '50%',
                      height: '50%',
                      background: categoryColors[1] as string
                    }} />
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '50%',
                      background: categoryColors[2] as string
                    }} />
                  </>
                ) : categoryColors.length >= 4 ? (
                  <>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '50%',
                      height: '50%',
                      background: categoryColors[0] as string
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '50%',
                      height: '50%',
                      background: categoryColors[1] as string
                    }} />
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '50%',
                      height: '50%',
                      background: categoryColors[2] as string
                    }} />
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '50%',
                      height: '50%',
                      background: categoryColors[3] as string
                    }} />
                  </>
                ) : null}

                {/* Day number */}
                <span style={{
                  position: 'relative',
                  zIndex: 1,
                  textShadow: hasSession ? '0 1px 2px rgba(0, 0, 0, 0.5)' : 'none'
                }}>
                  {format(day, 'd')}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

// View Mode Toggle Component
const ViewModeToggle: React.FC<{
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  colors: ReturnType<typeof getThemeColors>;
}> = ({ viewMode, setViewMode, colors }) => {
  const modes: ViewMode[] = ['daily', 'weekly', 'monthly', 'yearly'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SOFT_SPRING}
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        padding: '6px',
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
      }}
    >
      {modes.map(mode => (
        <motion.button
          key={mode}
          onClick={() => setViewMode(mode)}
          whileTap={{ scale: 0.95 }}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            background: viewMode === mode ? colors.gradient : 'transparent',
            color: viewMode === mode ? colors.text.primary : colors.text.tertiary,
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textTransform: 'capitalize',
            fontFamily: "'Quicksand', sans-serif"
          }}
        >
          {mode}
        </motion.button>
      ))}
    </motion.div>
  );
};

// Helper: format minutes as readable time string
const formatTime = (minutes: number): string => {
  if (minutes === 0) return '0 mins';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins} min${mins !== 1 ? 's' : ''}`;
  if (mins === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
};

// Helper: format minutes as compact time (e.g., "3 H 30 M")
const formatTimeCompact = (minutes: number): string => {
  if (minutes === 0) return '0 M';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins} M`;
  if (mins === 0) return `${hours} H`;
  return `${hours} H ${mins} M`;
};

// ==========================================
// DAILY VIEW CARD 1: Focused Time Distribution
// ==========================================
const FocusedTimeDistribution: React.FC<{
  sessions: EnhancedFocusSession[];
  colors: ReturnType<typeof getThemeColors>;
}> = ({ sessions, colors }) => {
  const today = new Date();

  const todaySessions = sessions.filter(s => isSameDay(parseISO(s.date), today));
  const totalMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);

  // Group by hour
  const sessionsByHour = Array.from({ length: 24 }, (_, i) => {
    const hourSessions = todaySessions.filter(s => {
      const hour = new Date(s.date).getHours();
      return hour === i;
    });
    return {
      hour: i,
      minutes: hourSessions.reduce((sum, s) => sum + s.duration, 0)
    };
  });

  const maxMinutes = Math.max(...sessionsByHour.map(h => h.minutes), 1);
  const xLabels = ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'];
  const chartWidth = 320;
  const chartHeight = 140;
  const barWidth = chartWidth / 24 - 2;
  const accentColor = colors.isDark ? '#3B82F6' : '#8B5CF6';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SOFT_SPRING}
      style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
        padding: '20px',
        marginBottom: '16px'
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '0.8rem', color: colors.text.tertiary, marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Total focused time
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text.primary }}>
          {formatTime(totalMinutes)}
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} style={{ width: '100%', height: 'auto' }}>
          {/* Bars */}
          {sessionsByHour.map((h, i) => {
            const barHeight = maxMinutes > 0 ? (h.minutes / maxMinutes) * chartHeight : 0;
            const x = i * (chartWidth / 24) + 1;
            return (
              <rect
                key={i}
                x={x}
                y={chartHeight - barHeight}
                width={barWidth}
                height={Math.max(barHeight, 0)}
                rx={2}
                fill={h.minutes > 0 ? accentColor : (colors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')}
                opacity={h.minutes > 0 ? 0.85 : 1}
              />
            );
          })}
          {/* X-axis labels */}
          {xLabels.map((label, i) => (
            <text
              key={label}
              x={i * (chartWidth / 8) + chartWidth / 16}
              y={chartHeight + 18}
              textAnchor="middle"
              fill={colors.text.tertiary}
              fontSize="8"
              fontFamily="'Quicksand', sans-serif"
              fontWeight={500}
            >
              {label}
            </text>
          ))}
        </svg>
      </div>
    </motion.div>
  );
};

// ==========================================
// Date-specific Focused Time Distribution (for drill-down)
// ==========================================
const FocusedTimeDistributionForDate: React.FC<{
  sessions: EnhancedFocusSession[];
  date: Date;
  colors: ReturnType<typeof getThemeColors>;
}> = ({ sessions, date, colors }) => {
  const daySessions = sessions.filter(s => isSameDay(parseISO(s.date), date));
  const totalMinutes = daySessions.reduce((sum, s) => sum + s.duration, 0);

  const sessionsByHour = Array.from({ length: 24 }, (_, i) => {
    const hourSessions = daySessions.filter(s => {
      const hour = new Date(s.date).getHours();
      return hour === i;
    });
    return { hour: i, minutes: hourSessions.reduce((sum, s) => sum + s.duration, 0) };
  });

  const maxMinutes = Math.max(...sessionsByHour.map(h => h.minutes), 1);
  const xLabels = ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'];
  const chartWidth = 320;
  const chartHeight = 140;
  const barWidth = chartWidth / 24 - 2;
  const accentColor = colors.isDark ? '#3B82F6' : '#8B5CF6';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SOFT_SPRING}
      style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
        padding: '20px',
        marginBottom: '16px'
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '0.8rem', color: colors.text.tertiary, marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Focused time
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text.primary }}>
          {formatTime(totalMinutes)}
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} style={{ width: '100%', height: 'auto' }}>
          {sessionsByHour.map((h, i) => {
            const barHeight = maxMinutes > 0 ? (h.minutes / maxMinutes) * chartHeight : 0;
            const x = i * (chartWidth / 24) + 1;
            return (
              <rect
                key={i}
                x={x}
                y={chartHeight - barHeight}
                width={barWidth}
                height={Math.max(barHeight, 0)}
                rx={2}
                fill={h.minutes > 0 ? accentColor : (colors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')}
                opacity={h.minutes > 0 ? 0.85 : 1}
              />
            );
          })}
          {xLabels.map((label, i) => (
            <text
              key={label}
              x={i * (chartWidth / 8) + chartWidth / 16}
              y={chartHeight + 18}
              textAnchor="middle"
              fill={colors.text.tertiary}
              fontSize="8"
              fontFamily="'Quicksand', sans-serif"
              fontWeight={500}
            >
              {label}
            </text>
          ))}
        </svg>
      </div>
    </motion.div>
  );
};

// ==========================================
// DAILY VIEW CARD 2: Focus Trend Card
// ==========================================
const FocusTrendCard: React.FC<{
  sessions: EnhancedFocusSession[];
  colors: ReturnType<typeof getThemeColors>;
}> = ({ sessions, colors }) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = subDays(today, 1);
  const dayBefore = subDays(today, 2);

  // For fair comparison: only count minutes up to current time-of-day
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const getMinutesUpToNow = (date: Date): number => {
    return sessions
      .filter(s => isSameDay(parseISO(s.date), date))
      .filter(s => {
        // For today, count all sessions. For past days, only count up to current time
        if (isSameDay(date, today)) return true;
        const sessionDate = new Date(s.date);
        return sessionDate.getHours() < currentHour ||
          (sessionDate.getHours() === currentHour && sessionDate.getMinutes() <= currentMinute);
      })
      .reduce((sum, s) => sum + s.duration, 0);
  };

  const todayMins = getMinutesUpToNow(today);
  const yesterdayMins = getMinutesUpToNow(yesterday);
  const dayBeforeMins = getMinutesUpToNow(dayBefore);

  const getTrend = (current: number, previous: number) => {
    const diff = current - previous;
    if (diff === 0) return { text: 'Same as before', color: colors.text.tertiary, positive: true };
    const absDiff = Math.abs(diff);
    if (diff > 0) return { text: `${formatTime(absDiff)} longer`, color: '#10B981', positive: true };
    return { text: `${formatTime(absDiff)} shorter`, color: '#EF4444', positive: false };
  };

  const trend1 = getTrend(todayMins, yesterdayMins);
  const trend2 = getTrend(yesterdayMins, dayBeforeMins);

  const rows = [
    { label: 'Today', minutes: todayMins, trend: null as null | typeof trend1 },
    { label: 'Yesterday', minutes: yesterdayMins, trend: trend1 },
    { label: 'Day Before Yesterday', minutes: dayBeforeMins, trend: trend2 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SOFT_SPRING, delay: 0.1 }}
      style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
        padding: '20px',
        marginBottom: '16px'
      }}
    >
      <div style={{ fontSize: '0.8rem', color: colors.text.tertiary, marginBottom: '16px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Focus Trend
      </div>

      {rows.map((row, i) => (
        <React.Fragment key={row.label}>
          {/* Trend label between rows */}
          {row.trend && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 0',
              marginLeft: '8px'
            }}>
              <TrendingUp size={12} color={row.trend.color} style={{ transform: row.trend.positive ? 'none' : 'rotate(180deg)' }} />
              <span style={{ fontSize: '0.75rem', color: row.trend.color, fontWeight: 600 }}>
                {row.trend.text}
              </span>
            </div>
          )}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: i < rows.length - 1 ? `1px solid ${colors.border}` : 'none'
          }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: i === 0 ? colors.text.primary : colors.text.secondary }}>
              {row.label}
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.text.primary }}>
              {formatTime(row.minutes)}
            </span>
          </div>
        </React.Fragment>
      ))}

      <div style={{ fontSize: '0.7rem', color: colors.text.tertiary, marginTop: '8px', fontStyle: 'italic' }}>
        Past days compared up to {format(now, 'h:mm a')} for fair comparison
      </div>
    </motion.div>
  );
};

// ==========================================
// DAILY VIEW CARD 3: Tag & Animal Breakdown
// ==========================================
const TagAnimalBreakdown: React.FC<{
  sessions: EnhancedFocusSession[];
  colors: ReturnType<typeof getThemeColors>;
  label?: string;
  filterStart?: Date;
  filterEnd?: Date;
  animationDelay?: number;
}> = ({ sessions, colors, label = 'Tag Breakdown', filterStart, filterEnd, animationDelay = 0.2 }) => {
  const today = new Date();

  // If explicit date range provided, filter to that range; otherwise default to today
  const filteredSessions = (filterStart && filterEnd)
    ? sessions.filter(s => {
        const d = parseISO(s.date);
        return d >= filterStart && d <= filterEnd;
      })
    : sessions.filter(s => isSameDay(parseISO(s.date), today));
  const totalMinutes = filteredSessions.reduce((sum, s) => sum + s.duration, 0);

  // Group by category
  const categoryMap: Record<string, { emoji: string; title: string; themeColor: string; minutes: number }> = {};
  filteredSessions.forEach(s => {
    if (!categoryMap[s.categoryId]) {
      categoryMap[s.categoryId] = { emoji: s.emoji, title: s.category, themeColor: s.themeColor, minutes: 0 };
    }
    categoryMap[s.categoryId].minutes += s.duration;
  });
  const categories = Object.values(categoryMap).sort((a, b) => b.minutes - a.minutes);

  // Donut chart SVG params
  const donutSize = 140;
  const radius = 50;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  // Build donut segments
  let cumulativePercent = 0;
  const segments = categories.map(cat => {
    const percent = totalMinutes > 0 ? (cat.minutes / totalMinutes) * 100 : 0;
    const offset = circumference - (circumference * cumulativePercent) / 100;
    const length = (circumference * percent) / 100;
    cumulativePercent += percent;
    return { ...cat, percent, offset, length };
  });

  // Top 3 Animal Companions (filtered to date range if provided)
  const userData = getUserData();
  const allCollection = userData.permanentCollection || [];
  const collection = (filterStart && filterEnd)
    ? allCollection.filter(animal => {
        if (!animal.collectedAt) return false;
        const collected = parseISO(animal.collectedAt);
        return collected >= filterStart && collected <= filterEnd;
      })
    : allCollection;

  // Count animal frequency from collection - group by species (name+biome), not instance id
  const animalCounts: Record<string, { count: number; name: string; biome: BiomeType; lottieUrl: string }> = {};
  collection.forEach(animal => {
    const speciesKey = `${animal.name}__${animal.biome}`;
    if (!animalCounts[speciesKey]) {
      animalCounts[speciesKey] = { count: 0, name: animal.name, biome: animal.biome, lottieUrl: animal.lottieUrl };
    }
    animalCounts[speciesKey].count++;
  });

  const topAnimals = Object.entries(animalCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 3);

  // Stable key for lottie loading dependency
  const topAnimalsKey = topAnimals.map(([id]) => id).join(',');

  // Lottie animation data loading for top 3
  const [topLottieData, setTopLottieData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (topAnimals.length === 0) return;
    const toLoad = topAnimals.filter(([id]) => !topLottieData[id]);
    if (toLoad.length === 0) return;
    Promise.all(
      toLoad.map(([id, info]) =>
        fetch(info.lottieUrl)
          .then(r => r.json())
          .then(data => ({ id, data }))
          .catch(() => null)
      )
    ).then(results => {
      const newData: Record<string, any> = {};
      results.forEach(r => { if (r) newData[r.id] = r.data; });
      if (Object.keys(newData).length > 0) {
        setTopLottieData(prev => ({ ...prev, ...newData }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topAnimalsKey]);

  const accentColor = colors.isDark ? '#3B82F6' : '#8B5CF6';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SOFT_SPRING, delay: animationDelay }}
      style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
        padding: '20px',
        marginBottom: '16px'
      }}
    >
      <div style={{ fontSize: '0.8rem', color: colors.text.tertiary, marginBottom: '16px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>

      {categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: colors.text.tertiary, fontSize: '0.9rem' }}>
          No sessions today yet. Start a focus session to see your breakdown!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Donut Chart */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={donutSize} height={donutSize} viewBox={`0 0 ${donutSize} ${donutSize}`}>
              {/* Background circle */}
              <circle
                cx={donutSize / 2}
                cy={donutSize / 2}
                r={radius}
                fill="none"
                stroke={colors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                strokeWidth={strokeWidth}
              />
              {/* Segments */}
              {segments.map((seg, i) => (
                <circle
                  key={i}
                  cx={donutSize / 2}
                  cy={donutSize / 2}
                  r={radius}
                  fill="none"
                  stroke={seg.themeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${seg.length} ${circumference - seg.length}`}
                  strokeDashoffset={seg.offset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${donutSize / 2} ${donutSize / 2})`}
                  style={{ transition: 'all 0.5s ease' }}
                />
              ))}
              {/* Center text */}
              <text
                x={donutSize / 2}
                y={donutSize / 2 - 6}
                textAnchor="middle"
                fill={colors.text.primary}
                fontSize="16"
                fontWeight="700"
                fontFamily="'Quicksand', sans-serif"
              >
                {formatTimeCompact(totalMinutes)}
              </text>
              <text
                x={donutSize / 2}
                y={donutSize / 2 + 10}
                textAnchor="middle"
                fill={colors.text.tertiary}
                fontSize="9"
                fontFamily="'Quicksand', sans-serif"
              >
                Total
              </text>
            </svg>
          </div>

          {/* Category List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {segments.map((seg, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: i < segments.length - 1 ? `1px solid ${colors.border}` : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: seg.themeColor,
                    flexShrink: 0
                  }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.text.primary }}>
                    {seg.emoji} {seg.title}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.text.tertiary }}>
                    {Math.round(seg.percent)}%
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: colors.text.secondary, minWidth: '60px', textAlign: 'right' }}>
                    {formatTimeCompact(seg.minutes)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Animal Companions */}
      {topAnimals.length > 0 && (
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: `1px solid ${colors.border}`
        }}>
          <div style={{ fontSize: '0.8rem', color: colors.text.tertiary, marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Top Animal Companions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topAnimals.map(([animalId, info], index) => {
              const biomeConfig = BIOME_CONFIG[info.biome];
              const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
              const medalLabels = ['1st', '2nd', '3rd'];
              return (
                <div key={animalId} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px',
                  borderRadius: '14px',
                  background: index === 0
                    ? (colors.isDark ? 'rgba(255,215,0,0.08)' : 'rgba(255,215,0,0.1)')
                    : 'transparent'
                }}>
                  {/* Rank badge */}
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: `${medalColors[index]}30`,
                    border: `2px solid ${medalColors[index]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    color: medalColors[index],
                    flexShrink: 0
                  }}>
                    {medalLabels[index]}
                  </div>
                  {/* Animal avatar */}
                  <div style={{
                    width: index === 0 ? '52px' : '42px',
                    height: index === 0 ? '52px' : '42px',
                    borderRadius: '14px',
                    background: biomeConfig
                      ? `linear-gradient(135deg, ${biomeConfig.primaryColor}33, ${biomeConfig.secondaryColor}33)`
                      : (colors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {topLottieData[animalId] ? (
                      <Lottie
                        animationData={topLottieData[animalId]}
                        loop={true}
                        autoplay={true}
                        style={{
                          width: index === 0 ? '44px' : '36px',
                          height: index === 0 ? '44px' : '36px'
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: index === 0 ? '1.5rem' : '1.2rem' }}>
                        {biomeConfig?.emoji || '🐾'}
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: index === 0 ? '0.95rem' : '0.85rem',
                      fontWeight: 700,
                      color: colors.text.primary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {info.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: colors.text.tertiary }}>
                      {biomeConfig?.emoji} {biomeConfig?.name}
                    </div>
                  </div>
                  {/* Count */}
                  <div style={{
                    textAlign: 'center',
                    padding: '6px 10px',
                    borderRadius: '10px',
                    background: colors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    flexShrink: 0
                  }}>
                    <div style={{
                      fontSize: index === 0 ? '1.1rem' : '0.95rem',
                      fontWeight: 700,
                      color: accentColor
                    }}>
                      {info.count}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: colors.text.tertiary, fontWeight: 600 }}>
                      Earned
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Time Navigator Component
const TimeNavigator: React.FC<{
  viewMode: ViewMode;
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  colors: ReturnType<typeof getThemeColors>;
}> = ({ viewMode, currentDate, onPrevious, onNext, onToday, colors }) => {
  const displayText = viewMode === 'monthly'
    ? format(currentDate, 'MMMM yyyy')
    : format(currentDate, 'yyyy');

  const isCurrentPeriod = viewMode === 'monthly'
    ? isSameDay(startOfMonth(currentDate), startOfMonth(new Date()))
    : currentDate.getFullYear() === new Date().getFullYear();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SOFT_SPRING}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        padding: '12px 16px',
        background: colors.cardBg,
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
      }}
    >
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onPrevious}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.text.secondary
        }}
      >
        <ChevronLeft size={20} />
      </motion.button>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: colors.text.primary
        }}>
          {displayText}
        </span>
        {!isCurrentPeriod && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToday}
            style={{
              background: colors.gradient,
              border: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: colors.text.primary,
              fontFamily: "'Quicksand', sans-serif"
            }}
          >
            Today
          </motion.button>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.text.secondary
        }}
      >
        <ChevronRight size={20} />
      </motion.button>
    </motion.div>
  );
};

// Daily Goal Progress Card
const DailyGoalCard: React.FC<{
  todayMinutes: number;
  dailyGoal: number;
  colors: ReturnType<typeof getThemeColors>;
}> = ({ todayMinutes, dailyGoal, colors }) => {
  const progress = Math.min(todayMinutes / dailyGoal, 1);
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference * (1 - progress);
  const remaining = Math.max(dailyGoal - todayMinutes, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SOFT_SPRING}
      style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: `1px solid ${colors.border}`,
        padding: '24px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px'
      }}
    >
      {/* Progress Ring */}
      <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
        <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={progress >= 1 ? '#10B981' : (colors.isDark ? '#3B82F6' : '#8B5CF6')}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            lineHeight: 1,
            color: progress >= 1 ? '#10B981' : colors.text.primary
          }}>
            {todayMinutes}
          </div>
          <div style={{
            fontSize: '0.625rem',
            color: colors.text.tertiary,
            marginTop: '2px'
          }}>
            / {dailyGoal} min
          </div>
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: colors.text.primary,
          marginBottom: '4px'
        }}>
          Daily Goal
        </div>
        <div style={{
          fontSize: '0.8rem',
          color: colors.text.secondary,
          lineHeight: 1.4
        }}>
          {progress >= 1
            ? 'Goal reached! Great work today.'
            : `${remaining} min remaining today`}
        </div>
      </div>
    </motion.div>
  );
};

// Overall Dashboard Component
const OverallDashboard: React.FC<{
  stats: any;
  currentDate: Date;
  colors: ReturnType<typeof getThemeColors>;
  onDateClick: (date: Date) => void;
  dailyGoal: number;
}> = ({ stats, currentDate, colors, onDateClick, dailyGoal }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SOFT_SPRING}
      style={{ marginBottom: '32px' }}
    >
      {/* Central Progress Ring */}
      <div style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: `1px solid ${colors.border}`,
        padding: '32px 24px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* Progress Circle */}
          <div style={{ position: 'relative', width: '160px', height: '160px' }}>
            <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke={colors.heatmap.empty}
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="url(#successGradient)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={2 * Math.PI * 70}
                strokeDashoffset={2 * Math.PI * 70 * (1 - Math.min(stats.successRate / 100, 1))}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={colors.isDark ? '#A78BFA' : '#8B5CF6'} />
                  <stop offset="100%" stopColor={colors.isDark ? '#F472B6' : '#EC4899'} />
                </linearGradient>
              </defs>
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>
                {Math.round(stats.successRate)}%
              </div>
              <div style={{ fontSize: '0.75rem', color: colors.text.tertiary, marginTop: '4px' }}>
                Success Rate
              </div>
            </div>
          </div>

          {/* Core Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            width: '100%'
          }}>
            <StatCard
              icon={<Flame size={20} />}
              label="Current Streak"
              value={`${stats.currentStreak}d`}
              color="#F59E0B"
              colors={colors}
            />
            <StatCard
              icon={<Award size={20} />}
              label="Best Streak"
              value={`${stats.bestStreak}d`}
              color="#8B5CF6"
              colors={colors}
            />
            <StatCard
              icon={<Target size={20} />}
              label="Perfect Days"
              value={stats.perfectDays.toString()}
              color="#10B981"
              colors={colors}
            />
            <StatCard
              icon={<TrendingUp size={20} />}
              label="Total Sessions"
              value={stats.totalSessions.toString()}
              color="#3B82F6"
              colors={colors}
            />
          </div>
        </div>
      </div>

      {/* Monthly Calendar Heatmap */}
      <MonthlyCalendarHeatmap
        monthlyData={stats.monthlyData}
        currentDate={currentDate}
        colors={colors}
        onDateClick={onDateClick}
        dailyGoal={dailyGoal}
      />
    </motion.div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  colors: ReturnType<typeof getThemeColors>;
}> = ({ icon, label, value, color, colors }) => {
  return (
    <div style={{
      background: colors.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      borderRadius: '16px',
      padding: '16px',
      border: `1px solid ${colors.border}`
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        color
      }}>
        {icon}
        <span style={{ fontSize: '0.75rem', color: colors.text.tertiary }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
        {value}
      </div>
    </div>
  );
};

// Monthly Calendar Heatmap
const MonthlyCalendarHeatmap: React.FC<{
  monthlyData: DayData[];
  currentDate: Date;
  colors: ReturnType<typeof getThemeColors>;
  onDateClick: (date: Date) => void;
  dailyGoal: number;
}> = ({ monthlyData, currentDate, colors, onDateClick, dailyGoal }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);

  const calendarDays = [
    ...Array(firstDayOfWeek).fill(null),
    ...daysInMonth
  ];

  return (
    <div style={{
      background: colors.cardBg,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '24px',
      border: `1px solid ${colors.border}`,
      padding: '24px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <Calendar size={20} style={{ color: colors.isDark ? '#A78BFA' : '#8B5CF6' }} />
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
          {format(currentDate, 'MMMM yyyy')}
        </h3>
      </div>

      {/* Week day labels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        marginBottom: '8px'
      }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: colors.text.tertiary,
            fontWeight: 600
          }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px'
      }}>
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} />;
          }

          const dayData = monthlyData.find(d => isSameDay(d.date, day));
          const minutes = dayData?.totalMinutes || 0;
          const hasSession = dayData?.hasSession || false;
          const progress = Math.min(minutes / dailyGoal, 1);
          const r = 16;
          const circumference = 2 * Math.PI * r;
          const strokeDashoffset = circumference * (1 - progress);

          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => hasSession && onDateClick(day)}
              style={{
                aspectRatio: '1',
                borderRadius: '12px',
                background: colors.heatmap.empty,
                border: `1px solid ${colors.heatmap.emptyBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: hasSession ? 'pointer' : 'default',
                position: 'relative'
              }}
            >
              {/* Progress ring */}
              {minutes > 0 && (
                <svg
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-90deg)',
                    width: '36px',
                    height: '36px'
                  }}
                  viewBox="0 0 36 36"
                >
                  {/* Background track */}
                  <circle
                    cx="18"
                    cy="18"
                    r={r}
                    fill="none"
                    stroke={colors.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
                    strokeWidth="3"
                  />
                  {/* Progress arc */}
                  <circle
                    cx="18"
                    cy="18"
                    r={r}
                    fill="none"
                    stroke={progress >= 1
                      ? '#10B981'
                      : (colors.isDark ? '#3B82F6' : '#8B5CF6')}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
              )}

              {/* Day number */}
              <span style={{
                position: 'relative',
                zIndex: 1,
                fontSize: '0.8rem',
                fontWeight: progress >= 1 ? 700 : 500,
                color: progress >= 1
                  ? '#10B981'
                  : (minutes > 0
                    ? (colors.isDark ? '#3B82F6' : '#8B5CF6')
                    : colors.text.tertiary)
              }}>
                {format(day, 'd')}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Yearly GitHub-Style Heatmap
const YearlyHeatmap: React.FC<{
  yearlyData: DayData[];
  currentDate: Date;
  colors: ReturnType<typeof getThemeColors>;
  onDateClick: (date: Date) => void;
  dailyGoal: number;
}> = ({ yearlyData, currentDate, colors, onDateClick, dailyGoal }) => {
  const yearStart = startOfYear(currentDate);

  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];

  const firstDayOfWeek = getDay(yearStart);
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({} as DayData);
  }

  yearlyData.forEach((day) => {
    currentWeek.push(day);

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({} as DayData);
    }
    weeks.push(currentWeek);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SOFT_SPRING, delay: 0.2 }}
      style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: `1px solid ${colors.border}`,
        padding: '24px',
        marginBottom: '32px'
      }}
    >
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        marginBottom: '16px',
        color: colors.text.primary
      }}>
        {format(currentDate, 'yyyy')} Activity
      </h2>

      <div style={{ display: 'flex', gap: '2px', width: '100%' }}>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
            {week.map((day, dayIndex) => {
              if (!day.date) {
                return <div key={dayIndex} style={{ width: '100%', aspectRatio: '1' }} />;
              }

              const intensity = getIntensity(day.totalMinutes, dailyGoal);

              return (
                <motion.div
                  key={dayIndex}
                  whileHover={{ scale: 1.5, zIndex: 10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => day.hasSession && onDateClick(day.date)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '2px',
                    background: intensity > 0 ? colors.heatmap.levels[intensity - 1] : colors.heatmap.empty,
                    border: `0.5px solid ${intensity > 0 ? 'transparent' : colors.heatmap.emptyBorder}`,
                    cursor: day.hasSession ? 'pointer' : 'default'
                  }}
                  title={`${format(day.date, 'MMM d')}: ${day.totalMinutes}min`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '12px',
        fontSize: '0.7rem',
        color: colors.text.tertiary
      }}>
        <span>Less</span>
        {[0, 1, 2, 3, 4, 5].map(level => (
          <div
            key={level}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '2px',
              background: level === 0 ? colors.heatmap.empty : colors.heatmap.levels[level - 1],
              border: `0.5px solid ${level === 0 ? colors.heatmap.emptyBorder : 'transparent'}`
            }}
          />
        ))}
        <span>More</span>
      </div>
    </motion.div>
  );
};

// Yearly Summary Stats
const YearlySummaryStats: React.FC<{
  overallStats: any;
  colors: ReturnType<typeof getThemeColors>;
}> = ({ overallStats, colors }) => {
  const totalDaysWithSessions = new Set(
    overallStats.yearlyData.filter((d: any) => d.hasSession).map((d: any) => d.date.toDateString())
  ).size;

  const totalDaysInYear = overallStats.yearlyData.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SOFT_SPRING, delay: 0.3 }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        marginBottom: '32px'
      }}
    >
      <div style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: colors.text.primary }}>
          {Math.floor(overallStats.totalMinutes / 60)}h
        </div>
        <div style={{ fontSize: '0.875rem', color: colors.text.tertiary, marginTop: '4px' }}>
          Total Study Time
        </div>
      </div>

      <div style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: colors.text.primary }}>
          {totalDaysWithSessions}/{totalDaysInYear}
        </div>
        <div style={{ fontSize: '0.875rem', color: colors.text.tertiary, marginTop: '4px' }}>
          Active Days
        </div>
      </div>
    </motion.div>
  );
};
