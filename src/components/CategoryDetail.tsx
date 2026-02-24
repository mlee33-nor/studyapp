import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  format,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isToday,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  parseISO,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks
} from 'date-fns';
import { X, Flame, Award, TrendingUp, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CategoryStats as CategoryStatsType } from '../types/stats';
import { DailyReport } from './DailyReport';
import { useAnalytics } from '../hooks/useAnalytics';

type Theme = 'morning' | 'midnight';

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

export const CategoryDetail: React.FC<{
  category: CategoryStatsType;
  theme: Theme;
  viewMode: 'weekly' | 'monthly' | 'yearly';
  onClose: () => void;
}> = ({ category, theme, viewMode, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const colors = getThemeColors(theme);

  // Get all sessions for this category
  const { sessions } = useAnalytics('monthly', 60);
  const categorySessions = sessions.filter(s => s.categoryId === category.categoryId);

  const handlePrevious = () => {
    if (viewMode === 'weekly') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'weekly') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleCloseDailyReport = () => {
    setSelectedDate(null);
  };

  // Show DailyReport if a date is selected
  if (selectedDate) {
    return (
      <DailyReport
        date={selectedDate}
        theme={theme}
        onClose={handleCloseDailyReport}
        categoryId={category.categoryId}
      />
    );
  }

  const hours = Math.floor(category.totalMinutes / 60);
  const minutes = category.totalMinutes % 60;

  // Yearly heatmap data - generate from all sessions for this category
  const yearStart = startOfYear(new Date());
  const yearEnd = endOfYear(new Date());
  const yearlyDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

  const weeks: any[][] = [];
  let currentWeek: any[] = [];
  const firstDayOfWeek = getDay(yearStart);

  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({});
  }

  yearlyDays.forEach((day) => {
    // Find sessions for this day
    const daySessions = categorySessions.filter(s => isSameDay(parseISO(s.date), day));
    const dayMinutes = daySessions.reduce((sum, s) => sum + s.duration, 0);

    currentWeek.push({
      date: day,
      hasSession: daySessions.length > 0,
      minutes: dayMinutes
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 'clamp(2rem, 8vw, 2.5rem)', flexShrink: 0 }}>{category.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontSize: 'clamp(1.25rem, 5vw, 1.75rem)',
              fontWeight: 700,
              margin: '0 0 4px 0',
              color: colors.text.primary,
              textShadow: !colors.isDark ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
              wordWrap: 'break-word'
            }}>
              {category.title}
            </h1>
            <p style={{ margin: 0, color: colors.text.tertiary, fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
              {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`} · {category.sessionCount} sessions
            </p>
          </div>
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

      {/* All-Time Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
        gap: '10px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: colors.cardBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          padding: '12px',
          textAlign: 'center'
        }}>
          <Flame size={20} style={{ color: category.themeColor, margin: '0 auto 6px' }} />
          <div style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', fontWeight: 700, color: colors.text.primary }}>
            {category.currentStreak}d
          </div>
          <div style={{ fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)', color: colors.text.tertiary }}>
            Current Streak
          </div>
        </div>

        <div style={{
          background: colors.cardBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          padding: '12px',
          textAlign: 'center'
        }}>
          <Award size={20} style={{ color: category.themeColor, margin: '0 auto 6px' }} />
          <div style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', fontWeight: 700, color: colors.text.primary }}>
            {category.bestStreak}d
          </div>
          <div style={{ fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)', color: colors.text.tertiary }}>
            Best Streak
          </div>
        </div>

        <div style={{
          background: colors.cardBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          padding: '12px',
          textAlign: 'center'
        }}>
          <TrendingUp size={20} style={{ color: category.themeColor, margin: '0 auto 6px' }} />
          <div style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', fontWeight: 700, color: colors.text.primary }}>
            {category.perfectDays}
          </div>
          <div style={{ fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)', color: colors.text.tertiary }}>
            Perfect Days
          </div>
        </div>
      </div>

      {/* Yearly Heatmap - Only show in yearly mode */}
      {viewMode === 'yearly' && (
        <div style={{
          background: colors.cardBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          padding: '16px',
          marginBottom: '24px',
          overflowX: 'auto'
        }}>
          <h2 style={{
            fontSize: 'clamp(1rem, 4vw, 1.25rem)',
            fontWeight: 600,
            marginBottom: '12px',
            color: colors.text.primary
          }}>
            {format(new Date(), 'yyyy')} Activity
          </h2>

          <div style={{ display: 'flex', gap: '2px', minWidth: 'fit-content' }}>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {week.map((day: any, dayIndex: number) => {
                  if (!day.date) {
                    return <div key={dayIndex} style={{ width: '9px', height: '9px' }} />;
                  }

                  const isTodayDate = isToday(day.date);

                  return (
                    <motion.div
                      key={dayIndex}
                      whileHover={{ scale: 1.5, zIndex: 10 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => day.hasSession && handleDateClick(day.date)}
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '2px',
                        background: day.hasSession ? `${category.themeColor}CC` : colors.heatmap.empty,
                        border: isTodayDate
                          ? `1.5px solid ${category.themeColor}`
                          : `0.5px solid ${day.hasSession ? category.themeColor : colors.heatmap.emptyBorder}`,
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
      )}

      {/* Weekly Calendar Strip - Only show in weekly mode */}
      {viewMode === 'weekly' && (
        <div style={{
          background: colors.cardBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          padding: '16px'
        }}>
          {/* Week Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePrevious}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                color: colors.text.secondary
              }}
            >
              <ChevronLeft size={20} />
            </motion.button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={20} style={{ color: category.themeColor }} />
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: colors.text.primary }}>
                Week of {format(startOfWeek(currentDate), 'MMM d')}
              </h3>
              {!isSameDay(startOfWeek(currentDate), startOfWeek(new Date())) && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToday}
                  style={{
                    background: `${category.themeColor}30`,
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: category.themeColor,
                    fontFamily: "'Quicksand', sans-serif"
                  }}
                >
                  Today
                </motion.button>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                color: colors.text.secondary
              }}
            >
              <ChevronRight size={20} />
            </motion.button>
          </div>

          {/* 7-Day Calendar Strip */}
          <WeeklyCalendarStrip
            currentDate={currentDate}
            category={category}
            colors={colors}
            onDateClick={handleDateClick}
            categorySessions={categorySessions}
          />
        </div>
      )}

      {/* Monthly Streak Calendar - Only show in monthly mode */}
      {viewMode === 'monthly' && (
        <div style={{
          background: colors.cardBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          padding: '16px'
        }}>
          {/* Month Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePrevious}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                color: colors.text.secondary
              }}
            >
              <ChevronLeft size={20} />
            </motion.button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={20} style={{ color: category.themeColor }} />
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: colors.text.primary }}>
                {format(currentDate, 'MMMM yyyy')}
              </h3>
              {!isSameDay(startOfMonth(currentDate), startOfMonth(new Date())) && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToday}
                  style={{
                    background: `${category.themeColor}30`,
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: category.themeColor,
                    fontFamily: "'Quicksand', sans-serif"
                  }}
                >
                  Today
                </motion.button>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                color: colors.text.secondary
              }}
            >
              <ChevronRight size={20} />
            </motion.button>
          </div>

          {/* Month Calendar */}
          <MonthlyStreakGrid
            currentDate={currentDate}
            category={category}
            colors={colors}
            onDateClick={handleDateClick}
            categorySessions={categorySessions}
          />
        </div>
      )}
    </motion.div>
  );
};

// Monthly Streak Grid Component
const MonthlyStreakGrid: React.FC<{
  currentDate: Date;
  category: CategoryStatsType;
  colors: ReturnType<typeof getThemeColors>;
  onDateClick: (date: Date) => void;
  categorySessions: any[];
}> = ({ currentDate, category, colors, onDateClick, categorySessions }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);

  const calendarDays = [
    ...Array(firstDayOfWeek).fill(null),
    ...daysInMonth
  ];

  return (
    <>
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

      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '6px'
      }}>
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} />;
          }

          // Find sessions for this day
          const daySessions = categorySessions.filter(s => isSameDay(parseISO(s.date), day));
          const hasSession = daySessions.length > 0;
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
                  ? `2px solid ${category.themeColor}`
                  : `1px solid ${hasSession ? category.themeColor : colors.heatmap.emptyBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
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
    </>
  );
};

// Weekly Calendar Strip Component
const WeeklyCalendarStrip: React.FC<{
  currentDate: Date;
  category: CategoryStatsType;
  colors: ReturnType<typeof getThemeColors>;
  onDateClick: (date: Date) => void;
  categorySessions: any[];
}> = ({ currentDate, category, colors, onDateClick, categorySessions }) => {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      justifyContent: 'space-around',
      flexWrap: 'wrap'
    }}>
      {weekDays.map((day, index) => {
        // Find sessions for this day
        const daySessions = categorySessions.filter(s => isSameDay(parseISO(s.date), day));
        const hasSession = daySessions.length > 0;
        const isTodayDate = isToday(day);

        // Get category colors for quadrant display
        const uniqueCategories = Array.from(new Set(daySessions.map(s => s.categoryId)));
        const categoryColors = uniqueCategories.map(catId => {
          const session = daySessions.find(s => s.categoryId === catId);
          return session?.themeColor || category.themeColor;
        });

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
              gap: '6px',
              flex: '1 1 auto',
              minWidth: '60px'
            }}
          >
            {/* Day label */}
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isTodayDate ? category.themeColor : colors.text.tertiary,
              textTransform: 'uppercase'
            }}>
              {format(day, 'EEE')[0]}
            </div>

            {/* Day square with quadrant colors */}
            <div style={{
              width: 'clamp(40px, 12vw, 56px)',
              height: 'clamp(40px, 12vw, 56px)',
              borderRadius: '12px',
              background: (categoryColors.length === 0 ? colors.heatmap.empty : 'transparent') as string,
              border: isTodayDate
                ? `3px solid ${category.themeColor}`
                : `2px solid ${hasSession ? 'transparent' : colors.heatmap.emptyBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              fontWeight: isTodayDate ? 700 : 500,
              color: (hasSession ? '#FFFFFF' : colors.text.tertiary) as string,
              position: 'relative',
              overflow: 'hidden',
              cursor: hasSession ? 'pointer' : 'default'
            }}>
              {/* Quadrant-based color fill */}
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

              {/* Date number */}
              <span style={{ position: 'relative', zIndex: 1 }}>
                {format(day, 'd')}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
