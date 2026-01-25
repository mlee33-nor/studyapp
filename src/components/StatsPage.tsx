import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  startOfYear,
  addMonths,
  subMonths,
  addYears,
  subYears,
  isToday,
  parseISO
} from 'date-fns';
import { useAnalytics } from '../hooks/useAnalytics';
import type { ViewMode, DayData, CategoryStats as CategoryStatsType } from '../types/stats';
import { TrendingUp, Award, Flame, Target, Calendar, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';

const SOFT_SPRING = { type: "spring" as const, stiffness: 100, damping: 20 };

type Theme = 'morning' | 'twilight' | 'golden' | 'midnight';

// Theme-Adaptive Color System
const getThemeColors = (theme: Theme) => {
  const themeMap = {
    morning: {
      background: '#FFFFFF',
      cardBg: 'rgba(255, 255, 255, 0.8)',
      border: 'rgba(100, 116, 139, 0.15)',
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

export const StatsPage: React.FC<{ theme: Theme }> = ({ theme }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.background,
      color: colors.text.primary,
      padding: '24px 16px 120px',
      fontFamily: "'Quicksand', sans-serif",
      maxHeight: '100vh',
      overflowY: expandedCategory || selectedDate ? 'hidden' : 'auto'
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
          background: colors.gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
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

      {/* Yearly View: Full Year Heatmap at Top */}
      {viewMode === 'yearly' && (
        <YearlyHeatmap
          yearlyData={overallStats.yearlyData}
          currentDate={currentDate}
          colors={colors}
          onDateClick={(date) => setSelectedDate(date)}
        />
      )}

      {/* Overall Dashboard */}
      {viewMode === 'monthly' && (
        <OverallDashboard
          stats={overallStats}
          currentDate={currentDate}
          colors={colors}
          onDateClick={(date) => setSelectedDate(date)}
        />
      )}

      {/* Category Habit Cards with Interactive Heatmaps */}
      {(viewMode === 'weekly' || viewMode === 'monthly') && categoryStats.length > 0 && (
        <CategoryHabitCards
          categoryStats={categoryStats}
          colors={colors}
          expandedCategory={expandedCategory}
          setExpandedCategory={setExpandedCategory}
          currentDate={currentDate}
          onDateClick={(date, categoryId) => {
            setExpandedCategory(categoryId);
            setSelectedDate(date);
          }}
        />
      )}

      {/* Expanded Category Heatmap Modal */}
      <AnimatePresence>
        {expandedCategory && (
          <CategoryHeatmapModal
            category={categoryStats.find(c => c.categoryId === expandedCategory)!}
            colors={colors}
            onClose={() => setExpandedCategory(null)}
            onDateClick={(date) => setSelectedDate(date)}
            currentDate={currentDate}
          />
        )}
      </AnimatePresence>

      {/* Daily Detail Drill-Down Modal */}
      <AnimatePresence>
        {selectedDate && (
          <DailyDetailModal
            date={selectedDate}
            categoryId={expandedCategory}
            colors={colors}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>
    </div>
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

          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => hasSession && onDateClick(day)}
              style={{
                aspectRatio: '1',
                borderRadius: '12px',
                background: intensity > 0 ? colors.heatmap.levels[intensity - 1] : colors.heatmap.empty,
                border: isTodayDate
                  ? `2px solid ${colors.heatmap.currentDayBorder}`
                  : `1px solid ${intensity > 0 ? 'transparent' : colors.heatmap.emptyBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: isTodayDate ? 700 : 500,
                color: intensity > 0 ? (colors.isDark ? '#FFFFFF' : '#FFFFFF') : colors.text.tertiary,
                position: 'relative',
                cursor: hasSession ? 'pointer' : 'default'
              }}
            >
              {format(day, 'd')}
              {dayData?.isPerfectDay && (
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10B981'
                }} />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Heatmap Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '16px',
        fontSize: '0.75rem',
        color: colors.text.tertiary,
        justifyContent: 'center'
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
    </div>
  );
};

// Category Habit Cards
const CategoryHabitCards: React.FC<{
  categoryStats: CategoryStatsType[];
  colors: ReturnType<typeof getThemeColors>;
  expandedCategory: string | null;
  setExpandedCategory: (id: string | null) => void;
  currentDate: Date;
  onDateClick: (date: Date, categoryId: string) => void;
}> = ({ categoryStats, colors, setExpandedCategory }) => {
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
            onExpand={() => setExpandedCategory(cat.categoryId)}
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
  onExpand: () => void;
}> = ({ category, delay, colors, onExpand }) => {
  const hours = Math.floor(category.totalMinutes / 60);
  const minutes = category.totalMinutes % 60;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...SOFT_SPRING, delay }}
      whileHover={{ scale: 1.02 }}
      onClick={onExpand}
      style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
        padding: '20px',
        cursor: 'pointer'
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

      {/* Progress Bar - Clickable to expand */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '0.75rem',
          color: colors.text.tertiary
        }}>
          <span>Tap to view detailed heatmap →</span>
          <span>{Math.round(category.weeklyProgress)}%</span>
        </div>
        <div style={{
          height: '8px',
          borderRadius: '999px',
          background: colors.heatmap.empty,
          overflow: 'hidden'
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
                    background: intensity > 0 ? colors.heatmap.levels[intensity - 1] : colors.heatmap.empty,
                    border: isTodayDate
                      ? `2px solid ${colors.heatmap.currentDayBorder}`
                      : `1px solid ${intensity > 0 ? 'transparent' : colors.heatmap.emptyBorder}`,
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

// Category Heatmap Modal
const CategoryHeatmapModal: React.FC<{
  category: CategoryStatsType;
  colors: ReturnType<typeof getThemeColors>;
  onClose: () => void;
  onDateClick: (date: Date) => void;
  currentDate: Date;
}> = ({ category, colors, onClose, onDateClick, currentDate }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);

  const calendarDays = [
    ...Array(firstDayOfWeek).fill(null),
    ...daysInMonth
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        overflowY: 'auto'
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.cardBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '32px 24px',
          border: `1px solid ${colors.border}`,
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>{category.emoji}</span>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
              {category.title}
            </h2>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
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
            <X size={24} />
          </motion.button>
        </div>

        {/* Category Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: colors.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
              {category.currentStreak}d
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.text.tertiary }}>
              Streak
            </div>
          </div>
          <div style={{
            background: colors.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
              {category.bestStreak}d
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.text.tertiary }}>
              Best
            </div>
          </div>
          <div style={{
            background: colors.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
              {category.perfectDays}
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.text.tertiary }}>
              Days
            </div>
          </div>
        </div>

        {/* Category-Specific Heatmap */}
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: colors.text.primary }}>
          Consistency Calendar
        </h3>

        {/* Week day labels */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
          marginBottom: '6px'
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

        {/* Heatmap Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px'
        }}>
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} />;
            }

            const dayData = category.monthlyData.find(d => isSameDay(d.date, day));
            const hasSession = dayData?.hasSession || false;
            const isTodayDate = isToday(day);

            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => hasSession && onDateClick(day)}
                style={{
                  aspectRatio: '1',
                  borderRadius: '8px',
                  background: hasSession ? `${category.themeColor}CC` : colors.heatmap.empty,
                  border: isTodayDate
                    ? `2px solid ${colors.heatmap.currentDayBorder}`
                    : `1px solid ${hasSession ? category.themeColor : colors.heatmap.emptyBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: isTodayDate ? 700 : 500,
                  color: hasSession ? '#FFFFFF' : colors.text.tertiary,
                  cursor: hasSession ? 'pointer' : 'default'
                }}
              >
                {format(day, 'd')}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Daily Detail Modal
const DailyDetailModal: React.FC<{
  date: Date;
  categoryId: string | null;
  colors: ReturnType<typeof getThemeColors>;
  onClose: () => void;
}> = ({ date, categoryId, colors, onClose }) => {
  const { sessions } = useAnalytics('monthly', 60);

  const daySessions = sessions.filter(s =>
    isSameDay(parseISO(s.date), date) &&
    (!categoryId || s.categoryId === categoryId)
  );

  const totalMinutes = daySessions.reduce((sum, s) => sum + s.duration, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
        overflowY: 'auto'
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.cardBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '32px 24px',
          border: `1px solid ${colors.border}`,
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
              {format(date, 'MMMM d, yyyy')}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: colors.text.tertiary }}>
              {totalMinutes} minutes · {daySessions.length} sessions
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
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
            <X size={24} />
          </motion.button>
        </div>

        {/* Sessions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {daySessions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: colors.text.tertiary,
              fontSize: '0.875rem'
            }}>
              No sessions recorded for this day
            </div>
          ) : (
            daySessions.map((session) => (
              <div
                key={session.id}
                style={{
                  background: colors.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  borderRadius: '16px',
                  padding: '16px',
                  border: `1px solid ${colors.border}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '2rem' }}>{session.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: colors.text.primary }}>
                      {session.category}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: colors.text.tertiary, marginTop: '2px' }}>
                      {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{
                    background: `${session.themeColor}30`,
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: session.themeColor
                  }}>
                    {session.duration} min
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
