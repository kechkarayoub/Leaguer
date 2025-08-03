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
            {t('home:noContentYet')}
          </p>
        </div>

      </div>
    </div>
  );
};

export default HomePage;
