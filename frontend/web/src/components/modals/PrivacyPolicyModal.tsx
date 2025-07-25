/**
 * PrivacyPolicyModal Component
 * 
 * Modal displaying the privacy policy for the Leaguer platform
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  // Get company information from environment variables
  const companyName = process.env.REACT_APP_COMPANY_NAME || 'Leaguer';
  const supportEmail = process.env.REACT_APP_SUPPORT_EMAIL || 'support@leaguer.com';
  const companyAddress = process.env.REACT_APP_COMPANY_ADDRESS || 'Company Address';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('common:privacy.title', { defaultValue: 'Privacy Policy' })}
      size="large"
    >
      <div className="privacy-policy-modal-content">
        {/* Last Updated Section */}
        <div className="modal-section">
          <p className="privacy-last-updated">
            <strong>{t('common:privacy.lastUpdated', { defaultValue: 'Last updated:' })}</strong> {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Introduction */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:privacy.introduction.title', { defaultValue: 'Introduction' })}
          </h4>
          <p className="modal-text">
            {t('common:privacy.introduction.text', { 
              defaultValue: `At ${companyName}, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our sports community platform.`,
              companyName
            })}
          </p>
        </div>

        {/* Information We Collect */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:privacy.informationWeCollect.title', { defaultValue: 'Information We Collect' })}
          </h4>
          
          <h5 className="modal-subsection-title">
            {t('common:privacy.informationWeCollect.personalInfo.title', { defaultValue: 'Personal Information' })}
          </h5>
          <p className="modal-text">
            {t('common:privacy.informationWeCollect.personalInfo.text', { 
              defaultValue: 'We may collect personal information that you voluntarily provide to us when you register for an account, create a profile, join teams, or contact us. This may include:'
            })}
          </p>
          <ul className="modal-list">
            <li>{t('common:privacy.informationWeCollect.personalInfo.items.name', { defaultValue: 'Name and contact information (email address, phone number)' })}</li>
            <li>{t('common:privacy.informationWeCollect.personalInfo.items.profile', { defaultValue: 'Profile information (age, sports preferences, skill level)' })}</li>
            <li>{t('common:privacy.informationWeCollect.personalInfo.items.photos', { defaultValue: 'Profile photos and other images you upload' })}</li>
            <li>{t('common:privacy.informationWeCollect.personalInfo.items.location', { defaultValue: 'Location information (if you choose to share it)' })}</li>
          </ul>

          <h5 className="modal-subsection-title">
            {t('common:privacy.informationWeCollect.automaticInfo.title', { defaultValue: 'Automatically Collected Information' })}
          </h5>
          <p className="modal-text">
            {t('common:privacy.informationWeCollect.automaticInfo.text', { 
              defaultValue: 'We automatically collect certain information when you access and use our platform:'
            })}
          </p>
          <ul className="modal-list">
            <li>{t('common:privacy.informationWeCollect.automaticInfo.items.usage', { defaultValue: 'Usage data and analytics' })}</li>
            <li>{t('common:privacy.informationWeCollect.automaticInfo.items.device', { defaultValue: 'Device information and browser type' })}</li>
            <li>{t('common:privacy.informationWeCollect.automaticInfo.items.ip', { defaultValue: 'IP address and location data' })}</li>
            <li>{t('common:privacy.informationWeCollect.automaticInfo.items.cookies', { defaultValue: 'Cookies and similar tracking technologies' })}</li>
          </ul>
        </div>

        {/* How We Use Your Information */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:privacy.howWeUse.title', { defaultValue: 'How We Use Your Information' })}
          </h4>
          <p className="modal-text">
            {t('common:privacy.howWeUse.text', { defaultValue: 'We use the information we collect for the following purposes:' })}
          </p>
          <ul className="modal-list">
            <li>{t('common:privacy.howWeUse.items.provide', { defaultValue: 'To provide, operate, and maintain our platform' })}</li>
            <li>{t('common:privacy.howWeUse.items.improve', { defaultValue: 'To improve, personalize, and expand our services' })}</li>
            <li>{t('common:privacy.howWeUse.items.communicate', { defaultValue: 'To communicate with you and provide customer support' })}</li>
            <li>{t('common:privacy.howWeUse.items.connect', { defaultValue: 'To help you connect with other players and teams' })}</li>
            <li>{t('common:privacy.howWeUse.items.notifications', { defaultValue: 'To send you notifications about your account and activities' })}</li>
            <li>{t('common:privacy.howWeUse.items.security', { defaultValue: 'To monitor and analyze usage patterns for security purposes' })}</li>
            <li>{t('common:privacy.howWeUse.items.legal', { defaultValue: 'To comply with legal obligations and protect our rights' })}</li>
          </ul>
        </div>

        {/* Information Sharing */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:privacy.informationSharing.title', { defaultValue: 'Information Sharing and Disclosure' })}
          </h4>
          <p className="modal-text">
            {t('common:privacy.informationSharing.text', { 
              defaultValue: 'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:'
            })}
          </p>
          <ul className="modal-list">
            <li>{t('common:privacy.informationSharing.items.consent', { defaultValue: 'With your explicit consent' })}</li>
            <li>{t('common:privacy.informationSharing.items.service', { defaultValue: 'With trusted service providers who assist us in operating our platform' })}</li>
            <li>{t('common:privacy.informationSharing.items.legal', { defaultValue: 'When required by law or to protect our rights and safety' })}</li>
            <li>{t('common:privacy.informationSharing.items.business', { defaultValue: 'In connection with a business transfer or merger' })}</li>
          </ul>
        </div>

        {/* Data Security */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:privacy.dataSecurity.title', { defaultValue: 'Data Security' })}
          </h4>
          <p className="modal-text">
            {t('common:privacy.dataSecurity.text', { 
              defaultValue: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.'
            })}
          </p>
        </div>

        {/* Your Rights */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:privacy.yourRights.title', { defaultValue: 'Your Privacy Rights' })}
          </h4>
          <p className="modal-text">
            {t('common:privacy.yourRights.text', { defaultValue: 'You have the following rights regarding your personal information:' })}
          </p>
          <ul className="modal-list">
            <li>{t('common:privacy.yourRights.items.access', { defaultValue: 'Access and review your personal information' })}</li>
            <li>{t('common:privacy.yourRights.items.correct', { defaultValue: 'Correct inaccurate or incomplete information' })}</li>
            <li>{t('common:privacy.yourRights.items.delete', { defaultValue: 'Request deletion of your personal information' })}</li>
            <li>{t('common:privacy.yourRights.items.restrict', { defaultValue: 'Restrict or object to certain processing of your information' })}</li>
            <li>{t('common:privacy.yourRights.items.portability', { defaultValue: 'Request data portability' })}</li>
            <li>{t('common:privacy.yourRights.items.withdraw', { defaultValue: 'Withdraw consent where applicable' })}</li>
          </ul>
        </div>

        {/* Cookies Policy */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:privacy.cookies.title', { defaultValue: 'Cookies and Tracking Technologies' })}
          </h4>
          <p className="modal-text">
            {t('common:privacy.cookies.text', { 
              defaultValue: 'We use cookies and similar tracking technologies to enhance your experience on our platform. You can control cookie settings through your browser preferences.'
            })}
          </p>
        </div>

        {/* Children's Privacy */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:privacy.childrens.title', { defaultValue: "Children's Privacy" })}
          </h4>
          <p className="modal-text">
            {t('common:privacy.childrens.text', { 
              defaultValue: 'Our platform is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.'
            })}
          </p>
        </div>

        {/* International Transfers */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:privacy.international.title', { defaultValue: 'International Data Transfers' })}
          </h4>
          <p className="modal-text">
            {t('common:privacy.international.text', { 
              defaultValue: 'Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.'
            })}
          </p>
        </div>

        {/* Changes to Privacy Policy */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:privacy.changes.title', { defaultValue: 'Changes to This Privacy Policy' })}
          </h4>
          <p className="modal-text">
            {t('common:privacy.changes.text', { 
              defaultValue: 'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date.'
            })}
          </p>
        </div>

        {/* Contact Information */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:privacy.contact.title', { defaultValue: 'Contact Us' })}
          </h4>
          <p className="modal-text">
            {t('common:privacy.contact.text', { 
              defaultValue: 'If you have any questions about this Privacy Policy or our privacy practices, please contact us:'
            })}
          </p>
          <div className="privacy-contact-info">
            <p><strong>{t('common:privacy.contact.email', { defaultValue: 'Email:' })}</strong> 
              <a href={`mailto:${supportEmail}`} className="privacy-contact-link">
                {supportEmail}
              </a>
            </p>
            <p><strong>{t('common:privacy.contact.address', { defaultValue: 'Address:' })}</strong> {" "}{companyAddress}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-section privacy-footer">
          <div className="privacy-footer-content">
            <p className="privacy-footer-text">
              {t('common:privacy.footer.text', { 
                defaultValue: `By using ${companyName}, you acknowledge that you have read and understood this Privacy Policy and agree to the collection and use of your information as described herein.`,
                companyName
              })}
            </p>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default PrivacyPolicyModal;
