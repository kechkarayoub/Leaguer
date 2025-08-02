/**
 * HomePage Component
 * 
 * Main home page for authenticated users
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

import useAuth from '../../hooks/useAuth';
import './HomePage.css';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user?.email || t('common:user.guest');
  };

  return (
    <div className="home-page">
      <div className="page-container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1 className="welcome-title">
            {t('home:welcome', { name: getUserDisplayName() })}
          </h1>
          <p className="welcome-description">
            {t('home:description')}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--blue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="stat-card__content">
              <h3 className="stat-card__value">24</h3>
              <p className="stat-card__label">{t('home:stats.total_games')}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--green">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-card__content">
              <h3 className="stat-card__value">18</h3>
              <p className="stat-card__label">{t('home:stats.wins')}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--purple">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="stat-card__content">
              <h3 className="stat-card__value">75%</h3>
              <p className="stat-card__label">{t('home:stats.win_rate')}</p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="action-cards">
          <div className="action-card">
            <div className="action-card__header">
              <h3 className="action-card__title">{t('home:actions.start_game')}</h3>
              <p className="action-card__description">{t('home:actions.start_game_desc')}</p>
            </div>
            <button className="action-card__button action-card__button--primary">
              {t('home:actions.new_game')}
            </button>
          </div>

          <div className="action-card">
            <div className="action-card__header">
              <h3 className="action-card__title">{t('home:actions.find_players')}</h3>
              <p className="action-card__description">{t('home:actions.find_players_desc')}</p>
            </div>
            <button className="action-card__button action-card__button--secondary">
              {t('home:actions.browse_players')}
            </button>
          </div>

          <div className="action-card">
            <div className="action-card__header">
              <h3 className="action-card__title">{t('home:actions.view_profile')}</h3>
              <p className="action-card__description">{t('home:actions.view_profile_desc')}</p>
            </div>
            <button className="action-card__button action-card__button--outline">
              {t('home:actions.edit_profile')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
