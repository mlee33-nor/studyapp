import React, { useState, useEffect, useRef } from 'react';
import { Home, BarChart2, Settings as SettingsIcon, User, Play, Pause, RotateCcw, Volume2, Bell, Moon, Lock, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { AstronautCat } from './AstronautCat';
import { StatsPage } from './components/StatsPage';
import { getCategories, getRecentCategories, saveEnhancedSession } from './utils/categoryManager';
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

// --- CHART DATA HELPERS (removed - replaced by new stats system) ---

// --- GAME LOGIC ---
const calculateXpForLevel = (level: number) => {
  return 100 * level;
};

const getCharacterTitle = (level: number) => {
  if (level >= 30) return 'Space Explorer';
  if (level >= 20) return 'Astronaut';
  if (level >= 10) return 'Cadet';
  return 'Rookie';
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

// --- BACKGROUND THEMES - 4 Distinct Palettes ---
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
  // STRICT MATHEMATICAL ALIGNMENT - Shared Constants
  // Using viewBox coordinate system for perfect precision
  const VIEWBOX_SIZE = 100; // Perfect square viewBox
  const CX = 50; // Exact center X in viewBox coordinates
  const CY = 50; // Exact center Y in viewBox coordinates
  const STROKE_WIDTH = 3; // Stroke width in viewBox coordinates
  const RADIUS = 45; // Circle radius in viewBox coordinates (leaves room for stroke)

  // Physical display size (CSS)
  const displaySize = 192;

  // Derived values - all use the same RADIUS
  const circumference = RADIUS * 2 * Math.PI;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const progress = 1 - (timeLeft / totalSeconds);
  const dashOffset = circumference * (1 - progress);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate angle from minutes (0-360 degrees, starting at 12 o'clock)
  const angleFromMinutes = (mins: number) => {
    const normalized = (mins - 5) / (60 - 5);
    return normalized * 360 - 90;
  };

  // TRIGONOMETRY LOCKING: Handle position uses EXACT formula
  // handleX = CX + RADIUS * cos(θ)
  // handleY = CY + RADIUS * sin(θ)
  const handleAngle = angleFromMinutes(minutes);
  const handleAngleRad = (handleAngle * Math.PI) / 180;
  const handleX = CX + RADIUS * Math.cos(handleAngleRad);
  const handleY = CY + RADIUS * Math.sin(handleAngleRad);

  // Calculate minutes from mouse/touch position
  // Uses strict center calculation with no offsets
  const updateMinutesFromPosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    // Exact center using the same CX, CY scaled to display size
    const containerCenterX = rect.left + (CX * scale);
    const containerCenterY = rect.top + (CY * scale);

    // Calculate angle from center to mouse position
    const dx = clientX - containerCenterX;
    const dy = clientY - containerCenterY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Normalize angle to 0-360 range
    angle = (angle + 90 + 360) % 360;

    // Map angle to minutes (5-60 range)
    const normalized = angle / 360;
    const newMinutes = Math.round(5 + normalized * (60 - 5));
    const clampedMinutes = Math.max(5, Math.min(60, newMinutes));

    onMinutesChange(clampedMinutes);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isRunning) return;
    setIsDragging(true);
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

  // Convert viewBox coordinates to display pixels for handle positioning
  const scale = displaySize / VIEWBOX_SIZE;
  const handleXPixels = handleX * scale;
  const handleYPixels = handleY * scale;

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: displaySize, height: displaySize, margin: '0 auto' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* ViewBox Integrity: Perfect square viewBox with no distortion */}
      <svg
        width={displaySize}
        height={displaySize}
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
      >
        {/* Background circle - uses EXACT same CX, CY, RADIUS as handle */}
        <circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {/* Progress circle - uses EXACT same CX, CY, RADIUS as handle */}
        <motion.circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          stroke="url(#lavenderGradient)"
          strokeWidth={STROKE_WIDTH}
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

      {/* Handle - STRICT MATHEMATICAL ALIGNMENT - NO MANUAL OFFSETS */}
      {/* Position calculated using: X = CX + RADIUS * cos(θ), Y = CY + RADIUS * sin(θ) */}
      {!isRunning && (
        <motion.div
          onPointerDown={handlePointerDown}
          animate={{
            left: handleXPixels,
            top: handleYPixels,
            scale: isDragging ? 1.1 : 1
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            position: 'absolute',
            transform: 'translate(-50%, -50%)',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            pointerEvents: 'auto',
          }}
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

// --- XP PROGRESS BAR ---
const XpProgressBar: React.FC<{ currentXp: number; requiredXp: number; theme: 'morning' | 'twilight' | 'golden' | 'midnight' }> = ({ currentXp, requiredXp, theme }) => {
  const percentage = (currentXp / requiredXp) * 100;

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
        fontSize: '13px',
        color: getTextColor(theme, 'secondary'),
        fontWeight: 600,
        fontFamily: "'Quicksand', sans-serif"
      }}>
        <span>{currentXp} XP</span>
        <span>{requiredXp} XP</span>
      </div>
      <div style={{
        width: '100%',
        height: '12px',
        background: BACKGROUND_THEMES[theme].isDark ? 'rgba(200, 220, 255, 0.3)' : 'rgba(100, 116, 139, 0.2)',
        borderRadius: '100px',
        overflow: 'hidden'
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={SOFT_SPRING}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, rgba(244, 114, 182, 0.8) 0%, rgba(168, 85, 247, 0.8) 100%)',
            boxShadow: '0 2px 10px rgba(244, 114, 182, 0.5)'
          }}
        />
      </div>
    </div>
  );
};

