import React, { useState, useEffect, useRef } from 'react';
import { Home, Settings as SettingsIcon, Play, Pause, RotateCcw, Volume2, Bell, Moon, Lock, FileText, Image } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import Lottie from 'lottie-react';
import { triggerHapticFeedback } from './utils/haptics';
import { StatsPage } from './components/StatsPage';
import MeadowScreen from './screens/MeadowScreen';
import GalleryScreen from './screens/GalleryScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import { getCategories, getRecentCategories, saveEnhancedSession } from './utils/categoryManager';
import { addCompletedSession, updateUserData as updateStorageUserData, getUserData as getStorageUserData } from './utils/storage';
import { getAnimalsForBiome } from './data/biomes';
import type { BiomeType } from './types';
import type { StudyCategory } from './types/stats';

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
    const parsed = JSON.parse(data);
    // Ensure meadow fields and collection fields exist
    return {
      level: 1,
      xp: 0,
      sessionsCompleted: 0,
      meadowAnimals: [],
      lastMeadowReset: null,
      permanentCollection: [],
      activeBiome: 'meadow' as const,
      unlockedBiomes: ['meadow'],
      lastDailyReset: null,
      ...parsed
    };
  }
  return {
    level: 1,
    xp: 0,
    sessionsCompleted: 0,
    meadowAnimals: [],
    lastMeadowReset: null,
    permanentCollection: [],
    activeBiome: 'meadow' as const,
    unlockedBiomes: ['meadow'],
    lastDailyReset: null
  };
};

