/**
 * DashboardPage Component
 * 
 * Main dashboard page for authenticated users
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

import useAuth from '../../hooks/useAuth';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const stats = [
    {
      id: 1,
      title: t('dashboard:stats.total_games'),
      value: '24',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'blue',
    },
    {
      id: 2,
      title: t('dashboard:stats.wins'),
      value: '18',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'green',
    },
    {
      id: 3,
      title: t('dashboard:stats.losses'),
      value: '6',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'red',
    },
    {
      id: 4,
      title: t('dashboard:stats.win_rate'),
      value: '75%',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'purple',
    },
  ];

  const recentGames = [
    {
      id: 1,
      opponent: 'John Doe',
      result: 'win',
      date: '2024-01-15',
      score: '3-1',
    },
    {
      id: 2,
      opponent: 'Jane Smith',
      result: 'loss',
      date: '2024-01-14',
      score: '1-2',
    },
    {
      id: 3,
      opponent: 'Mike Johnson',
      result: 'win',
      date: '2024-01-13',
      score: '2-0',
    },
  ];

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || t('common:user.guest');
  };

  return (
    <div className="dashboard-page">
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">
            {t('dashboard:welcome', { name: getUserDisplayName() })}
          </h1>
          <p className="page-description">
            {t('dashboard:description')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.id} className={`stat-card stat-card--${stat.color}`}>
              <div className="stat-card__icon">
                {stat.icon}
              </div>
              <div className="stat-card__content">
                <h3 className="stat-card__value">{stat.value}</h3>
                <p className="stat-card__title">{stat.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Recent Games */}
          <div className="content-card">
            <div className="content-card__header">
              <h2 className="content-card__title">
                {t('dashboard:recent_games.title')}
              </h2>
              <button className="btn btn--outline btn--sm">
                {t('dashboard:recent_games.view_all')}
              </button>
            </div>
            <div className="recent-games">
              {recentGames.map((game) => (
                <div key={game.id} className="game-item">
                  <div className="game-item__info">
                    <span className="game-item__opponent">{game.opponent}</span>
                    <span className="game-item__date">{game.date}</span>
                  </div>
                  <div className="game-item__result">
                    <span className="game-item__score">{game.score}</span>
                    <span className={`game-item__status game-item__status--${game.result}`}>
                      {t(`dashboard:game_result.${game.result}`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="content-card">
            <div className="content-card__header">
              <h2 className="content-card__title">
                {t('dashboard:quick_actions.title')}
              </h2>
            </div>
            <div className="quick-actions">
              <button className="action-btn action-btn--primary">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('dashboard:quick_actions.new_game')}
              </button>
              <button className="action-btn action-btn--secondary">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {t('dashboard:quick_actions.find_players')}
              </button>
              <button className="action-btn action-btn--secondary">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {t('dashboard:quick_actions.view_stats')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
