import React, { useState } from 'react';
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
  isToday
} from 'date-fns';
import { useAnalytics } from '../hooks/useAnalytics';
import type { ViewMode, DayData, CategoryStats as CategoryStatsType } from '../types/stats';
import { TrendingUp, Award, Flame, Target, Calendar, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { DailyReport } from './DailyReport';
import { CategoryDetail } from './CategoryDetail';

const SOFT_SPRING = { type: "spring" as const, stiffness: 100, damping: 20 };

type Theme = 'morning' | 'twilight' | 'golden' | 'midnight';

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
    twilight: {
      background: '#0A0A0A',
      cardBg: 'rgba(26, 26, 26, 0.95)',
      border: 'rgba(255, 255, 255, 0.1)',
      headerTextColor: '#FFFFFF',  // White for twilight theme
      text: {
        primary: 'rgba(255, 255, 255, 0.95)',
        secondary: 'rgba(255, 255, 255, 0.7)',
        tertiary: 'rgba(255, 255, 255, 0.5)'
      },
      heatmap: {
        empty: 'rgba(255, 255, 255, 0.05)',
        emptyBorder: 'rgba(255, 255, 255, 0.08)',
        levels: [
          'rgba(244, 114, 182, 0.2)',
          'rgba(244, 114, 182, 0.4)',
          'rgba(244, 114, 182, 0.6)',
          'rgba(244, 114, 182, 0.8)',
          'rgba(244, 114, 182, 1)'
        ],
        currentDayBorder: '#F472B6',
        selectedBorder: '#A855F7'
      },
      gradient: 'linear-gradient(135deg, rgba(244, 114, 182, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)',
      isDark: true
    },
    golden: {
      background: '#0A0A0A',
      cardBg: 'rgba(26, 26, 26, 0.95)',
      border: 'rgba(255, 255, 255, 0.1)',
      headerTextColor: '#FFFFFF',  // White for golden theme
      text: {
        primary: 'rgba(255, 255, 255, 0.95)',
        secondary: 'rgba(255, 255, 255, 0.7)',
        tertiary: 'rgba(255, 255, 255, 0.5)'
      },
      heatmap: {
        empty: 'rgba(255, 255, 255, 0.05)',
        emptyBorder: 'rgba(255, 255, 255, 0.08)',
        levels: [
          'rgba(251, 191, 36, 0.2)',
          'rgba(251, 191, 36, 0.4)',
          'rgba(251, 191, 36, 0.6)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(251, 191, 36, 1)'
        ],
        currentDayBorder: '#FBBF24',
        selectedBorder: '#F59E0B'
      },
      gradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(249, 115, 22, 0.3) 100%)',
      isDark: true
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

const getIntensity = (minutes: number): number => {
  if (minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  if (minutes < 180) return 4;
  return 5;
};

type NavigationView = 'main' | 'daily' | 'category';

export const StatsPage: React.FC<{ theme: Theme }> = ({ theme }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [navigationView, setNavigationView] = useState<NavigationView>('main');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryStatsType | null>(null);
  const [selectedViewMode, setSelectedViewMode] = useState<ViewMode>('monthly');
  const { overallStats, categoryStats } = useAnalytics(viewMode, 60);

  const colors = getThemeColors(theme);

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

  const handleCategoryClick = (category: CategoryStatsType) => {
    setSelectedCategory(category);
    setSelectedViewMode(viewMode); // Save the current viewMode
    setNavigationView('category');
  };

  const handleBackToMain = () => {
    setNavigationView('main');
    setSelectedDate(null);
    setSelectedCategory(null);
  };

  // Render drill-down views
  if (navigationView === 'daily' && selectedDate) {
    return <DailyReport date={selectedDate} theme={theme} onClose={handleBackToMain} />;
  }

  if (navigationView === 'category' && selectedCategory) {
    return (
      <CategoryDetail
        category={selectedCategory}
        theme={theme}
        viewMode={selectedViewMode}
        onClose={handleBackToMain}
      />
    );
  }

  // Main view
  return (
    <div style={{
      minHeight: '100dvh',
      background: colors.background,
      color: colors.text.primary,
      padding: '24px 16px 120px',
      fontFamily: "'Quicksand', sans-serif"
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SOFT_SPRING}
        style={{ marginBottom: '24px' }}
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

      {/* Yearly View: Comprehensive High-Density View */}
      {viewMode === 'yearly' && (
        <>
          {/* Overall Yearly Heatmap */}
          <YearlyHeatmap
            yearlyData={overallStats.yearlyData}
            currentDate={currentDate}
            colors={colors}
            onDateClick={handleDateClick}
          />

          {/* Per-Category Yearly Heatmaps */}
          {categoryStats.length > 0 && (
            <CategoryYearlyHeatmaps
              categoryStats={categoryStats}
              colors={colors}
              onDateClick={handleDateClick}
              onCategoryClick={handleCategoryClick}
            />
          )}

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

      {/* Overall Dashboard */}
      {viewMode === 'monthly' && (
        <OverallDashboard
          stats={overallStats}
          currentDate={currentDate}
          colors={colors}
          onDateClick={handleDateClick}
        />
      )}

      {/* Category Habit Cards (Colorful, Clean Design) */}
      {(viewMode === 'weekly' || viewMode === 'monthly') && categoryStats.length > 0 && (
        <CategoryHabitCards
          categoryStats={categoryStats}
          colors={colors}
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
        gap: '12px'
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
                width: 'clamp(40px, 12vw, 56px)',
                height: 'clamp(40px, 12vw, 56px)',
                borderRadius: '12px',
                background: (categoryColors.length === 0 ? colors.heatmap.empty : 'transparent') as string,
                border: isTodayDate
                  ? `3px solid ${colors.headerTextColor}`
                  : `2px solid ${hasSession ? 'transparent' : colors.heatmap.emptyBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
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
  const modes: ViewMode[] = ['weekly', 'monthly', 'yearly'];

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

// Overall Dashboard Component
const OverallDashboard: React.FC<{
  stats: any;
  currentDate: Date;
  colors: ReturnType<typeof getThemeColors>;
  onDateClick: (date: Date) => void;
}> = ({ stats, currentDate, colors, onDateClick }) => {
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
}> = ({ monthlyData, currentDate, colors, onDateClick }) => {
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
          const intensity = getIntensity(dayData?.totalMinutes || 0);
          const hasSession = dayData?.hasSession || false;
          const isTodayDate = isToday(day);

          // Get category colors for this day
          const categoryColors = dayData && dayData.sessions.length > 0
            ? Array.from(new Set(dayData.sessions.map(s => s.themeColor)))
            : [];

          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => hasSession && onDateClick(day)}
              style={{
                aspectRatio: '1',
                borderRadius: '12px',
                background: (categoryColors.length === 0 ? colors.heatmap.empty : 'transparent') as string,
                border: isTodayDate
                  ? `2px solid ${colors.heatmap.currentDayBorder}`
                  : `1px solid ${intensity > 0 ? 'transparent' : colors.heatmap.emptyBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: isTodayDate ? 700 : 500,
                color: intensity > 0 ? '#FFFFFF' : colors.text.tertiary,
                position: 'relative',
                cursor: hasSession ? 'pointer' : 'default',
                overflow: 'hidden'
              }}
            >
              {/* Quadrant-based color fill for categories */}
              {categoryColors.length === 1 ? (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: categoryColors[0]
                }} />
              ) : categoryColors.length === 2 ? (
                <>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '50%',
                    height: '100%',
                    background: categoryColors[0]
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '50%',
                    height: '100%',
                    background: categoryColors[1]
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
                    background: categoryColors[0]
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '50%',
                    height: '50%',
                    background: categoryColors[1]
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    background: categoryColors[2]
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
                    background: categoryColors[0]
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '50%',
                    height: '50%',
                    background: categoryColors[1]
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '50%',
                    height: '50%',
                    background: categoryColors[2]
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '50%',
                    height: '50%',
                    background: categoryColors[3]
                  }} />
                </>
              ) : null}

              {/* Day number */}
              <span style={{
                position: 'relative',
                zIndex: 1,
                textShadow: intensity > 0 ? '0 1px 2px rgba(0, 0, 0, 0.5)' : 'none'
              }}>
                {format(day, 'd')}
              </span>

              {/* Perfect day indicator */}
              {dayData?.isPerfectDay && (
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10B981',
                  zIndex: 2
                }} />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Category Habit Cards
const CategoryHabitCards: React.FC<{
  categoryStats: CategoryStatsType[];
  colors: ReturnType<typeof getThemeColors>;
}> = ({ categoryStats, colors }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SOFT_SPRING, delay: 0.1 }}
      style={{ marginBottom: '32px' }}
    >
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        marginBottom: '16px',
        color: colors.text.primary
      }}>
        Category Progress
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {categoryStats.map((cat, index) => (
          <CategoryCard
            key={cat.categoryId}
            category={cat}
            delay={index * 0.05}
            colors={colors}
          />
        ))}
      </div>
    </motion.div>
  );
};

