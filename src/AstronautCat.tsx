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
      }}
    >
      <img
        src="/animation.gif"
        alt="Astronaut Cat"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};
