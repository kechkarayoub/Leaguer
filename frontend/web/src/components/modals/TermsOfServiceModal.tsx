/**
 * TermsOfServiceModal Component
 * 
 * Modal displaying the terms of service for the Leaguer platform
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import { renderDate } from '../../utils/GlobalUtils';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language;

  // Get company information from environment variables
  const companyName = process.env.REACT_APP_COMPANY_NAME || 'Leaguer';
  const supportEmail = process.env.REACT_APP_SUPPORT_EMAIL || 'support@leaguer.com';
  const companyAddress = process.env.REACT_APP_COMPANY_ADDRESS || 'Company Address';
  const lastUpdated = new Date(2023, 0, 1); // Example last updated date: 01/01/2023

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('common:terms.title', { defaultValue: 'Terms of Service' })}
      size="large"
    >
      <div className="terms-of-service-modal-content">
        {/* Last Updated Section */}
        <div className="modal-section">
          <p className="terms-last-updated">
            <strong>{t('common:terms.lastUpdated', { defaultValue: 'Last updated:' })}</strong> {renderDate(lastUpdated, currentLanguage)}
          </p>
        </div>

        {/* Introduction */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:terms.introduction.title', { defaultValue: 'Introduction' })}
          </h4>
          <p className="modal-text">
            {t('common:terms.introduction.text', { 
              defaultValue: `Welcome to ${companyName}! These Terms of Service ("Terms") govern your use of our sports community platform and services. By accessing or using our platform, you agree to be bound by these Terms.`,
              companyName
            })}
          </p>
        </div>

        {/* Acceptance of Terms */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:terms.acceptance.title', { defaultValue: 'Acceptance of Terms' })}
          </h4>
          <p className="modal-text">
            {t('common:terms.acceptance.text', { 
              defaultValue: 'By creating an account, accessing, or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use our services.'
            })}
          </p>
        </div>

        {/* Eligibility */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:terms.eligibility.title', { defaultValue: 'Eligibility' })}
          </h4>
          <p className="modal-text">
            {t('common:terms.eligibility.text', { 
              defaultValue: 'To use our services, you must:'
            })}
          </p>
          <ul className="modal-list">
            <li>{t('common:terms.eligibility.items.age', { defaultValue: 'Be at least 13 years old (or the minimum age required in your jurisdiction)' })}</li>
            <li>{t('common:terms.eligibility.items.capacity', { defaultValue: 'Have the legal capacity to enter into this agreement' })}</li>
            <li>{t('common:terms.eligibility.items.compliance', { defaultValue: 'Comply with all applicable laws and regulations' })}</li>
            <li>{t('common:terms.eligibility.items.accuracy', { defaultValue: 'Provide accurate and complete information during registration' })}</li>
          </ul>
        </div>

        {/* Account Registration */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:terms.accountRegistration.title', { defaultValue: 'Account Registration and Security' })}
          </h4>
          <p className="modal-text">
            {t('common:terms.accountRegistration.text', { 
              defaultValue: 'When you create an account with us, you must provide information that is accurate, complete, and current. You are responsible for:'
            })}
          </p>
          <ul className="modal-list">
            <li>{t('common:terms.accountRegistration.items.security', { defaultValue: 'Maintaining the security of your account and password' })}</li>
            <li>{t('common:terms.accountRegistration.items.activities', { defaultValue: 'All activities that occur under your account' })}</li>
            <li>{t('common:terms.accountRegistration.items.notify', { defaultValue: 'Immediately notifying us of any unauthorized use of your account' })}</li>
            <li>{t('common:terms.accountRegistration.items.update', { defaultValue: 'Keeping your account information accurate and up-to-date' })}</li>
          </ul>
        </div>

        {/* Use of Services */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:terms.useOfServices.title', { defaultValue: 'Use of Services' })}
          </h4>
          <p className="modal-text">
            {t('common:terms.useOfServices.text', { 
              defaultValue: 'Our platform provides tools and services to help you connect with other sports enthusiasts, create and join teams, and participate in sports activities. You may use our services for lawful purposes only.'
            })}
          </p>
          
          <h5 className="modal-subsection-title">
            {t('common:terms.useOfServices.permitted.title', { defaultValue: 'Permitted Uses' })}
          </h5>
          <ul className="modal-list">
            <li>{t('common:terms.useOfServices.permitted.items.connect', { defaultValue: 'Connect with other players and teams' })}</li>
            <li>{t('common:terms.useOfServices.permitted.items.create', { defaultValue: 'Create and manage sports teams' })}</li>
            <li>{t('common:terms.useOfServices.permitted.items.participate', { defaultValue: 'Participate in sports activities and events' })}</li>
            <li>{t('common:terms.useOfServices.permitted.items.share', { defaultValue: 'Share sports-related content and experiences' })}</li>
          </ul>

          <h5 className="modal-subsection-title">
            {t('common:terms.useOfServices.prohibited.title', { defaultValue: 'Prohibited Uses' })}
          </h5>
          <ul className="modal-list">
            <li>{t('common:terms.useOfServices.prohibited.items.illegal', { defaultValue: 'Use the platform for any illegal or unauthorized purpose' })}</li>
            <li>{t('common:terms.useOfServices.prohibited.items.harass', { defaultValue: 'Harass, abuse, or harm other users' })}</li>
            <li>{t('common:terms.useOfServices.prohibited.items.spam', { defaultValue: 'Send spam, unsolicited communications, or engage in commercial activities' })}</li>
            <li>{t('common:terms.useOfServices.prohibited.items.impersonate', { defaultValue: 'Impersonate others or provide false information' })}</li>
            <li>{t('common:terms.useOfServices.prohibited.items.violate', { defaultValue: 'Violate any laws, regulations, or third-party rights' })}</li>
            <li>{t('common:terms.useOfServices.prohibited.items.interfere', { defaultValue: 'Interfere with or disrupt the platform or servers' })}</li>
          </ul>
        </div>

        {/* User Content */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:terms.userContent.title', { defaultValue: 'User Content' })}
          </h4>
          <p className="modal-text">
            {t('common:terms.userContent.text', { 
              defaultValue: 'You may submit, upload, or post content on our platform ("User Content"). You retain ownership of your User Content, but you grant us certain rights to use it.'
            })}
          </p>
          
          <h5 className="modal-subsection-title">
            {t('common:terms.userContent.license.title', { defaultValue: 'License to User Content' })}
          </h5>
          <p className="modal-text">
            {t('common:terms.userContent.license.text', { 
              defaultValue: 'By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute your content in connection with our services.'
            })}
          </p>

          <h5 className="modal-subsection-title">
            {t('common:terms.userContent.responsibilities.title', { defaultValue: 'Your Responsibilities' })}
          </h5>
          <p className="modal-text">
            {t('common:terms.userContent.responsibilities.text', { 
              defaultValue: 'You are solely responsible for your User Content and must ensure that it:'
            })}
          </p>
          <ul className="modal-list">
            <li>{t('common:terms.userContent.responsibilities.items.legal', { defaultValue: 'Does not violate any laws or regulations' })}</li>
            <li>{t('common:terms.userContent.responsibilities.items.rights', { defaultValue: 'Does not infringe on third-party rights' })}</li>
            <li>{t('common:terms.userContent.responsibilities.items.appropriate', { defaultValue: 'Is appropriate and not offensive or harmful' })}</li>
            <li>{t('common:terms.userContent.responsibilities.items.accurate', { defaultValue: 'Is accurate and not misleading' })}</li>
          </ul>
        </div>

        {/* Privacy and Data */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:terms.privacy.title', { defaultValue: 'Privacy and Data Protection' })}
          </h4>
          <p className="modal-text">
            {t('common:terms.privacy.text', { 
              defaultValue: 'Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.'
            })}
          </p>
        </div>

        {/* Intellectual Property */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:terms.intellectualProperty.title', { defaultValue: 'Intellectual Property' })}
          </h4>
          <p className="modal-text">
            {t('common:terms.intellectualProperty.text', { 
              defaultValue: `The platform and its content, features, and functionality are owned by ${companyName} and are protected by international copyright, trademark, and other intellectual property laws.`,
              companyName
            })}
          </p>
        </div>

        {/* Payments and Subscriptions */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:terms.payments.title', { defaultValue: 'Payments and Subscriptions' })}
          </h4>
          <p className="modal-text">
            {t('common:terms.payments.text', { 
              defaultValue: 'Some features of our platform may require payment. By making a payment, you agree to our billing terms and policies.'
            })}
          </p>
          <ul className="modal-list">
            <li>{t('common:terms.payments.items.authorization', { defaultValue: 'You authorize us to charge your payment method for applicable fees' })}</li>
            <li>{t('common:terms.payments.items.accuracy', { defaultValue: 'You are responsible for providing accurate payment information' })}</li>
            <li>{t('common:terms.payments.items.cancellation', { defaultValue: 'You may cancel your subscription at any time through your account settings' })}</li>
            <li>{t('common:terms.payments.items.refunds', { defaultValue: 'Refunds are subject to our refund policy' })}</li>
          </ul>
        </div>

        {/* Disclaimers */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:terms.disclaimers.title', { defaultValue: 'Disclaimers' })}
          </h4>
          <p className="modal-text">
            {t('common:terms.disclaimers.text', { 
              defaultValue: 'Our services are provided "as is" and "as available" without warranties of any kind. We disclaim all warranties, express or implied, including but not limited to merchantability, fitness for a particular purpose, and non-infringement.'
            })}
          </p>
        </div>

        {/* Limitation of Liability */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:terms.limitation.title', { defaultValue: 'Limitation of Liability' })}
          </h4>
          <p className="modal-text">
            {t('common:terms.limitation.text', { 
              defaultValue: `To the fullest extent permitted by law, ${companyName} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.`,
              companyName
            })}
          </p>
        </div>

        {/* Termination */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:terms.termination.title', { defaultValue: 'Termination' })}
          </h4>
          <p className="modal-text">
            {t('common:terms.termination.text', { 
              defaultValue: 'We may terminate or suspend your account and access to our services at any time, with or without cause, and with or without notice. You may also terminate your account at any time.'
            })}
          </p>
        </div>

        {/* Governing Law */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:terms.governingLaw.title', { defaultValue: 'Governing Law' })}
          </h4>
          <p className="modal-text">
            {t('common:terms.governingLaw.text', { 
              defaultValue: 'These Terms are governed by and construed in accordance with the laws of the jurisdiction where our company is incorporated, without regard to conflict of law principles.'
            })}
          </p>
        </div>

        {/* Changes to Terms */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:terms.changes.title', { defaultValue: 'Changes to These Terms' })}
          </h4>
          <p className="modal-text">
            {t('common:terms.changes.text', { 
              defaultValue: 'We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on our platform and updating the "Last updated" date.'
            })}
          </p>
        </div>

        {/* Contact Information */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:terms.contact.title', { defaultValue: 'Contact Us' })}
          </h4>
          <p className="modal-text">
            {t('common:terms.contact.text', { 
              defaultValue: 'If you have any questions about these Terms of Service, please contact us:'
            })}
          </p>
          <div className="terms-contact-info">
            <p><strong>{t('common:terms.contact.email', { defaultValue: 'Email:' })}</strong> 
              <a href={`mailto:${supportEmail}`} className="terms-contact-link">
                {" "}{supportEmail}
              </a>
            </p>
            <p><strong>{t('common:terms.contact.address', { defaultValue: 'Address:' })}</strong> {" "}{companyAddress}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-section terms-footer">
          <div className="terms-footer-content">
            <p className="terms-footer-text">
              {t('common:terms.footer.text', { 
                defaultValue: `By using ${companyName}, you acknowledge that you have read and understood these Terms of Service and agree to be bound by them.`,
                companyName
              })}
            </p>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default TermsOfServiceModal;
