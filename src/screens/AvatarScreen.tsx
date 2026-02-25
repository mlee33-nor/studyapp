import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserData } from '../hooks/useUserData';
import Character from '../components/Character';
import { CHARACTER_STAGES } from '../types';


const AvatarScreen: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useUserData();

  const currentStageInfo = CHARACTER_STAGES[userData.currentStage - 1] || CHARACTER_STAGES[0];
  const nextStage = userData.currentStage < 4 ? CHARACTER_STAGES[userData.currentStage] : null;

  return (
    <div className="min-h-screen gradient-bg-blue pb-20 px-6 pt-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-soft mr-4"
        >
          <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="bg-white/50 backdrop-blur-sm px-6 py-2 rounded-full shadow-soft">
          <h1 className="text-lg font-semibold text-text-primary">Your Avatar</h1>
        </div>
      </div>

      {/* Main Avatar Display */}
      <div className="flex justify-center mb-8 mt-12">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent rounded-full blur-3xl transform scale-150"></div>

          {/* Character */}
          <div className="relative transform scale-150">
            <Character stage={userData.currentStage} />
          </div>
        </div>
      </div>

      <div className="mb-8 mt-16" />

      {/* Current Stage Info */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-soft">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            {currentStageInfo.name}
          </h3>
          <p className="text-text-secondary text-sm mb-4">
            {currentStageInfo.description}
          </p>
          <div className="inline-flex items-center gap-2 bg-pastel-green/30 px-4 py-2 rounded-full">
            <span className="text-2xl">🎉</span>
            <span className="text-text-primary font-medium">
              {userData.totalCompletedSessions} Study Sessions
            </span>
          </div>
        </div>
      </div>

      {/* Evolution Progress */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">
          Evolution Stages
        </h3>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {CHARACTER_STAGES.map((stage, index) => {
            const stageNum = index + 1;
            const isUnlocked = userData.currentStage >= stageNum;
            const isCurrent = userData.currentStage === stageNum;

            return (
              <div
                key={stageNum}
                className={`text-center p-4 rounded-2xl transition-all ${
                  isUnlocked
                    ? isCurrent
                      ? 'bg-pastel-green shadow-soft scale-105'
                      : 'bg-pastel-green/30'
                    : 'bg-gray-100 opacity-50'
                }`}
              >
                <div className="text-3xl mb-2">
                  {stageNum === 1 ? '🌱' : stageNum === 2 ? '🌿' : stageNum === 3 ? '🪴' : '🌸'}
                </div>
                <div className="text-xs text-text-primary font-medium mb-1">
                  Stage {stageNum}
                </div>
                <div className="text-xs text-text-secondary">
                  {stage.requiredSessions}+ sessions
                </div>
                {isUnlocked && (
                  <div className="text-lg mt-1">✓</div>
                )}
                {isCurrent && (
                  <div className="text-xs text-pastel-green-dark font-semibold mt-1">
                    Current
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Next Stage Info */}
        {nextStage && (
          <div className="border-t border-white/50 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Next: {nextStage.name}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {nextStage.requiredSessions - userData.totalCompletedSessions} more sessions to unlock
                </p>
              </div>
              <div className="text-3xl">🎯</div>
            </div>

            {/* Progress bar to next stage */}
            <div className="mt-3">
              <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pastel-green rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      ((userData.totalCompletedSessions - (CHARACTER_STAGES[userData.currentStage - 1]?.requiredSessions || 0)) /
                        (nextStage.requiredSessions - (CHARACTER_STAGES[userData.currentStage - 1]?.requiredSessions || 0))) *
                        100,
                      100
                    )}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {userData.currentStage >= 4 && (
          <div className="border-t border-white/50 pt-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-3xl">🌸</span>
                <span className="text-lg font-semibold text-text-primary">Fully Evolved!</span>
                <span className="text-3xl">🌸</span>
              </div>
              <p className="text-sm text-text-secondary">
                You've reached the maximum evolution stage!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-soft text-center">
          <div className="text-3xl mb-2">📚</div>
          <div className="text-2xl font-bold text-text-primary mb-1">
            {userData.totalCompletedSessions}
          </div>
          <div className="text-xs text-text-secondary">Total Sessions</div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-soft text-center">
          <div className="text-3xl mb-2">🔥</div>
          <div className="text-2xl font-bold text-text-primary mb-1">
            {userData.studyStreak}
          </div>
          <div className="text-xs text-text-secondary">Day Streak</div>
        </div>
      </div>
    </div>
  );
};

export default AvatarScreen;
