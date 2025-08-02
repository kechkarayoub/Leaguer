import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './PageNotFound.css';

const PageNotFound: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="page-not-found-container">
      <div className="page-not-found-content">
        <h1 className="page-not-found-title">404</h1>
        <h2 className="page-not-found-subtitle">{t('common:notFound.title', { defaultValue: 'Page Not Found' })}</h2>
        <p className="page-not-found-text">
          {t('common:notFound.text', { defaultValue: 'Sorry, the page you are looking for does not exist.' })}
        </p>
        <button className="page-not-found-btn" onClick={() => navigate('/')}>{t('common:notFound.goHome', { defaultValue: 'Go to Home' })}</button>
      </div>
    </div>
  );
};

export default PageNotFound;
