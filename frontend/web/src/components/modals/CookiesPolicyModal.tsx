/**
 * CookiesPolicyModal Component
 * 
 * Modal displaying the cookies policy for the Leaguer platform
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import { renderDate } from '../../utils/GlobalUtils';

interface CookiesPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CookiesPolicyModal: React.FC<CookiesPolicyModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language;

  // Get company information from environment variables
  const companyName = process.env.REACT_APP_COMPANY_NAME || 'Leaguer';
  const supportEmail = process.env.REACT_APP_SUPPORT_EMAIL || 'support@leaguer.com';
  const lastUpdated = new Date(2024, 0, 1); // Example last updated date: 01/01/2024

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('common:cookies.title', { defaultValue: 'Cookies Policy' })}
      size="large"
    >
      <div className="cookies-policy-modal-content">
        {/* Last Updated Section */}
        <div className="modal-section">
          <p className="cookies-last-updated">
            <strong>{t('common:cookies.lastUpdated', { defaultValue: 'Last updated:' })}</strong> {renderDate(lastUpdated, currentLanguage)}
          </p>
        </div>

        {/* Introduction */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:cookies.introduction.title', { defaultValue: 'What Are Cookies?' })}
          </h4>
          <p className="modal-text">
            {t('common:cookies.introduction.text', { 
              defaultValue: `This Cookies Policy explains how ${companyName} uses cookies and similar tracking technologies when you visit our sports community platform. We use cookies to enhance your experience, analyze usage patterns, and provide personalized content.`,
              companyName
            })}
          </p>
        </div>

        {/* What Are Cookies */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:cookies.whatAreCookies.title', { defaultValue: 'Understanding Cookies' })}
          </h4>
          <p className="modal-text">
            {t('common:cookies.whatAreCookies.text', { 
              defaultValue: 'Cookies are small text files that are stored on your device when you visit a website. They help websites remember information about your visit, such as your preferred settings and login status, which can make your next visit easier and the site more useful to you.'
            })}
          </p>
        </div>

        {/* Types of Cookies */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:cookies.typesOfCookies.title', { defaultValue: 'Types of Cookies We Use' })}
          </h4>
          
          <h5 className="modal-subsection-title">
            {t('common:cookies.typesOfCookies.essential.title', { defaultValue: 'Essential Cookies' })}
          </h5>
          <p className="modal-text">
            {t('common:cookies.typesOfCookies.essential.text', { 
              defaultValue: 'These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.'
            })}
          </p>
          <ul className="modal-list">
            <li>{t('common:cookies.typesOfCookies.essential.items.authentication', { defaultValue: 'User authentication and session management' })}</li>
            <li>{t('common:cookies.typesOfCookies.essential.items.security', { defaultValue: 'Security and fraud prevention' })}</li>
            <li>{t('common:cookies.typesOfCookies.essential.items.functionality', { defaultValue: 'Basic website functionality and navigation' })}</li>
            <li>{t('common:cookies.typesOfCookies.essential.items.preferences', { defaultValue: 'Your consent preferences for cookies' })}</li>
          </ul>

          <h5 className="modal-subsection-title">
            {t('common:cookies.typesOfCookies.performance.title', { defaultValue: 'Performance Cookies' })}
          </h5>
          <p className="modal-text">
            {t('common:cookies.typesOfCookies.performance.text', { 
              defaultValue: 'These cookies collect information about how you use our website, helping us understand and improve performance.'
            })}
          </p>
          <ul className="modal-list">
            <li>{t('common:cookies.typesOfCookies.performance.items.analytics', { defaultValue: 'Website analytics and usage statistics' })}</li>
            <li>{t('common:cookies.typesOfCookies.performance.items.errors', { defaultValue: 'Error tracking and performance monitoring' })}</li>
            <li>{t('common:cookies.typesOfCookies.performance.items.optimization', { defaultValue: 'Website optimization and A/B testing' })}</li>
            <li>{t('common:cookies.typesOfCookies.performance.items.speed', { defaultValue: 'Loading speed and performance metrics' })}</li>
          </ul>

          <h5 className="modal-subsection-title">
            {t('common:cookies.typesOfCookies.functional.title', { defaultValue: 'Functional Cookies' })}
          </h5>
          <p className="modal-text">
            {t('common:cookies.typesOfCookies.functional.text', { 
              defaultValue: 'These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.'
            })}
          </p>
          <ul className="modal-list">
            <li>{t('common:cookies.typesOfCookies.functional.items.language', { defaultValue: 'Language and region preferences' })}</li>
            <li>{t('common:cookies.typesOfCookies.functional.items.settings', { defaultValue: 'User interface settings and customizations' })}</li>
            <li>{t('common:cookies.typesOfCookies.functional.items.content', { defaultValue: 'Personalized content and recommendations' })}</li>
            <li>{t('common:cookies.typesOfCookies.functional.items.forms', { defaultValue: 'Form data and user inputs' })}</li>
          </ul>

          <h5 className="modal-subsection-title">
            {t('common:cookies.typesOfCookies.targeting.title', { defaultValue: 'Targeting Cookies' })}
          </h5>
          <p className="modal-text">
            {t('common:cookies.typesOfCookies.targeting.text', { 
              defaultValue: 'These cookies are used to deliver relevant advertisements and marketing content based on your interests and behavior.'
            })}
          </p>
          <ul className="modal-list">
            <li>{t('common:cookies.typesOfCookies.targeting.items.advertising', { defaultValue: 'Targeted advertising and marketing campaigns' })}</li>
            <li>{t('common:cookies.typesOfCookies.targeting.items.social', { defaultValue: 'Social media integration and sharing' })}</li>
            <li>{t('common:cookies.typesOfCookies.targeting.items.tracking', { defaultValue: 'Cross-site tracking and behavior analysis' })}</li>
            <li>{t('common:cookies.typesOfCookies.targeting.items.retargeting', { defaultValue: 'Retargeting and remarketing campaigns' })}</li>
          </ul>
        </div>

        {/* Third-Party Cookies */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:cookies.thirdParty.title', { defaultValue: 'Third-Party Cookies' })}
          </h4>
          <p className="modal-text">
            {t('common:cookies.thirdParty.text', { 
              defaultValue: 'We may use third-party services that set cookies on our website. These services help us provide better functionality and analyze website performance.'
            })}
          </p>
          <ul className="modal-list">
            <li>{t('common:cookies.thirdParty.items.analytics', { defaultValue: 'Google Analytics for website analytics and user behavior tracking' })}</li>
            <li>{t('common:cookies.thirdParty.items.social', { defaultValue: 'Social media platforms for sharing and integration features' })}</li>
            <li>{t('common:cookies.thirdParty.items.payment', { defaultValue: 'Payment processors for secure transaction handling' })}</li>
            <li>{t('common:cookies.thirdParty.items.support', { defaultValue: 'Customer support and chat services' })}</li>
          </ul>
        </div>

        {/* How Long Cookies Last */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:cookies.duration.title', { defaultValue: 'How Long Do Cookies Last?' })}
          </h4>
          <p className="modal-text">
            {t('common:cookies.duration.text', { 
              defaultValue: 'Cookies have different lifespans depending on their purpose:'
            })}
          </p>
          <ul className="modal-list">
            <li><strong>{t('common:cookies.duration.items.session.title', { defaultValue: 'Session Cookies:' })}</strong> {t('common:cookies.duration.items.session.text', { defaultValue: 'These are temporary and are deleted when you close your browser' })}</li>
            <li><strong>{t('common:cookies.duration.items.persistent.title', { defaultValue: 'Persistent Cookies:' })}</strong> {t('common:cookies.duration.items.persistent.text', { defaultValue: 'These remain on your device for a set period or until you delete them' })}</li>
            <li><strong>{t('common:cookies.duration.items.longTerm.title', { defaultValue: 'Long-term Cookies:' })}</strong> {t('common:cookies.duration.items.longTerm.text', { defaultValue: 'Some cookies may last up to 2 years to remember your preferences' })}</li>
          </ul>
        </div>

        {/* Managing Cookies */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:cookies.managing.title', { defaultValue: 'Managing Your Cookie Preferences' })}
          </h4>
          <p className="modal-text">
            {t('common:cookies.managing.text', { 
              defaultValue: 'You have several options for managing cookies on our website:'
            })}
          </p>

          <h5 className="modal-subsection-title">
            {t('common:cookies.managing.consent.title', { defaultValue: 'Cookie Consent Banner' })}
          </h5>
          <p className="modal-text">
            {t('common:cookies.managing.consent.text', { 
              defaultValue: 'When you first visit our website, you will see a cookie consent banner where you can choose which types of cookies to accept or reject.'
            })}
          </p>

          <h5 className="modal-subsection-title">
            {t('common:cookies.managing.browser.title', { defaultValue: 'Browser Settings' })}
          </h5>
          <p className="modal-text">
            {t('common:cookies.managing.browser.text', { 
              defaultValue: 'You can control and delete cookies through your browser settings. Most browsers allow you to:'
            })}
          </p>
          <ul className="modal-list">
            <li>{t('common:cookies.managing.browser.items.view', { defaultValue: 'View and delete existing cookies' })}</li>
            <li>{t('common:cookies.managing.browser.items.block', { defaultValue: 'Block cookies from specific websites' })}</li>
            <li>{t('common:cookies.managing.browser.items.disable', { defaultValue: 'Disable all cookies (may affect website functionality)' })}</li>
            <li>{t('common:cookies.managing.browser.items.notify', { defaultValue: 'Get notifications when cookies are set' })}</li>
          </ul>
        </div>

        {/* Browser Instructions */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:cookies.browserInstructions.title', { defaultValue: 'Browser-Specific Instructions' })}
          </h4>
          <p className="modal-text">
            {t('common:cookies.browserInstructions.text', { 
              defaultValue: 'Here are links to cookie management instructions for popular browsers:'
            })}
          </p>
          <ul className="modal-list">
            <li><strong>Google Chrome:</strong> <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="cookies-link">{t('common:cookies.browserInstructions.chrome', { defaultValue: 'Chrome Cookie Settings' })}</a></li>
            <li><strong>Mozilla Firefox:</strong> <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="cookies-link">{t('common:cookies.browserInstructions.firefox', { defaultValue: 'Firefox Cookie Settings' })}</a></li>
            <li><strong>Safari:</strong> <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="cookies-link">{t('common:cookies.browserInstructions.safari', { defaultValue: 'Safari Cookie Settings' })}</a></li>
            <li><strong>Microsoft Edge:</strong> <a href="https://support.microsoft.com/en-us/help/4027947/microsoft-edge-delete-cookies" target="_blank" rel="noopener noreferrer" className="cookies-link">{t('common:cookies.browserInstructions.edge', { defaultValue: 'Edge Cookie Settings' })}</a></li>
          </ul>
        </div>

        {/* Impact of Disabling Cookies */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:cookies.impact.title', { defaultValue: 'Impact of Disabling Cookies' })}
          </h4>
          <p className="modal-text">
            {t('common:cookies.impact.text', { 
              defaultValue: 'Please note that disabling certain cookies may affect your experience on our website:'
            })}
          </p>
          <ul className="modal-list">
            <li>{t('common:cookies.impact.items.functionality', { defaultValue: 'Some features may not work properly or may be unavailable' })}</li>
            <li>{t('common:cookies.impact.items.personalization', { defaultValue: 'Personalized content and recommendations may not be displayed' })}</li>
            <li>{t('common:cookies.impact.items.preferences', { defaultValue: 'Your preferences and settings may not be remembered' })}</li>
            <li>{t('common:cookies.impact.items.analytics', { defaultValue: 'We may not be able to improve our services based on usage patterns' })}</li>
          </ul>
        </div>

        {/* Updates to Policy */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:cookies.updates.title', { defaultValue: 'Updates to This Policy' })}
          </h4>
          <p className="modal-text">
            {t('common:cookies.updates.text', { 
              defaultValue: 'We may update this Cookies Policy from time to time to reflect changes in technology, legislation, or our business practices. We will notify you of any significant changes by updating the "Last updated" date at the top of this policy.'
            })}
          </p>
        </div>

        {/* Contact Information */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:cookies.contact.title', { defaultValue: 'Contact Us' })}
          </h4>
          <p className="modal-text">
            {t('common:cookies.contact.text', { 
              defaultValue: 'If you have any questions about our use of cookies or this Cookies Policy, please contact us:'
            })}
          </p>
          <div className="cookies-contact-info">
            <p><strong>{t('common:cookies.contact.email', { defaultValue: 'Email:' })}</strong> 
              <a href={`mailto:${supportEmail}`} className="cookies-contact-link">
                {" "}{supportEmail}
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-section cookies-footer">
          <div className="cookies-footer-content">
            <p className="cookies-footer-text">
              {t('common:cookies.footer.text', { 
                defaultValue: `By continuing to use ${companyName}, you acknowledge that you have read and understood this Cookies Policy and consent to our use of cookies as described herein.`,
                companyName
              })}
            </p>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default CookiesPolicyModal;
