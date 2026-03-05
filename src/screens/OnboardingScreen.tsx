import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import confetti from 'canvas-confetti';
import { triggerHapticFeedback, triggerSelectionTick } from '../utils/haptics';
import { createAccount, verifyLogin, setLoggedIn } from '../utils/auth';
import sanctuaryImg from '../assets/Sanctuary.jpg';
import statsImg from '../assets/Stats.jpg';

const BUNNY_LOTTIE_URL = 'https://assets-v2.lottiefiles.com/a/935dfeb0-118b-11ee-9126-43e3de286e2f/1X7rBzXV9L.json';

interface OnboardingData {
  studyHours: string;
  age?: string;
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
      { color: 'rgba(230, 210, 255, 0.35)', size: 600, x: '-5%', y: '-5%' },
      { color: 'rgba(200, 255, 230, 0.35)', size: 550, x: '55%', y: '20%' },
      { color: 'rgba(200, 230, 255, 0.35)', size: 580, x: '25%', y: '55%' },
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
      { color: 'rgba(59, 130, 246, 0.2)', size: 600, x: '-5%', y: '-5%' },
      { color: 'rgba(139, 92, 246, 0.2)', size: 550, x: '55%', y: '20%' },
      { color: 'rgba(16, 185, 129, 0.2)', size: 580, x: '25%', y: '55%' },
    ],
  },
};

const GRADIENT_TEXT_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, #A78BFA 0%, #818CF8 50%, #6366F1 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

