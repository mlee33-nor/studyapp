import React, { useEffect, useState } from 'react';
import { useUserData } from '../hooks/useUserData';
import { useTheme } from '../contexts/ThemeContext';
import { getWeeklyData } from '../utils/storage';
import { CHARACTER_STAGES } from '../types';

const StatsScreen: React.FC = () => {
  const { userData } = useUserData();
  const { getGradientClass } = useTheme();
  const [weeklyData, setWeeklyData] = useState<number[]>([]);
  const weekDays = ['Su', 'M', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  useEffect(() => {
    setWeeklyData(getWeeklyData());
  }, [userData]);

  const maxMinutes = Math.max(...weeklyData, 60); // Minimum scale of 60

  const getNextStageInfo = () => {
    if (userData.currentStage >= 4) return null;
    return CHARACTER_STAGES[userData.currentStage];
  };

  const getBarColor = (index: number) => {
    const colors = [
      'bg-pastel-blue',
      'bg-pastel-purple',
      'bg-pastel-green',
      'bg-pastel-peach',
      'bg-pastel-blue-dark',
      'bg-pastel-green-dark',
      'bg-pastel-purple-dark',
    ];
    return colors[index % colors.length];
  };

  const nextStage = getNextStageInfo();
  const sessionsToNext = nextStage ? nextStage.requiredSessions - userData.totalCompletedSessions : 0;

  return (
    <div className={`min-h-screen ${getGradientClass()} transition-all duration-700 pb-20 px-6 pt-8`}>
      {/* Header */}
      <div className="flex items-center mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Stats</h1>
      </div>

      {/* Study Time Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-soft">
        <h2 className="text-lg font-semibold text-text-primary mb-1">Study Time</h2>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-bold text-text-primary">
            {weeklyData.reduce((a, b) => a + b, 0)}
          </span>
          <span className="text-text-secondary">minutes this week</span>
        </div>

        {/* Bar Chart */}
        <div className="flex items-end justify-between gap-2 h-48 mb-3">
          {weeklyData.map((minutes, index) => {
            const height = maxMinutes > 0 ? (minutes / maxMinutes) * 100 : 0;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                  <div
                    className={`w-full ${getBarColor(index)} rounded-t-xl transition-all duration-500 relative group`}
                    style={{ height: `${height}%`, minHeight: minutes > 0 ? '8px' : '0' }}
                  >
                    {minutes > 0 && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-text-primary text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {minutes}m
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-text-secondary">{weekDays[index]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Progress Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-soft">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Weekly Progress</h2>

        <div className="flex items-center gap-4">
        </div>

        {nextStage && (
          <div className="mt-4 pt-4 border-t border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Next Evolution: {nextStage.name}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {sessionsToNext} more session{sessionsToNext !== 1 ? 's' : ''} needed
                </p>
              </div>
              <div className="text-2xl">🌱</div>
            </div>
          </div>
        )}

        {userData.currentStage >= 4 && (
          <div className="mt-4 pt-4 border-t border-white/50">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🌸</span>
              <p className="text-sm font-medium text-text-primary">
                Fully Evolved!
              </p>
              <span className="text-2xl">🌸</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-soft">
          <div className="text-3xl font-bold text-text-primary mb-1">
            {userData.totalCompletedSessions}
          </div>
          <div className="text-sm text-text-secondary">Study Sessions</div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-soft">
          <div className="text-3xl font-bold text-text-primary mb-1">
            {userData.studyStreak}
          </div>
          <div className="text-sm text-text-secondary">Day Streak 🔥</div>
        </div>
      </div>
    </div>
  );
};

export default StatsScreen;
