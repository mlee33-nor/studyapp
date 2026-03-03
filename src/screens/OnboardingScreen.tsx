import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHapticFeedback, triggerSelectionTick } from '../utils/haptics';

interface OnboardingData {
  studyHours: string;
  age: string;
  occupation: string;
  goal: string;
}

interface OnboardingScreenProps {
  onComplete: (data: OnboardingData) => void;
  theme: 'morning' | 'midnight';
}

const THEMES = {
  morning: {
    gradient: 'linear-gradient(180deg, #F0F4FF 0%, #F5F0FF 50%, #F0FFF5 100%)',
    textPrimary: 'rgba(15, 23, 42, 0.95)',
    textSecondary: 'rgba(51, 65, 85, 0.7)',
    textTertiary: 'rgba(100, 116, 139, 0.5)',
    cardBg: 'rgba(255, 255, 255, 0.6)',
    cardBorder: 'rgba(0, 0, 0, 0.08)',
    optionBg: 'rgba(255, 255, 255, 0.7)',
    optionBorder: 'rgba(0, 0, 0, 0.08)',
    optionSelectedBg: 'rgba(167, 139, 250, 0.15)',
    optionSelectedBorder: 'rgba(167, 139, 250, 0.5)',
    buttonGradient: 'linear-gradient(135deg, rgba(167, 139, 250, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
    buttonShadow: '0 4px 20px rgba(139, 92, 246, 0.35)',
    progressBg: 'rgba(0, 0, 0, 0.06)',
    progressFill: 'linear-gradient(90deg, #A78BFA, #8B5CF6)',
    skipColor: 'rgba(100, 116, 139, 0.6)',
    orbs: [
      { color: 'rgba(230, 210, 255, 0.5)', size: 400, x: '5%', y: '5%' },
      { color: 'rgba(200, 255, 230, 0.5)', size: 350, x: '65%', y: '25%' },
      { color: 'rgba(200, 230, 255, 0.5)', size: 380, x: '35%', y: '65%' },
    ],
  },
  midnight: {
    gradient: 'linear-gradient(180deg, #000000 0%, #0F172A 50%, #1E1B4B 100%)',
    textPrimary: 'rgba(255, 255, 255, 0.9)',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textTertiary: 'rgba(255, 255, 255, 0.4)',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    optionBg: 'rgba(255, 255, 255, 0.06)',
    optionBorder: 'rgba(255, 255, 255, 0.1)',
    optionSelectedBg: 'rgba(167, 139, 250, 0.2)',
    optionSelectedBorder: 'rgba(167, 139, 250, 0.6)',
    buttonGradient: 'linear-gradient(135deg, rgba(167, 139, 250, 0.8) 0%, rgba(139, 92, 246, 0.8) 100%)',
    buttonShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
    progressBg: 'rgba(255, 255, 255, 0.08)',
    progressFill: 'linear-gradient(90deg, #A78BFA, #8B5CF6)',
    skipColor: 'rgba(255, 255, 255, 0.4)',
    orbs: [
      { color: 'rgba(59, 130, 246, 0.25)', size: 400, x: '5%', y: '5%' },
      { color: 'rgba(139, 92, 246, 0.25)', size: 350, x: '65%', y: '25%' },
      { color: 'rgba(16, 185, 129, 0.25)', size: 380, x: '35%', y: '65%' },
    ],
  },
};