// Step definitions
const STEPS = [
  { id: 'welcome' },
  { id: 'studyHours' },
  { id: 'occupation' },
  { id: 'goal' },
  { id: 'calculating' },
  { id: 'intro' },
  { id: 'badNews' },
  { id: 'goodNews' },
  { id: 'sanctuary' },
  { id: 'stats' },
  { id: 'premium' },
  { id: 'chestReveal' },
  { id: 'lastChance' },
  { id: 'createAccount' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

const QUESTION_STEP_IDS = ['studyHours', 'occupation', 'goal'] as const;

// Personalized stats based on user answers
function getPersonalizedStats(data: OnboardingData) {
  // Daily study hours → estimated lost hours/year (20-30% distraction rate, 300 study days)
  const studyHoursMap: Record<string, { lostRange: [number, number]; reclaimHeadline: string; workweeksRange: [number, number] }> = {
    'less-than-1': { lostRange: [45, 67], reclaimHeadline: 'Save up to 1 week per year.', workweeksRange: [1, 1.5] },
    '1-2': { lostRange: [90, 135], reclaimHeadline: 'Reclaim 2\u20133 weeks per year.', workweeksRange: [2, 3] },
    '2-4': { lostRange: [180, 270], reclaimHeadline: 'Gain back 1 full month per year.', workweeksRange: [4.5, 7] },
    '4-6': { lostRange: [300, 450], reclaimHeadline: 'Recover 1.5\u20132 months per year.', workweeksRange: [7.5, 11] },
    '6-plus': { lostRange: [420, 630], reclaimHeadline: 'Save 2\u20133 months every year.', workweeksRange: [10, 16] },
  };

  // Age → compounded impact projection
  const ageMultiplierMap: Record<string, { years: number; label: string }> = {
    'under-18': { years: 7, label: '~1 year of workweeks' },
    '18-24': { years: 5, label: '5\u20138 months of focused time' },
    '25-34': { years: 10, label: '~1\u20131.5 years of workweeks' },
    '35-44': { years: 10, label: '~1 year reclaimed' },
    '45-plus': { years: 15, label: '1.5\u20132 years of workweeks' },
  };

  // Goal-specific taglines
  const goalTaglineMap: Record<string, string> = {
    'focus': 'Increase your deep work by 20\u201330%.',
    'consistent': 'Turn distracted hours into consistent ones.',
    'productive': 'Gain 1 extra productive day per week.',
    'exam-prep': 'Add 25\u201340 extra focused sessions before test day.',
  };

  const study = studyHoursMap[data.studyHours] || studyHoursMap['2-4'];
  const age = ageMultiplierMap[data.age ?? '25-34'] || ageMultiplierMap['25-34'];

  // Use the midpoint for display
  const lostHoursPerYear = Math.round((study.lostRange[0] + study.lostRange[1]) / 2);
  const workweeks = Math.round((study.workweeksRange[0] + study.workweeksRange[1]) / 2);

  // Compounded hours over remaining learning years
  const compoundedHours = lostHoursPerYear * age.years;

  // Reclaimable: ~80% of lost hours (what the app can help save)
  const reclaimableHours = Math.round(lostHoursPerYear * 0.8);

  // Format workweeks for display
  const workweeksLabel = workweeks === 1 ? '1 full workweek' : `${workweeks} full workweeks`;

  const goalTagline = goalTaglineMap[data.goal] || goalTaglineMap['productive'];

  return {
    lostHoursPerYear,
    reclaimableHours,
    workweeks,
    workweeksLabel,
    compoundedHours,
    ageProjection: age.label,
    reclaimHeadline: study.reclaimHeadline,
    goalTagline,
  };
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, theme }) => {
  const t = THEMES[theme];
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    studyHours: '',
    occupation: '',
    goal: '',
  });
  const [calculatingProgress, setCalculatingProgress] = useState(0);
  const [calculatingLabel, setCalculatingLabel] = useState('Analyzing your study habits...');
  const [bunnyAnimData, setBunnyAnimData] = useState<any>(null);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'lifetime' | 'annual' | 'monthly'>('lifetime');
  const [chestAnimData, setChestAnimData] = useState<any>(null);
  const [chestStage, setChestStage] = useState(0);
  const [lastChanceTapGuard, setLastChanceTapGuard] = useState(false);
  const [navCooldown, setNavCooldown] = useState(false);
  const chestLottieRef = useRef<any>(null);
  const chestDoneRef = useRef(false);

  // Preload sanctuary and stats images on mount
  useEffect(() => {
    const preload = (src: string) => { const img = new Image(); img.src = src; };
    preload(sanctuaryImg);
    preload(statsImg);
  }, []);

  // Pre-fetch bunny Lottie animation
  useEffect(() => {
    fetch(BUNNY_LOTTIE_URL)
      .then((res) => res.json())
      .then(setBunnyAnimData)
      .catch(() => {});
  }, []);

  // Load chest Lottie when approaching chestReveal step
  useEffect(() => {
    if (!chestAnimData) {
      fetch('/studyapp/treasure-3d.json')
        .then((r) => r.json())
        .then(setChestAnimData)
        .catch(() => {});
    }
  }, [chestAnimData]);

  // Control chest Lottie playback per stage
  useEffect(() => {
    if (!chestLottieRef.current) return;
    const lottie = chestLottieRef.current;
    if (chestStage === 0) {
      lottie.goToAndStop(0, true);
    } else if (chestStage === 1) {
      lottie.playSegments([0, 45], true);
    } else if (chestStage === 2) {
      lottie.playSegments([45, 90], true);
    }
  }, [chestStage]);

  // Reset chest stage when entering chestReveal step
  useEffect(() => {
    if (STEPS[currentStep].id === 'chestReveal') {
      setChestStage(0);
      chestDoneRef.current = false;
    }
  }, [currentStep]);

  // Fire confetti and enable tap guard when lastChance screen appears
  useEffect(() => {
    if (STEPS[currentStep].id === 'lastChance') {
      setLastChanceTapGuard(true);
      // No cleanup — let the timeout always fire so buttons reliably enable
      setTimeout(() => setLastChanceTapGuard(false), 2000);

      const gold = ['#FFD700', '#FFC107', '#FFAB00', '#FFE082', '#FFFFFF'];
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.4, x: 0.5 }, colors: gold, shapes: ['circle'], startVelocity: 50, zIndex: 99999 });
      setTimeout(() => {
        confetti({ particleCount: 60, spread: 140, origin: { y: 0.45, x: 0.25 }, colors: gold, shapes: ['circle'], startVelocity: 35, zIndex: 99999 });
      }, 150);
      setTimeout(() => {
        confetti({ particleCount: 60, spread: 140, origin: { y: 0.45, x: 0.75 }, colors: gold, shapes: ['circle'], startVelocity: 35, zIndex: 99999 });
      }, 300);
      setTimeout(() => {
        confetti({ particleCount: 50, spread: 180, origin: { y: 0.3, x: 0.5 }, colors: gold, shapes: ['circle'], gravity: 1.2, scalar: 0.9, zIndex: 99999 });
      }, 500);
    }
  }, [currentStep]);

  const stepId = STEPS[currentStep].id as StepId;
  const totalQuestionSteps = QUESTION_STEP_IDS.length;
  const questionIndex = QUESTION_STEP_IDS.indexOf(stepId as any);
  const stats = getPersonalizedStats(data);

  const goNext = useCallback(() => {
    if (navCooldown) return;
    triggerSelectionTick();
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    setNavCooldown(true);
    setTimeout(() => setNavCooldown(false), 1000);
  }, [navCooldown]);

  const goBack = useCallback(() => {
    if (navCooldown) return;
    triggerSelectionTick();
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 0));
    setNavCooldown(true);
    setTimeout(() => setNavCooldown(false), 1000);
  }, [navCooldown]);

  const selectOption = useCallback(
    (field: keyof OnboardingData, value: string) => {
      triggerSelectionTick();
      setData((d) => ({ ...d, [field]: value }));
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
        triggerHapticFeedback();
        setTimeout(() => { setDirection(1); setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1)); }, 600);
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
    enter: (_dir: number) => ({
      opacity: 0,
    }),
    center: {
      opacity: 1,
    },
    exit: (_dir: number) => ({
      opacity: 0,
    }),
  };

  const renderProgressDots = () => {
    if (questionIndex < 0) return null;
    return (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
        {Array.from({ length: totalQuestionSteps }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 8,
              width: i === questionIndex ? 24 : 8,
              borderRadius: 4,
              background: i <= questionIndex ? '#A78BFA' : t.progressBg,
              opacity: i <= questionIndex ? 1 : 0.5,
              transition: 'width 0.3s ease, background 0.3s ease, opacity 0.3s ease',
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
      <button
        key={value}
        onClick={() => selectOption(field, value)}
        style={{
          width: '100%',
          padding: '16px 20px',
          borderRadius: '16px',
          border: `2px solid ${isSelected ? t.optionSelectedBorder : t.optionBorder}`,
          background: isSelected ? t.optionSelectedBg : t.optionBg,
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
          <div
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
          </div>
        )}
      </button>
    );
  };

  const renderConfirmButton = (field: keyof OnboardingData) => {
    const hasSelection = data[field] !== '';
    return (
      <div style={{ marginTop: '16px' }}>
        <AnimatePresence>
          {hasSelection && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
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
              }}
            >
              Continue
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderContinueButton = (label = 'Continue') => (
    <motion.button
      whileTap={navCooldown ? {} : { scale: 0.97 }}
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
        cursor: navCooldown ? 'default' : 'pointer',
        boxShadow: t.buttonShadow,
        fontFamily: "'Quicksand', -apple-system, sans-serif",
        opacity: navCooldown ? 0.5 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      {label}
    </motion.button>
  );

  const renderBackButton = () => {
    // Hide back button on welcome, calculating, and post-calculating Opal screens
    const postCalcSteps: string[] = ['welcome', 'calculating', 'intro', 'badNews', 'goodNews', 'sanctuary', 'stats', 'premium', 'chestReveal', 'lastChance', 'createAccount'];
    if (currentStep <= 0 || postCalcSteps.includes(stepId)) return null;
    return (
      <button
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
          cursor: navCooldown ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          opacity: navCooldown ? 0.5 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
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
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: '32px',
            background: t.buttonGradient,
            boxShadow: t.buttonShadow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
            overflow: 'hidden',
          }}
        >
          {bunnyAnimData ? (
            <Lottie animationData={bunnyAnimData} loop style={{ width: 120, height: 120 }} />
          ) : (
            <span style={{ fontSize: '56px' }}>🐰</span>
          )}
        </div>

        <h1
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
        </h1>

        <p
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
        </p>

        {/* Feature pills */}
        <div
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
          ].map((pill) => (
            <div
              key={pill.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                background: t.optionBg,
                border: `1px solid ${t.optionBorder}`,
                fontSize: '13px',
                fontWeight: 600,
                color: t.textSecondary,
                fontFamily: "'Quicksand', -apple-system, sans-serif",
              }}
            >
              <span>{pill.emoji}</span>
              {pill.label}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom button */}
      <div style={{ width: '100%', maxWidth: 360 }}>
        {renderContinueButton('Get Started')}
      </div>
    </div>
  );

  // --- Opal-style Intro Screen ---
  const renderIntro = () => (
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
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: t.textPrimary,
            textAlign: 'center',
            lineHeight: 1.35,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            letterSpacing: '-0.01em',
            maxWidth: 320,
          }}
        >
          Some not-so-good news,{' '}
          <span style={{ display: 'block', marginTop: '4px' }}>
            and some{' '}
            <span style={GRADIENT_TEXT_STYLE}>great</span>{' '}
            news.
          </span>
        </h1>
      </div>

      <div style={{ width: '100%', maxWidth: 360 }}>
        {renderContinueButton()}
      </div>
    </div>
  );

  // --- Opal-style Bad News Screen ---
  const renderBadNews = () => (
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', maxWidth: 360 }}>
        <p
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: t.textTertiary,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            margin: '0 0 32px 0',
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          Bad news
        </p>

        <p
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: t.textSecondary,
            margin: '0 0 8px 0',
            lineHeight: 1.4,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          You lose nearly
        </p>

        <h2
          style={{
            fontSize: '56px',
            fontWeight: 800,
            margin: '0 0 8px 0',
            lineHeight: 1.1,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            ...GRADIENT_TEXT_STYLE,
          }}
        >
          {stats.lostHoursPerYear} hours
        </h2>

        <p
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: t.textSecondary,
            margin: '0 0 40px 0',
            lineHeight: 1.4,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          a year to distraction.
        </p>

        <p
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: t.textSecondary,
            margin: '0 0 8px 0',
            lineHeight: 1.4,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          That's
        </p>

        <h2
          style={{
            fontSize: '56px',
            fontWeight: 800,
            margin: '0 0 8px 0',
            lineHeight: 1.1,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            ...GRADIENT_TEXT_STYLE,
          }}
        >
          {stats.workweeksLabel}
        </h2>

        <p
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: t.textSecondary,
            margin: 0,
            lineHeight: 1.4,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          of your life — gone.
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 360 }}>
        {renderContinueButton()}
      </div>
    </div>
  );

  // --- Opal-style Good News Screen ---
  const renderGoodNews = () => (
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', maxWidth: 360 }}>
        <h2
          style={{
            fontSize: '32px',
            fontWeight: 800,
            margin: '0 0 32px 0',
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            letterSpacing: '-0.01em',
            ...GRADIENT_TEXT_STYLE,
          }}
        >
          GOOD NEWS
        </h2>

        <p
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: t.textSecondary,
            margin: '0 0 8px 0',
            lineHeight: 1.4,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          You can reclaim
        </p>

        <h2
          style={{
            fontSize: '56px',
            fontWeight: 800,
            margin: '0 0 8px 0',
            lineHeight: 1.1,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            ...GRADIENT_TEXT_STYLE,
          }}
        >
          {stats.reclaimableHours}+ hours
        </h2>

        <p
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: t.textSecondary,
            margin: '0 0 40px 0',
            lineHeight: 1.4,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          this year.
        </p>

        <p
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: t.textSecondary,
            margin: 0,
            lineHeight: 1.4,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          {stats.goalTagline}
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 360 }}>
        {renderContinueButton()}
      </div>
    </div>
  );

  // --- Opal-style First Step Screen ---
  // --- Premium Paywall Screen ---
  const premiumFeatures = [
    { icon: '🎯', label: 'Unlimited focus sessions' },
    { icon: '🐾', label: 'Unlock all companions & biomes' },
    { icon: '📊', label: 'Advanced analytics & insights' },
    { icon: '🎨', label: 'Custom themes & sounds' },
    { icon: '☁️', label: 'Cloud sync across devices' },
  ];

  const renderPremium = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        padding: '0 24px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 40px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '14px', width: '100%', maxWidth: 360 }}>
        <div
          style={{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            marginBottom: '10px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: "'Quicksand', -apple-system, sans-serif",
              background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            LIMITED OFFER
          </span>
        </div>

        <h2
          style={{
            fontSize: '26px',
            fontWeight: 800,
            margin: '0 0 2px 0',
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            letterSpacing: '-0.02em',
            ...GRADIENT_TEXT_STYLE,
          }}
        >
          Study Buddy
        </h2>
        <h2
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: t.textPrimary,
            margin: '0 0 4px 0',
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            letterSpacing: '-0.02em',
          }}
        >
          PLUS
        </h2>
        <p
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: t.textSecondary,
            margin: 0,
            lineHeight: 1.4,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          Unlock your full potential
        </p>
      </div>

      {/* Feature list */}
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: t.cardBg,
          borderRadius: '20px',
          padding: '10px 20px',
          border: `1px solid ${t.cardBorder}`,
          marginBottom: '14px',
        }}
      >
        {premiumFeatures.map((feature, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 0',
              borderBottom: i < premiumFeatures.length - 1 ? `1px solid ${t.optionBorder}` : 'none',
            }}
          >
            <span style={{ fontSize: '17px', flexShrink: 0 }}>{feature.icon}</span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: t.textPrimary,
                fontFamily: "'Quicksand', -apple-system, sans-serif",
              }}
            >
              {feature.label}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#A78BFA"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginLeft: 'auto', flexShrink: 0 }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        ))}
      </div>

      {/* Plan options */}
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
        {/* Lifetime */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { setSelectedPlan('lifetime'); triggerSelectionTick(); }}
          style={{
            width: '100%',
            padding: '14px 18px',
            borderRadius: '16px',
            border: selectedPlan === 'lifetime'
              ? '2px solid rgba(167, 139, 250, 0.6)'
              : `1px solid ${t.optionBorder}`,
            background: selectedPlan === 'lifetime' ? t.optionSelectedBg : t.optionBg,
            cursor: 'pointer',
            textAlign: 'left',
            position: 'relative',
            overflow: 'visible',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Best value badge */}
          <div
            style={{
              position: 'absolute',
              top: '-9px',
              left: '18px',
              padding: '2px 10px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
              fontSize: '9px',
              fontWeight: 700,
              color: 'white',
              fontFamily: "'Quicksand', -apple-system, sans-serif",
              whiteSpace: 'nowrap',
            }}
          >
            BEST VALUE
          </div>
          <div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: t.textPrimary,
                fontFamily: "'Quicksand', -apple-system, sans-serif",
              }}
            >
              Lifetime
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: t.textTertiary,
                fontFamily: "'Quicksand', -apple-system, sans-serif",
                marginTop: '1px',
              }}
            >
              Pay once, yours forever
            </div>
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: t.textPrimary,
              fontFamily: "'Quicksand', -apple-system, sans-serif",
            }}
          >
            $33
          </div>
        </motion.button>

        {/* Annual */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { setSelectedPlan('annual'); triggerSelectionTick(); }}
          style={{
            width: '100%',
            padding: '14px 18px',
            borderRadius: '16px',
            border: selectedPlan === 'annual'
              ? '2px solid rgba(167, 139, 250, 0.6)'
              : `1px solid ${t.optionBorder}`,
            background: selectedPlan === 'annual' ? t.optionSelectedBg : t.optionBg,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: t.textPrimary,
                fontFamily: "'Quicksand', -apple-system, sans-serif",
              }}
            >
              Annual
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: t.textTertiary,
                fontFamily: "'Quicksand', -apple-system, sans-serif",
                marginTop: '1px',
              }}
            >
              $1.33/month — save 67%
            </div>
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: t.textPrimary,
              fontFamily: "'Quicksand', -apple-system, sans-serif",
            }}
          >
            $15.99
          </div>
        </motion.button>

        {/* Monthly */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { setSelectedPlan('monthly'); triggerSelectionTick(); }}
          style={{
            width: '100%',
            padding: '14px 18px',
            borderRadius: '16px',
            border: selectedPlan === 'monthly'
              ? '2px solid rgba(167, 139, 250, 0.6)'
              : `1px solid ${t.optionBorder}`,
            background: selectedPlan === 'monthly' ? t.optionSelectedBg : t.optionBg,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: t.textPrimary,
                fontFamily: "'Quicksand', -apple-system, sans-serif",
              }}
            >
              Monthly
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: t.textTertiary,
                fontFamily: "'Quicksand', -apple-system, sans-serif",
                marginTop: '1px',
              }}
            >
              per month
            </div>
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: t.textPrimary,
              fontFamily: "'Quicksand', -apple-system, sans-serif",
            }}
          >
            $3.99
          </div>
        </motion.button>
      </div>

      {/* CTA Button */}
      <div style={{ width: '100%', maxWidth: 360 }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { if (navCooldown) return; triggerSelectionTick(); setDirection(1); setCurrentStep((s) => Math.min(s + 3, STEPS.length - 1)); setNavCooldown(true); setTimeout(() => setNavCooldown(false), 1000); }}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '18px',
            border: 'none',
            background: t.buttonGradient,
            color: 'white',
            fontSize: '16px',
            fontWeight: 700,
            cursor: navCooldown ? 'default' : 'pointer',
            boxShadow: t.buttonShadow,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            opacity: navCooldown ? 0.5 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          Start Free Trial
        </motion.button>

        <p
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: t.textTertiary,
            textAlign: 'center',
            margin: '8px 0 0 0',
            lineHeight: 1.4,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          {selectedPlan === 'lifetime'
            ? 'One-time payment of $33. No subscription.'
            : `3-day free trial, then ${selectedPlan === 'annual' ? '$15.99/year' : '$3.99/month'}. Cancel anytime.`}
        </p>

        <button
          onClick={goNext}
          style={{
            width: '100%',
            padding: '8px',
            border: 'none',
            background: 'transparent',
            color: t.textTertiary,
            fontSize: '13px',
            fontWeight: 600,
            cursor: navCooldown ? 'default' : 'pointer',
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            marginTop: '2px',
            opacity: navCooldown ? 0.5 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );

  const handleChestTap = useCallback(() => {
    if (chestDoneRef.current) return;
    triggerHapticFeedback();
    const next = chestStage + 1;
    if (next >= 3) {
      chestDoneRef.current = true;
      setDirection(1);
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    } else {
      setChestStage(next);
    }
  }, [chestStage]);

  const renderChestReveal = () => (
    <div
      onClick={handleChestTap}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Subtle golden ambient glow behind chest (always visible) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: chestStage >= 2 ? [0.4, 0.8, 0.4] : [0.15, 0.3, 0.15], scale: chestStage >= 2 ? 1.3 : 1 }}
        transition={{ duration: chestStage >= 2 ? 0.8 : 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, rgba(255, 193, 7, 0.15) 40%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* Intense golden light rays behind chest (stage 2) */}
      {chestStage >= 2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: [0, 0.8, 0.5], scale: [0.3, 1.5, 1.2] }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, rgba(255, 193, 7, 0.2) 40%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* The chest */}
      <motion.div
        animate={
          chestStage === 0 ? { scale: [0, 1.15, 1], rotate: 0 } :
          chestStage === 1 ? {
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
          chestStage === 0
            ? { type: 'spring', stiffness: 300, damping: 15, duration: 0.5 }
            : { duration: chestStage === 1 ? 0.5 : 0.7, ease: 'easeInOut' }
        }
        style={{
          position: 'relative',
          width: '200px',
          height: '200px',
          filter: chestStage >= 2
            ? 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.6))'
            : 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.3)) drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
        }}
      >
        {chestAnimData && (
          <Lottie
            lottieRef={chestLottieRef}
            animationData={chestAnimData}
            loop={false}
            autoplay={false}
            style={{ width: '100%', height: '100%' }}
          />
        )}

        {/* Gift emoji peeking out of chest (stage 1+) */}
        {chestStage >= 1 && (
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
                chestStage === 1
                  ? { y: [30, 15, 30], opacity: 1, rotate: [-4, 4, -4] }
                  : { y: [10, -8, 10], opacity: 1, rotate: [-6, 6, -6], scale: [1, 1.1, 1] }
              }
              transition={{
                duration: chestStage === 1 ? 1 : 0.6,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
              style={{
                width: '90px', height: '90px',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '60px',
                filter: 'drop-shadow(0 2px 8px rgba(255, 215, 0, 0.5))',
              }}
            >
              🎁
            </motion.div>
          </div>
        )}

        {/* Sparkles around chest (stage 1+) */}
        {chestStage >= 1 && (
          <>
            {[...Array(chestStage >= 2 ? 10 : 6)].map((_, i) => {
              const count = chestStage >= 2 ? 10 : 6;
              const angle = (i / count) * Math.PI * 2;
              const radius = chestStage >= 2 ? 120 : 90;
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
                    width: chestStage >= 2 ? '8px' : '5px',
                    height: chestStage >= 2 ? '8px' : '5px',
                    background: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#FFC107' : '#FFFFFF',
                    borderRadius: '50%',
                    boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
                    pointerEvents: 'none',
                  }}
                />
              );
            })}
          </>
        )}

        {/* Golden glow pulse on stage 2 */}
        {chestStage >= 2 && (
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{
              position: 'absolute',
              top: '-20%', left: '-20%',
              width: '140%', height: '140%',
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 60%)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
        )}
      </motion.div>

      {/* Tap prompt */}
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{
          marginTop: '32px',
          fontSize: 18,
          fontWeight: 700,
          color: 'rgba(255, 255, 255, 0.85)',
          fontFamily: "'Quicksand', sans-serif",
          letterSpacing: '2px',
          textTransform: 'uppercase',
          textShadow: '0 0 12px rgba(255, 215, 0, 0.4)',
        }}
      >
        {chestStage === 0 ? 'TAP TO OPEN!' : chestStage === 1 ? 'TAP AGAIN!' : 'ONE MORE TAP!'}
      </motion.div>
    </div>
  );

  const renderLastChance = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '0 24px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 40px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        overflow: 'hidden',
      }}
    >
      {/* Emoji */}
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>
        🎁
      </div>

      {/* Heading */}
      <h2
        style={{
          fontSize: '26px',
          fontWeight: 800,
          color: t.textPrimary,
          margin: '0 0 6px 0',
          fontFamily: "'Quicksand', -apple-system, sans-serif",
          letterSpacing: '-0.02em',
          textAlign: 'center',
        }}
      >
        Wait — one last offer!
      </h2>
      <p
        style={{
          fontSize: '15px',
          fontWeight: 500,
          color: t.textSecondary,
          margin: '0 0 24px 0',
          lineHeight: 1.5,
          fontFamily: "'Quicksand', -apple-system, sans-serif",
          textAlign: 'center',
          maxWidth: 300,
        }}
      >
        Get lifetime access at an exclusive discount — just for you.
      </p>

      {/* Discount card */}
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: t.cardBg,
          borderRadius: '20px',
          padding: '24px',
          border: '2px solid rgba(167, 139, 250, 0.5)',
          marginBottom: '24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* 10% off badge */}
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
            fontSize: '12px',
            fontWeight: 800,
            color: 'white',
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            whiteSpace: 'nowrap',
          }}
        >
          10% OFF
        </div>

        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: t.textSecondary,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            marginBottom: '8px',
          }}
        >
          Lifetime Access
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: t.textTertiary,
              fontFamily: "'Quicksand', -apple-system, sans-serif",
              textDecoration: 'line-through',
            }}
          >
            $33
          </span>
          <span
            style={{
              fontSize: '36px',
              fontWeight: 800,
              fontFamily: "'Quicksand', -apple-system, sans-serif",
              ...GRADIENT_TEXT_STYLE,
            }}
          >
            $29.99
          </span>
        </div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: t.textTertiary,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            marginTop: '6px',
          }}
        >
          Pay once, yours forever
        </div>
      </div>

      {/* CTA */}
      <div style={{ width: '100%', maxWidth: 360 }}>
        <motion.button
          whileTap={lastChanceTapGuard || navCooldown ? {} : { scale: 0.97 }}
          disabled={lastChanceTapGuard}
          onClick={goNext}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '18px',
            border: 'none',
            background: t.buttonGradient,
            color: 'white',
            fontSize: '16px',
            fontWeight: 700,
            cursor: lastChanceTapGuard || navCooldown ? 'default' : 'pointer',
            boxShadow: t.buttonShadow,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            opacity: lastChanceTapGuard || navCooldown ? 0.5 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          Claim This Deal
        </motion.button>

        <button
          disabled={lastChanceTapGuard}
          onClick={() => onComplete(data)}
          style={{
            width: '100%',
            padding: '8px',
            border: 'none',
            background: 'transparent',
            color: t.textTertiary,
            fontSize: '13px',
            fontWeight: 600,
            cursor: lastChanceTapGuard ? 'default' : 'pointer',
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            marginTop: '8px',
            opacity: lastChanceTapGuard ? 0 : 1,
            transition: 'opacity 0.3s ease',
          }}
        >
          No thanks
        </button>
      </div>
    </div>
  );

  // Shared phone frame wrapper for feature showcase slides (realistic iPhone style)
  const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{
      width: '100%',
      maxWidth: 250,
      aspectRatio: '9 / 19',
      borderRadius: '28px',
      border: '1.5px solid rgba(255, 255, 255, 0.15)',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: `
        0 20px 60px rgba(0, 0, 0, 0.5)
      `,
    }}>
      {/* Screen area */}
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '27px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {children}
      </div>
    </div>
  );

  const renderSanctuary = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        padding: '0 24px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: 360, gap: '16px' }}>
        {/* Phone mockup showing sanctuary */}
        <PhoneFrame>
          <img src={sanctuaryImg} alt="Your Sanctuary" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </PhoneFrame>

        {/* Title & description below phone */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 800,
            margin: '0 0 6px 0',
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            letterSpacing: '-0.01em',
            ...GRADIENT_TEXT_STYLE,
          }}>
            Your Sanctuary
          </h2>
          <p style={{
            fontSize: '15px',
            fontWeight: 500,
            color: t.textSecondary,
            margin: 0,
            lineHeight: 1.5,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}>
            Earn adorable companions with every session and watch your sanctuary come alive!
          </p>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 360 }}>
        {renderContinueButton()}
      </div>
    </div>
  );

  const renderStats = () => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          padding: '0 24px',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: 360, gap: '16px' }}>
          {/* Phone mockup showing stats */}
          <PhoneFrame>
            <img src={statsImg} alt="Focus Trends" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </PhoneFrame>
          {/* Title & description below phone */}
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 800,
              margin: '0 0 6px 0',
              fontFamily: "'Quicksand', -apple-system, sans-serif",
              letterSpacing: '-0.01em',
              ...GRADIENT_TEXT_STYLE,
            }}>
              Focus Trends
            </h2>
            <p style={{
              fontSize: '15px',
              fontWeight: 500,
              color: t.textSecondary,
              margin: 0,
              lineHeight: 1.5,
              fontFamily: "'Quicksand', -apple-system, sans-serif",
            }}>
              View focus trends by day, week, month, and year — to stay motivated and review progress
            </p>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: 360 }}>
          {renderContinueButton()}
        </div>
      </div>
    );
  };

  // --- Create Account Screen ---
  const handleCreateAccount = async () => {
    setSignupError('');
    const email = signupEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSignupError('Please enter a valid email address.');
      return;
    }
    if (signupPassword.length < 8) {
      setSignupError('Password must be at least 8 characters.');
      return;
    }
    setSignupLoading(true);
    try {
      await createAccount(email, signupPassword);
      onComplete(data);
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_IN_USE') {
        setSignupError('This email is already in use. Try logging in instead.');
      } else if (err instanceof Error && err.message === 'ACCOUNT_EXISTS') {
        setSignupError('An account already exists on this device. Try logging in instead.');
      } else {
        setSignupError('Something went wrong. Please try again.');
      }
    } finally {
      setSignupLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px 18px',
    borderRadius: '16px',
    border: `1px solid ${t.optionBorder}`,
    background: t.optionBg,
    color: t.textPrimary,
    fontSize: '16px',
    fontWeight: 500,
    fontFamily: "'Quicksand', -apple-system, sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const handleLogin = async () => {
    setLoginError('');
    const email = loginEmail.trim();
    if (!email) {
      setLoginError('Please enter your email.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }
    setLoginLoading(true);
    try {
      const valid = await verifyLogin(email, loginPassword);
      if (valid) {
        setLoggedIn();
        onComplete(data);
      } else {
        setLoginError('Incorrect email or password.');
      }
    } catch {
      setLoginError('Something went wrong. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const renderCreateAccount = () => loginMode ? (
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', maxWidth: 360 }}>
        <h2
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: t.textPrimary,
            margin: '0 0 8px 0',
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          Welcome back
        </h2>

        <p
          style={{
            fontSize: '16px',
            fontWeight: 500,
            color: t.textSecondary,
            margin: '0 0 32px 0',
            lineHeight: 1.5,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          Sign in to continue your study journey.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          <input
            type="email"
            placeholder="Email address"
            autoComplete="email"
            value={loginEmail}
            onChange={(e) => { setLoginEmail(e.target.value); setLoginError(''); }}
            style={inputStyle}
          />

          <div style={{ position: 'relative' }}>
            <input
              type={showLoginPassword ? 'text' : 'password'}
              placeholder="Password"
              autoComplete="current-password"
              value={loginPassword}
              onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowLoginPassword(!showLoginPassword)}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: t.textTertiary,
                fontSize: '14px',
                fontFamily: "'Quicksand', -apple-system, sans-serif",
                fontWeight: 600,
              }}
            >
              {showLoginPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {loginError && (
          <p
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#EF4444',
              margin: '12px 0 0 0',
              fontFamily: "'Quicksand', -apple-system, sans-serif",
            }}
          >
            {loginError}
          </p>
        )}
      </div>

      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogin}
          disabled={loginLoading}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '20px',
            border: 'none',
            background: t.buttonGradient,
            color: 'white',
            fontSize: '17px',
            fontWeight: 700,
            cursor: loginLoading ? 'default' : 'pointer',
            boxShadow: t.buttonShadow,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            opacity: loginLoading ? 0.7 : 1,
          }}
        >
          {loginLoading ? 'Signing in...' : 'Sign In'}
        </motion.button>

        <button
          onClick={() => { setLoginMode(false); setLoginError(''); }}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '20px',
            border: 'none',
            background: 'transparent',
            color: t.textTertiary,
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          Back to sign up
        </button>
      </div>
    </div>
  ) : (
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', maxWidth: 360 }}>
        <h2
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: t.textPrimary,
            margin: '0 0 8px 0',
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          Create your account
        </h2>

        <p
          style={{
            fontSize: '16px',
            fontWeight: 500,
            color: t.textSecondary,
            margin: '0 0 32px 0',
            lineHeight: 1.5,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          Save your progress and pick up where you left off.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          <input
            type="email"
            placeholder="Email address"
            autoComplete="email"
            value={signupEmail}
            onChange={(e) => { setSignupEmail(e.target.value); setSignupError(''); }}
            style={inputStyle}
          />

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password (8+ characters)"
              autoComplete="new-password"
              value={signupPassword}
              onChange={(e) => { setSignupPassword(e.target.value); setSignupError(''); }}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: t.textTertiary,
                fontSize: '14px',
                fontFamily: "'Quicksand', -apple-system, sans-serif",
                fontWeight: 600,
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {signupError && (
          <p
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#EF4444',
              margin: '12px 0 0 0',
              fontFamily: "'Quicksand', -apple-system, sans-serif",
            }}
          >
            {signupError}
          </p>
        )}
      </div>

      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleCreateAccount}
          disabled={signupLoading}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '20px',
            border: 'none',
            background: t.buttonGradient,
            color: 'white',
            fontSize: '17px',
            fontWeight: 700,
            cursor: signupLoading ? 'default' : 'pointer',
            boxShadow: t.buttonShadow,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            opacity: signupLoading ? 0.7 : 1,
          }}
        >
          {signupLoading ? 'Creating...' : 'Create Account'}
        </motion.button>

        <button
          onClick={() => onComplete(data)}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '20px',
            border: 'none',
            background: 'transparent',
            color: t.textTertiary,
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          Skip for now
        </button>

        <button
          onClick={() => { setLoginMode(true); setSignupError(''); }}
          style={{
            width: '100%',
            padding: '8px',
            border: 'none',
            background: 'transparent',
            color: t.textSecondary,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'Quicksand', -apple-system, sans-serif",
          }}
        >
          Already have an account? <span style={{ color: t.textPrimary, fontWeight: 700 }}>Log in</span>
        </button>
      </div>
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

      <h2
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
      </h2>
      <p
        style={{
          fontSize: '15px',
          color: t.textSecondary,
          margin: '0 0 28px 0',
          fontFamily: "'Quicksand', -apple-system, sans-serif",
        }}
      >
        We'll tailor your experience to your habits
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {renderOption('studyHours', 'less-than-1', 'Less than 1 hour', '📖')}
        {renderOption('studyHours', '1-2', '1 - 2 hours', '📚')}
        {renderOption('studyHours', '2-4', '2 - 4 hours', '🎯')}
        {renderOption('studyHours', '4-6', '4 - 6 hours', '🔥')}
        {renderOption('studyHours', '6-plus', '6+ hours', '💪')}
      </div>

      {renderConfirmButton('studyHours')}
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

      <h2
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
      </h2>
      <p
        style={{
          fontSize: '15px',
          color: t.textSecondary,
          margin: '0 0 28px 0',
          fontFamily: "'Quicksand', -apple-system, sans-serif",
        }}
      >
        We'll customize your study categories
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {renderOption('occupation', 'student', 'Student', '📚')}
        {renderOption('occupation', 'professional', 'Working Professional', '💼')}
        {renderOption('occupation', 'self-learner', 'Self-Learner', '🧠')}
        {renderOption('occupation', 'other', 'Other', '✨')}
      </div>

      {renderConfirmButton('occupation')}
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

      <h2
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
      </h2>
      <p
        style={{
          fontSize: '15px',
          color: t.textSecondary,
          margin: '0 0 28px 0',
          fontFamily: "'Quicksand', -apple-system, sans-serif",
        }}
      >
        Choose what matters most to you
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {renderOption('goal', 'focus', 'Stay focused longer', '🎯')}
        {renderOption('goal', 'consistent', 'Build a study habit', '📅')}
        {renderOption('goal', 'productive', 'Be more productive', '⚡')}
        {renderOption('goal', 'exam-prep', 'Prepare for exams', '📝')}
      </div>

      {renderConfirmButton('goal')}
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
      {/* Mascot */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: '28px',
          background: t.buttonGradient,
          boxShadow: t.buttonShadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '40px',
          overflow: 'hidden',
        }}
      >
        {bunnyAnimData ? (
          <Lottie animationData={bunnyAnimData} loop style={{ width: 100, height: 100 }} />
        ) : (
          <span style={{ fontSize: '48px' }}>🐰</span>
        )}
      </div>

      <h2
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: t.textPrimary,
          margin: '0 0 32px 0',
          fontFamily: "'Quicksand', -apple-system, sans-serif",
        }}
      >
        {calculatingLabel}
      </h2>

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
        <div
          style={{
            height: '100%',
            borderRadius: 4,
            background: t.progressFill,
            width: `${calculatingProgress}%`,
            transition: 'width 0.3s ease-out',
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
      case 'occupation':
        return renderOccupation();
      case 'goal':
        return renderGoal();
      case 'calculating':
        return renderCalculating();
      case 'intro':
        return renderIntro();
      case 'badNews':
        return renderBadNews();
      case 'goodNews':
        return renderGoodNews();
      case 'sanctuary':
        return renderSanctuary();
      case 'stats':
        return renderStats();
      case 'premium':
        return renderPremium();
      case 'chestReveal':
        return renderChestReveal();
      case 'lastChance':
        return renderLastChance();
      case 'createAccount':
        return renderCreateAccount();
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
        {/* Soft orbs */}
        {t.orbs.map((orb, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: orb.x,
              top: orb.y,
              width: orb.size,
              height: orb.size,
              background: `radial-gradient(circle, ${orb.color} 0%, transparent 60%)`,
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
          transition={{ duration: 0.25, ease: 'easeInOut' }}
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
