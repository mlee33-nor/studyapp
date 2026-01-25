import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, startOfYear } from 'date-fns';
import { useAnalytics } from '../hooks/useAnalytics';
import type { ViewMode, DayData, CategoryStats as CategoryStatsType } from '../types/stats';
import { TrendingUp, Award, Flame, Target, Calendar, Check } from 'lucide-react';

const SOFT_SPRING = { type: "spring" as const, stiffness: 100, damping: 20 };

export const StatsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const { overallStats, categoryStats } = useAnalytics(viewMode, 60);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0A',
      color: '#FFFFFF',
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
          background: 'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Your Progress
        </h1>
        <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
          Track your study journey and celebrate your wins
        </p>
      </motion.div>

      {/* View Mode Toggle */}
      <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />

      {/* Overall Dashboard */}
      <OverallDashboard stats={overallStats} viewMode={viewMode} />

      {/* Category Habit Cards */}
      {categoryStats.length > 0 && (
        <CategoryHabitCards categoryStats={categoryStats} />
      )}

      {/* Yearly Heatmap */}
      {viewMode === 'yearly' && (
        <YearlyHeatmap yearlyData={overallStats.yearlyData} />
      )}
    </div>
  );
};

// View Mode Toggle Component
const ViewModeToggle: React.FC<{
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}> = ({ viewMode, setViewMode }) => {
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
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
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
            background: viewMode === mode
              ? 'linear-gradient(135deg, rgba(167, 139, 250, 0.3) 0%, rgba(244, 114, 182, 0.3) 100%)'
              : 'transparent',
            color: viewMode === mode ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
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

// Overall Dashboard Component
const OverallDashboard: React.FC<{
  stats: any;
  viewMode: ViewMode;
}> = ({ stats, viewMode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SOFT_SPRING}
      style={{ marginBottom: '32px' }}
    >
      {/* Central Progress Ring */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '32px 24px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* Progress Circle */}
          <div style={{ position: 'relative', width: '160px', height: '160px' }}>
            <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress circle */}
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
                  <stop offset="0%" stopColor="#A78BFA" />
                  <stop offset="100%" stopColor="#F472B6" />
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
              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>
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
            />
            <StatCard
              icon={<Award size={20} />}
              label="Best Streak"
              value={`${stats.bestStreak}d`}
              color="#8B5CF6"
            />
            <StatCard
              icon={<Target size={20} />}
              label="Perfect Days"
              value={stats.perfectDays.toString()}
              color="#10B981"
            />
            <StatCard
              icon={<TrendingUp size={20} />}
              label="Total Sessions"
              value={stats.totalSessions.toString()}
              color="#3B82F6"
            />
          </div>
        </div>
      </div>

      {/* Monthly Calendar Heatmap */}
      {viewMode === 'monthly' && (
        <MonthlyCalendarHeatmap monthlyData={stats.monthlyData} />
      )}
    </motion.div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '16px',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        color
      }}>
        {icon}
        <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
        {value}
      </div>
    </div>
  );
};

// Monthly Calendar Heatmap
const MonthlyCalendarHeatmap: React.FC<{
  monthlyData: DayData[];
}> = ({ monthlyData }) => {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);

  // Create calendar grid with empty cells for padding
  const calendarDays = [
    ...Array(firstDayOfWeek).fill(null),
    ...daysInMonth
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '24px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <Calendar size={20} style={{ color: '#A78BFA' }} />
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
          {format(new Date(), 'MMMM yyyy')}
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
            color: 'rgba(255, 255, 255, 0.5)',
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
          const hasSession = dayData?.hasSession || false;
          const categories = dayData?.categories || [];
          const isToday = dayData?.isToday || false;

          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.1 }}
              style={{
                aspectRatio: '1',
                borderRadius: '12px',
                background: isToday
                  ? 'rgba(167, 139, 250, 0.2)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: hasSession
                  ? categories.length > 1
                    ? '2px solid transparent'
                    : `2px solid ${getCategoryColor(categories[0])}`
                  : '1px solid rgba(255, 255, 255, 0.05)',
                backgroundImage: categories.length > 1
                  ? `conic-gradient(${categories.map((_, i) =>
                      `${getCategoryColor(categories[i])} ${i * (360 / categories.length)}deg ${(i + 1) * (360 / categories.length)}deg`
                    ).join(', ')})`
                  : undefined,
                backgroundClip: categories.length > 1 ? 'padding-box' : undefined,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: isToday ? 700 : 500,
                color: hasSession ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                position: 'relative'
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
    </div>
  );
};

// Category Habit Cards
const CategoryHabitCards: React.FC<{
  categoryStats: CategoryStatsType[];
}> = ({ categoryStats }) => {
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
        color: 'rgba(255, 255, 255, 0.9)'
      }}>
        Category Progress
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {categoryStats.map((cat, index) => (
          <CategoryCard key={cat.categoryId} category={cat} delay={index * 0.05} />
        ))}
      </div>
    </motion.div>
  );
};

