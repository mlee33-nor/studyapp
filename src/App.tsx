import React, { useState, useEffect, useRef } from 'react';
import { Home, BarChart2, Settings as SettingsIcon, User, Play, Pause, RotateCcw, Volume2, Bell, Moon, Lock, FileText, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { format, startOfWeek, addDays, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { SproutCharacter } from './MascotComponent';

// --- STORAGE HELPERS ---
const getDarkMode = () => {
  const stored = localStorage.getItem('darkMode');
  return stored === 'true';
};

const setDarkMode = (enabled: boolean) => {
  localStorage.setItem('darkMode', String(enabled));
};

const getSelectedTheme = (): 'morning' | 'twilight' | 'golden' | 'midnight' => {
  const stored = localStorage.getItem('selectedTheme');
  if (stored && ['morning', 'twilight', 'golden', 'midnight'].includes(stored)) {
    return stored as 'morning' | 'twilight' | 'golden' | 'midnight';
  }
  return 'morning';
};

const setSelectedTheme = (theme: 'morning' | 'twilight' | 'golden' | 'midnight') => {
  localStorage.setItem('selectedTheme', theme);
};

const getUserData = () => {
  const data = localStorage.getItem('userData');
  if (data) {
    return JSON.parse(data);
  }
  return { level: 1, xp: 0, sessionsCompleted: 0 };
};

const saveUserData = (data: { level: number; xp: number; sessionsCompleted: number }) => {
  localStorage.setItem('userData', JSON.stringify(data));
};

const getStoredStreak = () => {
  const data = localStorage.getItem('studyStreak');
  if (data) {
    const parsed = JSON.parse(data);
    return parsed;
  }
  return { streak: 0, lastStudyDate: null };
};

const updateStreak = () => {
  const today = new Date().toDateString();
  const stored = getStoredStreak();

  if (stored.lastStudyDate === today) {
    return stored.streak;
  }

  const lastDate = stored.lastStudyDate ? new Date(stored.lastStudyDate) : null;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak;
  if (!lastDate || lastDate.toDateString() === yesterday.toDateString()) {
    newStreak = stored.streak + 1;
  } else {
    newStreak = 1;
  }

  localStorage.setItem('studyStreak', JSON.stringify({
    streak: newStreak,
    lastStudyDate: today
  }));

  return newStreak;
};

// --- FOCUS HISTORY STORAGE ---
interface FocusSession {
  id: number;
  category: string;
  duration: number;
  date: string;
}

const getFocusHistory = (): FocusSession[] => {
  const data = localStorage.getItem('focusHistory');
  if (data) {
    return JSON.parse(data);
  }
  return [];
};

const saveFocusHistory = (history: FocusSession[]) => {
  localStorage.setItem('focusHistory', JSON.stringify(history));
};

const saveSession = (category: string, duration: number) => {
  const history = getFocusHistory();
  const newSession: FocusSession = {
    id: Date.now(),
    category: category,
    duration: duration,
    date: new Date().toISOString()
  };
  history.push(newSession);
  saveFocusHistory(history);
  return newSession;
};

// --- CHART DATA HELPERS ---
const getTimeDistributionForDate = (history: FocusSession[], date: Date) => {
  const daysSessions = history.filter(session => isSameDay(parseISO(session.date), date));
  const categoryMap: { [key: string]: number } = {};
  daysSessions.forEach(session => {
    categoryMap[session.category] = (categoryMap[session.category] || 0) + session.duration;
  });
  return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
};

const getDailyFocusForDate = (history: FocusSession[], selectedDate: Date) => {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return weekDays.map(day => {
    const dayTotal = history
      .filter(session => isSameDay(parseISO(session.date), day))
      .reduce((sum, session) => sum + session.duration, 0);
    const isSelected = isSameDay(day, selectedDate);
    return {
      day: format(day, 'EEE'),
      minutes: dayTotal,
      isSelected
    };
  });
};

const getCalendarData = (history: FocusSession[]) => {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return daysInMonth.map(day => ({
    date: day,
    day: format(day, 'd'),
    hasSession: history.some(session => isSameDay(parseISO(session.date), day))
  }));
};

// --- GAME LOGIC ---
const calculateXpForLevel = (level: number) => {
  return 100 * level;
};

const getCharacterStage = (level: number) => {
  if (level < 10) return 0; // Bean (Lvl 1-9)
  if (level < 20) return 1; // Pear with Arms (Lvl 10-19)
  if (level < 30) return 2; // Flower Bloom (Lvl 20-29)
  return 3; // Transcendent (Lvl 30+)
};

// Theme unlock levels
const THEME_UNLOCK_LEVELS = {
  morning: 0,
  twilight: 10,
  golden: 20,
  midnight: 30
};

const isThemeUnlocked = (theme: string, level: number) => {
  return level >= THEME_UNLOCK_LEVELS[theme as keyof typeof THEME_UNLOCK_LEVELS];
};

// Theme-aware colors for charts
const getThemeColors = (theme: 'morning' | 'twilight' | 'golden' | 'midnight') => {
  const themeColorMap = {
    morning: {
      primary: 'rgba(167, 139, 250, 0.8)',
      secondary: 'rgba(139, 92, 246, 0.8)',
      pastels: ['#E6D2FF', '#C8E6FF', '#C8FFE6', '#FFE6D2', '#FFD2E6', '#D2FFE6']
    },
    twilight: {
      primary: 'rgba(236, 72, 153, 0.8)',
      secondary: 'rgba(167, 139, 250, 0.8)',
      pastels: ['#FFC8E3', '#E6C8FF', '#C8D6FF', '#FFC8C8', '#E6FFC8', '#C8FFE6']
    },
    golden: {
      primary: 'rgba(251, 191, 36, 0.8)',
      secondary: 'rgba(249, 115, 22, 0.8)',
      pastels: ['#FFE6C8', '#FFDCC8', '#FFD2C8', '#FFC8D2', '#FFE6FF', '#E6FFD2']
    },
    midnight: {
      primary: 'rgba(59, 130, 246, 0.8)',
      secondary: 'rgba(139, 92, 246, 0.8)',
      pastels: ['#C8D6FF', '#D2C8FF', '#C8FFE6', '#C8F0FF', '#E6C8FF', '#FFC8E6']
    }
  };
  return themeColorMap[theme];
};

// --- SOFT ANIMATIONS ---
const SOFT_SPRING = { type: "spring" as const, stiffness: 100, damping: 20 };
const GENTLE_PRESS = { scale: 0.96 };

// --- BACKGROUND THEMES ---
const BACKGROUND_THEMES = {
  morning: {
    name: 'Morning',
    emoji: '🌅',
    gradient: 'linear-gradient(180deg, #F0F4FF 0%, #F5F0FF 50%, #F0FFF5 100%)',
    orbs: [
      { color: 'rgba(230, 210, 255, 0.4)', size: 500, x: '10%', y: '10%' },
      { color: 'rgba(200, 255, 230, 0.4)', size: 450, x: '70%', y: '30%' },
      { color: 'rgba(200, 230, 255, 0.4)', size: 480, x: '40%', y: '70%' },
      { color: 'rgba(255, 220, 240, 0.4)', size: 420, x: '80%', y: '60%' }
    ]
  },
  twilight: {
    name: 'Twilight',
    emoji: '🌆',
    gradient: 'linear-gradient(180deg, #1E1B4B 0%, #4C1D95 50%, #831843 100%)',
    orbs: [
      { color: 'rgba(167, 139, 250, 0.4)', size: 500, x: '10%', y: '10%' },
      { color: 'rgba(236, 72, 153, 0.4)', size: 450, x: '70%', y: '30%' },
      { color: 'rgba(99, 102, 241, 0.4)', size: 480, x: '40%', y: '70%' },
      { color: 'rgba(219, 39, 119, 0.4)', size: 420, x: '80%', y: '60%' }
    ]
  },
  golden: {
    name: 'Golden',
    emoji: '🌇',
    gradient: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 50%, #FBBF24 100%)',
    orbs: [
      { color: 'rgba(251, 191, 36, 0.4)', size: 500, x: '10%', y: '10%' },
      { color: 'rgba(249, 115, 22, 0.4)', size: 450, x: '70%', y: '30%' },
      { color: 'rgba(245, 158, 11, 0.4)', size: 480, x: '40%', y: '70%' },
      { color: 'rgba(251, 146, 60, 0.4)', size: 420, x: '80%', y: '60%' }
    ]
  },
  midnight: {
    name: 'Midnight',
    emoji: '🌌',
    gradient: 'linear-gradient(180deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
    orbs: [
      { color: 'rgba(59, 130, 246, 0.3)', size: 500, x: '10%', y: '10%' },
      { color: 'rgba(139, 92, 246, 0.3)', size: 450, x: '70%', y: '30%' },
      { color: 'rgba(16, 185, 129, 0.3)', size: 480, x: '40%', y: '70%' },
      { color: 'rgba(236, 72, 153, 0.3)', size: 420, x: '80%', y: '60%' }
    ]
  }
};

// --- LIVING AURORA MESH BACKGROUND ---
const LivingAuroraBackground: React.FC<{ theme: 'morning' | 'twilight' | 'golden' | 'midnight' }> = ({ theme }) => {
  const orbs = BACKGROUND_THEMES[theme].orbs;

  return (
    <>
      {orbs.map((orb, index) => (
        <motion.div
          key={index}
          animate={{
            x: [0, 80 * (index % 2 ? 1 : -1), -60 * (index % 2 ? 1 : -1), 0],
            y: [0, -70 * (index % 2 ? -1 : 1), 90 * (index % 2 ? -1 : 1), 0],
            scale: [1, 1.15, 0.9, 1],
            opacity: [0.4, 0.5, 0.3, 0.4]
          }}
          transition={{
            duration: 20 + index * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 2
          }}
          style={{
            position: 'absolute',
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: 'blur(80px)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
      ))}
    </>
  );
};

// --- METAMORPHIC CHARACTER imported from ./MascotComponent.tsx ---


// --- GLASSMORPHISM 2.0 CARD ---
const GlassCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={SOFT_SPRING}
    style={{
      background: 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(25px)',
      WebkitBackdropFilter: 'blur(25px)',
      borderRadius: '32px',
      padding: '32px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(147, 197, 253, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
      ...style
    }}
  >
    {children}
  </motion.div>
);

// --- SOFT BUTTON ---
const SoftButton: React.FC<{
  text?: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}> = ({ text, icon: Icon, onClick, variant = 'primary' }) => {
  const colors = {
    primary: {
      bg: 'linear-gradient(135deg, rgba(167, 139, 250, 0.7) 0%, rgba(139, 92, 246, 0.7) 100%)',
      shadow: '0 4px 20px rgba(167, 139, 250, 0.3)',
      hoverShadow: '0 6px 30px rgba(167, 139, 250, 0.4)'
    },
    secondary: {
      bg: 'rgba(255, 255, 255, 0.5)',
      shadow: '0 4px 20px rgba(147, 197, 253, 0.2)',
      hoverShadow: '0 6px 30px rgba(147, 197, 253, 0.3)'
    },
    ghost: {
      bg: 'rgba(255, 255, 255, 0.3)',
      shadow: '0 4px 15px rgba(147, 197, 253, 0.15)',
      hoverShadow: '0 6px 25px rgba(147, 197, 253, 0.25)'
    }
  };

  const style = colors[variant];

  return (
    <motion.button
      whileHover={{ scale: 1.02, boxShadow: style.hoverShadow }}
      whileTap={GENTLE_PRESS}
      onClick={onClick}
      transition={SOFT_SPRING}
      style={{
        background: style.bg,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: 'none',
        borderRadius: '20px',
        padding: text ? '16px 32px' : '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: 'pointer',
        color: variant === 'primary' ? 'white' : 'rgba(100, 100, 150, 1)',
        fontSize: '15px',
        fontWeight: 600,
        boxShadow: style.shadow,
        outline: 'none',
        fontFamily: "'Quicksand', sans-serif"
      }}
    >
      {Icon && <Icon size={20} strokeWidth={2.5} />}
      {text}
    </motion.button>
  );
};

// --- INTERACTIVE TIMER RING ---
const InteractiveTimerRing: React.FC<{
  minutes: number;
  onMinutesChange: (minutes: number) => void;
  isRunning: boolean;
  timeLeft: number;
  totalSeconds: number;
}> = ({ minutes, onMinutesChange, isRunning, timeLeft, totalSeconds }) => {
  // SVG Constants - Define once for perfect mathematical alignment
  const size = 192;
  const strokeWidth = 5;
  const cx = size / 2; // Center X coordinate
  const cy = size / 2; // Center Y coordinate
  // Radius accounts for stroke width: position handle on centerline of stroke
  // For stroke to fit within bounds: radius + (strokeWidth/2) <= size/2
  const radius = (size / 2) - (strokeWidth / 2); // 96 - 2.5 = 93.5
  const circumference = radius * 2 * Math.PI;
  const containerRef = useRef<HTMLDivElement>(null);

  const progress = 1 - (timeLeft / totalSeconds);
  const dashOffset = circumference * (1 - progress);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate angle from minutes (0-360 degrees)
  const angleFromMinutes = (mins: number) => {
    const normalized = (mins - 5) / (60 - 5); // Map 5-60 to 0-1
    return normalized * 360 - 90; // -90 to start at top (12 o'clock position)
  };

  // Mathematical orbit calculation: x = cx + radius * cos(angle), y = cy + radius * sin(angle)
  const handleAngle = angleFromMinutes(minutes);
  const handleAngleRad = (handleAngle * Math.PI) / 180; // Convert to radians
  const handleX = cx + radius * Math.cos(handleAngleRad);
  const handleY = cy + radius * Math.sin(handleAngleRad);

  const handleDrag = (_event: any, info: any) => {
    if (isRunning || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const containerCenterX = rect.left + rect.width / 2;
    const containerCenterY = rect.top + rect.height / 2;

    // Calculate angle from center using mouse position
    const dx = info.point.x - containerCenterX;
    const dy = info.point.y - containerCenterY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Normalize angle to 0-360
    angle = (angle + 90 + 360) % 360;

    // Map angle to minutes (5-60)
    const normalized = angle / 360; // 0-1
    const newMinutes = Math.round(5 + normalized * (60 - 5));
    const clampedMinutes = Math.max(5, Math.min(60, newMinutes));

    onMinutesChange(clampedMinutes);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle - uses cx, cy, and calculated radius */}
        <circle cx={cx} cy={cy} r={radius} stroke="rgba(200, 220, 255, 0.3)" strokeWidth={strokeWidth} fill="none" />
        {/* Progress circle - animated stroke offset */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="url(#lavenderGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: isRunning ? dashOffset : 0 }}
          strokeLinecap="round"
          transition={{ duration: 1, ease: "easeInOut" }}
        />
        <defs>
          <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(167, 139, 250, 0.8)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.8)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Draggable Handle - positioned on orbit using mathematical formula */}
      {!isRunning && (
        <motion.div
          drag
          dragMomentum={false}
          onDrag={handleDrag}
          dragElastic={0}
          key={`handle-${minutes}`} // Re-mount on minute change to reset position
          style={{
            position: 'absolute',
            left: handleX,
            top: handleY,
            transform: 'translate(-50%, -50%)', // Center the handle on calculated position
            cursor: 'grab',
            touchAction: 'none',
            pointerEvents: 'auto',
          }}
          whileTap={{ scale: 1.1, cursor: 'grabbing' }}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '2.5px solid rgba(167, 139, 250, 0.6)',
            boxShadow: '0 4px 20px rgba(167, 139, 250, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            color: 'rgba(139, 92, 246, 0.9)',
            fontFamily: "'Quicksand', sans-serif"
          }}>
            {minutes}
          </div>
        </motion.div>
      )}

      {/* Center Display */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        <motion.h1
          key={isRunning ? timeLeft : minutes}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.01, 1] }}
          transition={{ duration: 1 }}
          style={{
            fontSize: '2.5rem',
            margin: 0,
            color: 'rgba(100, 100, 150, 0.9)',
            fontFamily: "'Quicksand', sans-serif",
            fontWeight: 400,
            letterSpacing: '0.05em',
          }}
        >
          {isRunning ? formatTime(timeLeft) : `${minutes}:00`}
        </motion.h1>
        {!isRunning && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: '12px',
              color: 'rgba(100, 100, 150, 0.6)',
              marginTop: '4px',
              fontFamily: "'Quicksand', sans-serif",
              fontWeight: 500
            }}
          >
            {minutes * 10} XP
          </motion.div>
        )}
      </div>
    </div>
  );
};

