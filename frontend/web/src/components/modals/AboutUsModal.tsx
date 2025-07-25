/**
 * AboutUsModal Component
 * 
 * Modal displaying information about the Leaguer platform
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import leaguerLogo from '../../logo.png';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutUsModal: React.FC<AboutUsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  // Get support email from environment variables
  const supportEmail = process.env.REACT_APP_SUPPORT_EMAIL;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('common:footer.about', { defaultValue: 'About Us' })}
      size="large"
    >
      <div className="about-us-modal-content">
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
              {t('common:app.welcome', { defaultValue: 'Welcome to Leaguer' })}
            </h3>
            <p className="modal-hero-subtitle">
              {t('common:app.tagline', { defaultValue: 'Your Sports Community Platform' })}
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:about.ourMission', { defaultValue: 'Our Mission' })}
          </h4>
          <p className="modal-text">
            {t('common:about.missionText', { 
              defaultValue: 'At Leaguer, we believe in bringing sports communities together. Our platform connects athletes, teams, and sports enthusiasts, providing tools to organize, participate, and excel in various sporting activities.' 
            })}
          </p>
        </div>

        {/* Features Section */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:about.whatWeOffer', { defaultValue: 'What We Offer' })}
          </h4>
          <div className="modal-feature-grid">
            <div className="modal-feature-item">
              <div className="modal-feature-icon">
                <svg viewBox="0 0 24 24" className="modal-feature-svg">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-6h13v8h-2v-6.2L9 17.2V22H7v-6h2l-5-2.2V10h2L4 18z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h5 className="modal-feature-title">
                  {t('common:about.teamManagement', { defaultValue: 'Team Management' })}
                </h5>
                <p className="modal-feature-text">
                  {t('common:about.teamManagementDesc', { 
                    defaultValue: 'Create and manage sports teams, track player statistics, and organize team activities.' 
                  })}
                </p>
              </div>
            </div>

            <div className="modal-feature-item">
              <div className="modal-feature-icon">
                <svg viewBox="0 0 24 24" className="modal-feature-svg">
                  <path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.21,15.05 2.27,14.78 2.46,14.63L4.57,12.97L4.5,12L4.57,11.03L2.46,9.37C2.27,9.22 2.21,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.79,8.95 21.73,9.22 21.54,9.37L19.43,11.03L19.5,12L19.43,12.97L21.54,14.63C21.73,14.78 21.79,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.04 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.62L12.75,4H11.25Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h5 className="modal-feature-title">
                  {t('common:about.eventOrganization', { defaultValue: 'Event Organization' })}
                </h5>
                <p className="modal-feature-text">
                  {t('common:about.eventOrganizationDesc', { 
                    defaultValue: 'Organize tournaments, matches, and sporting events with easy scheduling and management tools.' 
                  })}
                </p>
              </div>
            </div>

            <div className="modal-feature-item">
              <div className="modal-feature-icon">
                <svg viewBox="0 0 24 24" className="modal-feature-svg">
                  <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h5 className="modal-feature-title">
                  {t('common:about.communityBuilding', { defaultValue: 'Community Building' })}
                </h5>
                <p className="modal-feature-text">
                  {t('common:about.communityBuildingDesc', { 
                    defaultValue: 'Connect with fellow athletes, share experiences, and build lasting relationships within the sports community.' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:about.ourValues', { defaultValue: 'Our Values' })}
          </h4>
          <div className="modal-values-grid">
            <div className="modal-value-item">
              <strong>{t('common:about.excellence', { defaultValue: 'Excellence' })}</strong>
              <span>{t('common:about.excellenceDesc', { defaultValue: 'Striving for the best in everything we do' })}</span>
            </div>
            <div className="modal-value-item">
              <strong>{t('common:about.community', { defaultValue: 'Community' })}</strong>
              <span>{t('common:about.communityDesc', { defaultValue: 'Building connections that last beyond the game' })}</span>
            </div>
            <div className="modal-value-item">
              <strong>{t('common:about.innovation', { defaultValue: 'Innovation' })}</strong>
              <span>{t('common:about.innovationDesc', { defaultValue: 'Using technology to enhance the sports experience' })}</span>
            </div>
            <div className="modal-value-item">
              <strong>{t('common:about.inclusivity', { defaultValue: 'Inclusivity' })}</strong>
              <span>{t('common:about.inclusivityDesc', { defaultValue: 'Welcoming athletes of all levels and backgrounds' })}</span>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="modal-section modal-section--final">
          <h4 className="modal-section-title">
            {t('common:about.getInTouch', { defaultValue: 'Get in Touch' })}
          </h4>
          <p className="modal-text">
            {t('common:about.contactText', { 
              defaultValue: 'Have questions or want to learn more? We\'d love to hear from you! Contact our team for support, partnerships, or general inquiries.' 
            })}
          </p>
          {supportEmail && supportEmail.trim() !== '' && (
            <div className="modal-contact-info">
              <div className="modal-contact-item">
                <svg viewBox="0 0 24 24" className="modal-contact-icon">
                  <path d="M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4M20,8L12,13L4,8V6L12,11L20,6V8Z" fill="currentColor"/>
                </svg>
                <a 
                  href={`mailto:${supportEmail}`}
                  className="modal-contact-link"
                >
                  {supportEmail}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

export default AboutUsModal;