// Category Card Component
const CategoryCard: React.FC<{
  category: CategoryStatsType;
  delay: number;
}> = ({ category, delay }) => {
  const hours = Math.floor(category.totalMinutes / 60);
  const minutes = category.totalMinutes % 60;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...SOFT_SPRING, delay }}
      whileHover={{ scale: 1.02 }}
      style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
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
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
            {category.title}
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
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
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          <span>Weekly Goal</span>
          <span>{Math.round(category.weeklyProgress)}%</span>
        </div>
        <div style={{
          height: '8px',
          borderRadius: '999px',
          background: 'rgba(255, 255, 255, 0.1)',
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
        />
        <MiniStat
          icon={<Award size={16} />}
          label="Best"
          value={`${category.bestStreak}d`}
          color={category.themeColor}
        />
        <MiniStat
          icon={<Check size={16} />}
          label="Days"
          value={category.perfectDays.toString()}
          color={category.themeColor}
        />
      </div>

      {/* Mini Calendar */}
      <CategoryMiniCalendar monthlyData={category.monthlyData} themeColor={category.themeColor} />
    </motion.div>
  );
};

// Mini Stat Component
const MiniStat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '12px',
      padding: '10px',
      textAlign: 'center'
    }}>
      <div style={{ color, marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '2px' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.625rem', color: 'rgba(255, 255, 255, 0.5)' }}>
        {label}
      </div>
    </div>
  );
};

// Category Mini Calendar
const CategoryMiniCalendar: React.FC<{
  monthlyData: DayData[];
  themeColor: string;
}> = ({ monthlyData, themeColor }) => {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);

  const calendarDays = [
    ...Array(firstDayOfWeek).fill(null),
    ...daysInMonth
  ];

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px'
      }}>
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} style={{ aspectRatio: '1' }} />;
          }

          const dayData = monthlyData.find(d => isSameDay(d.date, day));
          const hasSession = dayData?.hasSession || false;

          return (
            <div
              key={index}
              style={{
                aspectRatio: '1',
                borderRadius: '6px',
                background: hasSession
                  ? `${themeColor}CC`
                  : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${hasSession ? themeColor : 'rgba(255, 255, 255, 0.05)'}`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// Yearly GitHub-Style Heatmap
const YearlyHeatmap: React.FC<{
  yearlyData: DayData[];
}> = ({ yearlyData }) => {
  const yearStart = startOfYear(new Date());

  // Group days by week
  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];

  // Add padding for first week
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
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '24px',
        marginBottom: '32px',
        overflowX: 'auto'
      }}
    >
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        marginBottom: '16px',
        color: 'rgba(255, 255, 255, 0.9)'
      }}>
        {format(new Date(), 'yyyy')} Activity
      </h2>

      <div style={{ display: 'flex', gap: '4px', minWidth: 'fit-content' }}>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {week.map((day, dayIndex) => {
              if (!day.date) {
                return <div key={dayIndex} style={{ width: '14px', height: '14px' }} />;
              }

              const intensity = getIntensity(day.totalMinutes);

              return (
                <motion.div
                  key={dayIndex}
                  whileHover={{ scale: 1.5, zIndex: 10 }}
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '3px',
                    background: getHeatmapColor(intensity),
                    border: '1px solid rgba(0, 0, 0, 0.3)',
                    cursor: 'pointer'
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
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        <span>Less</span>
        {[0, 1, 2, 3, 4].map(level => (
          <div
            key={level}
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '3px',
              background: getHeatmapColor(level),
              border: '1px solid rgba(0, 0, 0, 0.3)'
            }}
          />
        ))}
        <span>More</span>
      </div>
    </motion.div>
  );
};

// Helper functions
const getCategoryColor = (categoryId: string): string => {
  const colors: { [key: string]: string } = {
    accounting: '#10B981',
    algebra: '#3B82F6',
    science: '#8B5CF6',
    coding: '#EC4899',
    reading: '#F59E0B',
    writing: '#EF4444',
    language: '#06B6D4',
    music: '#6366F1'
  };

  return colors[categoryId] || '#A855F7';
};

const getIntensity = (minutes: number): number => {
  if (minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
};

const getHeatmapColor = (intensity: number): string => {
  const colors = [
    'rgba(255, 255, 255, 0.05)', // 0 - no activity
    'rgba(16, 185, 129, 0.3)',   // 1 - low
    'rgba(16, 185, 129, 0.5)',   // 2 - medium
    'rgba(16, 185, 129, 0.7)',   // 3 - high
    'rgba(16, 185, 129, 0.9)'    // 4 - very high
  ];

  return colors[intensity] || colors[0];
};
