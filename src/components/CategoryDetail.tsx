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
  subMonths
} from 'date-fns';
import { X, Flame, Award, TrendingUp, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CategoryStats as CategoryStatsType } from '../types/stats';

type Theme = 'morning' | 'twilight' | 'golden' | 'midnight';

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

export const CategoryDetail: React.FC<{
  category: CategoryStatsType;
  theme: Theme;
  onClose: () => void;
  onDateClick?: (date: Date) => void;
}> = ({ category, theme, onClose, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const colors = getThemeColors(theme);

  const handlePrevious = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const hours = Math.floor(category.totalMinutes / 60);
  const minutes = category.totalMinutes % 60;

  // Yearly heatmap data
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

      {/* Yearly Heatmap */}
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

        <div style={{ display: 'flex', gap: '4px', minWidth: 'fit-content' }}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {week.map((day: any, dayIndex: number) => {
                if (!day.date) {
                  return <div key={dayIndex} style={{ width: '14px', height: '14px' }} />;
                }

                const isTodayDate = isToday(day.date);

                return (
                  <motion.div
                    key={dayIndex}
                    whileHover={{ scale: 1.5, zIndex: 10 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => day.hasSession && onDateClick && onDateClick(day.date)}
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
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

      {/* Monthly Streak Calendar */}
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
          onDateClick={onDateClick}
        />
      </div>
    </motion.div>
  );
};

// Monthly Streak Grid Component
const MonthlyStreakGrid: React.FC<{
  currentDate: Date;
  category: CategoryStatsType;
  colors: ReturnType<typeof getThemeColors>;
  onDateClick?: (date: Date) => void;
}> = ({ currentDate, category, colors, onDateClick }) => {
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

          const dayData = category.monthlyData.find(d => isSameDay(d.date, day));
          const hasSession = dayData?.hasSession || false;
          const isTodayDate = isToday(day);

          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => hasSession && onDateClick && onDateClick(day)}
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
