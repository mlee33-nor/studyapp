import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { verifyLogin, getStoredEmail, setLoggedIn } from '../utils/auth';

interface LoginScreenProps {
  onSuccess: () => void;
  onClose?: () => void;
  theme: 'morning' | 'midnight';
}

const THEMES = {
  morning: {
    gradient: 'linear-gradient(180deg, #F0F4FF 0%, #F5F0FF 50%, #F0FFF5 100%)',
    textPrimary: 'rgba(15, 23, 42, 0.95)',
    textSecondary: 'rgba(51, 65, 85, 0.7)',
    textTertiary: 'rgba(100, 116, 139, 0.5)',
    optionBg: 'rgba(255, 255, 255, 0.7)',
    optionBorder: 'rgba(0, 0, 0, 0.08)',
    buttonGradient: 'linear-gradient(135deg, rgba(167, 139, 250, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
    buttonShadow: '0 4px 20px rgba(139, 92, 246, 0.35)',
  },
  midnight: {
    gradient: 'linear-gradient(180deg, #000000 0%, #0F172A 50%, #1E1B4B 100%)',
    textPrimary: 'rgba(255, 255, 255, 0.9)',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textTertiary: 'rgba(255, 255, 255, 0.4)',
    optionBg: 'rgba(255, 255, 255, 0.06)',
    optionBorder: 'rgba(255, 255, 255, 0.1)',
    buttonGradient: 'linear-gradient(135deg, rgba(167, 139, 250, 0.8) 0%, rgba(139, 92, 246, 0.8) 100%)',
    buttonShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
  },
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, onClose, theme }) => {
  const t = THEMES[theme];
  const storedEmail = getStoredEmail() || '';
  const [email, setEmail] = useState(storedEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      const valid = await verifyLogin(email, password);
      if (valid) {
        setLoggedIn();
        onSuccess();
      } else {
        setError('Incorrect email or password.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: t.gradient,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 80px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)',
      }}
    >
      {onClose && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
            right: '20px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            background: theme === 'midnight' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            color: t.textSecondary,
            fontSize: '20px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontFamily: "'Quicksand', sans-serif",
          }}
        >
          ✕
        </motion.button>
      )}

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
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            style={inputStyle}
          />

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
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

        {error && (
          <p
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#EF4444',
              margin: '12px 0 0 0',
              fontFamily: "'Quicksand', -apple-system, sans-serif",
            }}
          >
            {error}
          </p>
        )}
      </div>

      <div style={{ width: '100%', maxWidth: 360 }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '20px',
            border: 'none',
            background: t.buttonGradient,
            color: 'white',
            fontSize: '17px',
            fontWeight: 700,
            cursor: loading ? 'default' : 'pointer',
            boxShadow: t.buttonShadow,
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </motion.button>
      </div>
    </div>
  );
};

export default LoginScreen;
