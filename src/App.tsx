import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Home, Settings as SettingsIcon, Play, Pause, Bell, Lock, FileText, Image, X, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Lottie from 'lottie-react';
import RiveComponent from '@rive-app/react-canvas';
import { triggerHapticFeedback, triggerSelectionTick } from './utils/haptics';
import { StatsPage } from './components/StatsPage';
import MeadowScreen from './screens/MeadowScreen';
import GalleryScreen from './screens/GalleryScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import { getNewlyUnlocked } from './utils/achievements';
import type { Achievement } from './utils/achievements';
import { getCategories, getRecentCategories, getOrCreateCategory, saveEnhancedSession, categoryExists, createCustomCategory, CUSTOM_CATEGORY_COLORS } from './utils/categoryManager';
import { addCompletedSession, addFailedSession, updateUserData as updateStorageUserData, getUserData as getStorageUserData, purchaseAnimal } from './utils/storage';
import { getAnimalsForBiome, getStarterAnimalIds, getAllAnimalIds } from './data/biomes';
import type { BiomeType } from './types';

// --- STORAGE HELPERS ---
const getSelectedTheme = (): 'morning' | 'midnight' => {
  const stored = localStorage.getItem('selectedTheme');
  if (stored && ['morning', 'midnight'].includes(stored)) {
    return stored as 'morning' | 'midnight';
  }
  return 'morning';
};

