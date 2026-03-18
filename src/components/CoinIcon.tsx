import React from 'react';

interface CoinIconProps {
  size?: number;
  style?: React.CSSProperties;
}

const CoinIcon: React.FC<CoinIconProps> = ({ size = 16, style }) => (
  <img
    src="/coin-logo.png"
    onError={(e) => { (e.target as HTMLImageElement).src = '/coin-logo.svg'; }}
    alt="Study Coin"
    width={size}
    height={size}
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      objectFit: 'contain',
      ...style,
    }}
  />
);

export default CoinIcon;
