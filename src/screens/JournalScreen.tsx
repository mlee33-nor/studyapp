import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useUserData } from '../hooks/useUserData';
import { getEnhancedSessions } from '../utils/categoryManager';

const JournalScreen: React.FC = () => {
  const { getGradientClass } = useTheme();
  const { userData } = useUserData();
  const sessions = getEnhancedSessions();
  const recentSessions = sessions.slice(-20).reverse();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className={`min-h-screen ${getGradientClass()} transition-all duration-700 pb-20 px-6 pt-8`}>
      {/* Header */}
      <div className="flex items-center mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Study Journal</h1>
      </div>

      {/* Summary Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-soft mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-text-primary">{userData.totalCompletedSessions || 0}</div>
            <div className="text-xs text-text-secondary">Sessions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-text-primary">{userData.studyStreak || 0}</div>
            <div className="text-xs text-text-secondary">Day Streak</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-text-primary">{userData.coins || 0}</div>
            <div className="text-xs text-text-secondary">Coins</div>
          </div>
        </div>
      </div>

      {/* Session History */}
      <h2 className="text-lg font-semibold text-text-primary mb-3">Recent Sessions</h2>
      {recentSessions.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-soft text-center">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-text-secondary text-sm">
            Complete your first study session to see your history here!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-soft flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: `${session.themeColor}20` }}
              >
                {session.emoji || '📖'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-text-primary text-sm truncate">
                  {session.category}
                </div>
                <div className="text-xs text-text-secondary">
                  {formatDate(session.date)} at {formatTime(session.date)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-text-primary text-sm">
                  {session.duration} min
                </div>
                <div className={`text-xs font-medium ${session.successStatus ? 'text-green-600' : 'text-red-400'}`}>
                  {session.successStatus ? 'Completed' : 'Stopped'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JournalScreen;
