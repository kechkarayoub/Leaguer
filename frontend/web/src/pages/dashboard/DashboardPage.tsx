/**
 * DashboardPage Component
 * 
 * Main dashboard page for authenticated users
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../../components/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Example: Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      // This would fetch real dashboard data from the API
      return {
        stats: {
          totalGames: 42,
          wins: 28,
          losses: 14,
          winRate: 67,
        },
        recentGames: [
          { id: 1, opponent: 'Player1', result: 'win', date: '2024-01-15' },
          { id: 2, opponent: 'Player2', result: 'loss', date: '2024-01-14' },
          { id: 3, opponent: 'Player3', result: 'win', date: '2024-01-13' },
        ],
        achievements: [
          { id: 1, title: 'First Win', unlocked: true },
          { id: 2, title: '10 Win Streak', unlocked: true },
          { id: 3, title: 'Tournament Winner', unlocked: false },
        ],
      };
    },
  });

  if (isLoading) {
    return <LoadingSpinner overlay />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__container">
        {/* Welcome section */}
        <div className="dashboard-page__welcome">
          <h1 className="dashboard-page__title">
            {t('dashboard:welcome_back')}, {user?.firstName || user?.email || t('common:app.user')}!
          </h1>
          <p className="dashboard-page__subtitle">
            {t('dashboard:ready_to_play')}
          </p>
        </div>

        {/* Stats grid */}
        <div className="dashboard-page__stats">
          <div className="stat-card">
            <div className="stat-card__icon">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="stat-card__content">
              <div className="stat-card__value">{dashboardData?.stats.totalGames || 0}</div>
              <div className="stat-card__label">{t('dashboard:total_games')}</div>
            </div>
          </div>

          <div className="stat-card stat-card--success">
            <div className="stat-card__icon">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-card__content">
              <div className="stat-card__value">{dashboardData?.stats.wins || 0}</div>
              <div className="stat-card__label">{t('dashboard:wins')}</div>
            </div>
          </div>

          <div className="stat-card stat-card--danger">
            <div className="stat-card__icon">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-card__content">
              <div className="stat-card__value">{dashboardData?.stats.losses || 0}</div>
              <div className="stat-card__label">{t('dashboard:losses')}</div>
            </div>
          </div>

          <div className="stat-card stat-card--info">
            <div className="stat-card__icon">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="stat-card__content">
              <div className="stat-card__value">{dashboardData?.stats.winRate || 0}%</div>
              <div className="stat-card__label">{t('dashboard:win_rate')}</div>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="dashboard-page__content">
          {/* Recent games */}
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <h3 className="dashboard-card__title">
                {t('dashboard:recent_games')}
              </h3>
              <button className="dashboard-card__action">
                {t('dashboard:view_all')}
              </button>
            </div>
            <div className="dashboard-card__content">
              {dashboardData?.recentGames?.length ? (
                <div className="game-list">
                  {dashboardData.recentGames.map((game) => (
                    <div key={game.id} className="game-item">
                      <div className="game-item__info">
                        <div className="game-item__opponent">vs {game.opponent}</div>
                        <div className="game-item__date">{game.date}</div>
                      </div>
                      <div className={`game-item__result game-item__result--${game.result}`}>
                        {t(`dashboard:${game.result}`)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-card__empty">
                  <p>{t('dashboard:no_recent_games')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <h3 className="dashboard-card__title">
                {t('dashboard:achievements')}
              </h3>
              <button className="dashboard-card__action">
                {t('dashboard:view_all')}
              </button>
            </div>
            <div className="dashboard-card__content">
              {dashboardData?.achievements?.length ? (
                <div className="achievement-list">
                  {dashboardData.achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`achievement-item ${
                        achievement.unlocked ? 'achievement-item--unlocked' : 'achievement-item--locked'
                      }`}
                    >
                      <div className="achievement-item__icon">
                        {achievement.unlocked ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </div>
                      <div className="achievement-item__title">
                        {achievement.title}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-card__empty">
                  <p>{t('dashboard:no_achievements')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="dashboard-page__actions">
          <button className="action-button action-button--primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('dashboard:start_new_game')}
          </button>

          <button className="action-button action-button--secondary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {t('dashboard:find_opponents')}
          </button>

          <button className="action-button action-button--secondary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {t('dashboard:join_tournament')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
