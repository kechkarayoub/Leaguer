/**
 * LanguageSwitcher Component
 * 
 * Allows users to switch between supported languages
 * Displays language options with flags and native names
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CountryFlag } from './FlagIcons';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: 'US' | 'FR' | 'SA';
}

const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: 'US',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: 'FR',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: 'SA',
  },
];

interface LanguageSwitcherProps {
  variant?: 'default' | 'minimal' | 'floating' | 'compact';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'default',
  position = 'top-right',
  className = '',
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === i18n.language
  ) || SUPPORTED_LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      setIsOpen(false);
      // The useRTL hook in App.tsx will handle direction changes automatically
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const handleDropdownToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!isOpen) {
      // Calculate optimal dropdown position
      const buttonRect = event.currentTarget.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const dropdownHeight = 200; // Approximate dropdown height
      
      // Check if there's enough space below the button
      const spaceBelow = windowHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
    setIsOpen(!isOpen);
  };

  const getPositionClasses = () => {
    const baseClasses = 'language-switcher';
    const variantClass = `language-switcher--${variant}`;
    const positionClass = `language-switcher--${position}`;
    
    return `${baseClasses} ${variantClass} ${positionClass} ${className}`;
  };

  if (variant === 'minimal') {
    return (
      <div className={getPositionClasses()}>
        <div className="language-switcher__minimal">
          {SUPPORTED_LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`language-switcher__minimal-btn ${
                currentLanguage.code === language.code ? 'language-switcher__minimal-btn--active' : ''
              }`}
              title={language.nativeName}
            >
              <CountryFlag 
                country={language.flag} 
                className="language-switcher__flag-icon" 
                size={20}
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={getPositionClasses()}>
        <div className="language-switcher__compact">
          {SUPPORTED_LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`language-switcher__compact-btn ${
                currentLanguage.code === language.code ? 'language-switcher__compact-btn--active' : ''
              }`}
              title={language.nativeName}
            >
              <CountryFlag 
                country={language.flag} 
                className="language-switcher__flag-icon" 
                size={16}
              />
              <span className="language-switcher__compact-code">{language.code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div className={getPositionClasses()} ref={dropdownRef}>
        <button
          className="language-switcher__floating-trigger"
          onClick={handleDropdownToggle}
          title="Change Language"
        >
          <CountryFlag 
            country={currentLanguage.flag} 
            className="language-switcher__flag-icon" 
            size={20}
          />
          <svg viewBox="0 0 24 24" className="language-switcher__icon">
            <path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
          </svg>
        </button>
        
        {isOpen && (
          <div className={`language-switcher__floating-menu language-switcher__floating-menu--${dropdownPosition}`}>
            {SUPPORTED_LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`language-switcher__floating-option ${
                  currentLanguage.code === language.code ? 'language-switcher__floating-option--active' : ''
                }`}
              >
                <CountryFlag 
                  country={language.flag} 
                  className="language-switcher__flag-icon" 
                  size={18}
                />
                <span className="language-switcher__name">{language.nativeName}</span>
                {currentLanguage.code === language.code && (
                  <svg className="language-switcher__check" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={getPositionClasses()} ref={dropdownRef}>
      <div className="language-switcher__dropdown">
        <button
          className="language-switcher__trigger"
          onClick={handleDropdownToggle}
        >
          <CountryFlag 
            country={currentLanguage.flag} 
            className="language-switcher__flag-icon" 
            size={20}
          />
          <span className="language-switcher__name">{currentLanguage.nativeName}</span>
          <svg 
            className={`language-switcher__chevron ${isOpen ? 'language-switcher__chevron--open' : ''}`}
            viewBox="0 0 24 24"
          >
            <path fill="currentColor" d="M7 10l5 5 5-5z"/>
          </svg>
        </button>

        {isOpen && (
          <div className={`language-switcher__menu language-switcher__menu--${dropdownPosition}`}>
            {SUPPORTED_LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`language-switcher__option ${
                  currentLanguage.code === language.code ? 'language-switcher__option--active' : ''
                }`}
              >
                <CountryFlag 
                  country={language.flag} 
                  className="language-switcher__flag-icon" 
                  size={18}
                />
                <span className="language-switcher__name">{language.nativeName}</span>
                {currentLanguage.code === language.code && (
                  <svg className="language-switcher__check" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
