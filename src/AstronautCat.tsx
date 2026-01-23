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
      <video
        src="https://storage.googleapis.com/catgif/cattest123.mov"
        autoPlay
        loop
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center',
        }}
      />
    </div>
  );
};
