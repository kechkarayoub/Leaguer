/**
 * SettingsPage Component
 * 
 * User settings and preferences page
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import useAuth from '../../hooks/useAuth';
import PhoneNumberField from '../../components/form/PhoneNumberField';
import ImageUpload from '../../components/form/ImageUpload';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'profile' | 'preferences' | 'security'>('profile');

  const sections = [
    {
      key: 'profile',
      label: t('settings:sections.profile'),
      description: t('settings:sections.profile_desc'),
    },
    {
      key: 'preferences',
      label: t('settings:sections.preferences'),
      description: t('settings:sections.preferences_desc'),
    },
    {
      key: 'security',
      label: t('settings:sections.security'),
      description: t('settings:sections.security_desc'),
    },
  ];

  return (
    <div className="settings-page">
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">{t('settings:title')}</h1>
          <p className="page-description">{t('settings:description')}</p>
        </div>

        <div className="settings-layout">
          {/* Settings Navigation */}
          <div className="settings-nav">
            <nav className="settings-nav__menu">
              {sections.map((section) => (
                <button
                  key={section.key}
                  className={`settings-nav__item ${activeSection === section.key ? 'settings-nav__item--active' : ''}`}
                  onClick={() => setActiveSection(section.key as any)}
                >
                  <div className="settings-nav__item-content">
                    <span className="settings-nav__item-label">{section.label}</span>
                    <span className="settings-nav__item-desc">{section.description}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="settings-content">
            {activeSection === 'profile' && (
              <div className="settings-section">
                <div className="settings-section__header">
                  <h2 className="settings-section__title">{t('settings:profile.title')}</h2>
                  <p className="settings-section__description">{t('settings:profile.description')}</p>
                </div>

                <div className="settings-form">
                  {/* Profile Picture */}
                  <div className="form-group">
                    <label className="form-label">{t('settings:profile.picture')}</label>
                    <ImageUpload
                      value={user?.user_image_url || user?.profileImage}
                      onChange={(file) => console.log('Image changed:', file)}
                      label={t('settings:profile.picture')}
                    />
                  </div>

                  {/* Name Fields */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">{t('settings:profile.first_name')}</label>
                      <input
                        type="text"
                        className="form-input"
                        defaultValue={user?.first_name || user?.firstName || ''}
                        placeholder={t('settings:profile.first_name_placeholder')}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('settings:profile.last_name')}</label>
                      <input
                        type="text"
                        className="form-input"
                        defaultValue={user?.last_name || user?.lastName || ''}
                        placeholder={t('settings:profile.last_name_placeholder')}
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="form-group">
                    <PhoneNumberField
                      label={t('settings:profile.phone')}
                      value={user?.user_phone_number || ''}
                      onChange={(phone) => console.log('Phone changed:', phone)}
                    />
                  </div>

                  {/* Email */}
                  <div className="form-group">
                    <label className="form-label">{t('settings:profile.email')}</label>
                    <input
                      type="email"
                      className="form-input"
                      defaultValue={user?.email || ''}
                      placeholder={t('settings:profile.email_placeholder')}
                    />
                  </div>

                  <div className="form-actions">
                    <button className="btn btn--primary">{t('settings:profile.save')}</button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'preferences' && (
              <div className="settings-section">
                <div className="settings-section__header">
                  <h2 className="settings-section__title">{t('settings:preferences.title')}</h2>
                  <p className="settings-section__description">{t('settings:preferences.description')}</p>
                </div>

                <div className="settings-form">
                  {/* Language */}
                  <div className="form-group">
                    <label className="form-label">{t('settings:preferences.language')}</label>
                    <select className="form-select">
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>

                  
                    <div className="form-group">
                      <label htmlFor="user_timezone" className="form-label">
                        {t('settings:preferences.timezone')}
                      </label>
                      <select
                        id="user_timezone"
                        // className={`form-input form-select ${errorsProfile.user_timezone ? 'form-input--error' : ''}`}
                        // {...registerProfile('user_timezone')}
                      >
                        <option value="">{t('profile:placeholders.select_timezone')}</option>
                        <option value="Africa/Algiers">Africa/Algiers (UTC+1)</option>
                        <option value="Africa/Casablanca">Africa/Casablanca (UTC+1)</option>
                        <option value="Africa/Tunis">Africa/Tunis (UTC+1)</option>
                        <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                        <option value="Europe/London">Europe/London (UTC+0)</option>
                        <option value="Europe/Berlin">Europe/Berlin (UTC+1)</option>
                        <option value="Europe/Madrid">Europe/Madrid (UTC+1)</option>
                        <option value="Europe/Rome">Europe/Rome (UTC+1)</option>
                        <option value="America/New_York">America/New_York (UTC-5)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
                        <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                      </select>
                      {/* {errorsProfile.user_timezone && (
                        <span className="form-error">{errorsProfile.user_timezone.message}</span>
                      )} */}
                    </div>

                  {/* Theme */}
                  <div className="form-group">
                    <label className="form-label">{t('settings:preferences.theme')}</label>
                    <div className="radio-group">
                      <label className="radio-option">
                        <input type="radio" name="theme" value="light" defaultChecked />
                        <span className="radio-option__label">{t('settings:preferences.theme_light')}</span>
                      </label>
                      <label className="radio-option">
                        <input type="radio" name="theme" value="dark" />
                        <span className="radio-option__label">{t('settings:preferences.theme_dark')}</span>
                      </label>
                      <label className="radio-option">
                        <input type="radio" name="theme" value="auto" />
                        <span className="radio-option__label">{t('settings:preferences.theme_auto')}</span>
                      </label>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="form-group">
                    <label className="form-label">{t('settings:preferences.notifications')}</label>
                    <div className="toggle-group">
                      <label className="toggle-option">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-option__label">{t('settings:preferences.email_notifications')}</span>
                      </label>
                      <label className="toggle-option">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-option__label">{t('settings:preferences.push_notifications')}</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button className="btn btn--primary">{t('settings:preferences.save')}</button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="settings-section">
                <div className="settings-section__header">
                  <h2 className="settings-section__title">{t('settings:security.title')}</h2>
                  <p className="settings-section__description">{t('settings:security.description')}</p>
                </div>

                <div className="settings-form">
                  {/* Change Password */}
                  <div className="form-group">
                    <label className="form-label">{t('settings:security.current_password')}</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder={t('settings:security.current_password_placeholder')}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('settings:security.new_password')}</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder={t('settings:security.new_password_placeholder')}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('settings:security.confirm_password')}</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder={t('settings:security.confirm_password_placeholder')}
                    />
                  </div>

                  <div className="form-actions">
                    <button className="btn btn--primary">{t('settings:security.change_password')}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