// Category Card Component
const CategoryCard: React.FC<{
  category: CategoryStatsType;
  delay: number;
  colors: ReturnType<typeof getThemeColors>;
}> = ({ category, delay, colors }) => {
  const hours = Math.floor(category.totalMinutes / 60);
  const minutes = category.totalMinutes % 60;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...SOFT_SPRING, delay }}
      style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `2px solid ${category.themeColor}40`,
        padding: '20px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          fontSize: '2rem',
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: `${category.themeColor}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${category.themeColor}40`
        }}>
          {category.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: colors.text.primary }}>
            {category.title}
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: colors.text.tertiary }}>
            {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`} · {category.sessionCount} sessions
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '0.75rem',
          color: colors.text.tertiary
        }}>
          <span>Weekly Goal (3h)</span>
          <span style={{ fontWeight: 600, color: category.themeColor }}>
            {Math.round(category.weeklyProgress)}%
          </span>
        </div>
        <div style={{
          height: '8px',
          borderRadius: '999px',
          background: colors.heatmap.empty,
          overflow: 'hidden',
          border: `1px solid ${category.themeColor}20`
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(category.weeklyProgress, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${category.themeColor}, ${category.themeColor}CC)`,
              borderRadius: '999px'
            }}
          />
        </div>
      </div>

      {/* Mini Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px'
      }}>
        <MiniStat
          icon={<Flame size={16} />}
          label="Streak"
          value={`${category.currentStreak}d`}
          color={category.themeColor}
          colors={colors}
        />
        <MiniStat
          icon={<Award size={16} />}
          label="Best"
          value={`${category.bestStreak}d`}
          color={category.themeColor}
          colors={colors}
        />
        <MiniStat
          icon={<Check size={16} />}
          label="Days"
          value={category.perfectDays.toString()}
          color={category.themeColor}
          colors={colors}
        />
      </div>
    </motion.div>
  );
};

// Mini Stat Component
const MiniStat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  colors: ReturnType<typeof getThemeColors>;
}> = ({ icon, label, value, color, colors }) => {
  return (
    <div style={{
      background: colors.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      borderRadius: '12px',
      padding: '10px',
      textAlign: 'center'
    }}>
      <div style={{ color, marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '2px', color: colors.text.primary }}>
        {value}
      </div>
      <div style={{ fontSize: '0.625rem', color: colors.text.tertiary }}>
        {label}
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
}> = ({ yearlyData, currentDate, colors, onDateClick }) => {
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
        marginBottom: '32px',
        overflowX: 'auto'
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

      <div style={{ display: 'flex', gap: '4px', minWidth: 'fit-content' }}>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {week.map((day, dayIndex) => {
              if (!day.date) {
                return <div key={dayIndex} style={{ width: '14px', height: '14px' }} />;
              }

              const intensity = getIntensity(day.totalMinutes);
              const isTodayDate = isToday(day.date);

              // Get category colors for this day
              const categoryColors = day.sessions && day.sessions.length > 0
                ? Array.from(new Set(day.sessions.map(s => s.themeColor)))
                : [];

              return (
                <motion.div
                  key={dayIndex}
                  whileHover={{ scale: 1.5, zIndex: 10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => day.hasSession && onDateClick(day.date)}
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '3px',
                    background: (categoryColors.length === 0 ? colors.heatmap.empty : 'transparent') as string,
                    border: isTodayDate
                      ? `2px solid ${colors.heatmap.currentDayBorder}`
                      : `1px solid ${intensity > 0 ? 'transparent' : colors.heatmap.emptyBorder}`,
                    cursor: day.hasSession ? 'pointer' : 'default',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  title={`${format(day.date, 'MMM d')}: ${day.totalMinutes}min`}
                >
                  {/* Pie chart for multiple categories */}
                  {categoryColors.length === 1 ? (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: categoryColors[0]
                    }} />
                  ) : categoryColors.length === 2 ? (
                    <>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '50%',
                        height: '100%',
                        background: categoryColors[0]
                      }} />
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '50%',
                        height: '100%',
                        background: categoryColors[1]
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
                        background: categoryColors[0]
                      }} />
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '50%',
                        height: '50%',
                        background: categoryColors[1]
                      }} />
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '50%',
                        background: categoryColors[2]
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
                        background: categoryColors[0]
                      }} />
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '50%',
                        height: '50%',
                        background: categoryColors[1]
                      }} />
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '50%',
                        height: '50%',
                        background: categoryColors[2]
                      }} />
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '50%',
                        height: '50%',
                        background: categoryColors[3]
                      }} />
                    </>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '16px',
        fontSize: '0.75rem',
        color: colors.text.tertiary
      }}>
        <span>Less</span>
        {[0, 1, 2, 3, 4, 5].map(level => (
          <div
            key={level}
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '3px',
              background: level === 0 ? colors.heatmap.empty : colors.heatmap.levels[level - 1],
              border: `1px solid ${level === 0 ? colors.heatmap.emptyBorder : 'transparent'}`
            }}
          />
        ))}
        <span>More</span>
      </div>
    </motion.div>
  );
};