// --- XP PROGRESS BAR ---
const XpProgressBar: React.FC<{ currentXp: number; requiredXp: number }> = ({ currentXp, requiredXp }) => {
  const percentage = (currentXp / requiredXp) * 100;

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
        fontSize: '13px',
        color: 'rgba(100, 100, 150, 0.7)',
        fontWeight: 600,
        fontFamily: "'Quicksand', sans-serif"
      }}>
        <span>{currentXp} XP</span>
        <span>{requiredXp} XP</span>
      </div>
      <div style={{
        width: '100%',
        height: '12px',
        background: 'rgba(200, 220, 255, 0.3)',
        borderRadius: '100px',
        overflow: 'hidden'
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={SOFT_SPRING}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, rgba(167, 139, 250, 0.8) 0%, rgba(139, 92, 246, 0.8) 100%)',
            boxShadow: '0 2px 10px rgba(167, 139, 250, 0.4)'
          }}
        />
      </div>
    </div>
  );
};

// --- EVOLUTION STAGES GRID ---
const EvolutionStages: React.FC<{ currentLevel: number }> = ({ currentLevel }) => {
  const stages = [
    { name: 'Seed', level: 1, emoji: '🌰' },
    { name: 'Sprout', level: 5, emoji: '🌱' },
    { name: 'Pear', level: 10, emoji: '🌿' },
    { name: 'Spirit', level: 15, emoji: '✨' },
    { name: 'Bloom', level: 20, emoji: '🌸' },
    { name: 'Guardian', level: 25, emoji: '🌺' },
    { name: 'Transcendent', level: 30, emoji: '👑' },
    { name: 'Divine', level: 33, emoji: '🌟' }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      marginTop: '24px'
    }}>
      {stages.map((stage, i) => {
        const isUnlocked = currentLevel >= stage.level;
        return (
          <motion.div
            key={i}
            whileHover={{ scale: isUnlocked ? 1.05 : 1 }}
            style={{
              background: isUnlocked ? 'rgba(255, 255, 255, 0.5)' : 'rgba(200, 220, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              padding: '20px',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: isUnlocked ? '0 4px 15px rgba(167, 139, 250, 0.2)' : '0 2px 10px rgba(147, 197, 253, 0.1)',
              opacity: isUnlocked ? 1 : 0.5,
              cursor: isUnlocked ? 'default' : 'not-allowed'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
              {isUnlocked ? stage.emoji : '🔒'}
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'rgba(100, 100, 150, 0.8)',
              marginBottom: '4px',
              fontFamily: "'Quicksand', sans-serif"
            }}>
              {stage.name}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(100, 100, 150, 0.6)',
              fontFamily: "'Quicksand', sans-serif"
            }}>
              Level {stage.level}+
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// --- SOFT STATS CHART ---
const SoftStatsChart: React.FC = () => {
  const data = [35, 50, 30, 45, 65, 55, 25];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, gap: '12px' }}>
      {data.map((val, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(val / 70) * 100}%` }}
            transition={{ ...SOFT_SPRING, delay: i * 0.08 }}
            style={{
              width: '100%',
              background: i % 2 === 0
                ? 'linear-gradient(180deg, rgba(167, 139, 250, 0.6) 0%, rgba(167, 139, 250, 0.3) 100%)'
                : 'linear-gradient(180deg, rgba(147, 197, 253, 0.6) 0%, rgba(147, 197, 253, 0.3) 100%)',
              borderRadius: '12px',
              boxShadow: i % 2 === 0 ? '0 4px 15px rgba(167, 139, 250, 0.2)' : '0 4px 15px rgba(147, 197, 253, 0.2)',
            }}
          />
          <span style={{ fontSize: '12px', color: 'rgba(100, 100, 150, 0.7)', fontWeight: 600, fontFamily: "'Quicksand', sans-serif" }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]}
          </span>
        </div>
      ))}
    </div>
  );
};

// --- SOFT TOGGLE SWITCH ---
const SoftToggle: React.FC<{ enabled: boolean; onToggle: () => void }> = ({ enabled, onToggle }) => (
  <motion.div
    onClick={onToggle}
    whileTap={{ scale: 0.95 }}
    style={{
      width: 48,
      height: 26,
      background: enabled ? 'rgba(167, 139, 250, 0.4)' : 'rgba(200, 220, 255, 0.3)',
      borderRadius: '100px',
      position: 'relative',
      cursor: 'pointer',
      boxShadow: enabled ? '0 4px 15px rgba(167, 139, 250, 0.3)' : '0 2px 10px rgba(147, 197, 253, 0.2)',
    }}
  >
    <motion.div
      animate={{ left: enabled ? 24 : 2 }}
      transition={SOFT_SPRING}
      style={{
        width: 20,
        height: 20,
        background: 'white',
        borderRadius: '50%',
        position: 'absolute',
        top: 2,
        boxShadow: '0 2px 8px rgba(100, 100, 150, 0.2)',
      }}
    />
  </motion.div>
);

// --- CATEGORY SELECTION MODAL ---
const CategorySelectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: string) => void;
}> = ({ isOpen, onClose, onSelectCategory }) => {
  const [customInput, setCustomInput] = useState('');
  const predefinedCategories = ['Accounting', 'Algebra', 'Science', 'Coding'];

  if (!isOpen) return null;

  const handleCategoryClick = (category: string) => {
    onSelectCategory(category);
    setCustomInput('');
  };

  const handleBeginSession = () => {
    if (customInput.trim()) {
      onSelectCategory(customInput.trim());
    } else if (predefinedCategories.length > 0) {
      onSelectCategory(predefinedCategories[0]);
    }
    setCustomInput('');
  };

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
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '32px',
          padding: '32px 24px',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 8px 32px rgba(147, 197, 253, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
          maxWidth: '420px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Title */}
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          color: 'rgba(100, 100, 150, 0.9)',
          marginBottom: '24px',
          textAlign: 'center',
          fontFamily: "'Quicksand', sans-serif",
          letterSpacing: '0.02em',
        }}>
          What are we focusing on?
        </h2>

        {/* Quick Select Chips */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}>
          {predefinedCategories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleCategoryClick(category)}
              style={{
                background: customInput === ''
                  ? 'linear-gradient(135deg, rgba(167, 139, 250, 0.6) 0%, rgba(139, 92, 246, 0.6) 100%)'
                  : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '20px',
                padding: '16px 20px',
                cursor: 'pointer',
                color: customInput === '' ? 'white' : 'rgba(100, 100, 150, 0.9)',
                fontSize: '15px',
                fontWeight: 600,
                fontFamily: "'Quicksand', sans-serif",
                boxShadow: '0 4px 15px rgba(147, 197, 253, 0.2)',
                transition: 'all 0.3s ease',
              }}
            >
              {category}
            </motion.button>
          ))}
        </div>

        {/* Custom Input Section */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: 'rgba(100, 100, 150, 0.7)',
            marginBottom: '8px',
            fontFamily: "'Quicksand', sans-serif",
          }}>
            Or enter a custom subject:
          </label>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="e.g., CIS114DE"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && customInput.trim()) {
                handleBeginSession();
              }
            }}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '18px',
              border: '1px solid rgba(200, 220, 255, 0.4)',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              fontSize: '15px',
              color: 'rgba(100, 100, 150, 0.9)',
              fontFamily: "'Quicksand', sans-serif",
              fontWeight: 500,
              outline: 'none',
              boxShadow: '0 2px 10px rgba(147, 197, 253, 0.1)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
        }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(200, 220, 255, 0.3)',
              borderRadius: '20px',
              padding: '14px 24px',
              cursor: 'pointer',
              color: 'rgba(100, 100, 150, 0.8)',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: "'Quicksand', sans-serif",
              boxShadow: '0 4px 15px rgba(147, 197, 253, 0.15)',
            }}
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleBeginSession}
            style={{
              flex: 2,
              background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.7) 0%, rgba(139, 92, 246, 0.7) 100%)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '20px',
              padding: '14px 24px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: "'Quicksand', sans-serif",
              boxShadow: '0 4px 20px rgba(167, 139, 250, 0.3)',
            }}
          >
            Begin Session
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [activeTab, setActiveTab] = useState('Timer');
  const [isRunning, setIsRunning] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(getDarkMode());
  const [userData, setUserData] = useState(getUserData());
  const [devLevel, setDevLevel] = useState(userData.level);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(timerMinutes * 60);
  const [selectedTheme, setSelectedThemeState] = useState<'morning' | 'twilight' | 'golden' | 'midnight'>(getSelectedTheme());
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [focusHistory, setFocusHistory] = useState<FocusSession[]>(getFocusHistory());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const theme = selectedTheme;

  // Persistence Engine: Load saved data on mount
  useEffect(() => {
    const savedHistory = getFocusHistory();
    setFocusHistory(savedHistory);
  }, []);

  // Update timeLeft when timerMinutes changes
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(timerMinutes * 60);
    }
  }, [timerMinutes, isRunning]);

  // Countdown logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => Math.max(0, t - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Check for completion
  useEffect(() => {
    if (isRunning && timeLeft === 0) {
      handleCompleteSession();
    }
  }, [timeLeft, isRunning]);

  // Reset selected date when navigating away from Reports tab
  useEffect(() => {
    if (activeTab !== 'Reports') {
      setSelectedDate(null);
    }
  }, [activeTab]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    setDarkMode(newMode);
  };

  const handleThemeChange = (theme: 'morning' | 'twilight' | 'golden' | 'midnight') => {
    if (isThemeUnlocked(theme, userData.level)) {
      setSelectedThemeState(theme);
      setSelectedTheme(theme);
    }
  };

  const triggerCelebration = () => {
    // Circular bubbles and leaves confetti
    const count = 100;
    const defaults = {
      origin: { y: 0.6 },
      zIndex: 9999
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        shapes: ['circle'],
        colors: ['#A3E635', '#10B981', '#A78BFA', '#93C5FD', '#FCA5A5'],
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  const handleCompleteSession = () => {
    updateStreak();
    setIsRunning(false);

    // Save session to focusHistory
    const savedSession = saveSession(currentCategory || 'Uncategorized', timerMinutes);
    setFocusHistory(prev => [...prev, savedSession]);

    // XP Scaling Logic: XP = timerMinutes * 10 (10 XP per minute)
    const xpGained = timerMinutes * 10;
    let newLevel = userData.level;
    let remainingXp = userData.xp + xpGained;

    // Handle level up (can level up multiple times)
    while (remainingXp >= calculateXpForLevel(newLevel)) {
      const xpNeeded = calculateXpForLevel(newLevel);
      remainingXp -= xpNeeded;
      newLevel += 1;
    }

    const newData = {
      level: newLevel,
      xp: remainingXp,
      sessionsCompleted: userData.sessionsCompleted + 1
    };

    setUserData(newData);
    saveUserData(newData);

    // Trigger Success Burst celebration with bubbles and leaves!
    triggerCelebration();
  };

  const handleDevLevelChange = (level: number) => {
    setDevLevel(level);
    const newData = {
      ...userData,
      level: level,
      xp: 0
    };
    setUserData(newData);
    saveUserData(newData);
  };

  const handleStartFocus = () => {
    setShowCategoryModal(true);
  };

  const handleCategorySelected = (category: string) => {
    setCurrentCategory(category);
    setShowCategoryModal(false);
    setIsRunning(true);
  };

  const renderContent = () => {
    if (activeTab === 'Timer') return (
      <div style={{
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 1.25rem 0',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Top: Header */}
        <div style={{ width: '100%', textAlign: 'center', flexShrink: 0 }}>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: 500,
            color: 'rgba(100, 100, 150, 0.8)',
            margin: 0,
            letterSpacing: '0.05em',
            fontFamily: "'Quicksand', sans-serif"
          }}>
            Focus Session
          </h1>
          {currentCategory && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '8px',
                padding: '6px 16px',
                background: 'rgba(167, 139, 250, 0.2)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '16px',
                display: 'inline-block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'rgba(139, 92, 246, 0.9)',
                fontFamily: "'Quicksand', sans-serif",
                boxShadow: '0 2px 10px rgba(167, 139, 250, 0.2)',
              }}
            >
              📚 {currentCategory}
            </motion.div>
          )}
        </div>

        {/* Center: Timer & Mascot - Flexible wrapper that can scale down */}
        <div style={{
          flexGrow: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '400px',
          overflow: 'hidden'
        }}>
          <GlassCard style={{ width: '100%', padding: '20px 16px' }}>
            <InteractiveTimerRing
              minutes={timerMinutes}
              onMinutesChange={setTimerMinutes}
              isRunning={isRunning}
              timeLeft={timeLeft}
              totalSeconds={timerMinutes * 60}
            />

            {/* Mascot Container with strict height limit */}
            <div style={{
              maxHeight: '25vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '16px 0 12px',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                transform: 'scale(0.85)',
                transformOrigin: 'center'
              }}>
                <SproutCharacter size={80} level={userData.level} isTimerActive={isRunning} />
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                padding: '4px 12px',
                borderRadius: '16px',
                boxShadow: '0 4px 15px rgba(147, 197, 253, 0.2)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'rgba(100, 100, 150, 1)',
                display: 'inline-block',
                fontFamily: "'Quicksand', sans-serif",
                textAlign: 'center',
                marginTop: '8px'
              }}>
                {getCharacterStage(userData.level) === 0 && 'Bean'}
                {getCharacterStage(userData.level) === 1 && 'Pear'}
                {getCharacterStage(userData.level) === 2 && 'Bloom'}
                {getCharacterStage(userData.level) === 3 && 'Transcendent'}
                {' · Lvl '}{userData.level}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Bottom: Action Zone (Buttons + Nav) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          width: '100%',
          maxWidth: '400px',
          flexShrink: 0,
          paddingBottom: '2rem'
        }}>
          {/* Start/Stop Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '280px',
            width: '100%',
            margin: '0 auto'
          }}>
            {!isRunning ? (
              <SoftButton text="Start Focus" icon={Play} onClick={handleStartFocus} variant="primary" />
            ) : (
              <>
                <SoftButton text="Pause" icon={Pause} onClick={() => setIsRunning(false)} variant="secondary" />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <SoftButton text="Complete" onClick={handleCompleteSession} variant="primary" />
                  </div>
                  <SoftButton icon={RotateCcw} onClick={() => setIsRunning(false)} variant="ghost" />
                </div>
              </>
            )}
          </div>

          {/* Navigation Bar - Integrated into layout */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '0.5rem'
          }}>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={SOFT_SPRING}
              style={{
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '30px',
                boxShadow: '0 8px 32px rgba(147, 197, 253, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
                display: 'flex',
                gap: '8px',
                padding: '10px 16px',
              }}
            >
              {[
                { id: 'Timer', icon: Home },
                { id: 'Stats', icon: BarChart2 },
                { id: 'Reports', icon: FileText },
                { id: 'Avatar', icon: User },
                { id: 'Settings', icon: SettingsIcon }
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.div
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    whileTap={GENTLE_PRESS}
                    transition={SOFT_SPRING}
                    style={{
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '14px',
                      background: isActive ? 'rgba(167, 139, 250, 0.2)' : 'transparent',
                      boxShadow: isActive ? '0 4px 15px rgba(167, 139, 250, 0.2)' : 'none',
                    }}
                  >
                    <tab.icon
                      color={isActive ? 'rgba(139, 92, 246, 0.9)' : 'rgba(100, 100, 150, 0.5)'}
                      size={20}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    );

    if (activeTab === 'Stats') return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={SOFT_SPRING}
        style={{ padding: '40px 24px 160px', position: 'relative', zIndex: 1 }}
      >
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 500,
          color: 'rgba(100, 100, 150, 0.8)',
          marginBottom: '32px',
          letterSpacing: '0.05em',
          fontFamily: "'Quicksand', sans-serif"
        }}>
          Statistics
        </h1>

        <GlassCard style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', color: 'rgba(100, 100, 150, 0.8)', fontWeight: 600, fontFamily: "'Quicksand', sans-serif" }}>
            Weekly Activity
          </h3>
          <SoftStatsChart />
        </GlassCard>

        <GlassCard style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(167, 139, 250, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(167, 139, 250, 0.2)'
            }}>
              <User size={24} color="rgba(139, 92, 246, 0.8)" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(100, 100, 150, 0.9)', fontFamily: "'Quicksand', sans-serif" }}>
                {userData.sessionsCompleted} Sessions
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(100, 100, 150, 0.6)', fontFamily: "'Quicksand', sans-serif" }}>
                Total Completed
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'rgba(100, 100, 150, 0.8)', fontWeight: 600, fontFamily: "'Quicksand', sans-serif" }}>
            Recent Sessions
          </h3>
          {focusHistory.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '24px',
              color: 'rgba(100, 100, 150, 0.6)',
              fontSize: '14px',
              fontFamily: "'Quicksand', sans-serif"
            }}>
              No sessions yet. Complete a focus session to see your history!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {focusHistory.slice(-5).reverse().map((session) => (
                <div
                  key={session.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 2px 10px rgba(147, 197, 253, 0.1)'
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'rgba(100, 100, 150, 0.9)',
                      fontFamily: "'Quicksand', sans-serif"
                    }}>
                      📚 {session.category}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(100, 100, 150, 0.6)',
                      marginTop: '2px',
                      fontFamily: "'Quicksand', sans-serif"
                    }}>
                      {new Date(session.date).toLocaleDateString()} at {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(167, 139, 250, 0.2)',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'rgba(139, 92, 246, 0.9)',
                    fontFamily: "'Quicksand', sans-serif"
                  }}>
                    {session.duration} min
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>
    );

    if (activeTab === 'Reports') {
      const colors = getThemeColors(theme);
      const calendarData = getCalendarData(focusHistory);

      // Only compute filtered data when a date is selected
      const timeDistData = selectedDate ? getTimeDistributionForDate(focusHistory, selectedDate) : [];
      const dailyData = selectedDate ? getDailyFocusForDate(focusHistory, selectedDate) : [];

      const handleDayClick = (day: { date: Date; day: string; hasSession: boolean }) => {
        if (day.hasSession) {
          setSelectedDate(day.date);
        }
      };

      // GlobalStyles component to permanently remove blue focus boxes
      const GlobalStyles = () => (
        <style dangerouslySetInnerHTML={{ __html: `
          * { -webkit-tap-highlight-color: transparent !important; }
          *:focus { outline: none !important; }
          .recharts-wrapper, .recharts-surface { outline: none !important; border: none !important; }
          svg, svg * { outline: none !important; -webkit-tap-highlight-color: transparent !important; }
        `}} />
      );

      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={SOFT_SPRING}
          style={{ padding: '40px 24px 160px', position: 'relative', zIndex: 1 }}
        >
          <GlobalStyles />
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 500,
            color: 'rgba(100, 100, 150, 0.8)',
            marginBottom: '32px',
            letterSpacing: '0.05em',
            fontFamily: "'Quicksand', sans-serif"
          }}>
            Detailed Report
          </h1>

          {/* Card 4: Pomodoro Record Calendar Grid (Always visible) */}
          <GlassCard style={{ marginBottom: selectedDate ? '20px' : '0' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', color: 'rgba(100, 100, 150, 0.8)', fontWeight: 600, fontFamily: "'Quicksand', sans-serif" }}>
              Pomodoro Record ({format(new Date(), 'MMMM yyyy')})
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px'
            }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} style={{
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'rgba(100, 100, 150, 0.6)',
                  fontFamily: "'Quicksand', sans-serif",
                  padding: '8px 0'
                }}>
                  {day}
                </div>
              ))}
              {calendarData.map((day, index) => {
                const isSelected = selectedDate && isSameDay(day.date, selectedDate);
                return (
                  <motion.div
                    key={index}
                    onClick={() => handleDayClick(day)}
                    whileHover={{ scale: day.hasSession ? 1.1 : 1 }}
                    whileTap={{ scale: day.hasSession ? 0.95 : 1 }}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected
                        ? colors.primary
                        : day.hasSession
                          ? 'rgba(167, 139, 250, 0.5)'
                          : 'rgba(200, 220, 255, 0.2)',
                      color: (day.hasSession || isSelected) ? 'white' : 'rgba(100, 100, 150, 0.7)',
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: "'Quicksand', sans-serif",
                      position: 'relative',
                      cursor: day.hasSession ? 'pointer' : 'default',
                      boxShadow: isSelected
                        ? '0 8px 24px rgba(167, 139, 250, 0.6), 0 0 20px rgba(167, 139, 250, 0.4)'
                        : day.hasSession
                          ? '0 2px 10px rgba(167, 139, 250, 0.3)'
                          : 'none',
                      outline: 'none',
                      border: isSelected ? '2px solid rgba(255, 255, 255, 0.8)' : 'none',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.3s ease'
                    } as React.CSSProperties}
                  >
                    {day.hasSession ? (
                      <div style={{ position: 'relative' }}>
                        <Check size={16} strokeWidth={3} />
                      </div>
                    ) : (
                      day.day
                    )}
                  </motion.div>
                );
              })}
            </div>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SOFT_SPRING}
                style={{
                  marginTop: '20px',
                  padding: '12px 16px',
                  background: 'rgba(167, 139, 250, 0.1)',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'rgba(100, 100, 150, 0.8)',
                  fontFamily: "'Quicksand', sans-serif"
                }}
              >
                📅 Selected: {format(selectedDate, 'MMMM d, yyyy')}
              </motion.div>
            )}
          </GlassCard>

          {/* Card 1: Time Distribution (Only visible when date selected) */}
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SOFT_SPRING}
            >
              <GlassCard style={{
                marginBottom: '20px',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent'
              } as React.CSSProperties}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', color: 'rgba(100, 100, 150, 0.8)', fontWeight: 600, fontFamily: "'Quicksand', sans-serif" }}>
                  Time Distribution - {format(selectedDate, 'MMM d')}
                </h3>
                {timeDistData.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '48px 24px',
                    color: 'rgba(100, 100, 150, 0.6)',
                    fontSize: '14px',
                    fontFamily: "'Quicksand', sans-serif"
                  }}>
                    No sessions recorded for this day.
                  </div>
                ) : (
                  <div style={{
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    padding: '20px'
                  }}>
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={timeDistData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value, percent, cx, cy, midAngle, innerRadius, outerRadius }: any) => {
                            // Ensure all required values are defined
                            if (!name || midAngle === undefined || percent === undefined || !cx || !cy || !innerRadius || !outerRadius) {
                              return null;
                            }

                            // Calculate position for inside labels
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);

                            const hours = Math.floor(value / 60);
                            const mins = value % 60;
                            const displayName = name.length > 10 ? name.substring(0, 10) + '...' : name;

                            // Only show label if slice is large enough (>5%)
                            if (percent < 0.05) return null;

                            return (
                              <text
                                x={x}
                                y={y}
                                fill="white"
                                textAnchor="middle"
                                dominantBaseline="central"
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  fontFamily: "'Quicksand', sans-serif",
                                  pointerEvents: 'none'
                                }}
                              >
                                <tspan x={x} dy="0">{displayName}</tspan>
                                <tspan x={x} dy="16">{hours}h {mins}m</tspan>
                              </text>
                            );
                          }}
                          outerRadius="80%"
                          paddingAngle={5}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {timeDistData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={colors.pastels[index % colors.pastels.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* Card 2: Daily Focus (Only visible when date selected) */}
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SOFT_SPRING, delay: 0.1 }}
            >
              <GlassCard style={{
                marginBottom: '20px',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent'
              } as React.CSSProperties}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', color: 'rgba(100, 100, 150, 0.8)', fontWeight: 600, fontFamily: "'Quicksand', sans-serif" }}>
                  Weekly Context - {format(startOfWeek(selectedDate, { weekStartsOn: 0 }), 'MMM d')} to {format(addDays(startOfWeek(selectedDate, { weekStartsOn: 0 }), 6), 'MMM d')}
                </h3>
                <div style={{
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent'
                }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 220, 255, 0.2)" />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: 'rgba(100, 100, 150, 0.7)', fontFamily: "'Quicksand', sans-serif", fontSize: 12 }}
                        stroke="rgba(200, 220, 255, 0.3)"
                      />
                      <YAxis
                        tick={{ fill: 'rgba(100, 100, 150, 0.7)', fontFamily: "'Quicksand', sans-serif", fontSize: 12 }}
                        stroke="rgba(200, 220, 255, 0.3)"
                        label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: 'rgba(100, 100, 150, 0.7)', fontFamily: "'Quicksand', sans-serif", fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(167, 139, 250, 0.3)',
                          borderRadius: '12px',
                          padding: '8px 12px',
                          fontFamily: "'Quicksand', sans-serif",
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'rgba(100, 100, 150, 0.9)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          outline: 'none'
                        }}
                        cursor={{ fill: 'transparent' }}
                        wrapperStyle={{ outline: 'none' }}
                        labelStyle={{ color: 'rgba(100, 100, 150, 0.8)', fontWeight: 600 }}
                      />
                      <Bar
                        dataKey="minutes"
                        fill={colors.primary}
                        radius={[8, 8, 0, 0]}
                        isAnimationActive={false}
                        shape={(props: any) => {
                          const { x, y, width, height, payload } = props;
                          const isSelected = payload.isSelected;
                          const [isHovered, setIsHovered] = React.useState(false);

                          return (
                            <rect
                              x={x}
                              y={y}
                              width={width}
                              height={height}
                              fill={isSelected ? colors.primary : 'rgba(167, 139, 250, 0.4)'}
                              fillOpacity={isHovered ? 0.8 : 1}
                              rx={8}
                              ry={8}
                              onMouseEnter={() => setIsHovered(true)}
                              onMouseLeave={() => setIsHovered(false)}
                              style={{
                                outline: 'none',
                                transition: 'fill-opacity 0.2s ease',
                                cursor: 'pointer'
                              }}
                            />
                          );
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </motion.div>
      );
    }

    if (activeTab === 'Avatar') return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={SOFT_SPRING}
        style={{ padding: '40px 24px 160px', textAlign: 'center', position: 'relative', zIndex: 1 }}
      >
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 500,
          color: 'rgba(100, 100, 150, 0.8)',
          marginBottom: '32px',
          letterSpacing: '0.05em',
          fontFamily: "'Quicksand', sans-serif"
        }}>
          Your Character
        </h1>

        <GlassCard>
          <div style={{ marginBottom: '32px' }}>
            <SproutCharacter size={160} level={userData.level} isTimerActive={false} />
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '12px 24px',
            borderRadius: '24px',
            marginBottom: '24px',
            boxShadow: '0 4px 15px rgba(167, 139, 250, 0.2)',
            display: 'inline-block'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'rgba(100, 100, 150, 0.9)', fontFamily: "'Quicksand', sans-serif" }}>
              Level {userData.level}
            </div>
          </div>

          <XpProgressBar currentXp={userData.xp} requiredXp={calculateXpForLevel(userData.level)} />
          <EvolutionStages currentLevel={userData.level} />
        </GlassCard>
      </motion.div>
    );

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={SOFT_SPRING}
        style={{ padding: '40px 24px 160px', position: 'relative', zIndex: 1 }}
      >
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 500,
          color: 'rgba(100, 100, 150, 0.8)',
          marginBottom: '32px',
          letterSpacing: '0.05em',
          fontFamily: "'Quicksand', sans-serif"
        }}>
          Settings
        </h1>

        <GlassCard style={{ marginBottom: '20px' }}>
          {[
            { icon: Volume2, label: 'Sound', enabled: false, toggle: () => { } },
            { icon: Bell, label: 'Notifications', enabled: false, toggle: () => { } },
            { icon: Moon, label: 'Dark Mode', enabled: isDarkMode, toggle: toggleDarkMode }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ x: 2 }}
              transition={SOFT_SPRING}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '20px 0',
                borderBottom: i !== 2 ? '1px solid rgba(200, 220, 255, 0.2)' : 'none',
              }}
            >
              <item.icon size={20} color="rgba(100, 100, 150, 0.7)" strokeWidth={2.5} />
              <span style={{ marginLeft: 16, flex: 1, color: 'rgba(100, 100, 150, 0.8)', fontSize: '16px', fontWeight: 500, fontFamily: "'Quicksand', sans-serif" }}>
                {item.label}
              </span>
              <SoftToggle enabled={item.enabled} onToggle={item.toggle} />
            </motion.div>
          ))}
        </GlassCard>

        <GlassCard style={{ marginBottom: '20px' }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '16px',
            color: 'rgba(100, 100, 150, 0.8)',
            fontWeight: 600,
            fontFamily: "'Quicksand', sans-serif"
          }}>
            Theme Selection
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            {(Object.keys(BACKGROUND_THEMES) as Array<'morning' | 'twilight' | 'golden' | 'midnight'>).map((themeKey) => {
              const themeData = BACKGROUND_THEMES[themeKey];
              const unlocked = isThemeUnlocked(themeKey, userData.level);
              const isSelected = selectedTheme === themeKey;

              return (
                <motion.div
                  key={themeKey}
                  whileHover={{ scale: unlocked ? 1.02 : 1 }}
                  whileTap={unlocked ? { scale: 0.98 } : {}}
                  onClick={() => handleThemeChange(themeKey)}
                  style={{
                    position: 'relative',
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: isSelected ? '3px solid rgba(167, 139, 250, 0.8)' : '2px solid rgba(200, 220, 255, 0.3)',
                    boxShadow: isSelected ? '0 4px 20px rgba(167, 139, 250, 0.3)' : '0 2px 10px rgba(147, 197, 253, 0.1)',
                    opacity: unlocked ? 1 : 0.5
                  }}
                >
                  {/* Theme Swatch */}
                  <div style={{
                    height: '80px',
                    background: themeData.gradient,
                    position: 'relative'
                  }}>
                    {/* Lock Overlay */}
                    {!unlocked && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(4px)'
                      }}>
                        <Lock size={24} color="white" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>

                  {/* Theme Label */}
                  <div style={{
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'rgba(100, 100, 150, 0.9)',
                      fontFamily: "'Quicksand', sans-serif"
                    }}>
                      {themeData.emoji} {themeData.name}
                    </div>
                    {!unlocked && (
                      <div style={{
                        fontSize: '11px',
                        color: 'rgba(100, 100, 150, 0.6)',
                        marginTop: '2px',
                        fontFamily: "'Quicksand', sans-serif"
                      }}>
                        Level {THEME_UNLOCK_LEVELS[themeKey]}+
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '16px',
            color: 'rgba(100, 100, 150, 0.8)',
            fontWeight: 600,
            fontFamily: "'Quicksand', sans-serif"
          }}>
            Developer Tools
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px',
              fontSize: '14px',
              color: 'rgba(100, 100, 150, 0.7)',
              fontWeight: 600,
              fontFamily: "'Quicksand', sans-serif"
            }}>
              <span>Force Level</span>
              <span>Level {devLevel}</span>
            </div>

            <input
              type="range"
              min="1"
              max="50"
              value={devLevel}
              onChange={(e) => handleDevLevelChange(parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '10px',
                outline: 'none',
                background: 'linear-gradient(90deg, rgba(167, 139, 250, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)',
                WebkitAppearance: 'none',
                cursor: 'pointer'
              }}
            />
          </div>

          <div style={{
            fontSize: '12px',
            color: 'rgba(100, 100, 150, 0.6)',
            textAlign: 'center',
            marginTop: '12px',
            fontFamily: "'Quicksand', sans-serif"
          }}>
            Selected Theme: {BACKGROUND_THEMES[theme].emoji} {BACKGROUND_THEMES[theme].name}
          </div>
        </GlassCard>
      </motion.div>
    );
  };

  return (
    <motion.div
      animate={{ background: BACKGROUND_THEMES[theme].gradient }}
      transition={{ duration: 2, ease: "easeInOut" }}
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <LivingAuroraBackground theme={theme} />

      {/* Category Selection Modal */}
      <CategorySelectionModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSelectCategory={handleCategorySelected}
      />

      <div style={{
        maxWidth: '480px',
        margin: '0 auto',
        position: 'relative',
        height: activeTab === 'Timer' ? '100dvh' : 'auto'
      }}>
        {renderContent()}
      </div>

      {/* Fixed Navigation - Only show for non-Timer tabs */}
      {activeTab !== 'Timer' && (
        <div style={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={SOFT_SPRING}
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '30px',
              boxShadow: '0 8px 32px rgba(147, 197, 253, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
              display: 'flex',
              gap: '8px',
              padding: '12px 20px',
              pointerEvents: 'auto',
            }}
          >
            {[
              { id: 'Timer', icon: Home },
              { id: 'Stats', icon: BarChart2 },
              { id: 'Reports', icon: FileText },
              { id: 'Avatar', icon: User },
              { id: 'Settings', icon: SettingsIcon }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <motion.div
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileTap={GENTLE_PRESS}
                  transition={SOFT_SPRING}
                  style={{
                    cursor: 'pointer',
                    padding: '10px',
                    borderRadius: '16px',
                    background: isActive ? 'rgba(167, 139, 250, 0.2)' : 'transparent',
                    boxShadow: isActive ? '0 4px 15px rgba(167, 139, 250, 0.2)' : 'none',
                  }}
                >
                  <tab.icon
                    color={isActive ? 'rgba(139, 92, 246, 0.9)' : 'rgba(100, 100, 150, 0.5)'}
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