const saveUserData = (data: any) => {
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


const checkAndResetMeadow = () => {
  const data = getUserData();
  const today = new Date().toISOString().split('T')[0];

  if (data.lastMeadowReset !== today) {
    const newData = { ...data, meadowAnimals: [], lastMeadowReset: today };
    saveUserData(newData);
    return newData;
  }
  return data;
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

// --- CHART DATA HELPERS (removed - replaced by new stats system) ---

// --- GAME LOGIC ---
const calculateXpForLevel = (level: number) => {
  return 100 * level;
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

// Theme-aware colors for charts - 4 Distinct Palettes
const getThemeColors = (theme: 'morning' | 'twilight' | 'golden' | 'midnight') => {
  const themeColorMap = {
    morning: {
      primary: 'rgba(167, 139, 250, 0.8)',
      secondary: 'rgba(139, 92, 246, 0.8)',
      pastels: ['#E6D2FF', '#C8E6FF', '#C8FFE6', '#FFE6D2', '#FFD2E6', '#D2FFE6']
    },
    twilight: {
      primary: '#F472B6', // Neon Pink
      secondary: '#A855F7', // Electric Purple
      pastels: ['#F472B6', '#A855F7', '#2DD4BF', '#EC4899', '#9333EA', '#14B8A6']
    },
    golden: {
      primary: 'rgba(251, 191, 36, 0.8)',
      secondary: 'rgba(249, 115, 22, 0.8)',
      pastels: ['#FFE6C8', '#FFDCC8', '#FFD2C8', '#FFC8D2', '#FFE6FF', '#E6FFD2']
    },
    midnight: {
      primary: 'rgba(59, 130, 246, 0.8)',
      secondary: 'rgba(139, 92, 246, 0.8)',
      pastels: ['#3B82F6', '#8B5CF6', '#10B981', '#06B6D4', '#6366F1', '#EC4899']
    }
  };
  return themeColorMap[theme];
};

// --- SOFT ANIMATIONS ---
const SOFT_SPRING = { type: "spring" as const, stiffness: 100, damping: 20 };
const GENTLE_PRESS = { scale: 0.96 };

const MeadowIcon = ({ color, size, strokeWidth }: { color: string; size: number; strokeWidth: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const NAV_TABS = [
  { id: 'Timer', icon: Home },
  { id: 'Reports', icon: FileText },
  { id: 'Meadow', icon: MeadowIcon },
  { id: 'Collection', icon: Image },
  { id: 'Settings', icon: SettingsIcon },
] as const;

// --- BACKGROUND THEMES - 4 Distinct Palettes ---
const BACKGROUND_THEMES = {
  morning: {
    name: 'Daylight',
    emoji: '🌅',
    gradient: 'linear-gradient(180deg, #F0F4FF 0%, #F5F0FF 50%, #F0FFF5 100%)',
    orbs: [
      { color: 'rgba(230, 210, 255, 0.4)', size: 500, x: '10%', y: '10%' },
      { color: 'rgba(200, 255, 230, 0.4)', size: 450, x: '70%', y: '30%' },
      { color: 'rgba(200, 230, 255, 0.4)', size: 480, x: '40%', y: '70%' },
      { color: 'rgba(255, 220, 240, 0.4)', size: 420, x: '80%', y: '60%' }
    ],
    isDark: false,
    textMode: 'dark'
  },
  twilight: {
    name: 'Twilight',
    emoji: '🌆',
    gradient: 'linear-gradient(180deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
    orbs: [
      { color: 'rgba(244, 114, 182, 0.3)', size: 500, x: '10%', y: '10%' },
      { color: 'rgba(168, 85, 247, 0.3)', size: 450, x: '70%', y: '30%' },
      { color: 'rgba(45, 212, 191, 0.3)', size: 480, x: '40%', y: '70%' },
      { color: 'rgba(236, 72, 153, 0.3)', size: 420, x: '80%', y: '60%' }
    ],
    isDark: true,
    textMode: 'light'
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
    ],
    isDark: false,
    textMode: 'dark'
  },
  midnight: {
    name: 'Midnight',
    emoji: '🌌',
    gradient: 'linear-gradient(180deg, #000000 0%, #0F172A 50%, #1E1B4B 100%)',
    orbs: [
      { color: 'rgba(59, 130, 246, 0.3)', size: 500, x: '10%', y: '10%' },
      { color: 'rgba(139, 92, 246, 0.3)', size: 450, x: '70%', y: '30%' },
      { color: 'rgba(16, 185, 129, 0.3)', size: 480, x: '40%', y: '70%' },
      { color: 'rgba(236, 72, 153, 0.3)', size: 420, x: '80%', y: '60%' }
    ],
    isDark: true,
    textMode: 'light'
  }
};

// Helper functions for theme-aware colors
const getTextColor = (theme: 'morning' | 'twilight' | 'golden' | 'midnight', type: 'primary' | 'secondary' | 'tertiary') => {
  const isDarkText = BACKGROUND_THEMES[theme].textMode === 'dark';

  const colorMap = {
    dark: {
      primary: 'rgba(15, 23, 42, 0.95)',     // slate-900
      secondary: 'rgba(51, 65, 85, 0.8)',    // slate-700/80
      tertiary: 'rgba(100, 116, 139, 0.7)'   // slate-500/70
    },
    light: {
      primary: 'rgba(255, 255, 255, 0.9)',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.5)'
    }
  };

  return isDarkText ? colorMap.dark[type] : colorMap.light[type];
};

const getBorderColor = (theme: 'morning' | 'twilight' | 'golden' | 'midnight') => {
  const isDarkText = BACKGROUND_THEMES[theme].textMode === 'dark';
  return isDarkText ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)';
};

const getNavBackground = (theme: 'morning' | 'twilight' | 'golden' | 'midnight') => {
  const isDarkText = BACKGROUND_THEMES[theme].textMode === 'dark';
  return isDarkText ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.4)';
};

const getNavBorder = (theme: 'morning' | 'twilight' | 'golden' | 'midnight') => {
  const isDarkText = BACKGROUND_THEMES[theme].textMode === 'dark';
  return isDarkText ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
};

const getNavShadow = (theme: 'morning' | 'twilight' | 'golden' | 'midnight') => {
  const isDarkText = BACKGROUND_THEMES[theme].textMode === 'dark';
  return isDarkText
    ? '0 8px 32px rgba(100, 116, 139, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.5)'
    : '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.05)';
};

const getInactiveIconColor = (theme: 'morning' | 'twilight' | 'golden' | 'midnight') => {
  const isDarkText = BACKGROUND_THEMES[theme].textMode === 'dark';
  return isDarkText ? 'rgba(100, 116, 139, 0.6)' : 'rgba(255, 255, 255, 0.6)';
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


// --- THEME-AWARE GLASSMORPHISM CARD ---
const GlassCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; theme: 'morning' | 'twilight' | 'golden' | 'midnight' }> = ({ children, style, theme }) => {
  const isDark = BACKGROUND_THEMES[theme].isDark;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SOFT_SPRING}
      style={{
        background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
        borderRadius: '32px',
        padding: '32px',
        border: `1px solid ${getBorderColor(theme)}`,
        boxShadow: isDark
          ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.05)'
          : '0 8px 32px rgba(147, 197, 253, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
        ...style
      }}
    >
      {children}
    </motion.div>
  );
};

