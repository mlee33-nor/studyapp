import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerProps {
  initialMinutes: number;
  onComplete?: () => void;
  soundEnabled?: boolean;
}

interface UseTimerReturn {
  timeLeft: number;
  isRunning: boolean;
  progress: number;
  start: () => void;
  pause: () => void;
  reset: (minutes?: number) => void;
}

export const useTimer = ({ initialMinutes, onComplete, soundEnabled = true }: UseTimerProps): UseTimerReturn => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const totalTime = useRef(initialMinutes * 60);
  const onCompleteRef = useRef(onComplete);
  const soundEnabledRef = useRef(soundEnabled);

  // Keep refs up to date without triggering effect re-runs
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  const playCompletionSound = useCallback(() => {
    if (soundEnabledRef.current) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playCompletionSound();
            onCompleteRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, playCompletionSound]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((minutes?: number) => {
    setIsRunning(false);
    const newTime = (minutes || initialMinutes) * 60;
    setTimeLeft(newTime);
    totalTime.current = newTime;
  }, [initialMinutes]);

  const progress = totalTime.current > 0 ? ((totalTime.current - timeLeft) / totalTime.current) * 100 : 0;

  return {
    timeLeft,
    isRunning,
    progress,
    start,
    pause,
    reset,
  };
};
