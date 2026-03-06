import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../hooks/useTimer';
import { useUserData } from '../hooks/useUserData';
import { useTheme } from '../contexts/ThemeContext';
import type { TimerMode, BiomeType } from '../types';
import { getWeeklyMinutes } from '../utils/storage';
import { triggerSelectionTick } from '../utils/haptics';
import { getAnimalsForBiome, getAnimalScale, BIOME_CONFIG } from '../data/biomes';
import Lottie from 'lottie-react';
import { fetchAnimation, getAllCached } from '../utils/lottieCache';

const TimerScreen: React.FC = () => {
  const navigate = useNavigate();
  const { userData, completeSession, updateSettings, setUserData } = useUserData();
  const { getGradientClass } = useTheme();
  const [timerMode, setTimerMode] = useState<TimerMode>('study');
  const [showCelebration, setShowCelebration] = useState(false);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [customDuration, setCustomDuration] = useState(userData.settings.studyDuration);
  const [showAnimalSelector, setShowAnimalSelector] = useState(false);
  const [loadedAnimations, setLoadedAnimations] = useState<Record<string, any>>(getAllCached);
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
      triggerSelectionTick();
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

  // Load selected animal animation
  useEffect(() => {
    const animal = userData.selectedAnimal;
    if (!animal) return;
    // Skip if already in local state (from cache or previous load)
    if (loadedAnimations[animal.id]) return;
    let cancelled = false;
    fetchAnimation(animal.id, animal.lottieUrl)
      .then(data => { if (!cancelled) setLoadedAnimations(prev => ({ ...prev, [animal.id]: data })); })
      .catch(err => console.error('Error loading animation:', err));
    return () => { cancelled = true; };
  }, [userData.selectedAnimal?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`min-h-screen ${getGradientClass()} transition-all duration-700 pb-20 px-6 pt-8`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {timerMode === 'study' ? 'Timer' : 'Break'}
          </h1>
          <p className="text-xs text-text-secondary">v2.1 Build 5 - Math Lock</p>
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

      {/* Timer Circle - Mathematical Lock System */}
      {(() => {
        // === GLOBAL CONSTANTS (Single Source of Truth) ===
        const SVG_SIZE = 280;
        const CX = SVG_SIZE / 2; // 140
        const CY = SVG_SIZE / 2; // 140
        const STROKE_WIDTH = 8;
        const RADIUS = (SVG_SIZE - STROKE_WIDTH) / 2 - 16; // 120
        const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

        // === HANDLE POSITION via Pure Trigonometry ===
        // Progress handle: angle derived from timer.progress (0-100)
        const progressAngle = (timer.progress / 100) * 2 * Math.PI - Math.PI / 2;
        const progressHandleX = CX + RADIUS * Math.cos(progressAngle);
        const progressHandleY = CY + RADIUS * Math.sin(progressAngle);

        // Duration handle: angle derived from customDuration (5-60 min)
        const durationFraction = (customDuration - 5) / 55;
        const durationAngle = durationFraction * 2 * Math.PI - Math.PI / 2;
        const durationHandleX = CX + RADIUS * Math.cos(durationAngle);
        const durationHandleY = CY + RADIUS * Math.sin(durationAngle);

        return (
          <div className="flex justify-center mb-6">
            <div className="relative aspect-square" style={{ width: SVG_SIZE, height: SVG_SIZE }}>
              <svg
                ref={circleRef}
                width={SVG_SIZE}
                height={SVG_SIZE}
                viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                overflow="visible"
                style={{ touchAction: 'none' }}
              >
                {/* Background fill circle */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={RADIUS + 10}
                  fill="white"
                  opacity="0.2"
                />
                {/* Border circle */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={RADIUS}
                  fill="white"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.3"
                />
                {/* Progress ring - starts at top (12 o'clock) */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={RADIUS}
                  fill="none"
                  stroke="white"
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * (1 - timer.progress / 100)}
                  strokeLinecap="round"
                  opacity="0.9"
                  transform={`rotate(-90 ${CX} ${CY})`}
                  className="transition-all duration-1000"
                />

                {/* Draggable handle - only when timer stopped & study mode */}
                {!timer.isRunning && timerMode === 'study' && (
                  <>
                    {/* Handle track circle (dashed) */}
                    <circle
                      cx={CX}
                      cy={CY}
                      r={RADIUS}
                      fill="none"
                      stroke="rgba(0,0,0,0.1)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                    {/* Duration indicator line from center to handle */}
                    <line
                      x1={CX}
                      y1={CY}
                      x2={durationHandleX}
                      y2={durationHandleY}
                      stroke="rgba(0,0,0,0.3)"
                      strokeWidth="2"
                    />
                    {/* Invisible larger hit area for easier touch (cx/cy positioned via trig) */}
                    <circle
                      cx={durationHandleX}
                      cy={durationHandleY}
                      r="24"
                      fill="transparent"
                      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                      onTouchStart={handleDragStart}
                      onMouseDown={handleDragStart}
                    />
                    {/* Visible handle circle (cx/cy positioned via trig) */}
                    <circle
                      cx={durationHandleX}
                      cy={durationHandleY}
                      r="14"
                      fill="rgba(0,0,0,0.8)"
                      stroke="white"
                      strokeWidth="3"
                      className="pointer-events-none"
                    />
                  </>
                )}

                {/* Progress handle - visible while timer is running */}
                {timer.isRunning && (
                  <circle
                    cx={progressHandleX}
                    cy={progressHandleY}
                    r="10"
                    fill="white"
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="2"
                    className="pointer-events-none"
                  />
                )}
              </svg>
              {/* Centered time display overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <span className="text-6xl font-light text-text-primary">
                    {formatTime(timer.timeLeft)}
                  </span>
                  {timer.isRunning && timerMode === 'study' && (
                    <p className="text-sm text-text-secondary mt-1 flex items-center justify-center gap-1">
                      <span style={{ filter: 'sepia(1) saturate(3) brightness(1.1) hue-rotate(15deg)' }}>🪙</span>
                      {Math.floor((timer.progress / 100) * customDuration)} coins earned
                    </p>
                  )}
                  {!timer.isRunning && timerMode === 'study' && (
                    <p className="text-sm text-text-secondary mt-2">
                      Drag handle to adjust
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Selected Animal Display */}
      {userData.selectedAnimal && (
        <div className="flex justify-center mb-6">
          <button
            onClick={() => {
              console.log("Animal button clicked!");
              setShowAnimalSelector(true);
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-soft-lg transition-all duration-200 active:scale-95"
          >
            <div className="text-sm text-text-secondary font-medium">Next Animal:</div>
            <div className="w-20 h-20 pointer-events-none" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loadedAnimations[userData.selectedAnimal.id] ? (
                (() => {
                  const animalScale = getAnimalScale(userData.selectedAnimal.lottieUrl);
                  const scaledSize = animalScale ? 80 * animalScale : 80;
                  return (
                    <div style={{ width: `${scaledSize}px`, height: `${scaledSize}px`, flexShrink: 0 }}>
                      <Lottie
                        animationData={loadedAnimations[userData.selectedAnimal.id]}
                        loop={true}
                        style={{
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-center justify-center h-full text-2xl">
                  {userData.selectedAnimal.name}
                </div>
              )}
            </div>
            <div className="text-sm text-text-primary font-semibold">{userData.selectedAnimal.name}</div>
            <div className="text-xs text-text-secondary">{BIOME_CONFIG[userData.selectedAnimal.biome as BiomeType].name}</div>
          </button>
        </div>
      )}

      {/* Animal Selector Modal */}
      {showAnimalSelector && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-6"
          onClick={() => setShowAnimalSelector(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-md max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-text-primary mb-4">Select Your Animal</h2>

            {(userData.unlockedBiomes as BiomeType[]).map((biomeId) => {
              const biomeConfig = BIOME_CONFIG[biomeId];
              const biomeAnimals = getAnimalsForBiome(biomeId);

              return (
                <div key={biomeId} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-xl">{biomeConfig.emoji}</div>
                    <h3 className="text-sm font-semibold text-text-primary">{biomeConfig.name}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {biomeAnimals.map((animal) => (
                      <button
                        key={animal.id}
                        onClick={() => {
                          const newData = {
                            ...userData,
                            selectedAnimal: {
                              id: animal.id,
                              name: animal.name,
                              biome: biomeId,
                              lottieUrl: animal.lottieUrl,
                            },
                          };
                          setUserData(newData);
                          setShowAnimalSelector(false);
                        }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 ${
                          userData.selectedAnimal?.id === animal.id
                            ? 'bg-pastel-purple/30 ring-2 ring-pastel-purple'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <div className="text-sm text-text-primary font-semibold text-center line-clamp-2">{animal.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
      <div className="flex justify-center gap-3 mb-6">
        {!timer.isRunning ? (
          <>
            <button
              onClick={timer.start}
              className="px-10 py-3 bg-white text-text-primary rounded-full font-medium shadow-soft hover:shadow-soft-lg transition-all duration-200 active:scale-95"
            >
              Start
            </button>
            {timerMode === 'study' && timer.progress > 0 && (
              <button
                onClick={handleTimerComplete}
                className="px-6 py-3 bg-pastel-green text-text-primary rounded-full font-medium shadow-soft hover:shadow-soft-lg transition-all duration-200 active:scale-95"
              >
                Complete
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={timer.pause}
              className="px-6 py-3 bg-pastel-purple text-text-primary rounded-full font-medium shadow-soft hover:shadow-soft-lg transition-all duration-200 active:scale-95"
            >
              Pause
            </button>
            {timerMode === 'study' && (
              <>
                <button
                  onClick={() => {
                    timer.pause();
                    handleTimerComplete();
                  }}
                  className="px-6 py-3 bg-pastel-green text-text-primary rounded-full font-medium shadow-soft hover:shadow-soft-lg transition-all duration-200 active:scale-95"
                >
                  Complete
                </button>
                <button
                  onClick={() => {
                    timer.pause();
                    timer.reset(customDuration);
                  }}
                  className="px-6 py-3 bg-red-100 text-red-600 rounded-full font-medium shadow-soft hover:shadow-soft-lg transition-all duration-200 active:scale-95"
                >
                  Fail
                </button>
              </>
            )}
          </>
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
