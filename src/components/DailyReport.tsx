import React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { X, Flame, Clock, TrendingUp, Star } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import type { CategoryStats as CategoryStatsType } from '../types/stats';

type Theme = 'morning' | 'midnight';

// Calculate XP earned from session duration
const calculateXP = (minutes: number): number => {
  // Base XP: 10 XP per minute
  // Bonus: +50% for sessions >= 25 min (Pomodoro)
  // Bonus: +100% for sessions >= 50 min (Deep Work)
  let xp = minutes * 10;

  if (minutes >= 50) {
    xp = Math.floor(xp * 2); // Double XP for deep work
  } else if (minutes >= 25) {
    xp = Math.floor(xp * 1.5); // 50% bonus for Pomodoro
  }

  return xp;
};

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
  categoryId?: string; // Optional category filter
}> = ({ date, theme, onClose, categoryId }) => {
  const { sessions, categoryStats } = useAnalytics('monthly', 60);
  const colors = getThemeColors(theme);

  // Get sessions for this specific date, optionally filtered by category
  const daySessions = sessions.filter(s =>
    isSameDay(parseISO(s.date), date) &&
    (!categoryId || s.categoryId === categoryId)
  );
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
        padding: '16px',
        paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        paddingBottom: '100px',
        fontFamily: "'Quicksand', sans-serif",
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontSize: 'clamp(1.25rem, 5vw, 1.75rem)',
            fontWeight: 700,
            margin: '0 0 4px 0',
            color: colors.text.primary,
            textShadow: !colors.isDark ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
            wordWrap: 'break-word'
          }}>
            {format(date, 'MMMM d, yyyy')}
          </h1>
          <p style={{ margin: 0, color: colors.text.tertiary, fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
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
            color: colors.text.secondary,
            flexShrink: 0
          }}
        >
          <X size={24} />
        </motion.button>
      </div>

      {/* Category Consistency Heatmaps */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: 'clamp(1rem, 4vw, 1.25rem)',
          fontWeight: 600,
          marginBottom: '12px',
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

      {/* Focus Intensity Wave Chart */}
      <div style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <TrendingUp size={18} style={{ color: colors.text.primary }} />
          <h3 style={{ margin: 0, fontSize: 'clamp(0.95rem, 3.5vw, 1.125rem)', fontWeight: 600, color: colors.text.primary }}>
            Focus Intensity
          </h3>
        </div>

        <div style={{ position: 'relative', height: '120px', paddingTop: '10px' }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="focusGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(167, 139, 250, 0.6)" />
                <stop offset="100%" stopColor="rgba(167, 139, 250, 0.05)" />
              </linearGradient>
            </defs>

            {/* Generate smooth path for wave chart */}
            {(() => {
              const points = sessionsByHour.map((h, i) => ({
                x: (i / 23) * 100,
                y: 100 - ((h.minutes / maxMinutes) * 80)
              }));

              // Create smooth curve path using quadratic bezier
              let path = `M 0 100 L 0 ${points[0].y}`;

              for (let i = 0; i < points.length - 1; i++) {
                const curr = points[i];
                const next = points[i + 1];
                const midX = (curr.x + next.x) / 2;

                path += ` Q ${curr.x} ${curr.y}, ${midX} ${(curr.y + next.y) / 2}`;
              }

              const last = points[points.length - 1];
              path += ` Q ${last.x} ${last.y}, ${last.x} ${last.y}`;
              path += ` L ${last.x} 100 Z`;

              return (
                <>
                  <path
                    d={path}
                    fill="url(#focusGradient)"
                    stroke="rgba(167, 139, 250, 0.8)"
                    strokeWidth="0.5"
                  />
                  {/* Data points */}
                  {points.map((point, i) => (
                    sessionsByHour[i].minutes > 0 && (
                      <circle
                        key={i}
                        cx={point.x}
                        cy={point.y}
                        r="1"
                        fill="rgba(139, 92, 246, 1)"
                      />
                    )
                  ))}
                </>
              );
            })()}
          </svg>

          {/* Time labels */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            fontSize: '0.65rem',
            color: colors.text.tertiary
          }}>
            <span>12am</span>
            <span>6am</span>
            <span>12pm</span>
            <span>6pm</span>
            <span>11pm</span>
          </div>
        </div>
      </div>

      {/* Hourly Focus Timeline */}
      <div style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Clock size={18} style={{ color: colors.text.primary }} />
          <h3 style={{ margin: 0, fontSize: 'clamp(0.95rem, 3.5vw, 1.125rem)', fontWeight: 600, color: colors.text.primary }}>
            24-Hour Distribution
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '100px' }}>
          {sessionsByHour.map(({ hour, minutes, count }) => {
            // Get category colors for this hour
            const hourSessions = daySessions.filter(s => {
              const sessionHour = new Date(s.date).getHours();
              return sessionHour === hour;
            });
            const hourColors = Array.from(new Set(hourSessions.map(s => s.themeColor)));

            return (
              <div
                key={hour}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  position: 'relative'
                }}
                title={`${hour}:00 - ${minutes}min (${count} sessions)`}
              >
                <div style={{
                  width: '100%',
                  height: `${(minutes / maxMinutes) * 100}%`,
                  minHeight: minutes > 0 ? '4px' : '2px',
                  borderRadius: '2px 2px 0 0',
                  position: 'relative',
                  overflow: 'hidden',
                  background: minutes === 0 ? colors.heatmap.empty : 'transparent'
                }}>
                  {/* Multi-category bar */}
                  {hourColors.length === 1 ? (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: hourColors[0]
                    }} />
                  ) : hourColors.length > 1 ? (
                    hourColors.map((color, i) => (
                      <div
                        key={i}
                        style={{
                          width: '100%',
                          height: `${100 / hourColors.length}%`,
                          background: color
                        }}
                      />
                    ))
                  ) : null}
                </div>
                {hour % 6 === 0 && (
                  <span style={{ fontSize: '0.55rem', color: colors.text.tertiary }}>
                    {hour}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Session List */}
      <div style={{
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        padding: '16px'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 'clamp(0.95rem, 3.5vw, 1.125rem)', fontWeight: 600, color: colors.text.primary }}>
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
              .map((session) => {
                const xpEarned = calculateXP(session.duration);
                return (
                  <div
                    key={session.id}
                    style={{
                      background: colors.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderRadius: '16px',
                      padding: '16px',
                      border: `2px solid ${session.themeColor}20`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ fontSize: '2rem', flexShrink: 0 }}>{session.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 600, color: colors.text.primary }}>
                            {session.category}
                          </div>
                          <div style={{
                            background: `${session.themeColor}30`,
                            padding: '6px 12px',
                            borderRadius: '10px',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: session.themeColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Clock size={12} />
                            {session.duration} min
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '0.875rem', color: colors.text.tertiary }}>
                            {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#FBBF24'
                          }}>
                            <Star size={14} fill="#FBBF24" />
                            +{xpEarned} XP
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
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
