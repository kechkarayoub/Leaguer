/**
 * FeaturesModal Component
 * 
 * Modal displaying the key features and capabilities of the Leaguer platform
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import leaguerLogo from '../../logo.png';

interface FeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeaturesModal: React.FC<FeaturesModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('common:footer.features', { defaultValue: 'Features' })}
      size="large"
    >
      <div className="features-modal-content">
        {/* Hero Section */}
        <div className="modal-section">
          <div className="modal-hero">
            <div className="modal-hero-logo">
              <img 
                src={leaguerLogo} 
                alt="Leaguer Logo" 
                className="modal-hero-logo-img"
              />
            </div>
            <h3 className="modal-hero-title">
              {t('common:features.title', { defaultValue: 'Powerful Features for Sports Communities' })}
            </h3>
            <p className="modal-hero-subtitle">
              {t('common:features.subtitle', { defaultValue: 'Everything you need to manage, organize, and grow your sports community' })}
            </p>
          </div>
        </div>

        {/* Core Features */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:features.coreFeatures', { defaultValue: 'Core Features' })}
          </h4>
          <div className="modal-feature-grid">
            {/* Team Management */}
            <div className="modal-feature-item">
              <div className="modal-feature-icon">
                <svg viewBox="0 0 24 24" className="modal-feature-svg">
                  <path d="M16,4C16.88,4 17.67,4.25 18.31,4.69C19.25,5.34 20,6.34 20,7.5C20,8.66 19.25,9.66 18.31,10.31C17.67,10.75 16.88,11 16,11C15.12,11 14.33,10.75 13.69,10.31C12.75,9.66 12,8.66 12,7.5C12,6.34 12.75,5.34 13.69,4.69C14.33,4.25 15.12,4 16,4M16,13C18.67,13 22,14.34 22,17V20H10V17C10,14.34 13.33,13 16,13M8,4C8.88,4 9.67,4.25 10.31,4.69C11.25,5.34 12,6.34 12,7.5C12,8.66 11.25,9.66 10.31,10.31C9.67,10.75 8.88,11 8,11C7.12,11 6.33,10.75 5.69,10.31C4.75,9.66 4,8.66 4,7.5C4,6.34 4.75,5.34 5.69,4.69C6.33,4.25 7.12,4 8,4M8,13C10.67,13 14,14.34 14,17V20H2V17C2,14.34 5.33,13 8,13Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h5 className="modal-feature-title">
                  {t('common:features.teamManagement', { defaultValue: 'Team Management' })}
                </h5>
                <p className="modal-feature-text">
                  {t('common:features.teamManagementDesc', { 
                    defaultValue: 'Create and manage teams, track player rosters, monitor performance statistics, and organize team activities with ease.' 
                  })}
                </p>
              </div>
            </div>

            {/* Event Organization */}
            <div className="modal-feature-item">
              <div className="modal-feature-icon">
                <svg viewBox="0 0 24 24" className="modal-feature-svg">
                  <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h5 className="modal-feature-title">
                  {t('common:features.eventOrganization', { defaultValue: 'Event Organization' })}
                </h5>
                <p className="modal-feature-text">
                  {t('common:features.eventOrganizationDesc', { 
                    defaultValue: 'Schedule tournaments, matches, and training sessions. Send automated reminders and manage event logistics seamlessly.' 
                  })}
                </p>
              </div>
            </div>

            {/* Real-time Communication */}
            <div className="modal-feature-item">
              <div className="modal-feature-icon">
                <svg viewBox="0 0 24 24" className="modal-feature-svg">
                  <path d="M12,3C6.5,3 2,6.58 2,11A7.18,7.18 0 0,0 2.64,14.25L1,22L8.75,20.36C9.83,20.75 10.9,21 12,21C17.5,21 22,17.42 22,13C22,8.58 17.5,5 12,5M8.5,11A1.5,1.5 0 0,1 10,12.5A1.5,1.5 0 0,1 8.5,14A1.5,1.5 0 0,1 7,12.5A1.5,1.5 0 0,1 8.5,11M12,11A1.5,1.5 0 0,1 13.5,12.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 10.5,12.5A1.5,1.5 0 0,1 12,11M15.5,11A1.5,1.5 0 0,1 17,12.5A1.5,1.5 0 0,1 15.5,14A1.5,1.5 0 0,1 14,12.5A1.5,1.5 0 0,1 15.5,11Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h5 className="modal-feature-title">
                  {t('common:features.communication', { defaultValue: 'Real-time Communication' })}
                </h5>
                <p className="modal-feature-text">
                  {t('common:features.communicationDesc', { 
                    defaultValue: 'Stay connected with instant messaging, team announcements, and group chats. Never miss important updates.' 
                  })}
                </p>
              </div>
            </div>

            {/* Performance Analytics */}
            <div className="modal-feature-item">
              <div className="modal-feature-icon">
                <svg viewBox="0 0 24 24" className="modal-feature-svg">
                  <path d="M22,21H2V3H4V19H6V17H10V19H12V16H16V19H18V17H22V21M4,5V9H8V5H4M10,5V12H14V5H10M16,5V14H20V5H16Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h5 className="modal-feature-title">
                  {t('common:features.analytics', { defaultValue: 'Performance Analytics' })}
                </h5>
                <p className="modal-feature-text">
                  {t('common:features.analyticsDesc', { 
                    defaultValue: 'Track detailed statistics, analyze performance trends, and generate comprehensive reports for players and teams.' 
                  })}
                </p>
              </div>
            </div>

            {/* Tournament Management */}
            <div className="modal-feature-item">
              <div className="modal-feature-icon">
                <svg viewBox="0 0 24 24" className="modal-feature-svg">
                  <path d="M6,2A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6M6,4H13V9H18V20H6V4M8,12V14H16V12H8M8,16V18H13V16H8Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h5 className="modal-feature-title">
                  {t('common:features.tournaments', { defaultValue: 'Tournament Management' })}
                </h5>
                <p className="modal-feature-text">
                  {t('common:features.tournamentsDesc', { 
                    defaultValue: 'Create and manage tournaments with bracket generation, score tracking, and automated scheduling.' 
                  })}
                </p>
              </div>
            </div>

            {/* Mobile App */}
            <div className="modal-feature-item">
              <div className="modal-feature-icon">
                <svg viewBox="0 0 24 24" className="modal-feature-svg">
                  <path d="M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h5 className="modal-feature-title">
                  {t('common:features.mobileApp', { defaultValue: 'Mobile Application' })}
                </h5>
                <p className="modal-feature-text">
                  {t('common:features.mobileAppDesc', { 
                    defaultValue: 'Access all features on the go with our native mobile apps for iOS and Android devices.' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:features.advancedFeatures', { defaultValue: 'Advanced Features' })}
          </h4>
          
          <div className="modal-advanced-features">
            <div className="modal-advanced-feature-row">
              <div className="modal-advanced-feature-icon">
                <svg viewBox="0 0 24 24" className="modal-advanced-svg">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="modal-advanced-feature-content">
                <h5 className="modal-advanced-feature-title">
                  {t('common:features.liveTracking', { defaultValue: 'Live Match Tracking' })}
                </h5>
                <p className="modal-advanced-feature-text">
                  {t('common:features.liveTrackingDesc', { 
                    defaultValue: 'Real-time score updates, live commentary, and instant match statistics.' 
                  })}
                </p>
              </div>
            </div>

            <div className="modal-advanced-feature-row">
              <div className="modal-advanced-feature-icon">
                <svg viewBox="0 0 24 24" className="modal-advanced-svg">
                  <path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L6.04,7.5L12,10.85L17.96,7.5L12,4.15Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="modal-advanced-feature-content">
                <h5 className="modal-advanced-feature-title">
                  {t('common:features.integration', { defaultValue: 'Third-party Integrations' })}
                </h5>
                <p className="modal-advanced-feature-text">
                  {t('common:features.integrationDesc', { 
                    defaultValue: 'Connect with popular fitness trackers, payment systems, and social media platforms.' 
                  })}
                </p>
              </div>
            </div>

            <div className="modal-advanced-feature-row">
              <div className="modal-advanced-feature-icon">
                <svg viewBox="0 0 24 24" className="modal-advanced-svg">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.4C15.4,11.4 16,12 16,12.6V16.6C16,17.2 15.4,17.8 14.8,17.8H9.2C8.6,17.8 8,17.2 8,16.6V12.6C8,12 8.6,11.4 9.2,11.4V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11.4H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="modal-advanced-feature-content">
                <h5 className="modal-advanced-feature-title">
                  {t('common:features.security', { defaultValue: 'Advanced Security' })}
                </h5>
                <p className="modal-advanced-feature-text">
                  {t('common:features.securityDesc', { 
                    defaultValue: 'Enterprise-grade security with data encryption, secure authentication, and privacy controls.' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="modal-section modal-section--final">
          <div className="modal-cta">
            <h4 className="modal-cta-title">
              {t('common:features.getStarted', { defaultValue: 'Ready to Get Started?' })}
            </h4>
            <p className="modal-cta-text">
              {t('common:features.getStartedDesc', { 
                defaultValue: 'Join thousands of sports communities already using Leaguer to manage their teams and events.' 
              })}
            </p>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default FeaturesModal;