// --- MILESTONE STAGES GRID ---
const EvolutionStages: React.FC<{ currentLevel: number; theme: 'morning' | 'twilight' | 'golden' | 'midnight' }> = ({ currentLevel, theme }) => {
  const stages = [
    { name: 'Rookie', level: 1, emoji: '🐱' },
    { name: 'Beginner', level: 5, emoji: '📚' },
    { name: 'Cadet', level: 10, emoji: '🎓' },
    { name: 'Scholar', level: 15, emoji: '📖' },
    { name: 'Astronaut', level: 20, emoji: '🚀' },
    { name: 'Ace', level: 25, emoji: '⭐' },
    { name: 'Explorer', level: 30, emoji: '🌌' },
    { name: 'Legend', level: 35, emoji: '✨' }
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
              color: getTextColor(theme, 'primary'),
              marginBottom: '4px',
              fontFamily: "'Quicksand', sans-serif"
            }}>
              {stage.name}
            </div>
            <div style={{
              fontSize: '12px',
              color: getTextColor(theme, 'tertiary'),
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
const SoftStatsChart: React.FC<{ theme: 'morning' | 'twilight' | 'golden' | 'midnight' }> = ({ theme }) => {
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
          <span style={{ fontSize: '12px', color: getTextColor(theme, 'secondary'), fontWeight: 600, fontFamily: "'Quicksand', sans-serif" }}>
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

            {/* Mascot Container */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '12px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center'
              }}>
                <AstronautCat size={80} level={userData.level} isTimerActive={isRunning} theme={selectedTheme} />
              </div>

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
                {getCharacterTitle(userData.level)} · Lvl {userData.level}
              </div>
            </div>
          </GlassCard>
        </div>

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
                background: getNavBackground(selectedTheme),
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                border: `1px solid ${getNavBorder(selectedTheme)}`,
                borderRadius: '30px',
                boxShadow: getNavShadow(selectedTheme),
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
                const colors = getThemeColors(selectedTheme);
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
                      background: isActive ? (BACKGROUND_THEMES[selectedTheme].isDark ? 'rgba(244, 114, 182, 0.2)' : 'rgba(167, 139, 250, 0.2)') : 'transparent',
                      boxShadow: isActive ? `0 4px 15px ${colors.primary}33` : 'none',
                    }}
                  >
                    <tab.icon
                      color={isActive ? colors.primary : getInactiveIconColor(selectedTheme)}
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
          color: getTextColor(selectedTheme, 'primary'),
          marginBottom: '32px',
          letterSpacing: '0.05em',
          fontFamily: "'Quicksand', sans-serif"
        }}>
          Statistics
        </h1>

        <GlassCard theme={selectedTheme} style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', color: getTextColor(selectedTheme, 'primary'), fontWeight: 600, fontFamily: "'Quicksand', sans-serif" }}>
            Weekly Activity
          </h3>
          <SoftStatsChart theme={selectedTheme} />
        </GlassCard>

        <GlassCard theme={selectedTheme} style={{ marginBottom: '20px' }}>
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
              <div style={{ fontSize: '18px', fontWeight: 600, color: getTextColor(selectedTheme, 'primary'), fontFamily: "'Quicksand', sans-serif" }}>
                {userData.sessionsCompleted} Sessions
              </div>
              <div style={{ fontSize: '14px', color: getTextColor(selectedTheme, 'tertiary'), fontFamily: "'Quicksand', sans-serif" }}>
                Total Completed
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard theme={selectedTheme}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: getTextColor(selectedTheme, 'primary'), fontWeight: 600, fontFamily: "'Quicksand', sans-serif" }}>
            Recent Sessions
          </h3>
          {focusHistory.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '24px',
              color: getTextColor(selectedTheme, 'tertiary'),
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
                      color: getTextColor(selectedTheme, 'primary'),
                      fontFamily: "'Quicksand', sans-serif"
                    }}>
                      📚 {session.category}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: getTextColor(selectedTheme, 'tertiary'),
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
      return <StatsPage />;
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
          color: getTextColor(selectedTheme, 'primary'),
          marginBottom: '32px',
          letterSpacing: '0.05em',
          fontFamily: "'Quicksand', sans-serif"
        }}>
          Your Character
        </h1>

        <GlassCard theme={selectedTheme}>
          <div style={{ marginBottom: '32px' }}>
            <AstronautCat size={160} level={userData.level} isTimerActive={false} theme={selectedTheme} />
          </div>

          <div style={{
            background: BACKGROUND_THEMES[selectedTheme].isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '12px 24px',
            borderRadius: '24px',
            marginBottom: '24px',
            boxShadow: '0 4px 15px rgba(167, 139, 250, 0.2)',
            display: 'inline-block'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: getTextColor(selectedTheme, 'primary'), fontFamily: "'Quicksand', sans-serif" }}>
              Level {userData.level}
            </div>
          </div>

          <XpProgressBar currentXp={userData.xp} requiredXp={calculateXpForLevel(userData.level)} theme={selectedTheme} />
          <EvolutionStages currentLevel={userData.level} theme={selectedTheme} />
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
              background: getNavBackground(selectedTheme),
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              border: `1px solid ${getNavBorder(selectedTheme)}`,
              borderRadius: '30px',
              boxShadow: getNavShadow(selectedTheme),
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
              const colors = getThemeColors(selectedTheme);
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
                    background: isActive ? (BACKGROUND_THEMES[selectedTheme].isDark ? 'rgba(244, 114, 182, 0.2)' : 'rgba(167, 139, 250, 0.2)') : 'transparent',
                    boxShadow: isActive ? `0 4px 15px ${colors.primary}33` : 'none',
                  }}
                >
                  <tab.icon
                    color={isActive ? colors.primary : getInactiveIconColor(selectedTheme)}
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