// --- SOFT BUTTON ---
const SoftButton: React.FC<{
  text?: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}> = ({ text, icon: Icon, onClick, variant = 'primary' }) => {
  const colors = {
    primary: {
      bg: 'linear-gradient(135deg, rgba(244, 114, 182, 0.7) 0%, rgba(168, 85, 247, 0.7) 100%)',
      shadow: '0 4px 20px rgba(244, 114, 182, 0.4)',
      hoverShadow: '0 6px 30px rgba(244, 114, 182, 0.6)'
    },
    secondary: {
      bg: 'rgba(255, 255, 255, 0.1)',
      shadow: '0 4px 20px rgba(168, 85, 247, 0.2)',
      hoverShadow: '0 6px 30px rgba(168, 85, 247, 0.3)'
    },
    ghost: {
      bg: 'rgba(255, 255, 255, 0.05)',
      shadow: '0 4px 15px rgba(45, 212, 191, 0.15)',
      hoverShadow: '0 6px 25px rgba(45, 212, 191, 0.25)'
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
  // === GLOBAL CONSTANTS — Single Source of Truth ===
  const SVG_SIZE = 100;
  const CX = SVG_SIZE / 2;
  const CY = SVG_SIZE / 2;
  const STROKE_WIDTH = 3;
  const RADIUS = (SVG_SIZE - STROKE_WIDTH) / 2 - 2; // 45.5 — fits inside viewBox with stroke
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const displaySize = 192;
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const prevMinutesRef = useRef(minutes);

  const progress = 1 - (timeLeft / totalSeconds);
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // === HANDLE POSITION — Pure Trigonometry ===
  // Angle: map minutes (5–60) to radians, starting at 12 o'clock (-π/2)
  const durationFraction = (minutes - 5) / (60 - 5);
  const handleAngle = durationFraction * 2 * Math.PI - Math.PI / 2;
  const handleX = CX + RADIUS * Math.cos(handleAngle);
  const handleY = CY + RADIUS * Math.sin(handleAngle);

  // Handle radius in SVG units (for the visible knob and hit area)
  const HANDLE_RADIUS = 7.5;
  const HANDLE_HIT_RADIUS = 12;

  // === DRAG — Convert screen coords to angle ===
  const updateMinutesFromPosition = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    // atan2(dx, -dy) gives clockwise angle from 12 o'clock
    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    const newMinutes = Math.round((angle / 360) * (60 - 5) + 5);
    const clampedMinutes = Math.max(5, Math.min(60, newMinutes));

    // Trigger haptic feedback when the value changes
    if (clampedMinutes !== prevMinutesRef.current) {
      triggerHapticFeedback(10);
      prevMinutesRef.current = clampedMinutes;
    }

    onMinutesChange(clampedMinutes);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isRunning) return;
    setIsDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    updateMinutesFromPosition(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isRunning) return;
    updateMinutesFromPosition(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (isDragging && !isRunning) {
        updateMinutesFromPosition(e.clientX, e.clientY);
      }
    };

    const handleGlobalPointerUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('pointermove', handleGlobalPointerMove);
      window.addEventListener('pointerup', handleGlobalPointerUp);
      window.addEventListener('pointercancel', handleGlobalPointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [isDragging, isRunning]);

  // Update prevMinutesRef when minutes changes externally
  useEffect(() => {
    if (!isDragging) {
      prevMinutesRef.current = minutes;
    }
  }, [minutes, isDragging]);

  return (
    <div
      style={{ position: 'relative', width: displaySize, height: displaySize, margin: '0 auto' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Single SVG — handle lives INSIDE, sharing exact same coordinate space */}
      <svg
        ref={svgRef}
        width={displaySize}
        height={displaySize}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        overflow="visible"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(167, 139, 250, 0.8)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.8)" />
          </linearGradient>
        </defs>

        {/* Background circle — uses CX, CY, RADIUS */}
        <circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />

        {/* Progress arc — uses CX, CY, RADIUS, rotated -90° so 0% starts at 12 o'clock */}
        <motion.circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          stroke="url(#lavenderGradient)"
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animate={{ strokeDashoffset: isRunning ? dashOffset : 0 }}
          strokeLinecap="round"
          transition={{ duration: 1, ease: "easeInOut" }}
          transform={`rotate(-90 ${CX} ${CY})`}
        />

        {/* Handle — rendered as SVG elements INSIDE the same coordinate space */}
        {!isRunning && (
          <g style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
            {/* Invisible larger hit area */}
            <circle
              cx={handleX}
              cy={handleY}
              r={HANDLE_HIT_RADIUS}
              fill="transparent"
              onPointerDown={handlePointerDown}
              style={{ touchAction: 'none' }}
            />
            {/* Visible handle knob */}
            <circle
              cx={handleX}
              cy={handleY}
              r={HANDLE_RADIUS}
              fill="rgba(255, 255, 255, 0.9)"
              stroke="rgba(167, 139, 250, 0.6)"
              strokeWidth="0.8"
              className="pointer-events-none"
            />
            {/* Minutes label inside handle */}
            <text
              x={handleX}
              y={handleY}
              textAnchor="middle"
              dominantBaseline="central"
              fill="rgba(139, 92, 246, 0.9)"
              fontSize="6"
              fontWeight="700"
              fontFamily="'Quicksand', sans-serif"
              className="pointer-events-none"
            >
              {minutes}
            </text>
          </g>
        )}
      </svg>

      {/* Center Display */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
        <motion.h1
          key={isRunning ? timeLeft : minutes}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.01, 1] }}
          transition={{ duration: 1 }}
          style={{
            fontSize: '2.5rem',
            margin: 0,
            color: 'rgba(139, 92, 246, 0.9)',
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
              color: 'rgba(139, 92, 246, 0.7)',
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
  const [allCategories] = useState<StudyCategory[]>(getCategories());
  const [recentCategories] = useState<StudyCategory[]>(getRecentCategories());

  if (!isOpen) return null;

  const handleCategoryClick = (category: string) => {
    onSelectCategory(category);
    setCustomInput('');
  };

  const handleBeginSession = () => {
    if (customInput.trim()) {
      onSelectCategory(customInput.trim());
    } else if (recentCategories.length > 0) {
      onSelectCategory(recentCategories[0].title);
    }
    setCustomInput('');
  };

  // Display recent categories (last 4 used) or first 4 predefined if no history
  const displayCategories = recentCategories.length > 0
    ? recentCategories
    : allCategories.slice(0, 4);

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
          color: 'rgba(15, 23, 42, 0.95)',
          marginBottom: '24px',
          textAlign: 'center',
          fontFamily: "'Quicksand', sans-serif",
          letterSpacing: '0.02em',
        }}>
          What are we focusing on?
        </h2>

        {/* Quick Select Chips with Emojis */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}>
          {displayCategories.map((category) => (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleCategoryClick(category.title)}
              style={{
                background: customInput === ''
                  ? `linear-gradient(135deg, ${category.themeColor}99 0%, ${category.accentColor}99 100%)`
                  : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: `1px solid ${customInput === '' ? category.themeColor + '66' : 'rgba(255, 255, 255, 0.3)'}`,
                borderRadius: '20px',
                padding: '16px 20px',
                cursor: 'pointer',
                color: customInput === '' ? 'white' : 'rgba(100, 100, 150, 0.9)',
                fontSize: '15px',
                fontWeight: 600,
                fontFamily: "'Quicksand', sans-serif",
                boxShadow: `0 4px 15px ${category.themeColor}33`,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>{category.emoji}</span>
              <span>{category.title}</span>
            </motion.button>
          ))}
        </div>

        {/* Custom Input Section */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: 'rgba(51, 65, 85, 0.8)',
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
              color: 'rgba(15, 23, 42, 0.95)',
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
              color: 'rgba(51, 65, 85, 0.8)',
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
  const [_selectedDate, _setSelectedDate] = useState<Date | null>(null);
  const [loadedAnimations, setLoadedAnimations] = useState<Record<string, any>>({});
  const [selectedAnimal, setSelectedAnimal] = useState(0);
  const [showAnimalSelector, setShowAnimalSelector] = useState(false);
  const [activeBiome, setActiveBiome] = useState<BiomeType>(() => {
    const storageData = getStorageUserData();
    return (storageData.activeBiome as BiomeType) || 'meadow';
  });
  const [collectionViewMode, setCollectionViewMode] = useState<'gallery' | 'achievements'>('gallery');

  const theme = selectedTheme;

  // Build companion list from the active biome's animals
  const biomeAnimals = getAnimalsForBiome(activeBiome);
  const ANIMALS = biomeAnimals.map(a => ({
    name: a.name,
    url: a.lottieUrl,
    biome: activeBiome,
    scale: a.scale,
  }));

  // Re-read active biome from storage when returning to the timer tab (user may have switched biomes in Sanctuary)
  useEffect(() => {
    if (activeTab === 'Timer') {
      const storageData = getStorageUserData();
      const storedBiome = (storageData.activeBiome as BiomeType) || 'meadow';
      if (storedBiome !== activeBiome) {
        setActiveBiome(storedBiome);
        setSelectedAnimal(0); // Reset selection when biome changes
      }
    }
  }, [activeTab]);

  // Disable scrolling on the home (Timer) tab
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.style.overflowY = activeTab === 'Timer' ? 'hidden' : 'auto';
    }
  }, [activeTab]);

  // Persistence Engine: Load saved data on mount
  useEffect(() => {
    const savedHistory = getFocusHistory();
    setFocusHistory(savedHistory);
    // Check and reset meadow daily
    const resetData = checkAndResetMeadow();
    setUserData(resetData);
  }, []);

  // Load all animal animations for selector and timer display (re-runs when biome changes)
  useEffect(() => {
    const loadAllAnimals = async () => {
      for (let i = 0; i < ANIMALS.length; i++) {
        const animalKey = `selected-${activeBiome}-${i}`;
        if (!loadedAnimations[animalKey]) {
          try {
            const response = await fetch(ANIMALS[i].url);
            const data = await response.json();
            setLoadedAnimations(prev => ({ ...prev, [animalKey]: data }));
          } catch (error) {
            console.error(`Error loading animal ${i}:`, error);
          }
        }
      }
    };
    loadAllAnimals();
  }, [activeBiome]);

  // Load Lottie animations for meadow animals
  useEffect(() => {
    const loadAnimations = async () => {
      const meadowAnimals = userData.meadowAnimals || [];
      console.log('🌱 Loading meadow animations for', meadowAnimals.length, 'animals');

      for (const animal of meadowAnimals) {
        console.log('🐾 Attempting to load animal:', animal.id, 'URL:', animal.lottieUrl);

        try {
          const response = await fetch(animal.lottieUrl);
          if (!response.ok) {
            console.error('❌ Failed to fetch animation:', response.status, response.statusText);
            continue;
          }
          const data = await response.json();
          console.log('✅ Loaded animation for:', animal.id);
          setLoadedAnimations(prev => ({ ...prev, [animal.id]: data }));
        } catch (error) {
          console.error('❌ Error loading meadow animal animation:', error, 'for animal:', animal.id);
        }
      }
    };

    if (activeTab === 'Meadow' && userData.meadowAnimals && userData.meadowAnimals.length > 0) {
      console.log('🎯 Meadow tab active, triggering animation load');
      loadAnimations();
    }
  }, [activeTab, userData.meadowAnimals]);

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

    // Save session to both old and enhanced storage
    const savedSession = saveSession(currentCategory || 'Uncategorized', timerMinutes);
    setFocusHistory(prev => [...prev, savedSession]);

    // Also save to enhanced session storage with category metadata
    saveEnhancedSession(currentCategory || 'Uncategorized', timerMinutes);

    // Save the selected animal info to storage so addCompletedSession picks it up
    const currentAnimal = ANIMALS[selectedAnimal];
    const storageNow = getStorageUserData();
    updateStorageUserData({
      ...storageNow,
      selectedAnimal: {
        id: biomeAnimals[selectedAnimal]?.id || 'bunny',
        name: currentAnimal.name,
        biome: activeBiome,
        lottieUrl: currentAnimal.url,
      },
    });

    // Add completed session to storage (this spawns biome animal automatically)
    addCompletedSession(timerMinutes, currentAnimal.url);

    // Read back updated data from canonical storage (pomodoroStudyApp key)
    // This includes the new permanentCollection and meadowAnimals
    const updatedStorage = getStorageUserData();

    // XP Scaling Logic: XP = timerMinutes * 10 (10 XP per minute)
    // Bonus: +0.5% XP per minute (longer sessions get better odds for animals)
    const xpGained = timerMinutes * 10;
    let newLevel = userData.level;
    let remainingXp = userData.xp + xpGained;

    // Handle level up (can level up multiple times)
    while (remainingXp >= calculateXpForLevel(newLevel)) {
      const xpNeeded = calculateXpForLevel(newLevel);
      remainingXp -= xpNeeded;
      newLevel += 1;
    }

    // Update local userData - sync permanentCollection and meadowAnimals from canonical storage
    const newData = {
      level: newLevel,
      xp: remainingXp,
      sessionsCompleted: userData.sessionsCompleted + 1,
      meadowAnimals: updatedStorage.meadowAnimals || [],
      permanentCollection: updatedStorage.permanentCollection || [],
      lastMeadowReset: userData.lastMeadowReset
    };

    setUserData({ ...userData, ...newData });
    saveUserData({ ...userData, ...newData });
    triggerCelebration();
  };

  const handleDevLevelChange = (level: number) => {
    setDevLevel(level);
    const unlockedBiomes: any[] = [];
    // Unlock biomes based on level
    const levelThresholds: any = { meadow: 0, safari: 10, forest: 20, ocean: 30, arctic: 40, mountain: 50 };
    Object.entries(levelThresholds).forEach(([biome, threshold]: any) => {
      if (level >= threshold) unlockedBiomes.push(biome);
    });

    // Update the canonical storage (pomodoroStudyApp key) so MeadowScreen sees the change
    updateStorageUserData({
      level: level,
      xp: 0,
      unlockedBiomes: unlockedBiomes.length > 0 ? unlockedBiomes : ['meadow']
    });

    // Also sync App-level state
    const newData = {
      ...userData,
      level: level,
      xp: 0,
      unlockedBiomes: unlockedBiomes.length > 0 ? unlockedBiomes : ['meadow']
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
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1rem 0',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Zone 1 (Top): Header - flex-1 */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%'
        }}>
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: 500,
              color: getTextColor(selectedTheme, 'primary'),
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
        </div>

        {/* Zone 2 (Middle): Timer & Mascot Card - flex-[2.5] */}
        <div style={{
          flex: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '0 1.25rem'
        }}>
          <GlassCard theme={selectedTheme} style={{
            width: '100%',
            maxWidth: '400px',
            padding: '24px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ maxHeight: '85%', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <InteractiveTimerRing
                minutes={timerMinutes}
                onMinutesChange={setTimerMinutes}
                isRunning={isRunning}
                timeLeft={timeLeft}
                totalSeconds={timerMinutes * 60}
              />
            </div>

            {/* Selected Animal Display */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '12px'
            }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAnimalSelector(true)}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '80px',
                  height: '80px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
              >
                {loadedAnimations[`selected-${activeBiome}-${selectedAnimal}`] ? (
                  <div style={{ width: ANIMALS[selectedAnimal]?.scale ? `${80 * ANIMALS[selectedAnimal].scale}px` : '80px', height: ANIMALS[selectedAnimal]?.scale ? `${80 * ANIMALS[selectedAnimal].scale}px` : '80px', flexShrink: 0 }}>
                    <Lottie
                      animationData={loadedAnimations[`selected-${activeBiome}-${selectedAnimal}`]}
                      loop={true}
                      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                    />
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', color: getTextColor(selectedTheme, 'secondary') }}>
                    Loading...
                  </div>
                )}
              </motion.div>

              <div style={{
                background: BACKGROUND_THEMES[selectedTheme].isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                padding: '4px 12px',
                borderRadius: '16px',
                boxShadow: '0 4px 15px rgba(147, 197, 253, 0.2)',
                fontSize: '11px',
                fontWeight: 600,
                color: getTextColor(selectedTheme, 'secondary'),
                display: 'inline-block',
                fontFamily: "'Quicksand', sans-serif",
                textAlign: 'center',
                marginTop: '8px'
              }}>
                {ANIMALS[selectedAnimal].name}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Animal Selector Overlay */}
        {showAnimalSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAnimalSelector(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: BACKGROUND_THEMES[selectedTheme].isDark
                  ? 'rgba(30, 30, 60, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                padding: '24px',
                border: `1px solid ${BACKGROUND_THEMES[selectedTheme].isDark ? 'rgba(167, 139, 250, 0.3)' : 'rgba(200, 200, 220, 0.5)'}`,
                boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
                width: '100%',
                maxWidth: '340px',
              }}
            >
              <div style={{
                fontSize: '16px',
                fontWeight: 700,
                color: getTextColor(selectedTheme, 'primary'),
                fontFamily: "'Quicksand', sans-serif",
                textAlign: 'center',
                marginBottom: '20px',
              }}>
                Choose Your Companion
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '10px',
              }}>
                {ANIMALS.map((animal, index) => {
                  const isSelected = selectedAnimal === index;
                  return (
                    <motion.button
                      key={animal.name}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setSelectedAnimal(index);
                        setShowAnimalSelector(false);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 12px',
                        borderRadius: '18px',
                        border: isSelected
                          ? '2px solid rgba(167, 139, 250, 0.8)'
                          : `2px solid ${BACKGROUND_THEMES[selectedTheme].isDark ? 'rgba(255,255,255,0.12)' : 'rgba(200, 200, 220, 0.4)'}`,
                        background: isSelected
                          ? 'rgba(167, 139, 250, 0.2)'
                          : 'transparent',
                        cursor: 'pointer',
                        width: '28%',
                        minWidth: '80px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ width: '56px', height: '56px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {loadedAnimations[`selected-${activeBiome}-${index}`] ? (
                          <div style={{ width: animal.scale ? `${56 * animal.scale}px` : '56px', height: animal.scale ? `${56 * animal.scale}px` : '56px', flexShrink: 0 }}>
                            <Lottie
                              animationData={loadedAnimations[`selected-${activeBiome}-${index}`]}
                              loop={true}
                              style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                            />
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: getTextColor(selectedTheme, 'tertiary') }}>
                            ...
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: isSelected
                          ? (BACKGROUND_THEMES[selectedTheme].isDark ? '#c4b5fd' : '#7c3aed')
                          : getTextColor(selectedTheme, 'secondary'),
                        fontFamily: "'Quicksand', sans-serif",
                      }}>
                        {animal.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Zone 3 (Bottom): Action Zone - flex-1.5 */}
        <div style={{
          flex: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          width: '100%',
          padding: '0 1.25rem'
        }}>
          {/* Start/Stop Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '280px',
            width: '100%',
            marginBottom: '3rem'
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

        </div>
      </div>
    );

    if (activeTab === 'Reports') {
      return <StatsPage theme={selectedTheme} />;
    }

    if (activeTab === 'Meadow') {
      return <MeadowScreen />;
    }

    if (activeTab === 'Collection') {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ padding: '40px 24px 160px', position: 'relative', zIndex: 1 }}
        >
          {/* Collection View Toggle */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <motion.button
              onClick={() => setCollectionViewMode('gallery')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '16px',
                border: collectionViewMode === 'gallery' ? '2px solid rgba(167, 139, 250, 0.6)' : '1px solid rgba(200, 200, 200, 0.3)',
                background: collectionViewMode === 'gallery' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                color: getTextColor(selectedTheme, 'primary'),
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: "'Quicksand', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📚 Gallery
            </motion.button>
            <motion.button
              onClick={() => setCollectionViewMode('achievements')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '16px',
                border: collectionViewMode === 'achievements' ? '2px solid rgba(167, 139, 250, 0.6)' : '1px solid rgba(200, 200, 200, 0.3)',
                background: collectionViewMode === 'achievements' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                color: getTextColor(selectedTheme, 'primary'),
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: "'Quicksand', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🏆 Achievements
            </motion.button>
          </div>

          {/* Gallery View */}
          {collectionViewMode === 'gallery' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <GalleryScreen collection={userData.permanentCollection} theme={selectedTheme} />
            </motion.div>
          )}

          {/* Achievements View */}
          {collectionViewMode === 'achievements' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AchievementsScreen userData={userData} theme={selectedTheme} />
            </motion.div>
          )}
        </motion.div>
      );
    }

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
          color: getTextColor(selectedTheme, 'primary'),
          marginBottom: '32px',
          letterSpacing: '0.05em',
          fontFamily: "'Quicksand', sans-serif"
        }}>
          Settings
        </h1>

        <GlassCard theme={selectedTheme} style={{ marginBottom: '20px' }}>
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
                borderBottom: i !== 2 ? `1px solid ${getBorderColor(selectedTheme)}` : 'none',
              }}
            >
              <item.icon size={20} color={getTextColor(selectedTheme, 'secondary')} strokeWidth={2.5} />
              <span style={{ marginLeft: 16, flex: 1, color: getTextColor(selectedTheme, 'primary'), fontSize: '16px', fontWeight: 500, fontFamily: "'Quicksand', sans-serif" }}>
                {item.label}
              </span>
              <SoftToggle enabled={item.enabled} onToggle={item.toggle} />
            </motion.div>
          ))}
        </GlassCard>

        <GlassCard theme={selectedTheme} style={{ marginBottom: '20px' }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '16px',
            color: getTextColor(selectedTheme, 'primary'),
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
                    background: themeData.isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: getTextColor(themeKey, 'primary'),
                      fontFamily: "'Quicksand', sans-serif"
                    }}>
                      {themeData.emoji} {themeData.name}
                    </div>
                    {!unlocked && (
                      <div style={{
                        fontSize: '11px',
                        color: getTextColor(themeKey, 'tertiary'),
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

        <GlassCard theme={selectedTheme}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '16px',
            color: getTextColor(selectedTheme, 'primary'),
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
              color: getTextColor(selectedTheme, 'secondary'),
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
            color: getTextColor(selectedTheme, 'tertiary'),
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
    <>
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
        height: activeTab === 'Timer' ? '100dvh' : 'auto',
        overflow: activeTab === 'Timer' ? 'hidden' : undefined,
      }}>
        {renderContent()}
      </div>
    </motion.div>

      {/* Fixed Navigation - Always visible */}
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
        <div
            style={{
              background: getNavBackground(selectedTheme),
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              border: `1px solid ${getNavBorder(selectedTheme)}`,
              borderRadius: '30px',
              boxShadow: getNavShadow(selectedTheme),
              display: 'flex',
              gap: '8px',
              padding: '10px 16px',
              pointerEvents: 'auto',
            }}
          >
            {NAV_TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const colors = getThemeColors(selectedTheme);
              const IconComponent = tab.icon;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '14px',
                    background: isActive ? (BACKGROUND_THEMES[selectedTheme].isDark ? 'rgba(244, 114, 182, 0.2)' : 'rgba(167, 139, 250, 0.2)') : 'transparent',
                    boxShadow: isActive ? `0 4px 15px ${colors.primary}33` : 'none',
                    transition: 'background 0.2s, box-shadow 0.2s',
                  }}
                >
                  <IconComponent
                    color={isActive ? colors.primary : getInactiveIconColor(selectedTheme)}
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}