const setSelectedTheme = (theme: 'morning' | 'midnight') => {
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
      coins: 0,
      purchasedAnimals: [],
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
    lastDailyReset: null,
    coins: 0,
    purchasedAnimals: getStarterAnimalIds(),
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

// --- CHART DATA HELPERS (removed - replaced by new stats system) ---

// --- GAME LOGIC ---


// All themes are always unlocked
// Theme-aware colors for charts - 2 Distinct Palettes
const getThemeColors = (theme: 'morning' | 'midnight') => {
  const themeColorMap = {
    morning: {
      primary: 'rgba(167, 139, 250, 0.8)',
      secondary: 'rgba(139, 92, 246, 0.8)',
      pastels: ['#E6D2FF', '#C8E6FF', '#C8FFE6', '#FFE6D2', '#FFD2E6', '#D2FFE6']
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

// --- BACKGROUND THEMES - 2 Palettes ---
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
const getTextColor = (theme: 'morning' | 'midnight', type: 'primary' | 'secondary' | 'tertiary') => {
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

const getBorderColor = (theme: 'morning' | 'midnight') => {
  const isDarkText = BACKGROUND_THEMES[theme].textMode === 'dark';
  return isDarkText ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)';
};

const getNavBackground = (theme: 'morning' | 'midnight') => {
  const isDarkText = BACKGROUND_THEMES[theme].textMode === 'dark';
  return isDarkText ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
};

const getNavBorder = (_theme: 'morning' | 'midnight') => {
  return 'transparent';
};

const getNavShadow = (_theme: 'morning' | 'midnight') => {
  return 'none';
};

const getInactiveIconColor = (theme: 'morning' | 'midnight') => {
  const isDarkText = BACKGROUND_THEMES[theme].textMode === 'dark';
  return isDarkText ? 'rgba(100, 116, 139, 0.6)' : 'rgba(255, 255, 255, 0.6)';
};

const getTabBackground = (theme: 'morning' | 'midnight', isActive: boolean) => {
  const isLightTheme = theme === 'morning';

  if (isActive) {
    return 'rgba(167, 139, 250, 0.2)';
  }

  return isLightTheme ? 'rgba(255, 255, 255, 0.5)' : 'rgba(167, 139, 250, 0.1)';
};

const getTabBorder = (theme: 'morning' | 'midnight', isActive: boolean) => {
  const isLightTheme = theme === 'morning';

  if (isActive) {
    return '2px solid rgba(167, 139, 250, 0.6)';
  }

  return isLightTheme ? '1px solid rgba(200, 200, 200, 0.3)' : '1px solid rgba(167, 139, 250, 0.2)';
};

// --- LIVING AURORA MESH BACKGROUND ---
const LivingAuroraBackground: React.FC<{ theme: 'morning' | 'midnight' }> = ({ theme }) => {
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
const GlassCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; theme: 'morning' | 'midnight' }> = ({ children, style, theme }) => {
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
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
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
    },
    danger: {
      bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.7) 0%, rgba(185, 28, 28, 0.7) 100%)',
      shadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
      hoverShadow: '0 6px 30px rgba(239, 68, 68, 0.5)'
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
        color: (variant === 'primary' || variant === 'danger') ? 'white' : 'rgba(100, 100, 150, 1)',
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
  isPaused: boolean;
  timeLeft: number;
  totalSeconds: number;
}> = ({ minutes, onMinutesChange, isRunning, isPaused, timeLeft, totalSeconds }) => {
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
  // Angle: map minutes (1–60) to radians, starting at 12 o'clock (-π/2)
  const durationFraction = (minutes - 1) / (60 - 1);
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

    const newMinutes = Math.round((angle / 360) * (60 - 1) + 1);
    const clampedMinutes = Math.max(1, Math.min(60, newMinutes));

    // Trigger a picker-style tick each time the value changes
    if (clampedMinutes !== prevMinutesRef.current) {
      triggerSelectionTick();
      prevMinutesRef.current = clampedMinutes;
    }

    onMinutesChange(clampedMinutes);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isRunning || isPaused) return;
    setIsDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    updateMinutesFromPosition(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isRunning || isPaused) return;
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
          animate={{ strokeDashoffset: (isRunning || isPaused) ? dashOffset : 0 }}
          strokeLinecap="round"
          transition={{ duration: 1, ease: "easeInOut" }}
          transform={`rotate(-90 ${CX} ${CY})`}
        />

        {/* Handle — rendered as SVG elements INSIDE the same coordinate space */}
        {!isRunning && !isPaused && (
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
          key={(isRunning || isPaused) ? timeLeft : minutes}
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
          {(isRunning || isPaused) ? formatTime(timeLeft) : `${minutes}:00`}
        </motion.h1>
        {!isRunning && !isPaused && (
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
            <span style={{ filter: 'sepia(1) saturate(3) brightness(1.1) hue-rotate(15deg)' }}>🪙</span> {minutes} coins
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

// --- CATEGORY CUSTOMIZE MODAL (color + emoji picker for new subjects) ---
const EMOJI_OPTIONS = [
  '📚', '📐', '💻', '🧪', '💰', '✍️', '🗣️', '🎵',
  '🎨', '📊', '🧮', '🔬', '📝', '🏋️', '🧠', '🌍',
  '⚖️', '🩺', '📷', '🎭', '🔧', '🧬', '📖', '🎓',
];

const CategoryCustomizeModal: React.FC<{
  isOpen: boolean;
  categoryTitle: string;
  theme: 'morning' | 'midnight';
  onConfirm: (emoji: string, themeColor: string, accentColor: string) => void;
  onCancel: () => void;
}> = ({ isOpen, categoryTitle, theme, onConfirm, onCancel }) => {
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  // Reset selections when the modal opens with a new title
  useEffect(() => {
    if (isOpen) {
      setSelectedEmoji(EMOJI_OPTIONS[0]);
      setSelectedColorIdx(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isDark = BACKGROUND_THEMES[theme].isDark;
  const selectedColor = CUSTOM_CATEGORY_COLORS[selectedColorIdx];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2100,
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDark
            ? 'rgba(30, 30, 60, 0.95)'
            : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '32px',
          padding: '28px 24px',
          border: isDark
            ? '1px solid rgba(139, 92, 246, 0.3)'
            : '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: isDark
            ? '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(139, 92, 246, 0.1)'
            : '0 8px 32px rgba(147, 197, 253, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
          maxWidth: '400px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        {/* Preview */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            background: `linear-gradient(135deg, ${selectedColor[0]}99 0%, ${selectedColor[1]}99 100%)`,
            borderRadius: '20px',
            padding: '12px 24px',
            boxShadow: `0 4px 15px ${selectedColor[0]}33`,
          }}>
            <span style={{ fontSize: '1.5rem' }}>{selectedEmoji}</span>
            <span style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'white',
              fontFamily: "'Quicksand', sans-serif",
            }}>{categoryTitle}</span>
          </div>
        </div>

        {/* Emoji Picker */}
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 600,
          color: getTextColor(theme, 'secondary'),
          marginBottom: '10px',
          fontFamily: "'Quicksand', sans-serif",
        }}>
          Choose an emoji
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: '6px',
          marginBottom: '20px',
        }}>
          {EMOJI_OPTIONS.map((emoji) => (
            <motion.button
              key={emoji}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedEmoji(emoji)}
              style={{
                width: '100%',
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                borderRadius: '12px',
                border: selectedEmoji === emoji
                  ? `2px solid ${selectedColor[0]}`
                  : '2px solid transparent',
                background: selectedEmoji === emoji
                  ? `${selectedColor[0]}25`
                  : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {emoji}
            </motion.button>
          ))}
        </div>

        {/* Color Picker */}
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 600,
          color: getTextColor(theme, 'secondary'),
          marginBottom: '10px',
          fontFamily: "'Quicksand', sans-serif",
        }}>
          Choose a color
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '8px',
          marginBottom: '24px',
        }}>
          {CUSTOM_CATEGORY_COLORS.map(([clr, accent], idx) => (
            <motion.button
              key={clr}
              whileTap={{ scale: 0.85 }}
              onClick={() => setSelectedColorIdx(idx)}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${clr} 0%, ${accent} 100%)`,
                border: selectedColorIdx === idx
                  ? isDark ? '3px solid rgba(255, 255, 255, 0.8)' : '3px solid rgba(15, 23, 42, 0.7)'
                  : '3px solid transparent',
                cursor: 'pointer',
                boxShadow: selectedColorIdx === idx
                  ? isDark
                    ? `0 0 0 2px rgba(30, 30, 60, 0.95), 0 4px 12px ${clr}55`
                    : `0 0 0 2px white, 0 4px 12px ${clr}55`
                  : `0 2px 8px ${clr}33`,
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCancel}
            style={{
              flex: 1,
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: isDark
                ? '1px solid rgba(255, 255, 255, 0.15)'
                : '1px solid rgba(200, 220, 255, 0.3)',
              borderRadius: '20px',
              padding: '14px 24px',
              cursor: 'pointer',
              color: getTextColor(theme, 'secondary'),
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: "'Quicksand', sans-serif",
              boxShadow: isDark ? 'none' : '0 4px 15px rgba(147, 197, 253, 0.15)',
            }}
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onConfirm(selectedEmoji, selectedColor[0], selectedColor[1])}
            style={{
              flex: 2,
              background: `linear-gradient(135deg, ${selectedColor[0]}cc 0%, ${selectedColor[1]}cc 100%)`,
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
              boxShadow: `0 4px 20px ${selectedColor[0]}44`,
            }}
          >
            Start Studying
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- CATEGORY SELECTION MODAL ---
const CategorySelectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: string) => void;
  theme: 'morning' | 'midnight';
}> = ({ isOpen, onClose, onSelectCategory, theme }) => {
  const [customInput, setCustomInput] = useState('');

  // Re-read categories from storage every time the modal opens
  const allCategories = useMemo(() => getCategories(), [isOpen]);
  const recentCategories = useMemo(() => getRecentCategories(), [isOpen]);

  if (!isOpen) return null;

  const isDark = BACKGROUND_THEMES[theme].isDark;

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

  // Display recent categories first, fill remaining slots with predefined defaults
  const displayCategories = (() => {
    if (recentCategories.length >= 4) return recentCategories.slice(0, 4);
    if (recentCategories.length === 0) return allCategories.slice(0, 4);
    // Merge recents with predefined to fill 4 slots
    const recentIds = new Set(recentCategories.map(c => c.id));
    const fillers = allCategories.filter(c => !recentIds.has(c.id));
    return [...recentCategories, ...fillers].slice(0, 4);
  })();

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
        background: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)',
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
          background: isDark
            ? 'rgba(30, 30, 60, 0.95)'
            : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '32px',
          padding: '32px 24px',
          border: isDark
            ? '1px solid rgba(139, 92, 246, 0.3)'
            : '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: isDark
            ? '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(139, 92, 246, 0.1)'
            : '0 8px 32px rgba(147, 197, 253, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
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
          color: getTextColor(theme, 'primary'),
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
                  : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: `1px solid ${customInput === '' ? category.themeColor + '66' : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
                borderRadius: '20px',
                padding: '16px 20px',
                cursor: 'pointer',
                color: customInput === '' ? 'white' : isDark ? 'rgba(200, 200, 230, 0.7)' : 'rgba(100, 100, 150, 0.9)',
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
              {category.emoji && <span style={{ fontSize: '1.25rem' }}>{category.emoji}</span>}
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
            color: getTextColor(theme, 'secondary'),
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
              border: isDark
                ? '1px solid rgba(139, 92, 246, 0.3)'
                : '1px solid rgba(200, 220, 255, 0.4)',
              background: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              fontSize: '15px',
              color: getTextColor(theme, 'primary'),
              fontFamily: "'Quicksand', sans-serif",
              fontWeight: 500,
              outline: 'none',
              boxShadow: isDark
                ? '0 2px 10px rgba(0, 0, 0, 0.2)'
                : '0 2px 10px rgba(147, 197, 253, 0.1)',
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
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: isDark
                ? '1px solid rgba(255, 255, 255, 0.15)'
                : '1px solid rgba(200, 220, 255, 0.3)',
              borderRadius: '20px',
              padding: '14px 24px',
              cursor: 'pointer',
              color: getTextColor(theme, 'secondary'),
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: "'Quicksand', sans-serif",
              boxShadow: isDark ? 'none' : '0 4px 15px rgba(147, 197, 253, 0.15)',
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
  const [isPaused, setIsPaused] = useState(false);
  const [userData, setUserData] = useState(getUserData());
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(timerMinutes * 60);
  const [selectedTheme, setSelectedThemeState] = useState<'morning' | 'midnight'>(getSelectedTheme());
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [pendingCategory, setPendingCategory] = useState('');
  const [showFailConfirm, setShowFailConfirm] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string>('');
const [_selectedDate, _setSelectedDate] = useState<Date | null>(null);
  const [loadedAnimations, setLoadedAnimations] = useState<Record<string, any>>({});
  const [selectedAnimal, setSelectedAnimal] = useState(0);
  const [showAnimalSelector, setShowAnimalSelector] = useState(false);
  const [activeBiome, setActiveBiome] = useState<BiomeType>(() => {
    const storageData = getStorageUserData();
    return (storageData.activeBiome as BiomeType) || 'meadow';
  });
  const [collectionViewMode, setCollectionViewMode] = useState<'gallery' | 'achievements'>('gallery');
  const [purchaseTarget, setPurchaseTarget] = useState<{ index: number; id: string; name: string; price: number } | null>(null);
  const [chestOpening, setChestOpening] = useState<{
    stage: number; // 0=appear, 1=wobble, 2=shake+crack, 3=burst+reveal
    animalIndex: number;
    animalName: string;
  } | null>(null);
  const [chestAnimData, setChestAnimData] = useState<any>(null);
  const chestLottieRef = useRef<any>(null);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  const theme = selectedTheme;

  // Update meta theme-color and body background for full safe area coverage
  useEffect(() => {
    const themeColorMap = {
      morning: '#F0F4FF',
      midnight: '#000000'
    };

    // Solid fallback colors (bottom of each gradient) — shown if gradient fails to paint
    const themeSolidFallback = {
      morning: '#F0FFF5',
      midnight: '#1E1B4B'
    };

    // Gradients that match BACKGROUND_THEMES - used for body fallback
    const gradientMap = {
      morning: 'linear-gradient(180deg, #F0F4FF 0%, #F5F0FF 50%, #F0FFF5 100%)',
      midnight: 'linear-gradient(180deg, #000000 0%, #0F0F23 50%, #1E1B4B 100%)'
    };

    const color = themeColorMap[selectedTheme];
    const gradient = gradientMap[selectedTheme];
    const solidFallback = themeSolidFallback[selectedTheme];

    // Update meta theme-color for browser UI
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', color);
    }

    // Set gradient on html/body/root as fallback for areas not covered by React content.
    // Use backgroundImage + backgroundColor separately so the dark solid color is never
    // wiped out by the gradient shorthand (which would reset background-color to transparent,
    // exposing the white browser canvas on iOS WebKit when html has overflow:clip).
    const applyBackground = (el: HTMLElement) => {
      el.style.backgroundImage = gradient;
      el.style.backgroundColor = solidFallback;
    };

    applyBackground(document.documentElement);
    applyBackground(document.body);

    const root = document.getElementById('root');
    if (root) {
      applyBackground(root);
    }
  }, [selectedTheme]);

  // Build companion list from the active biome's animals
  const biomeAnimals = getAnimalsForBiome(activeBiome);
  const ANIMALS = biomeAnimals.map(a => ({
    id: a.id,
    name: a.name,
    url: a.lottieUrl,
    biome: activeBiome,
    scale: a.scale,
    price: a.price,
  }));

  // Re-read active biome from storage when returning to the timer tab (user may have switched biomes in Sanctuary)
  useEffect(() => {
    if (activeTab === 'Timer') {
      const storageData = getStorageUserData();
      const storedBiome = (storageData.activeBiome as BiomeType) || 'meadow';
      if (storedBiome !== activeBiome) {
        setActiveBiome(storedBiome);
        // Find first owned animal in new biome
        const newBiomeAnimals = getAnimalsForBiome(storedBiome);
        const owned = storageData.purchasedAnimals || [];
        const firstOwnedIdx = newBiomeAnimals.findIndex(a => a.price === 0 || owned.includes(a.id));
        setSelectedAnimal(firstOwnedIdx >= 0 ? firstOwnedIdx : 0);
      }
    }
  }, [activeTab]);

  // Disable scrolling on the home (Timer) tab
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.style.overflowY = activeTab === 'Timer' ? 'hidden' : 'auto';
    }
    // Also lock html/body to prevent browser-level scrolling
    if (activeTab === 'Timer') {
      document.documentElement.classList.add('no-scroll');
    } else {
      document.documentElement.classList.remove('no-scroll');
    }
  }, [activeTab]);

  // Persistence Engine: Load saved data on mount
  useEffect(() => {
    // Check and reset meadow daily
    const resetData = checkAndResetMeadow();
    setUserData(resetData);
  }, []);

  // Load all animal animations for selector and timer display (re-runs when biome changes)
  useEffect(() => {
    const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<any> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return await response.json();
        } catch (error) {
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, delay * (attempt + 1)));
          } else {
            throw error;
          }
        }
      }
    };

    const loadAllAnimals = async () => {
      const promises = ANIMALS.map(async (animal, i) => {
        const animalKey = `selected-${activeBiome}-${i}`;
        if (!loadedAnimations[animalKey]) {
          try {
            const data = await fetchWithRetry(animal.url);
            setLoadedAnimations(prev => ({ ...prev, [animalKey]: data }));
          } catch (error) {
            console.error(`Error loading animal ${i} after retries:`, error);
          }
        }
      });
      await Promise.all(promises);
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

  // Update timeLeft when timerMinutes changes (NOT when isRunning changes)
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(timerMinutes * 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerMinutes]);

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

  const handleThemeChange = (theme: 'morning' | 'midnight') => {
    setSelectedThemeState(theme);
    setSelectedTheme(theme);
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
    setIsPaused(false);

    // Snapshot canonical storage data BEFORE the session update (for achievement comparison)
    const storageBefore = getStorageUserData();

    // Save session to enhanced storage (also saves to old format for backward compatibility)
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

    // Check for newly unlocked achievements
    const newAchievements = getNewlyUnlocked(storageBefore, updatedStorage);
    if (newAchievements.length > 0) {
      // Show first achievement immediately
      setUnlockedAchievement(newAchievements[0]);
      // Queue additional achievements if multiple unlocked
      let delay = 3500;
      for (let i = 1; i < newAchievements.length; i++) {
        setTimeout(() => setUnlockedAchievement(newAchievements[i]), delay);
        delay += 3500;
      }
    }

    // Coins earned = 1 per minute studied
    const coinsEarned = timerMinutes;

    // Update local userData - sync from canonical storage (pomodoroStudyApp key)
    const newData = {
      sessionsCompleted: (userData.sessionsCompleted || 0) + 1,
      meadowAnimals: updatedStorage.meadowAnimals || [],
      permanentCollection: updatedStorage.permanentCollection || [],
      lastMeadowReset: userData.lastMeadowReset,
      coins: updatedStorage.coins ?? ((userData.coins ?? 0) + coinsEarned),
    };

    setUserData({ ...userData, ...newData });
    saveUserData({ ...userData, ...newData });
    triggerCelebration();
  };

  const handleFailSession = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(timerMinutes * 60);
    addFailedSession();
    saveEnhancedSession(currentCategory || 'Uncategorized', timerMinutes, false);
  };

  const handleStartFocus = () => {
    setShowCategoryModal(true);
  };

  const handleCategorySelected = (category: string) => {
    // If this is a brand-new category, show the customization popup first
    if (!categoryExists(category)) {
      setPendingCategory(category);
      setShowCategoryModal(false);
      setShowCustomizeModal(true);
      return;
    }
    // Existing category — register and start immediately
    getOrCreateCategory(category);
    setCurrentCategory(category);
    setShowCategoryModal(false);
    setIsRunning(true);
  };

  const handleCustomizeConfirm = (emoji: string, themeColor: string, accentColor: string) => {
    createCustomCategory(pendingCategory, emoji, themeColor, accentColor);
    setCurrentCategory(pendingCategory);
    setShowCustomizeModal(false);
    setPendingCategory('');
    setIsRunning(true);
  };

  const handleCustomizeCancel = () => {
    setShowCustomizeModal(false);
    setPendingCategory('');
    // Re-open the category selection modal so the user can pick again
    setShowCategoryModal(true);
  };

  // Load chest animation data on first purchase
  useEffect(() => {
    if (chestOpening && !chestAnimData) {
      fetch('/studyapp/treasure-3d.json')
        .then(r => r.json())
        .then(data => setChestAnimData(data))
        .catch(() => {});
    }
  }, [chestOpening, chestAnimData]);

  // Control chest Lottie playback per stage
  useEffect(() => {
    if (!chestOpening || !chestLottieRef.current) return;
    const lottie = chestLottieRef.current;
    if (chestOpening.stage === 0) {
      lottie.goToAndStop(0, true);
    } else if (chestOpening.stage === 1) {
      lottie.playSegments([0, 45], true);
    } else if (chestOpening.stage === 2) {
      lottie.playSegments([45, 90], true);
    }
    // Stage 3: chest disappears, so no playback needed
  }, [chestOpening?.stage]);

  // --- CHEST OPENING CELEBRATION ---
  const triggerGoldConfetti = useCallback(() => {
    const gold = ['#FBBF24', '#F59E0B', '#FCD34D', '#FFFFFF', '#EAB308'];
    confetti({ particleCount: 80, spread: 90, origin: { y: 0.45, x: 0.5 }, colors: gold, shapes: ['circle'], startVelocity: 45 });
    setTimeout(() => {
      confetti({ particleCount: 50, spread: 140, origin: { y: 0.5, x: 0.5 }, colors: gold, shapes: ['circle'], startVelocity: 30 });
    }, 150);
    setTimeout(() => {
      confetti({ particleCount: 40, spread: 180, origin: { y: 0.4, x: 0.5 }, colors: gold, shapes: ['circle'], gravity: 1.5, scalar: 0.8 });
    }, 300);
  }, []);

  const handleChestTap = useCallback(() => {
    if (!chestOpening) return;
    const next = chestOpening.stage + 1;
    if (next <= 3) {
      triggerHapticFeedback(20);
      setChestOpening(prev => prev ? { ...prev, stage: next } : null);
      if (next === 3) {
        // Final burst — fire confetti and auto-dismiss
        triggerGoldConfetti();
        setTimeout(() => {
          setChestOpening(null);
          setShowAnimalSelector(false);
        }, 2800);
      }
    }
  }, [chestOpening, triggerGoldConfetti]);

  const renderContent = () => {
    if (activeTab === 'Timer') return (
      <div style={{
        height: '100%',
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
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
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                background: BACKGROUND_THEMES[selectedTheme].isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(167, 139, 250, 0.3)',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                color: BACKGROUND_THEMES[selectedTheme].isDark ? '#A78BFA' : '#7C3AED',
                fontFamily: "'Quicksand', sans-serif",
              }}>
                <span style={{ fontSize: '14px', filter: 'sepia(1) saturate(3) brightness(1.1) hue-rotate(15deg)' }}>🪙</span> {userData.coins ?? 0}
              </div>
            </div>
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
                isPaused={isPaused}
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
                marginBottom: '4px',
              }}>
                Choose Your Companion
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                marginBottom: '16px',
                fontSize: '13px',
                fontWeight: 700,
                color: BACKGROUND_THEMES[selectedTheme].isDark ? '#A78BFA' : '#7C3AED',
                fontFamily: "'Quicksand', sans-serif",
              }}>
                <span style={{ fontSize: '14px', filter: 'sepia(1) saturate(3) brightness(1.1) hue-rotate(15deg)' }}>🪙</span> {userData.coins ?? 0} coins
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '10px',
              }}>
                {ANIMALS.map((animal, index) => {
                  const isSelected = selectedAnimal === index;
                  const isOwned = animal.price === 0 || (userData.purchasedAnimals || []).includes(animal.id);
                  const canAfford = (userData.coins ?? 0) >= animal.price;
                  return (
                    <motion.button
                      key={animal.name}
                      whileTap={isOwned ? { scale: 0.9 } : (canAfford ? { scale: 0.95 } : {})}
                      onClick={() => {
                        if (isOwned) {
                          setSelectedAnimal(index);
                          setShowAnimalSelector(false);
                        } else if (canAfford && animal.price > 0) {
                          setPurchaseTarget({ index, id: animal.id, name: animal.name, price: animal.price });
                        }
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
                          : !isOwned
                            ? `2px solid ${canAfford ? 'rgba(251, 191, 36, 0.5)' : 'rgba(150, 150, 150, 0.3)'}`
                            : `2px solid ${BACKGROUND_THEMES[selectedTheme].isDark ? 'rgba(255,255,255,0.12)' : 'rgba(200, 200, 220, 0.4)'}`,
                        background: isSelected
                          ? 'rgba(167, 139, 250, 0.2)'
                          : !isOwned
                            ? (BACKGROUND_THEMES[selectedTheme].isDark ? 'rgba(0,0,0,0.2)' : 'rgba(200, 200, 200, 0.15)')
                            : 'transparent',
                        cursor: isOwned ? 'pointer' : (canAfford ? 'pointer' : 'default'),
                        width: '28%',
                        minWidth: '80px',
                        transition: 'all 0.15s ease',
                        opacity: !isOwned && !canAfford ? 0.5 : 1,
                        position: 'relative',
                      }}
                    >
                      <div style={{ width: '56px', height: '56px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {loadedAnimations[`selected-${activeBiome}-${index}`] ? (
                          <div style={{
                            width: animal.scale ? `${56 * animal.scale}px` : '56px',
                            height: animal.scale ? `${56 * animal.scale}px` : '56px',
                            flexShrink: 0,
                            filter: !isOwned ? 'grayscale(0.6) brightness(0.8)' : 'none',
                          }}>
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
                        {!isOwned && (
                          <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,0,0,0.4)', borderRadius: '8px',
                          }}>
                            <Lock size={16} color="white" strokeWidth={2.5} />
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
                      {!isOwned && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: BACKGROUND_THEMES[selectedTheme].isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(167, 139, 250, 0.3)',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: canAfford ? '#CA8A04' : '#DC2626',
                          fontFamily: "'Quicksand', sans-serif",
                        }}>
                          <span style={{ fontSize: '11px', filter: 'sepia(1) saturate(3) brightness(1.1) hue-rotate(15deg)' }}>🪙</span>{animal.price}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Purchase Confirmation Modal */}
        {purchaseTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPurchaseTarget(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: BACKGROUND_THEMES[selectedTheme].isDark
                  ? 'rgba(30, 30, 60, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                padding: '28px 24px',
                border: `1px solid ${BACKGROUND_THEMES[selectedTheme].isDark ? 'rgba(167, 139, 250, 0.3)' : 'rgba(200, 200, 220, 0.5)'}`,
                boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
                width: '100%',
                maxWidth: '280px',
                textAlign: 'center',
              }}
            >
              {/* Animal preview */}
              <div style={{ width: '80px', height: '80px', margin: '0 auto 12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {loadedAnimations[`selected-${activeBiome}-${purchaseTarget.index}`] && (
                  <div style={{
                    width: ANIMALS[purchaseTarget.index]?.scale ? `${80 * (ANIMALS[purchaseTarget.index]?.scale || 1)}px` : '80px',
                    height: ANIMALS[purchaseTarget.index]?.scale ? `${80 * (ANIMALS[purchaseTarget.index]?.scale || 1)}px` : '80px',
                    flexShrink: 0,
                  }}>
                    <Lottie
                      animationData={loadedAnimations[`selected-${activeBiome}-${purchaseTarget.index}`]}
                      loop={true}
                      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                    />
                  </div>
                )}
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 700,
                color: getTextColor(selectedTheme, 'primary'),
                fontFamily: "'Quicksand', sans-serif",
                marginBottom: '8px',
              }}>
                Unlock {purchaseTarget.name}?
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 14px',
                background: BACKGROUND_THEMES[selectedTheme].isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(167, 139, 250, 0.3)',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: 700,
                color: BACKGROUND_THEMES[selectedTheme].isDark ? '#A78BFA' : '#7C3AED',
                fontFamily: "'Quicksand', sans-serif",
                marginBottom: '20px',
              }}>
                <span style={{ fontSize: '16px', filter: 'sepia(1) saturate(3) brightness(1.1) hue-rotate(15deg)' }}>🪙</span> {purchaseTarget.price}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPurchaseTarget(null)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '16px',
                    border: `1px solid ${BACKGROUND_THEMES[selectedTheme].isDark ? 'rgba(255,255,255,0.15)' : 'rgba(200, 200, 220, 0.4)'}`,
                    background: 'transparent',
                    color: getTextColor(selectedTheme, 'secondary'),
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: "'Quicksand', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const result = purchaseAnimal(purchaseTarget.id, purchaseTarget.price);
                    if (result) {
                      // Sync both storage keys
                      const updatedCoins = result.coins;
                      const updatedPurchased = result.purchasedAnimals;
                      setUserData((prev: any) => ({
                        ...prev,
                        coins: updatedCoins,
                        purchasedAnimals: updatedPurchased,
                      }));
                      saveUserData({
                        ...userData,
                        coins: updatedCoins,
                        purchasedAnimals: updatedPurchased,
                      });
                      // Auto-select the newly purchased animal
                      setSelectedAnimal(purchaseTarget.index);
                      // Launch chest opening celebration
                      setChestOpening({
                        stage: 0,
                        animalIndex: purchaseTarget.index,
                        animalName: purchaseTarget.name,
                      });
                    }
                    setPurchaseTarget(null);
                  }}
                  style={{
                    flex: 1.5,
                    padding: '12px 16px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.8) 0%, rgba(245, 158, 11, 0.8) 100%)',
                    color: '#78350F',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: "'Quicksand', sans-serif",
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)',
                  }}
                >
                  Buy
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Chest Opening Celebration Overlay */}
        <AnimatePresence>
          {chestOpening && (
            <motion.div
              key="chest-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={handleChestTap}
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: chestOpening.stage >= 3
                  ? 'radial-gradient(circle, rgba(251,191,36,0.4) 0%, rgba(0,0,0,0.85) 70%)'
                  : 'rgba(0, 0, 0, 0.85)',
                zIndex: 10001,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'background 0.5s ease',
              }}
            >
              {/* Golden light rays behind chest (stage 2+) */}
              {chestOpening.stage >= 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: [0, 0.8, 0.5], scale: [0.3, 1.5, 1.2] }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    width: '400px', height: '400px',
                    background: 'radial-gradient(circle, rgba(251,191,36,0.5) 0%, rgba(245,158,11,0.2) 40%, transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Rive particle burst on stage 3 */}
              {chestOpening.stage >= 3 && (
                <div style={{
                  position: 'absolute',
                  width: '500px', height: '500px',
                  pointerEvents: 'none',
                  opacity: 0.9,
                }}>
                  <RiveComponent
                    src="/particle-burst.riv"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              )}

              {/* The 3D Chest (stages 0-2) */}
              {chestOpening.stage < 3 && (
                <motion.div
                  animate={
                    chestOpening.stage === 0 ? { scale: [0, 1.15, 1], rotate: 0 } :
                    chestOpening.stage === 1 ? {
                      rotate: [-4, 4, -4, 4, -3, 3, 0],
                      scale: [1, 1.06, 1],
                    } :
                    {
                      rotate: [-7, 7, -9, 9, -7, 7, -5, 5, 0],
                      scale: [1, 1.1, 1.03, 1.1, 1],
                      y: [0, -8, 0, -5, 0],
                    }
                  }
                  transition={
                    chestOpening.stage === 0
                      ? { type: 'spring', stiffness: 300, damping: 15, duration: 0.5 }
                      : { duration: chestOpening.stage === 1 ? 0.5 : 0.7, ease: 'easeInOut' }
                  }
                  style={{
                    position: 'relative',
                    width: '200px',
                    height: '200px',
                    filter: chestOpening.stage >= 2
                      ? 'drop-shadow(0 0 30px rgba(251,191,36,0.6))'
                      : 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))',
                  }}
                >
                  {/* 3D Lottie Chest */}
                  {chestAnimData && (
                    <Lottie
                      lottieRef={chestLottieRef}
                      animationData={chestAnimData}
                      loop={false}
                      autoplay={false}
                      style={{ width: '100%', height: '100%' }}
                    />
                  )}

                  {/* Animal INSIDE the chest peeking out (stage 1+) */}
                  {chestOpening.stage >= 1 && loadedAnimations[`selected-${activeBiome}-${chestOpening.animalIndex}`] && (
                    <div style={{
                      position: 'absolute',
                      top: '8%', left: '15%',
                      width: '70%', height: '50%',
                      overflow: 'hidden',
                      zIndex: 1,
                      pointerEvents: 'none',
                    }}>
                      <motion.div
                        initial={{ y: 60, opacity: 0 }}
                        animate={
                          chestOpening.stage === 1
                            ? { y: [30, 15, 30], opacity: 1, rotate: [-4, 4, -4] }
                            : { y: [10, -8, 10], opacity: 1, rotate: [-6, 6, -6], scale: [1, 1.1, 1] }
                        }
                        transition={{
                          duration: chestOpening.stage === 1 ? 1 : 0.6,
                          repeat: Infinity,
                          repeatType: 'reverse',
                          ease: 'easeInOut',
                        }}
                        style={{
                          width: '90px', height: '90px',
                          margin: '0 auto',
                          filter: 'drop-shadow(0 2px 8px rgba(251,191,36,0.5))',
                        }}
                      >
                        <Lottie
                          animationData={loadedAnimations[`selected-${activeBiome}-${chestOpening.animalIndex}`]}
                          loop={true}
                          style={{ width: '100%', height: '100%' }}
                        />
                      </motion.div>
                    </div>
                  )}

                  {/* Sparkles around chest (stage 1+) */}
                  {chestOpening.stage >= 1 && (
                    <>
                      {[...Array(chestOpening.stage >= 2 ? 10 : 6)].map((_, i) => {
                        const count = chestOpening.stage >= 2 ? 10 : 6;
                        const angle = (i / count) * Math.PI * 2;
                        const radius = chestOpening.stage >= 2 ? 120 : 90;
                        return (
                          <motion.div
                            key={`sparkle-${i}`}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                              opacity: [0, 1, 0],
                              scale: [0, 1.5, 0],
                              x: Math.cos(angle) * radius,
                              y: Math.sin(angle) * radius,
                            }}
                            transition={{
                              duration: 0.8,
                              delay: i * 0.06,
                              repeat: Infinity,
                              repeatDelay: 0.2,
                            }}
                            style={{
                              position: 'absolute',
                              top: '50%', left: '50%',
                              width: chestOpening.stage >= 2 ? '8px' : '5px',
                              height: chestOpening.stage >= 2 ? '8px' : '5px',
                              background: i % 3 === 0 ? '#FCD34D' : i % 3 === 1 ? '#FBBF24' : '#F59E0B',
                              borderRadius: '50%',
                              boxShadow: '0 0 10px rgba(251,191,36,0.8)',
                              pointerEvents: 'none',
                            }}
                          />
                        );
                      })}
                    </>
                  )}

                  {/* Golden glow pulse on stage 2 */}
                  {chestOpening.stage >= 2 && (
                    <motion.div
                      animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      style={{
                        position: 'absolute',
                        top: '-20%', left: '-20%',
                        width: '140%', height: '140%',
                        background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 60%)',
                        borderRadius: '50%',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </motion.div>
              )}

              {/* Stage 3: Animal Reveal */}
              {chestOpening.stage >= 3 && (
                <>
                  {/* Glow ring */}
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: [0, 2], opacity: [1, 0] }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      width: '200px', height: '200px',
                      border: '4px solid rgba(251,191,36,0.6)',
                      borderRadius: '50%',
                      boxShadow: '0 0 40px rgba(251,191,36,0.4), inset 0 0 40px rgba(251,191,36,0.2)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Animal Lottie — big reveal */}
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: [0, 1.35, 1.05], rotate: [-10, 5, 0] }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                    style={{
                      width: '200px', height: '200px',
                      filter: 'drop-shadow(0 0 30px rgba(251,191,36,0.7))',
                      zIndex: 2,
                    }}
                  >
                    {loadedAnimations[`selected-${activeBiome}-${chestOpening.animalIndex}`] && (
                      <Lottie
                        animationData={loadedAnimations[`selected-${activeBiome}-${chestOpening.animalIndex}`]}
                        loop={true}
                        style={{ width: '100%', height: '100%' }}
                      />
                    )}
                  </motion.div>

                  {/* UNLOCKED! text — high visibility */}
                  <motion.div
                    initial={{ y: -40, opacity: 0, scale: 0.5 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.25 }}
                    style={{
                      marginTop: '12px',
                      fontSize: '34px',
                      fontWeight: 900,
                      fontFamily: "'Quicksand', sans-serif",
                      color: '#FDE68A',
                      textShadow: '0 0 20px rgba(251,191,36,0.9), 0 0 40px rgba(251,191,36,0.5), 0 2px 4px rgba(0,0,0,0.8)',
                      letterSpacing: '4px',
                      zIndex: 2,
                    }}
                  >
                    UNLOCKED!
                  </motion.div>

                  {/* Animal name */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    style={{
                      marginTop: '6px',
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      fontFamily: "'Quicksand', sans-serif",
                      textShadow: '0 0 12px rgba(251,191,36,0.6), 0 2px 4px rgba(0,0,0,0.7)',
                      zIndex: 2,
                    }}
                  >
                    {chestOpening.animalName}
                  </motion.div>

                  {/* Orbiting sparkles */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={`orbit-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        rotate: [i * 45, i * 45 + 360],
                      }}
                      transition={{
                        duration: 2,
                        delay: 0.2 + i * 0.05,
                        ease: 'linear',
                      }}
                      style={{
                        position: 'absolute',
                        width: '6px', height: '6px',
                        background: i % 2 === 0 ? '#FBBF24' : '#FCD34D',
                        borderRadius: '50%',
                        boxShadow: '0 0 6px rgba(251,191,36,0.8)',
                        top: `calc(50% + ${Math.sin(i * 0.785) * 110}px)`,
                        left: `calc(50% + ${Math.cos(i * 0.785) * 110}px)`,
                        pointerEvents: 'none',
                      }}
                    />
                  ))}
                </>
              )}

              {/* Tap prompt (stages 0-2) */}
              {chestOpening.stage < 3 && (
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6], scale: [0.97, 1.08, 0.97] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{
                    marginTop: '32px',
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#FDE68A',
                    fontFamily: "'Quicksand', sans-serif",
                    letterSpacing: '3px',
                    textShadow: '0 0 16px rgba(251,191,36,0.8), 0 2px 4px rgba(0,0,0,0.7)',
                  }}
                >
                  {chestOpening.stage === 0 ? 'TAP TO OPEN!' :
                   chestOpening.stage === 1 ? 'TAP AGAIN!' :
                   'ONE MORE TAP!'}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zone 3 (Bottom): Action Zone - flex-1.5 */}
        <div style={{
          flex: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '0 1.25rem',
          paddingBottom: 'calc(40px + max(12px, env(safe-area-inset-bottom, 12px)))',
        }}>
          {/* Start/Stop Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '280px',
            width: '100%',
          }}>
            {isRunning ? (
              <>
                <SoftButton text="Pause" icon={Pause} onClick={() => { setIsRunning(false); setIsPaused(true); }} variant="secondary" />
                <SoftButton text="Complete" icon={Check} onClick={handleCompleteSession} variant="primary" />
                <SoftButton text="Fail Session" icon={X} onClick={() => setShowFailConfirm(true)} variant="danger" />
              </>
            ) : isPaused ? (
              <>
                <SoftButton text="Resume" icon={Play} onClick={() => { setIsRunning(true); setIsPaused(false); }} variant="primary" />
                <SoftButton text="Complete" icon={Check} onClick={handleCompleteSession} variant="primary" />
                <SoftButton text="Fail Session" icon={X} onClick={() => setShowFailConfirm(true)} variant="danger" />
              </>
            ) : (
              <SoftButton text="Start Focus" icon={Play} onClick={handleStartFocus} variant="primary" />
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
          style={{ padding: '24px 24px 0', position: 'relative', zIndex: 1 }}
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
                border: getTabBorder(selectedTheme, collectionViewMode === 'gallery'),
                background: getTabBackground(selectedTheme, collectionViewMode === 'gallery'),
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
                border: getTabBorder(selectedTheme, collectionViewMode === 'achievements'),
                background: getTabBackground(selectedTheme, collectionViewMode === 'achievements'),
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
              <AchievementsScreen userData={getStorageUserData()} theme={selectedTheme} />
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
        style={{ padding: '24px 24px calc(68px + max(12px, env(safe-area-inset-bottom, 12px)))', position: 'relative', zIndex: 1 }}
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
            { icon: Bell, label: 'Notifications', enabled: false, toggle: () => { } },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ x: 2 }}
              transition={SOFT_SPRING}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '20px 0',
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
            {(Object.keys(BACKGROUND_THEMES) as Array<'morning' | 'midnight'>).map((themeKey) => {
              const themeData = BACKGROUND_THEMES[themeKey];
              const isSelected = selectedTheme === themeKey;

              return (
                <motion.div
                  key={themeKey}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleThemeChange(themeKey)}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: isSelected ? '3px solid rgba(167, 139, 250, 0.8)' : '2px solid rgba(200, 220, 255, 0.3)',
                    boxShadow: isSelected ? '0 4px 20px rgba(167, 139, 250, 0.3)' : '0 2px 10px rgba(147, 197, 253, 0.1)',
                  }}
                >
                  {/* Theme Swatch - covers entire card */}
                  <div style={{
                    position: 'relative',
                    height: '100px',
                  }}>
                    {/* Gradient background - stretched to cover any subpixel gaps */}
                    <div style={{
                      position: 'absolute',
                      top: '-1px',
                      left: '-1px',
                      right: '-1px',
                      bottom: '-1px',
                      background: themeData.gradient,
                    }} />
                    {/* Theme Label overlaid at bottom */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
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
                    </div>
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

          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const storageData = getStorageUserData();
                const newCoins = (storageData.coins || 0) + 5000;
                updateStorageUserData({ coins: newCoins });
                const newData = { ...userData, coins: newCoins };
                setUserData(newData);
                saveUserData(newData);
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.6) 0%, rgba(245, 158, 11, 0.6) 100%)',
                color: '#78350F',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: "'Quicksand', sans-serif",
                cursor: 'pointer',
              }}
            >
              +5,000 Coins
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const allIds = getAllAnimalIds();
                const storageData = getStorageUserData();
                updateStorageUserData({ purchasedAnimals: allIds, coins: (storageData.coins || 0) });
                const newData = { ...userData, purchasedAnimals: allIds };
                setUserData(newData);
                saveUserData(newData);
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.6) 0%, rgba(139, 92, 246, 0.6) 100%)',
                color: 'white',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: "'Quicksand', sans-serif",
                cursor: 'pointer',
              }}
            >
              Unlock All Animals
            </motion.button>
          </div>
          <div style={{ marginTop: '10px' }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const starterIds = getStarterAnimalIds();
                updateStorageUserData({ coins: 0, purchasedAnimals: starterIds, unlockedBiomes: ['meadow'] });
                const newData = { ...userData, coins: 0, purchasedAnimals: starterIds, unlockedBiomes: ['meadow'] };
                setUserData(newData);
                saveUserData(newData);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.6) 0%, rgba(220, 38, 38, 0.6) 100%)',
                color: 'white',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: "'Quicksand', sans-serif",
                cursor: 'pointer',
              }}
            >
              Reset All
            </motion.button>
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
    {/* Fixed background that covers entire screen including safe areas */}
    <motion.div
      animate={{ background: BACKGROUND_THEMES[theme].gradient }}
      transition={{ duration: 2, ease: "easeInOut" }}
      style={{
        position: 'fixed',
        top: '-50px',
        left: '-50px',
        right: '-50px',
        bottom: '-50px',
        zIndex: 0,
      }}
    >
      <LivingAuroraBackground theme={theme} />
    </motion.div>

    {/* Content container */}
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100dvh',
      }}
    >
      {/* Category Selection Modal */}
      <CategorySelectionModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSelectCategory={handleCategorySelected}
        theme={selectedTheme}
      />

      <CategoryCustomizeModal
        isOpen={showCustomizeModal}
        categoryTitle={pendingCategory}
        theme={selectedTheme}
        onConfirm={handleCustomizeConfirm}
        onCancel={handleCustomizeCancel}
      />

      {/* Fail Session Confirmation Modal */}
      <AnimatePresence>
        {showFailConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFailConfirm(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: BACKGROUND_THEMES[selectedTheme].isDark
                  ? 'rgba(30, 30, 60, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                padding: '28px 24px',
                border: `1px solid ${BACKGROUND_THEMES[selectedTheme].isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(200, 200, 220, 0.5)'}`,
                boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
                width: '100%',
                maxWidth: '280px',
                textAlign: 'center',
              }}
            >
              <div style={{
                fontSize: '18px',
                fontWeight: 700,
                color: getTextColor(selectedTheme, 'primary'),
                fontFamily: "'Quicksand', sans-serif",
                marginBottom: '20px',
                lineHeight: 1.4,
              }}>
                Are you sure you want to Fail your Pomodoro Session?
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFailConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '16px',
                    border: `1px solid ${BACKGROUND_THEMES[selectedTheme].isDark ? 'rgba(255,255,255,0.15)' : 'rgba(200, 200, 220, 0.4)'}`,
                    background: 'transparent',
                    color: getTextColor(selectedTheme, 'secondary'),
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: "'Quicksand', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowFailConfirm(false);
                    handleFailSession();
                  }}
                  style={{
                    flex: 1.5,
                    padding: '12px 16px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(220, 38, 38, 0.8) 100%)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: "'Quicksand', sans-serif",
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  Fail Session
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{
        maxWidth: '480px',
        margin: '0 auto',
        position: 'relative',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: activeTab === 'Timer' ? '100dvh' : 'auto',
        minHeight: activeTab !== 'Timer' ? '100dvh' : undefined,
        overflow: activeTab === 'Timer' ? 'hidden' : undefined,
      }}>
        {renderContent()}
      </div>
    </div>

      {/* Fixed Navigation - Always visible */}
      <div style={{
        position: 'fixed',
        bottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
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

      {/* Achievement Unlocked Popup */}
      <AnimatePresence>
        {unlockedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setUnlockedAchievement(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '24px',
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: selectedTheme === 'morning'
                  ? 'linear-gradient(135deg, #FFFFFF 0%, #F5F0FF 100%)'
                  : 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
                borderRadius: '32px',
                padding: '32px 24px',
                textAlign: 'center',
                maxWidth: '320px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3)',
                border: `1px solid ${selectedTheme === 'morning' ? 'rgba(167, 139, 250, 0.3)' : 'rgba(167, 139, 250, 0.4)'}`,
              }}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, delay: 0.3 }}
                style={{ fontSize: '64px', marginBottom: '16px' }}
              >
                {unlockedAchievement.emoji}
              </motion.div>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'rgba(139, 92, 246, 0.9)',
                marginBottom: '8px',
                fontFamily: "'Quicksand', sans-serif",
              }}>
                Achievement Unlocked!
              </div>
              <div style={{
                fontSize: '22px',
                fontWeight: 700,
                color: getTextColor(selectedTheme, 'primary'),
                marginBottom: '8px',
                fontFamily: "'Quicksand', sans-serif",
              }}>
                {unlockedAchievement.name}
              </div>
              <div style={{
                fontSize: '14px',
                color: getTextColor(selectedTheme, 'secondary'),
                marginBottom: '24px',
                lineHeight: '1.4',
                fontFamily: "'Quicksand', sans-serif",
              }}>
                {unlockedAchievement.description}
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setUnlockedAchievement(null)}
                style={{
                  background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.8) 0%, rgba(139, 92, 246, 0.8) 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '12px 32px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'Quicksand', sans-serif",
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                }}
              >
                Awesome!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