// Step definitions
const STEPS = [
  { id: 'welcome' },
  { id: 'studyHours' },
  { id: 'age' },
  { id: 'occupation' },
  { id: 'goal' },
  { id: 'calculating' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, theme }) => {
  const t = THEMES[theme];
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    studyHours: '',
    age: '',
    occupation: '',
    goal: '',
  });
  const [calculatingProgress, setCalculatingProgress] = useState(0);
  const [calculatingLabel, setCalculatingLabel] = useState('Analyzing your study habits...');

  const stepId = STEPS[currentStep].id as StepId;
  const totalQuestionSteps = STEPS.length - 2; // exclude welcome + calculating
  const questionIndex = currentStep - 1; // 0-indexed within question steps

  const goNext = useCallback(() => {
    triggerSelectionTick();
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, []);

  const goBack = useCallback(() => {
    triggerSelectionTick();
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const selectOption = useCallback(
    (field: keyof OnboardingData, value: string) => {
      triggerSelectionTick();
      setData((d) => ({ ...d, [field]: value }));
      // Auto-advance after a short delay
      setTimeout(() => {
        setDirection(1);
        setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
      }, 300);
    },
    []
  );

  // Calculating step animation
  useEffect(() => {
    if (stepId !== 'calculating') return;

    const labels = [
      'Analyzing your study habits...',
      'Building your personalized plan...',
      'Selecting your starter companions...',
      'Preparing your study sanctuary...',
    ];

    let progress = 0;
    let labelIdx = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 8 + 3;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        triggerHapticFeedback('success');
        setTimeout(() => onComplete(data), 600);
      }
      setCalculatingProgress(Math.min(progress, 100));

      const newLabelIdx = Math.min(Math.floor(progress / 25), labels.length - 1);
      if (newLabelIdx !== labelIdx) {
        labelIdx = newLabelIdx;
        setCalculatingLabel(labels[labelIdx]);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [stepId, data, onComplete]);

  // Slide animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  const renderProgressDots = () => {
    if (stepId === 'welcome' || stepId === 'calculating') return null;
    return (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
        {Array.from({ length: totalQuestionSteps }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              width: i === questionIndex ? 24 : 8,
              background: i <= questionIndex ? t.progressFill : t.progressBg,
              opacity: i <= questionIndex ? 1 : 0.5,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              height: 8,
              borderRadius: 4,
              background: i <= questionIndex ? '#A78BFA' : t.progressBg,
            }}
          />
        ))}
      </div>
    );
  };

  const renderOption = (
    field: keyof OnboardingData,
    value: string,
    label: string,
    emoji?: string
  ) => {
    const isSelected = data[field] === value;
    return (
      <motion.button
        key={value}
        whileTap={{ scale: 0.97 }}
        onClick={() => selectOption(field, value)}
        style={{
          width: '100%',
          padding: '16px 20px',
          borderRadius: '16px',
          border: `2px solid ${isSelected ? t.optionSelectedBorder : t.optionBorder}`,
          background: isSelected ? t.optionSelectedBg : t.optionBg,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          transition: 'border-color 0.2s, background 0.2s',
          fontFamily: "'Quicksand', -apple-system, sans-serif",
        }}
      >
        {emoji && (
          <span style={{ fontSize: '24px', flexShrink: 0 }}>{emoji}</span>
        )}
        <span
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: t.textPrimary,
            textAlign: 'left',
          }}
        >
          {label}
        </span>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              marginLeft: 'auto',
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: t.buttonGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
        )}
      </motion.button>
    );
  };

  const renderContinueButton = (disabled: boolean, onClick: () => void) => (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={disabled ? undefined : onClick}
      style={{
        width: '100%',
        padding: '18px',
        borderRadius: '20px',
        border: 'none',
        background: disabled ? t.progressBg : t.buttonGradient,
        color: disabled ? t.textTertiary : 'white',
        fontSize: '17px',
        fontWeight: 700,
        cursor: disabled ? 'default' : 'pointer',
        boxShadow: disabled ? 'none' : t.buttonShadow,
        transition: 'background 0.3s, box-shadow 0.3s',
        fontFamily: "'Quicksand', -apple-system, sans-serif",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      Continue
    </motion.button>
  );

  const renderBackButton = () => {
    if (currentStep <= 1) return null;
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={goBack}
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          left: '16px',
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: `1px solid ${t.optionBorder}`,
          background: t.optionBg,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </motion.button>
    );
  };

  // --- Welcome Screen ---
  const renderWelcome = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        padding: '0 32px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 80px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)',
      }}
    >
      <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* App icon / mascot area */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          style={{
            width: 120,
            height: 120,
            borderRadius: '32px',
            background: t.buttonGradient,
            boxShadow: t.buttonShadow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
          }}
        >
          <span style={{ fontSize: '56px' }}>🌱</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: t.textPrimary,
            margin: '0 0 12px 0',
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            letterSpacing: '-0.02em',
          }}
        >
          Study Buddy
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            fontSize: '17px',
            color: t.textSecondary,
            margin: '0 0 8px 0',
            lineHeight: '1.5',
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            maxWidth: 300,
          }}
        >
          Focus better. Study smarter.
          <br />
          Collect adorable companions along the way.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
            marginTop: '24px',
          }}
        >
          {[
            { emoji: '🎯', label: 'Focus Timer' },
            { emoji: '🐾', label: 'Collect Animals' },
            { emoji: '📊', label: 'Track Progress' },
            { emoji: '🏆', label: 'Earn Rewards' },
          ].map((pill, i) => (
            <motion.div
              key={pill.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                background: t.optionBg,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: `1px solid ${t.optionBorder}`,
                fontSize: '13px',
                fontWeight: 600,
                color: t.textSecondary,
                fontFamily: "'Quicksand', -apple-system, sans-serif",
              }}
            >
              <span>{pill.emoji}</span>
              {pill.label}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        style={{ width: '100%', maxWidth: 360 }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={goNext}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '20px',
            border: 'none',
            background: t.buttonGradient,
            color: 'white',
            fontSize: '17px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: t.buttonShadow,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            marginBottom: '16px',
          }}
        >
          Get Started
        </motion.button>
      </motion.div>
    </div>
  );

  // --- Study Hours Question ---
  const renderStudyHours = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '0 24px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 72px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)',
      }}
    >
      {renderProgressDots()}

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontSize: '26px',
          fontWeight: 800,
          color: t.textPrimary,
          margin: '0 0 8px 0',
          fontFamily: "'Quicksand', -apple-system, sans-serif",
          letterSpacing: '-0.01em',
        }}
      >
        How much do you study daily?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          fontSize: '15px',
          color: t.textSecondary,
          margin: '0 0 28px 0',
          fontFamily: "'Quicksand', -apple-system, sans-serif",
        }}
      >
        We'll tailor your experience to your habits
      </motion.p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {renderOption('studyHours', 'less-than-1', 'Less than 1 hour', '📖')}
        {renderOption('studyHours', '1-2', '1 - 2 hours', '📚')}
        {renderOption('studyHours', '2-4', '2 - 4 hours', '🎯')}
        {renderOption('studyHours', '4-6', '4 - 6 hours', '🔥')}
        {renderOption('studyHours', '6-plus', '6+ hours', '💪')}
      </div>
    </div>
  );

  // --- Age Question ---
  const renderAge = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '0 24px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 72px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)',
      }}
    >
      {renderProgressDots()}

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontSize: '26px',
          fontWeight: 800,
          color: t.textPrimary,
          margin: '0 0 8px 0',
          fontFamily: "'Quicksand', -apple-system, sans-serif",
          letterSpacing: '-0.01em',
        }}
      >
        How old are you?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          fontSize: '15px',
          color: t.textSecondary,
          margin: '0 0 28px 0',
          fontFamily: "'Quicksand', -apple-system, sans-serif",
        }}
      >
        This helps us personalize your study plan
      </motion.p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {renderOption('age', 'under-18', 'Under 18', '🎒')}
        {renderOption('age', '18-24', '18 - 24', '🎓')}
        {renderOption('age', '25-34', '25 - 34', '💼')}
        {renderOption('age', '35-44', '35 - 44', '🏠')}
        {renderOption('age', '45-plus', '45+', '🌟')}
      </div>

      {/* Skip button */}
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setData((d) => ({ ...d, age: 'skipped' }));
            goNext();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: t.skipColor,
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '12px 24px',
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          Skip
        </motion.button>
      </div>
    </div>
  );

  // --- Occupation Question ---
  const renderOccupation = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '0 24px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 72px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)',
      }}
    >
      {renderProgressDots()}

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontSize: '26px',
          fontWeight: 800,
          color: t.textPrimary,
          margin: '0 0 8px 0',
          fontFamily: "'Quicksand', -apple-system, sans-serif",
          letterSpacing: '-0.01em',
        }}
      >
        What do you do?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          fontSize: '15px',
          color: t.textSecondary,
          margin: '0 0 28px 0',
          fontFamily: "'Quicksand', -apple-system, sans-serif",
        }}
      >
        We'll customize your study categories
      </motion.p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {renderOption('occupation', 'student', 'Student', '📚')}
        {renderOption('occupation', 'professional', 'Working Professional', '💼')}
        {renderOption('occupation', 'self-learner', 'Self-Learner', '🧠')}
        {renderOption('occupation', 'other', 'Other', '✨')}
      </div>
    </div>
  );

  // --- Goal Question ---
  const renderGoal = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '0 24px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 72px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)',
      }}
    >
      {renderProgressDots()}

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontSize: '26px',
          fontWeight: 800,
          color: t.textPrimary,
          margin: '0 0 8px 0',
          fontFamily: "'Quicksand', -apple-system, sans-serif",
          letterSpacing: '-0.01em',
        }}
      >
        What's your main goal?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          fontSize: '15px',
          color: t.textSecondary,
          margin: '0 0 28px 0',
          fontFamily: "'Quicksand', -apple-system, sans-serif",
        }}
      >
        Choose what matters most to you
      </motion.p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {renderOption('goal', 'focus', 'Stay focused longer', '🎯')}
        {renderOption('goal', 'consistent', 'Build a study habit', '📅')}
        {renderOption('goal', 'productive', 'Be more productive', '⚡')}
        {renderOption('goal', 'exam-prep', 'Prepare for exams', '📝')}
      </div>
    </div>
  );

  // --- Calculating Screen ---
  const renderCalculating = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '0 32px',
        textAlign: 'center',
      }}
    >
      {/* Animated mascot */}
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          width: 100,
          height: 100,
          borderRadius: '28px',
          background: t.buttonGradient,
          boxShadow: t.buttonShadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '40px',
        }}
      >
        <span style={{ fontSize: '48px' }}>🌱</span>
      </motion.div>

      <motion.h2
        key={calculatingLabel}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: t.textPrimary,
          margin: '0 0 32px 0',
          fontFamily: "'Quicksand', -apple-system, sans-serif",
        }}
      >
        {calculatingLabel}
      </motion.h2>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          maxWidth: 280,
          height: 8,
          borderRadius: 4,
          background: t.progressBg,
          overflow: 'hidden',
        }}
      >
        <motion.div
          animate={{ width: `${calculatingProgress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            height: '100%',
            borderRadius: 4,
            background: t.progressFill,
          }}
        />
      </div>

      <div
        style={{
          marginTop: '16px',
          fontSize: '14px',
          fontWeight: 600,
          color: t.textTertiary,
          fontFamily: "'Quicksand', -apple-system, sans-serif",
        }}
      >
        {Math.round(calculatingProgress)}%
      </div>
    </div>
  );

  const renderStep = () => {
    switch (stepId) {
      case 'welcome':
        return renderWelcome();
      case 'studyHours':
        return renderStudyHours();
      case 'age':
        return renderAge();
      case 'occupation':
        return renderOccupation();
      case 'goal':
        return renderGoal();
      case 'calculating':
        return renderCalculating();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          inset: '-50px',
          background: t.gradient,
          zIndex: 0,
        }}
      >
        {/* Animated orbs */}
        {t.orbs.map((orb, index) => (
          <motion.div
            key={index}
            animate={{
              x: [0, 60 * (index % 2 ? 1 : -1), -40 * (index % 2 ? 1 : -1), 0],
              y: [0, -50 * (index % 2 ? -1 : 1), 70 * (index % 2 ? -1 : 1), 0],
              scale: [1, 1.15, 0.9, 1],
            }}
            transition={{
              duration: 18 + index * 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 2,
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
            }}
          />
        ))}
      </div>

      {/* Back button */}
      {renderBackButton()}

      {/* Animated step content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
          }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OnboardingScreen;
