/**
 * AuthLayout Component
 * 
 * Layout for authentication pages (login, register, etc.)
 * Provides a clean, centered design for auth forms
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import AuthFooter from '../AuthFooter';
import moment from 'moment';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { t } = useTranslation();

  return (
    <div className="auth-layout">      
      <div className="auth-layout__container">
        {/* Background decoration */}
        <div className="auth-layout__background">
          <div className="auth-layout__circle auth-layout__circle--1"></div>
          <div className="auth-layout__circle auth-layout__circle--2"></div>
          <div className="auth-layout__circle auth-layout__circle--3"></div>
        </div>

        {/* Language Switcher - Better positioned */}
        <div className="auth-layout__language-switcher">
          <LanguageSwitcher 
            variant="compact"
            position="top-left"
          />
        </div>

        {/* Main content */}
        <div className="auth-layout__content">
          {/* Logo/Brand */}
          <div className="auth-layout__header">
            <div className="auth-layout__logo">
              <h1 className="auth-layout__brand">
                {t('common:app.name')}
              </h1>
              <p className="auth-layout__tagline">
                {t('common:app.tagline')}
              </p>
            </div>
          </div>

          {/* Auth form content */}
          <div className="auth-layout__form">
            {children}
          </div>

          {/* Footer */}
          <div className="auth-layout__footer">
            <AuthFooter />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
