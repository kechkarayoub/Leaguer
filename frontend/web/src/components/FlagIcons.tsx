/**
 * Flag Icons as React Components
 * High-quality SVG flags for the language switcher
 */

import React from 'react';

interface FlagProps {
  className?: string;
  size?: number;
}

// United States Flag
export const USFlag: React.FC<FlagProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size * 0.6}
    viewBox="0 0 60 36"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="stars" x="0" y="0" width="4" height="3" patternUnits="userSpaceOnUse">
        <rect width="4" height="3" fill="#002868"/>
        <circle cx="2" cy="1.5" r="0.3" fill="white"/>
      </pattern>
    </defs>
    <rect width="60" height="36" fill="#BF0A30"/>
    <rect y="0" width="60" height="2.77" fill="white"/>
    <rect y="5.54" width="60" height="2.77" fill="white"/>
    <rect y="11.08" width="60" height="2.77" fill="white"/>
    <rect y="16.62" width="60" height="2.77" fill="white"/>
    <rect y="22.16" width="60" height="2.77" fill="white"/>
    <rect y="27.7" width="60" height="2.77" fill="white"/>
    <rect y="33.23" width="60" height="2.77" fill="white"/>
    <rect width="24" height="19.38" fill="#002868"/>
    <g fill="white">
      <circle cx="2" cy="1.5" r="0.6"/>
      <circle cx="6" cy="1.5" r="0.6"/>
      <circle cx="10" cy="1.5" r="0.6"/>
      <circle cx="14" cy="1.5" r="0.6"/>
      <circle cx="18" cy="1.5" r="0.6"/>
      <circle cx="22" cy="1.5" r="0.6"/>
      <circle cx="4" cy="3" r="0.6"/>
      <circle cx="8" cy="3" r="0.6"/>
      <circle cx="12" cy="3" r="0.6"/>
      <circle cx="16" cy="3" r="0.6"/>
      <circle cx="20" cy="3" r="0.6"/>
      <circle cx="2" cy="4.5" r="0.6"/>
      <circle cx="6" cy="4.5" r="0.6"/>
      <circle cx="10" cy="4.5" r="0.6"/>
      <circle cx="14" cy="4.5" r="0.6"/>
      <circle cx="18" cy="4.5" r="0.6"/>
      <circle cx="22" cy="4.5" r="0.6"/>
    </g>
  </svg>
);

// French Flag
export const FrenchFlag: React.FC<FlagProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size * 0.6}
    viewBox="0 0 60 36"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="20" height="36" fill="#002654"/>
    <rect x="20" width="20" height="36" fill="white"/>
    <rect x="40" width="20" height="36" fill="#CE1126"/>
  </svg>
);

// Saudi Arabia Flag (simplified)
export const SaudiFlag: React.FC<FlagProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size * 0.6}
    viewBox="0 0 60 36"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="60" height="36" fill="#006C35"/>
    <g fill="white" transform="translate(30, 18)">
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="8"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
      >
        لا إله إلا الله
      </text>
      <rect x="-8" y="3" width="16" height="1" fill="white"/>
      <rect x="-6" y="5" width="12" height="0.5" fill="white"/>
    </g>
  </svg>
);

// Generic flag component that selects the right flag
interface CountryFlagProps extends FlagProps {
  country: 'US' | 'FR' | 'SA';
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ country, ...props }) => {
  switch (country) {
    case 'US':
      return <USFlag {...props} />;
    case 'FR':
      return <FrenchFlag {...props} />;
    case 'SA':
      return <SaudiFlag {...props} />;
    default:
      return <USFlag {...props} />;
  }
};

export default CountryFlag;
