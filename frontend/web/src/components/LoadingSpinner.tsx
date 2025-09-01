/**
 * LoadingSpinner Component
 * 
 * Displays a loading spinner with optional text
 * Used throughout the app for loading states
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import logo from '../logo.svg';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
  className?: string;
  showLogo?: boolean;
  variant?: 'spinner' | 'dots';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  text,
  overlay = false,
  className = '',
  showLogo = false,
  variant = 'spinner',
}) => {
  const { t } = useTranslation();
  const [dots, setDots] = useState('.');

  // Animate dots: . → .. → ... → . → ..
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '.';
      });
    }, 500); // Change every 500ms

    return () => clearInterval(interval);
  }, [variant]);

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

  const renderSpinner = (onlyDots?: boolean) => {
    if (showLogo && !onlyDots) {
      return (
        <div className="loading-spinner__logo" data-testid="loading-logo">
          <img 
            src={logo} 
            alt="Loading" 
            className="loading-spinner__logo-image"
          />
        </div>
      );
    }

    if (variant === 'dots' || onlyDots) {
      return (
        <div className="loading-spinner__dots-text" data-testid="loading-dots">
          <span className="loading-spinner__dots-animated">{dots}</span>
        </div>
      );
    }

    return (
      <div className="loading-spinner__circle" data-testid="loading-spinner">
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
    );
  };

  const spinner = (
    <div className={`loading-spinner ${getSizeClass()} ${className}`}>
      {renderSpinner()}
      
      {(variant !== 'dots') && (
        <div className="loading-spinner__text">
          {text || t('common:app.loading', { defaultValue: 'Loading' } )}{renderSpinner(true)}
        </div>
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
