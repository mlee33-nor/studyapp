import React from 'react';

interface AstronautCatProps {
  size?: number;
  level: number;
  isTimerActive?: boolean;
  theme: 'morning' | 'twilight' | 'golden' | 'midnight';
}

export const AstronautCat: React.FC<AstronautCatProps> = ({
  size = 80,
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.8,
      }}
    >
      🐱🚀
    </div>
  );
};
