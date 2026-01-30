import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../hooks/useTimer';
import { useUserData } from '../hooks/useUserData';
import { useTheme } from '../contexts/ThemeContext';
import Character from '../components/Character';
import type { TimerMode } from '../types';
import { getWeeklyMinutes } from '../utils/storage';
import { triggerHapticFeedback } from '../utils/haptics';

const TimerScreen: React.FC = () => {
  const navigate = useNavigate();
  const { userData, completeSession, updateSettings } = useUserData();
  const { getGradientClass } = useTheme();
  const [timerMode, setTimerMode] = useState<TimerMode>('study');
  const [showCelebration, setShowCelebration] = useState(false);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [customDuration, setCustomDuration] = useState(userData.settings.studyDuration);
  const circleRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const previousMinutesRef = useRef<number>(customDuration);

  const getDuration = () => {
    switch (timerMode) {
      case 'study':
        return customDuration;
      case 'shortBreak':
        return userData.settings.shortBreakDuration;
      case 'longBreak':
        return userData.settings.longBreakDuration;
    }
  };

  const handleTimerComplete = () => {
    if (timerMode === 'study') {
      completeSession(customDuration);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);

      // Auto switch to break
      setTimeout(() => {
        setTimerMode('shortBreak');
        timer.reset(userData.settings.shortBreakDuration);
      }, 3000);
    } else {
      // Break complete, switch back to study
      setTimerMode('study');
      timer.reset(customDuration);
    }
  };

  const timer = useTimer({
    initialMinutes: getDuration(),
    onComplete: handleTimerComplete,
    soundEnabled: userData.settings.soundEnabled,
  });

  useEffect(() => {
    setWeeklyMinutes(getWeeklyMinutes());
  }, [userData]);

  useEffect(() => {
    if (!timer.isRunning) {
      timer.reset(getDuration());
    }
  }, [customDuration]);

  // Update previousMinutesRef when customDuration changes from outside drag
  useEffect(() => {
    if (!isDragging) {
      previousMinutesRef.current = customDuration;
    }
  }, [customDuration, isDragging]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressSessionToNext = () => {
    const currentStage = userData.currentStage;
    if (currentStage >= 4) return 100;

    const currentRequired = currentStage === 1 ? 0 : currentStage === 2 ? 11 : currentStage === 3 ? 26 : 51;
    const nextRequired = currentStage === 1 ? 11 : currentStage === 2 ? 26 : currentStage === 3 ? 51 : 51;

    const progress = ((userData.totalCompletedSessions - currentRequired) / (nextRequired - currentRequired)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  // Handle drag circle for time adjustment
  const handleDrag = useCallback((clientX: number, clientY: number) => {
    if (!circleRef.current || timer.isRunning || timerMode !== 'study') return;

    const rect = circleRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate angle from center
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // atan2 gives us angle from positive x-axis, counterclockwise
    // We need angle from negative y-axis (top), clockwise
    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);

    // Normalize to 0-360
    if (angle < 0) angle += 360;

    // Map angle to minutes (5-60)
    // Full circle = 55 minutes range (60-5)
    const minutes = Math.round((angle / 360) * 55 + 5);
    const clampedMinutes = Math.max(5, Math.min(60, minutes));

    // Trigger haptic feedback when the value changes
    if (clampedMinutes !== previousMinutesRef.current) {
      triggerHapticFeedback(10);
      previousMinutesRef.current = clampedMinutes;
    }

    setCustomDuration(clampedMinutes);
  }, [timer.isRunning, timerMode]);

  const handleDragStart = useCallback(() => {
    if (timer.isRunning || timerMode !== 'study') return;
    setIsDragging(true);
  }, [timer.isRunning, timerMode]);

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      updateSettings({ studyDuration: customDuration });
    }
  }, [isDragging, customDuration, updateSettings]);

  // Setup drag event listeners
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        e.preventDefault();
        // Use clientX/Y to match getBoundingClientRect() coordinate system
        const touch = e.touches[0];
        handleDrag(touch.clientX, touch.clientY);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        handleDrag(e.clientX, e.clientY);
      }
    };

    const handleEnd = () => {
      handleDragEnd();
    };

    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('mouseup', handleEnd);

      return () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchend', handleEnd);
        window.removeEventListener('mouseup', handleEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  return (
    <div className={`min-h-screen ${getGradientClass()} transition-all duration-700 pb-20 px-6 pt-8`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {timerMode === 'study' ? 'Timer' : 'Break'}
          </h1>
          <p className="text-xs text-text-secondary">v2.0 Build 4 - Angle Fix</p>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Timer Circle */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <svg
            ref={circleRef}
            className="transform -rotate-90"
            width="280"
            height="280"
            style={{ touchAction: 'none' }}
          >
            <circle
              cx="140"
              cy="140"
              r="130"
              fill="white"
              opacity="0.2"
            />
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="white"
              stroke="white"
              strokeWidth="2"
              opacity="0.3"
            />
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke="white"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - timer.progress / 100)}`}
              strokeLinecap="round"
              opacity="0.9"
              className="transition-all duration-1000"
            />
            {/* Draggable handle - only show when timer is not running and in study mode */}
            {!timer.isRunning && timerMode === 'study' && (
              <>
                {/* Handle track circle */}
                <circle
                  cx="140"
                  cy="140"
                  r="120"
                  fill="none"
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                {/* Duration indicator line */}
                <line
                  x1="140"
                  y1="140"
                  x2="140"
                  y2={140 - 120}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="2"
                  transform={`rotate(${((customDuration - 5) / 55) * 360} 140 140)`}
                  className="transition-transform duration-100"
                />
                {/* Draggable handle - larger touch target */}
                <g transform={`rotate(${((customDuration - 5) / 55) * 360} 140 140)`}>
                  {/* Invisible larger hit area for easier touch */}
                  <circle
                    cx="140"
                    cy={140 - 120}
                    r="24"
                    fill="transparent"
                    className="cursor-pointer"
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                    onTouchStart={handleDragStart}
                    onMouseDown={handleDragStart}
                  />
                  {/* Visible handle */}
                  <circle
                    cx="140"
                    cy={140 - 120}
                    r="14"
                    fill="rgba(0,0,0,0.8)"
                    stroke="white"
                    strokeWidth="3"
                    className="pointer-events-none transition-transform duration-100"
                  />
                </g>
              </>
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <span className="text-6xl font-light text-text-primary">
                {formatTime(timer.timeLeft)}
              </span>
              {!timer.isRunning && timerMode === 'study' && (
                <p className="text-sm text-text-secondary mt-2">
                  Drag handle to adjust
                </p>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Character */}
      <div className="flex justify-center mb-4">
        <button onClick={() => navigate('/avatar')} className="transition-transform hover:scale-105 active:scale-95">
          <Character stage={userData.currentStage} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="max-w-xs mx-auto mb-2">
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/70 rounded-full transition-all duration-500"
            style={{ width: `${progressSessionToNext()}%` }}
          />
        </div>
      </div>

      {/* Weekly Minutes */}
      <p className="text-center text-sm text-text-secondary mb-8">
        {weeklyMinutes} minutes this week
      </p>

      {/* Control Buttons */}
      <div className="flex justify-center gap-4 mb-6">
        {!timer.isRunning ? (
          <button
            onClick={timer.start}
            className="px-12 py-3 bg-white text-text-primary rounded-full font-medium shadow-soft hover:shadow-soft-lg transition-all duration-200 active:scale-95"
          >
            Start
          </button>
        ) : (
          <button
            onClick={timer.pause}
            className="px-12 py-3 bg-pastel-purple text-text-primary rounded-full font-medium shadow-soft hover:shadow-soft-lg transition-all duration-200 active:scale-95"
          >
            Pause
          </button>
        )}
      </div>

      {/* Skip Break Button (only show during break) */}
      {timerMode !== 'study' && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setTimerMode('study');
              timer.reset(customDuration);
            }}
            className="px-8 py-2 bg-white/50 text-text-primary rounded-full text-sm font-medium hover:bg-white/70 transition-all duration-200"
          >
            Skip Break
          </button>
        </div>
      )}

      {/* Celebration Message */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-white rounded-3xl px-8 py-6 shadow-soft-lg animate-bounce">
            <p className="text-2xl font-semibold text-text-primary text-center mb-2">
              Great Work! 🎉
            </p>
            <p className="text-text-secondary text-center">
              You completed a study session!
            </p>
            <p className="text-sm text-pastel-green-dark text-center mt-2 font-medium">
              +100 XP
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerScreen;
