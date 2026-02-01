import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserData } from '../hooks/useUserData';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColor } from '../types';
import Character from '../components/Character';

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { userData, updateSettings, resetAllStats, setUserData } = useUserData();
  const { getGradientClass } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  const handleToggle = (setting: keyof typeof userData.settings, value: boolean) => {
    updateSettings({ [setting]: value });
  };

  const handleThemeChange = (theme: ThemeColor) => {
    updateSettings({ selectedTheme: theme });
  };

  const handleDurationChange = (setting: 'studyDuration' | 'shortBreakDuration' | 'longBreakDuration', value: number) => {
    updateSettings({ [setting]: value });
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleFirstConfirm = () => {
    setShowResetConfirm(false);
    setShowFinalConfirm(true);
  };

  const handleFinalConfirm = () => {
    resetAllStats();
    setShowFinalConfirm(false);
    // Show success feedback (optional)
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
    setShowFinalConfirm(false);
  };

  const themeColors: { color: ThemeColor; class: string }[] = [
    { color: 'blue', class: 'bg-pastel-blue' },
    { color: 'purple', class: 'bg-pastel-purple' },
    { color: 'green', class: 'bg-pastel-green' },
    { color: 'peach', class: 'bg-pastel-peach' },
    { color: 'beige', class: 'bg-pastel-beige' },
  ];

  return (
    <div className={`min-h-screen ${getGradientClass()} transition-all duration-700 pb-20 px-6 pt-8`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
        <button
          onClick={() => navigate('/avatar')}
          className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-soft"
        >
          <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </div>

      {/* Toggle Settings */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-soft">
        <ToggleItem
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 0112.728 0" />
            </svg>
          }
          label="Sound"
          checked={userData.settings.soundEnabled}
          onChange={(checked) => handleToggle('soundEnabled', checked)}
        />

        <div className="my-4 border-t border-white/50" />

        <ToggleItem
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
          label="Notifications"
          checked={userData.settings.notificationsEnabled}
          onChange={(checked) => handleToggle('notificationsEnabled', checked)}
        />

        <div className="my-4 border-t border-white/50" />

        <ToggleItem
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          label="Focus Mode"
          checked={userData.settings.focusModeEnabled}
          onChange={(checked) => handleToggle('focusModeEnabled', checked)}
        />
      </div>

      {/* Theme Selection */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-soft">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Theme</h3>
        <div className="flex gap-3 justify-center">
          {themeColors.map(({ color, class: colorClass }) => (
            <button
              key={color}
              onClick={() => handleThemeChange(color)}
              className={`w-12 h-12 rounded-full ${colorClass} shadow-soft transition-all duration-200 ${
                userData.settings.selectedTheme === color
                  ? 'ring-4 ring-text-primary ring-offset-2'
                  : 'hover:scale-110'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Dev Mode */}
      <div className="bg-purple-50/80 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-soft border-2 border-purple-200">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <h3 className="text-lg font-semibold text-purple-800">Dev Mode</h3>
        </div>
        <p className="text-sm text-purple-700 mb-4">
          Unlock all biomes for testing and exploration.
        </p>
        <button
          onClick={() => {
            const biomeIds: any[] = ['meadow', 'safari', 'forest', 'ocean', 'arctic', 'mountain'];
            const newData = {
              ...userData,
              level: 50,
              xp: 25000,
              unlockedBiomes: biomeIds,
              activeBiome: 'meadow' as any,
            };
            setUserData(newData);
            setTimeout(() => {
              navigate('/');
            }, 100);
          }}
          className="w-full py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-2xl transition-all duration-200 shadow-soft"
        >
          Unlock All Biomes
        </button>
      </div>

      {/* Duration Settings */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Session Duration</h3>

        <DurationItem
          label="Study Session"
          value={userData.settings.studyDuration}
          onChange={(value) => handleDurationChange('studyDuration', value)}
          min={15}
          max={60}
          step={5}
        />

        <div className="my-4 border-t border-white/50" />

        <DurationItem
          label="Short Break"
          value={userData.settings.shortBreakDuration}
          onChange={(value) => handleDurationChange('shortBreakDuration', value)}
          min={3}
          max={15}
          step={1}
        />

        <div className="my-4 border-t border-white/50" />

        <DurationItem
          label="Long Break"
          value={userData.settings.longBreakDuration}
          onChange={(value) => handleDurationChange('longBreakDuration', value)}
          min={10}
          max={30}
          step={5}
        />
      </div>

      {/* Reset Stats - Danger Zone */}
      <div className="bg-red-50/80 backdrop-blur-sm rounded-3xl p-6 mt-6 shadow-soft border-2 border-red-200">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-semibold text-red-800">Danger Zone</h3>
        </div>
        <p className="text-sm text-red-700 mb-4">
          Resetting your stats will permanently delete all progress, sessions, and achievements. This action cannot be undone.
        </p>
        <button
          onClick={handleResetClick}
          className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-2xl transition-all duration-200 shadow-soft"
        >
          Reset All Stats
        </button>
      </div>

      {/* First Confirmation Modal */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-6"
          onClick={handleCancelReset}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-soft-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-text-primary text-center mb-3">
              Are you sure?
            </h2>
            <p className="text-sm text-text-secondary text-center mb-6">
              This will delete all your study sessions, progress, XP, streaks, and categories. Your settings will be preserved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelReset}
                className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-text-primary font-semibold rounded-2xl transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleFirstConfirm}
                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-2xl transition-all duration-200"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Confirmation Modal */}
      {showFinalConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-6"
          onClick={handleCancelReset}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-soft-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-text-primary text-center mb-3">
              Final Confirmation
            </h2>
            <p className="text-sm text-text-secondary text-center mb-6">
              This is your last chance. Once you confirm, all your data will be permanently deleted and cannot be recovered.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelReset}
                className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-text-primary font-semibold rounded-2xl transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalConfirm}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl transition-all duration-200"
              >
                Delete All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-6"
          onClick={() => setShowProfile(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-soft-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">Your Avatar</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex justify-center mb-6">
              <Character stage={userData.currentStage} />
            </div>

            <div className="text-center mb-6">
              <div className="text-sm text-text-secondary mb-2">
                Level {userData.level}: {userData.xp % 500} / 500 XP
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-pastel-green rounded-full transition-all duration-500"
                  style={{ width: `${((userData.xp % 500) / 500) * 100}%` }}
                />
              </div>
            </div>

            {/* Evolution Stages */}
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((stage) => (
                <div
                  key={stage}
                  className={`text-center p-3 rounded-2xl transition-all ${
                    userData.currentStage >= stage
                      ? 'bg-pastel-green/30'
                      : 'bg-gray-100 opacity-50'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {stage === 1 ? '🌱' : stage === 2 ? '🌿' : stage === 3 ? '🪴' : '🌸'}
                  </div>
                  <div className="text-xs text-text-secondary">Stage {stage}</div>
                  {userData.currentStage >= stage && (
                    <div className="text-xs text-pastel-green-dark font-medium mt-1">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Toggle Item Component
interface ToggleItemProps {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleItem: React.FC<ToggleItemProps> = ({ icon, label, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-text-primary">{icon}</div>
        <span className="text-text-primary font-medium">{label}</span>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
          checked ? 'bg-pastel-green' : 'bg-gray-300'
        }`}
      >
        <div
          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 ${
            checked ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
};

// Duration Item Component
interface DurationItemProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}

const DurationItem: React.FC<DurationItemProps> = ({ label, value, onChange, min, max, step }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-primary font-medium">{label}</span>
        <span className="text-text-primary font-semibold">{value} min</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #B4D9B4 0%, #B4D9B4 ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`
        }}
      />
    </div>
  );
};

export default SettingsScreen;
