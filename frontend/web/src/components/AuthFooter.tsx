/**
 * AuthFooter Component
 * 
 * Modern, professional footer for authentication pages
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useRTL from '../hooks/useRTL';
import AboutUsModal from './modals/AboutUsModal';
import FeaturesModal from './modals/FeaturesModal';
import ContactModal from './modals/ContactModal';
import HelpCenterModal from './modals/HelpCenterModal';
import PrivacyPolicyModal from './modals/PrivacyPolicyModal';
import TermsOfServiceModal from './modals/TermsOfServiceModal';
import CookiesPolicyModal from './modals/CookiesPolicyModal';

interface AuthFooterProps {
  showSignUpLink?: boolean;
  showSignInLink?: boolean;
}

const AuthFooter: React.FC<AuthFooterProps> = ({ 
  showSignUpLink = false, 
  showSignInLink = false 
}) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const currentYear = new Date().getFullYear();

  // Modal state management
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openModal = (modalName: string) => {
    setActiveModal(modalName);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // Get social media URLs from environment variables
  const socialLinks = {
    facebook: process.env.REACT_APP_SOCIAL_FACEBOOK_URL,
    twitter: process.env.REACT_APP_SOCIAL_TWITTER_URL,
    instagram: process.env.REACT_APP_SOCIAL_INSTAGRAM_URL,
    tiktok: process.env.REACT_APP_SOCIAL_TIKTOK_URL,
    youtube: process.env.REACT_APP_SOCIAL_YOUTUBE_URL,
    linkedin: process.env.REACT_APP_SOCIAL_LINKEDIN_URL,
  };

  // Filter out empty social links
  const activeSocialLinks = Object.entries(socialLinks).filter(([key, url]) => url && url.trim() !== '');
  const hasSocialLinks = activeSocialLinks.length > 0;

  // Function to get social media icon
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return (
          <svg viewBox="0 0 24 24" className="auth-footer-social-icon">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'twitter':
        return (
          <svg viewBox="0 0 24 24" className="auth-footer-social-icon">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
        );
      case 'instagram':
        return (
          <svg viewBox="0 0 24 24" className="auth-footer-social-icon">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        );
      case 'tiktok':
        return (
          <svg viewBox="0 0 24 24" className="auth-footer-social-icon">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
          </svg>
        );
      case 'youtube':
        return (
          <svg viewBox="0 0 24 24" className="auth-footer-social-icon">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      case 'linkedin':
        return (
          <svg viewBox="0 0 24 24" className="auth-footer-social-icon">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  // Function to get platform display name
  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return 'Facebook';
      case 'twitter':
        return 'Twitter';
      case 'instagram':
        return 'Instagram';
      case 'tiktok':
        return 'TikTok';
      case 'youtube':
        return 'YouTube';
      case 'linkedin':
        return 'LinkedIn';
      default:
        return platform;
    }
  };

  return (
    <div className={`auth-footer-modern ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Main Footer Content */}
      <div className="auth-footer-content">
        {/* Company Info */}
        <div className="auth-footer-section">
          <div className="auth-footer-brand">
            <h3 className="auth-footer-brand-name">Leaguer</h3>
            <p className="auth-footer-brand-tagline">
              {t('common:app.tagline', { defaultValue: 'Your Sports Community Platform' })}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="auth-footer-section">
          <h4 className="auth-footer-section-title">{t('common:footer.quickLinks', { defaultValue: 'Quick Links' })}</h4>
          <ul className="auth-footer-links">
            <li>
              <button 
                onClick={() => openModal('about')}
                className="auth-footer-link auth-footer-button"
              >
                {t('common:footer.about', { defaultValue: 'About Us' })}
              </button>
            </li>
            <li>
              <button 
                onClick={() => openModal('features')}
                className="auth-footer-link auth-footer-button"
              >
                {t('common:footer.features', { defaultValue: 'Features' })}
              </button>
            </li>
            <li>
              <button 
                onClick={() => openModal('contact')}
                className="auth-footer-link auth-footer-button"
              >
                {t('common:footer.contact', { defaultValue: 'Contact' })}
              </button>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div className="auth-footer-section">
          <h4 className="auth-footer-section-title">{t('common:footer.support', { defaultValue: 'Support' })}</h4>
          <ul className="auth-footer-links">
            <li>
              <button 
                onClick={() => openModal('help')}
                className="auth-footer-link auth-footer-button"
              >
                {t('common:footer.help', { defaultValue: 'Help Center' })}
              </button>
            </li>
            <li>
              <button 
                onClick={() => openModal('privacy')}
                className="auth-footer-link auth-footer-button"
              >
                {t('common:footer.privacy', { defaultValue: 'Privacy Policy' })}
              </button>
            </li>
            <li>
              <button 
                onClick={() => openModal('terms')}
                className="auth-footer-link auth-footer-button"
              >
                {t('common:footer.terms', { defaultValue: 'Terms of Service' })}
              </button>
            </li>
          </ul>
        </div>

        {/* Social Media - Only show if there are active social links */}
        {hasSocialLinks && (
          <div className="auth-footer-section">
            <h4 className="auth-footer-section-title">{t('common:footer.followUs', { defaultValue: 'Follow Us' })}</h4>
            <div className="auth-footer-social">
              {activeSocialLinks.map(([platform, url]) => (
                <a 
                  key={platform}
                  href={url}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="auth-footer-social-link"
                  aria-label={getPlatformName(platform)}
                >
                  {getSocialIcon(platform)}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="auth-footer-bottom">
        <div className="auth-footer-bottom-content">
          <p className="auth-footer-copyright">
            © {currentYear} Leaguer. {t('common:app.allRightsReserved')}
          </p>
          <div className="auth-footer-bottom-links">
            <button 
              onClick={() => openModal('privacy')}
              className="auth-footer-bottom-link auth-footer-button"
            >
              {t('common:footer.privacy', { defaultValue: 'Privacy' })}
            </button>
            <button 
              onClick={() => openModal('terms')}
              className="auth-footer-bottom-link auth-footer-button"
            >
              {t('common:footer.terms', { defaultValue: 'Terms' })}
            </button>
            <button 
              onClick={() => openModal('cookies')}
              className="auth-footer-bottom-link auth-footer-button"
            >
              {t('common:footer.cookies', { defaultValue: 'Cookies' })}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Components */}
      <AboutUsModal 
        isOpen={activeModal === 'about'} 
        onClose={closeModal} 
      />
      <FeaturesModal 
        isOpen={activeModal === 'features'} 
        onClose={closeModal} 
      />
      <ContactModal 
        isOpen={activeModal === 'contact'} 
        onClose={closeModal} 
      />
      <HelpCenterModal 
        isOpen={activeModal === 'help'} 
        onClose={closeModal} 
        onContactSupport={() => {
          closeModal();
          openModal('contact');
        }}
      />
      <PrivacyPolicyModal 
        isOpen={activeModal === 'privacy'} 
        onClose={closeModal} 
      />
      <TermsOfServiceModal 
        isOpen={activeModal === 'terms'} 
        onClose={closeModal} 
      />
      <CookiesPolicyModal 
        isOpen={activeModal === 'cookies'} 
        onClose={closeModal} 
      />
    </div>
  );
};

export default AuthFooter;
