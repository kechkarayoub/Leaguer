/**
 * MainHeader Component
 * 
 * Main application header with page title and user controls
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import useAuth from '../../hooks/useAuth';
import LanguageSwitcher from '../LanguageSwitcher';
import MenuIcon from '../icons/MenuIcon';
import UserIcon from '../icons/UserIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import './MainHeader.css';

interface MainHeaderProps {
  pageTitle?: string;
  pageSubtitle?: string;
  onMenuClick: () => void;
}

const MainHeader: React.FC<MainHeaderProps> = ({ pageTitle, pageSubtitle, onMenuClick }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get page title based on current route
  const getPageTitle = () => {
    if (pageTitle) return pageTitle;
    
    switch (location.pathname) {
      case '/':
        return t('navigation.home');
      case '/profile':
        return t('navigation.profile');
      case '/settings':
        return t('navigation.settings');
      default:
        return t('navigation.home');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    } else if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || t('common:user.guest');
  };

  return (
    <>
      <header className="main-header">
        <div className="main-header__container">
            {/* Menu Button */}
            <button
                className="menu-button"
                onClick={onMenuClick}
                aria-label={t('navigation.menu')}
            >
                <MenuIcon size={24} />
            </button>
          {/* Logo + App Name (left) */}
          <div className="main-header__logo" onClick={() => navigate('/')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            aria-label={t('navigation.home')}
            tabIndex={0}
            role="button"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate('/'); }}
          >
            <img src={require('../../logo.png')} alt="Leaguer Logo" className="site-logo" style={{ height: 32, marginRight: 12 }} />
            <span className="site-title" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-primary)' }}>Leaguer</span>
          </div>

          {/* Page Title (center) */}
          <div className="page-title-section" style={{ flex: 1, textAlign: 'center' }}>
            <h1 className="page-title">{getPageTitle()}</h1>
            {pageSubtitle && <p className="page-subtitle">{pageSubtitle}</p>}
          </div>

          {/* Header Actions (right) */}
          <div className="main-header__actions">
            {/* Language Switcher */}
            <div className="header-action languageSwitcher">
              <LanguageSwitcher className='from_main_connected' variant="compact" />
            </div>

            {/* User Menu */}
            <div className="header-action user-menu" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="user-menu__trigger"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                {user?.user_image_url || user?.profileImage ? (
                  <img
                    src={user.user_image_url || user.profileImage}
                    alt={getUserDisplayName()}
                    className="user-avatar"
                  />
                ) : (
                  <div className="user-avatar user-avatar--initials">
                    {getUserInitials()}
                  </div>
                )}
                <div className="user-info">
                  <span className="user-name">{getUserDisplayName()}</span>
                  <span className="user-email">{user?.email}</span>
                </div>
                <ChevronDownIcon 
                  className={`chevron-icon ${userMenuOpen ? 'chevron-icon--rotated' : ''}`} 
                  size={16} 
                />
              </button>

              {userMenuOpen && (
                <div className="user-menu__dropdown">
                  <button 
                    onClick={() => {
                      navigate('/profile');
                      setUserMenuOpen(false);
                    }}
                    className="user-menu__item"
                  >
                    <UserIcon className="menu-icon" size={16} />
                    {t('navigation.profile')}
                  </button>
                  <button 
                    onClick={handleLogout} 
                    className="user-menu__item user-menu__item--danger"
                  >
                    <svg className="menu-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('common:navigation.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default MainHeader;
