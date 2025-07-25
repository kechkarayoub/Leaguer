/**
 * MainLayout Component
 * 
 * Main application layout for authenticated users
 * Includes navigation, sidebar, and main content area
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../LoadingSpinner';
import LanguageSwitcher from '../LanguageSwitcher';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigationItems = [
    {
      path: '/dashboard',
      label: t('common:navigation.dashboard'),
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z" />
        </svg>
      ),
    },
    {
      path: '/profile',
      label: t('common:navigation.profile'),
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner overlay />;
  }

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className={`main-layout__sidebar ${sidebarOpen ? 'main-layout__sidebar--open' : ''}`}>
        <div className="main-layout__sidebar-content">
          {/* Logo */}
          <div className="main-layout__logo">
            <h2 className="main-layout__brand">
              {t('common:app.name')}
            </h2>
          </div>

          {/* Navigation */}
          <nav className="main-layout__navigation">
            <ul className="main-layout__nav-list">
              {navigationItems.map((item) => (
                <li key={item.path} className="main-layout__nav-item">
                  <Link
                    to={item.path}
                    className={`main-layout__nav-link ${
                      location.pathname === item.path ? 'main-layout__nav-link--active' : ''
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="main-layout__nav-icon">
                      {item.icon}
                    </span>
                    <span className="main-layout__nav-text">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main content area */}
      <div className="main-layout__main">
        {/* Header */}
        <header className="main-layout__header">
          <div className="main-layout__header-content">
            {/* Mobile menu button */}
            <button
              className="main-layout__menu-button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page title */}
            <div className="main-layout__title">
              <h1 className="main-layout__page-title">
                {navigationItems.find(item => item.path === location.pathname)?.label || t('common:app.name')}
              </h1>
            </div>

            {/* User menu */}
            <div className="main-layout__user-menu">
              <LanguageSwitcher 
                variant="minimal"
                className="main-layout__language-switcher"
              />
              
              <div className="main-layout__user-info">
                <span className="main-layout__user-name">
                  {user?.firstName || user?.email || t('common:app.user')}
                </span>
                <div className="main-layout__user-avatar">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.firstName || user.email}
                      className="main-layout__avatar-image"
                    />
                  ) : (
                    <div className="main-layout__avatar-placeholder">
                      {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <button
                className="main-layout__logout-button"
                onClick={handleLogout}
                title={t('common:navigation.logout')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="main-layout__content">
          {children}
        </main>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="main-layout__overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;