// Category Yearly Heatmaps - Per-Category Yearly View
const CategoryYearlyHeatmaps: React.FC<{
  categoryStats: CategoryStatsType[];
  colors: ReturnType<typeof getThemeColors>;
  onDateClick: (date: Date) => void;
  onCategoryClick: (category: CategoryStatsType) => void;
}> = ({ categoryStats, colors, onDateClick, onCategoryClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SOFT_SPRING, delay: 0.2 }}
      style={{ marginBottom: '32px' }}
    >
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        marginBottom: '16px',
        color: colors.text.primary
      }}>
        Category Activity
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {categoryStats.map((category, index) => (
          <CategoryYearlyCard
            key={category.categoryId}
            category={category}
            colors={colors}
            delay={index * 0.05}
            onDateClick={onDateClick}
            onCategoryClick={() => onCategoryClick(category)}
          />
        ))}
      </div>
    </motion.div>
  );
};

// Category Yearly Card
const CategoryYearlyCard: React.FC<{
  category: CategoryStatsType;
  colors: ReturnType<typeof getThemeColors>;
  delay: number;
  onDateClick: (date: Date) => void;
  onCategoryClick: () => void;
}> = ({ category, colors, delay, onDateClick, onCategoryClick }) => {
  const yearStart = startOfYear(new Date());
  const yearEnd = endOfYear(new Date());
  const yearlyDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

  // Build weeks for GitHub-style heatmap
  const weeks: any[][] = [];
  let currentWeek: any[] = [];
  const firstDayOfWeek = getDay(yearStart);

  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({});
  }

  yearlyDays.forEach((day) => {
    const dayData = category.monthlyData.find(d => isSameDay(d.date, day));
    currentWeek.push({
      date: day,
      hasSession: dayData?.hasSession || false,
      minutes: dayData?.totalMinutes || 0
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({});
    }
    weeks.push(currentWeek);
  }

  const hours = Math.floor(category.totalMinutes / 60);
  const minutes = category.totalMinutes % 60;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...SOFT_SPRING, delay }}
      style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `2px solid ${category.themeColor}40`,
        padding: '20px'
      }}
    >
      {/* Header - Clickable to navigate to CategoryDetail */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onCategoryClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          cursor: 'pointer'
        }}
      >
        <div style={{
          fontSize: '2rem',
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: `${category.themeColor}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${category.themeColor}60`
        }}>
          {category.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: colors.text.primary }}>
            {category.title}
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: colors.text.tertiary }}>
            {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`} · {category.sessionCount} sessions · Tap for details
          </p>
        </div>
      </motion.div>

      {/* Yearly Heatmap */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '4px', minWidth: 'fit-content' }}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {week.map((day: any, dayIndex: number) => {
                if (!day.date) {
                  return <div key={dayIndex} style={{ width: '12px', height: '12px' }} />;
                }

                const isTodayDate = isToday(day.date);

                return (
                  <motion.div
                    key={dayIndex}
                    whileHover={{ scale: 1.5, zIndex: 10 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => day.hasSession && onDateClick(day.date)}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '2px',
                      background: day.hasSession ? `${category.themeColor}CC` : colors.heatmap.empty,
                      border: isTodayDate
                        ? `2px solid ${category.themeColor}`
                        : `1px solid ${day.hasSession ? category.themeColor : colors.heatmap.emptyBorder}`,
                      cursor: day.hasSession ? 'pointer' : 'default'
                    }}
                    title={`${format(day.date, 'MMM d')}: ${day.minutes}min`}
                  />
                );
              })}
            </div>
          ))}
        </div>
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
