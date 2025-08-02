/**
 * Chevron Down Icon Component
 */

import React from 'react';

interface ChevronDownIconProps {
  className?: string;
  size?: number;
}

const ChevronDownIcon: React.FC<ChevronDownIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
};

export default ChevronDownIcon;
