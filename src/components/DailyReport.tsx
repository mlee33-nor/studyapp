import React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { X, Flame, Clock } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import type { CategoryStats as CategoryStatsType } from '../types/stats';

type Theme = 'morning' | 'twilight' | 'golden' | 'midnight';

// Theme colors helper (same as StatsPage)
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
        empty: '#E2E8F0',
        emptyBorder: '#CBD5E1'
      },
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
        emptyBorder: 'rgba(255, 255, 255, 0.08)'
      },
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
        emptyBorder: 'rgba(255, 255, 255, 0.08)'
      },
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
        emptyBorder: 'rgba(255, 255, 255, 0.08)'
      },
      isDark: true
    }
  };
  return themeMap[theme];
};

export const DailyReport: React.FC<{
  date: Date;
  theme: Theme;
  onClose: () => void;
}> = ({ date, theme, onClose }) => {
  const { sessions, categoryStats } = useAnalytics('monthly', 60);
  const colors = getThemeColors(theme);

  // Get sessions for this specific date
  const daySessions = sessions.filter(s => isSameDay(parseISO(s.date), date));
  const totalMinutes = daySessions.reduce((sum, s) => sum + s.duration, 0);

  // Group by category
  const sessionsByCategory = daySessions.reduce((acc, session) => {
    if (!acc[session.categoryId]) {
      acc[session.categoryId] = [];
    }
    acc[session.categoryId].push(session);
    return acc;
  }, {} as Record<string, typeof daySessions>);

  // Group by hour for timeline chart
  const sessionsByHour = Array.from({ length: 24 }, (_, i) => {
    const hourSessions = daySessions.filter(s => {
      const hour = new Date(s.date).getHours();
      return hour === i;
    });
    return {
      hour: i,
      minutes: hourSessions.reduce((sum, s) => sum + s.duration, 0),
      count: hourSessions.length
    };
  });

  const maxMinutes = Math.max(...sessionsByHour.map(h => h.minutes), 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: colors.background,
        zIndex: 3000,
        overflowY: 'auto',
        padding: '24px 16px 120px',
        fontFamily: "'Quicksand', sans-serif"
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            margin: '0 0 4px 0',
            color: colors.text.primary,
            textShadow: !colors.isDark ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none'
          }}>
            {format(date, 'MMMM d, yyyy')}
          </h1>
          <p style={{ margin: 0, color: colors.text.tertiary, fontSize: '0.875rem' }}>
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
            color: colors.text.secondary
          }}
        >
          <X size={24} />
        </motion.button>
      </div>

      {/* Category Consistency Heatmaps */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          marginBottom: '16px',
          color: colors.text.primary
        }}>
          Category Consistency
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(sessionsByCategory).map(([categoryId, sessions]) => {
            const category = categoryStats.find(c => c.categoryId === categoryId);
            if (!category) return null;

            return (
              <CategoryStreakCard
                key={categoryId}
                category={category}
                sessionMinutes={sessions.reduce((sum, s) => sum + s.duration, 0)}
                colors={colors}
                selectedDate={date}
              />
            );
          })}
        </div>
      </div>

      {/* Hourly Focus Timeline */}
      <div style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
        padding: '20px',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Clock size={20} style={{ color: colors.text.primary }} />
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: colors.text.primary }}>
            Focus Timeline
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
          {sessionsByHour.map(({ hour, minutes, count }) => (
            <div
              key={hour}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${(minutes / maxMinutes) * 100}%`,
                  background: minutes > 0
                    ? 'linear-gradient(180deg, rgba(167, 139, 250, 0.8), rgba(139, 92, 246, 0.8))'
                    : colors.heatmap.empty,
                  borderRadius: '4px 4px 0 0',
                  minHeight: '2px',
                  position: 'relative'
                }}
                title={`${hour}:00 - ${minutes}min (${count} sessions)`}
              />
              {hour % 3 === 0 && (
                <span style={{ fontSize: '0.625rem', color: colors.text.tertiary }}>
                  {hour}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Session List */}
      <div style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
        padding: '20px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.125rem', fontWeight: 600, color: colors.text.primary }}>
          All Sessions
        </h3>

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
            daySessions
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((session) => (
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
      </div>
    </motion.div>
  );
};

// Category Streak Card Component
const CategoryStreakCard: React.FC<{
  category: CategoryStatsType;
  sessionMinutes: number;
  colors: ReturnType<typeof getThemeColors>;
  selectedDate: Date;
}> = ({ category, sessionMinutes, colors, selectedDate }) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
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
      borderRadius: '16px',
      border: `2px solid ${category.themeColor}40`,
      padding: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <span style={{ fontSize: '1.5rem' }}>{category.emoji}</span>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: colors.text.primary }}>
            {category.title}
          </h4>
          <p style={{ margin: 0, fontSize: '0.875rem', color: colors.text.tertiary }}>
            {sessionMinutes} min today
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Flame size={16} style={{ color: category.themeColor }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: category.themeColor }}>
            {category.currentStreak}d
          </span>
        </div>
      </div>

      {/* Mini consistency grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px'
      }}>
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} style={{ aspectRatio: '1' }} />;
          }

          const dayData = category.monthlyData.find(d => isSameDay(d.date, day));
          const hasSession = dayData?.hasSession || false;
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div
              key={index}
              style={{
                aspectRatio: '1',
                borderRadius: '4px',
                background: hasSession ? `${category.themeColor}90` : colors.heatmap.empty,
                border: isSelected
                  ? `2px solid ${category.themeColor}`
                  : `1px solid ${hasSession ? category.themeColor : colors.heatmap.emptyBorder}`
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
