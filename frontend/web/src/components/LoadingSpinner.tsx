/**
 * LoadingSpinner Component
 * 
 * Displays a loading spinner with optional text
 * Used throughout the app for loading states
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  text,
  overlay = false,
  className = '',
}) => {
  const { t } = useTranslation();

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'loading-spinner--small';
      case 'large':
        return 'loading-spinner--large';
      default:
        return 'loading-spinner--medium';
    }
  };

  const spinner = (
    <div className={`loading-spinner ${getSizeClass()} ${className}`}>
      <div className="loading-spinner__circle">
        <svg
          className="loading-spinner__svg"
          viewBox="0 0 50 50"
        >
          <circle
            className="loading-spinner__path"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeMiterlimit="10"
          />
        </svg>
      </div>
      
      {(text || !text) && (
        <p className="loading-spinner__text">
          {text || t('common:app.loading')}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-spinner-overlay">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
