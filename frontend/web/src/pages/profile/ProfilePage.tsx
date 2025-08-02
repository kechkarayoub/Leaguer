/**
 * ProfilePage Component
 * 
 * User profile page with form to update personal information and password
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';

import useAuth from '../../hooks/useAuth';
import PhoneNumberField from '../../components/form/PhoneNumberField';
import ImageUpload from '../../components/form/ImageUpload';
import './ProfilePage.css';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  user_phone_number: string;
  user_address: string;
  user_birthday: string;
  user_cin: string;
  user_country: string;
  user_gender: string;
  user_timezone: string;
  current_language: string;
  username: string;
  email: string;
  user_image_url?: File | null;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    setValue: setValueProfile,
    watch: watchProfile,
    formState: { errors: errorsProfile }
  } = useForm<ProfileFormData>();

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    watch: watchPassword,
    reset: resetPassword,
    formState: { errors: errorsPassword }
  } = useForm<PasswordFormData>();

  const watchNewPassword = watchPassword('new_password');

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setValueProfile('first_name', user.first_name || '');
      setValueProfile('last_name', user.last_name || '');
      setValueProfile('user_phone_number', user.user_phone_number || '');
      setValueProfile('user_address', user.user_address || '');
      setValueProfile('user_birthday', user.user_birthday || '');
      setValueProfile('user_cin', user.user_cin || '');
      setValueProfile('user_country', user.user_country || '');
      setValueProfile('user_gender', user.user_gender || '');
      setValueProfile('user_timezone', user.user_timezone || '');
      setValueProfile('current_language', user.current_language || 'en');
      setValueProfile('username', user.username || '');
      setValueProfile('email', user.email || '');
    }
  }, [user, setValueProfile]);

  const onSubmitProfile = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      // Create the update data object that matches the backend API
      const updateData = {
        first_name: data.first_name,
        last_name: data.last_name,
        user_phone_number: data.user_phone_number,
        user_address: data.user_address,
        user_birthday: data.user_birthday,
        user_cin: data.user_cin,
        user_country: data.user_country,
        user_gender: data.user_gender,
        user_timezone: data.user_timezone,
        current_language: data.current_language,
        // Only include username and email if they are not validated/locked
        ...((!user?.is_user_phone_number_validated) && { username: data.username }),
        ...((!user?.is_user_phone_number_validated) && { email: data.email }),
      };

      // For now, we'll handle the image separately as the updateProfile expects Partial<User>
      // TODO: Update the useAuth hook to handle FormData for image uploads
      await updateProfile(updateData);
      
      // Show success message
      alert(t('profile:messages.profile_updated'));
    } catch (error) {
      console.error('Profile update error:', error);
      alert(t('profile:messages.profile_update_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/accounts/update-profile/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          current_password: data.current_password,
          new_password: data.new_password,
        }),
      });

      if (response.ok) {
        resetPassword();
        alert(t('profile:messages.password_updated'));
      } else {
        const errorData = await response.json();
        alert(errorData.message || t('profile:messages.password_update_error'));
      }
    } catch (error) {
      console.error('Password update error:', error);
      alert(t('profile:messages.password_update_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (file: File | null) => {
    setSelectedImage(file);
  };

  const handlePhoneChange = (phone: string) => {
    setValueProfile('user_phone_number', phone);
  };

  return (
    <div className="profile-page">
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">{t('profile:title')}</h1>
          <p className="page-description">{t('profile:description')}</p>
        </div>

        {/* Profile Card */}
        <div className="profile-card">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'profile' ? 'tab-button--active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {t('profile:tabs.personal_info')}
            </button>
            <button
              className={`tab-button ${activeTab === 'password' ? 'tab-button--active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t('profile:tabs.password')}
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'profile' && (
              <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="profile-form">
                <div className="form-section">
                  <h3 className="form-section__title">{t('profile:sections.profile_picture')}</h3>
                  <ImageUpload
                    value={selectedImage || user?.user_image_url}
                    onChange={handleImageChange}
                    label={t('profile:fields.profile_picture')}
                  />
                </div>

                <div className="form-section">
                  <h3 className="form-section__title">{t('profile:sections.personal_information')}</h3>
                  
                  {/* Username and Email (disabled if validated) */}
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="username" className="form-label">
                        {t('profile:fields.username')}
                      </label>
                      <input
                        id="username"
                        type="text"
                        className={`form-input ${errorsProfile.username ? 'form-input--error' : ''}`}
                        disabled={true} // Always disabled as per requirements
                        {...registerProfile('username')}
                      />
                      {errorsProfile.username && (
                        <span className="form-error">{errorsProfile.username.message}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email" className="form-label">
                        {t('profile:fields.email')}
                      </label>
                      <input
                        id="email"
                        type="email"
                        className={`form-input ${errorsProfile.email ? 'form-input--error' : ''}`}
                        disabled={true} // Always disabled as per requirements
                        {...registerProfile('email')}
                      />
                      {errorsProfile.email && (
                        <span className="form-error">{errorsProfile.email.message}</span>
                      )}
                    </div>
                  </div>

                  {/* First Name and Last Name */}
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="first_name" className="form-label">
                        {t('profile:fields.first_name')}
                      </label>
                      <input
                        id="first_name"
                        type="text"
                        className={`form-input ${errorsProfile.first_name ? 'form-input--error' : ''}`}
                        {...registerProfile('first_name', {
                          required: t('profile:validation.first_name_required'),
                          minLength: {
                            value: 2,
                            message: t('profile:validation.first_name_min_length')
                          }
                        })}
                      />
                      {errorsProfile.first_name && (
                        <span className="form-error">{errorsProfile.first_name.message}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="last_name" className="form-label">
                        {t('profile:fields.last_name')}
                      </label>
                      <input
                        id="last_name"
                        type="text"
                        className={`form-input ${errorsProfile.last_name ? 'form-input--error' : ''}`}
                        {...registerProfile('last_name', {
                          required: t('profile:validation.last_name_required'),
                          minLength: {
                            value: 2,
                            message: t('profile:validation.last_name_min_length')
                          }
                        })}
                      />
                      {errorsProfile.last_name && (
                        <span className="form-error">{errorsProfile.last_name.message}</span>
                      )}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="form-group">
                    <PhoneNumberField
                      label={t('profile:fields.phone_number')}
                      value={watchProfile('user_phone_number') || ''}
                      onChange={handlePhoneChange}
                      error={errorsProfile.user_phone_number?.message}
                      disabled={user?.is_user_phone_number_validated} // Disabled if validated
                    />
                    {user?.is_user_phone_number_validated && (
                      <small className="form-help-text">{t('profile:help.phone_validated')}</small>
                    )}
                  </div>

                  {/* Address */}
                  <div className="form-group">
                    <label htmlFor="user_address" className="form-label">
                      {t('profile:fields.address')}
                    </label>
                    <textarea
                      id="user_address"
                      className={`form-input form-textarea ${errorsProfile.user_address ? 'form-input--error' : ''}`}
                      rows={3}
                      {...registerProfile('user_address')}
                      placeholder={t('profile:placeholders.address')}
                    />
                    {errorsProfile.user_address && (
                      <span className="form-error">{errorsProfile.user_address.message}</span>
                    )}
                  </div>

                  {/* Birthday and CIN */}
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="user_birthday" className="form-label">
                        {t('profile:fields.birthday')}
                      </label>
                      <input
                        id="user_birthday"
                        type="date"
                        className={`form-input ${errorsProfile.user_birthday ? 'form-input--error' : ''}`}
                        {...registerProfile('user_birthday')}
                      />
                      {errorsProfile.user_birthday && (
                        <span className="form-error">{errorsProfile.user_birthday.message}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="user_cin" className="form-label">
                        {t('profile:fields.cin')}
                      </label>
                      <input
                        id="user_cin"
                        type="text"
                        className={`form-input ${errorsProfile.user_cin ? 'form-input--error' : ''}`}
                        {...registerProfile('user_cin')}
                        placeholder={t('profile:placeholders.cin')}
                      />
                      {errorsProfile.user_cin && (
                        <span className="form-error">{errorsProfile.user_cin.message}</span>
                      )}
                    </div>
                  </div>

                  {/* Country and Gender */}
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="user_country" className="form-label">
                        {t('profile:fields.country')}
                      </label>
                      <select
                        id="user_country"
                        className={`form-input form-select ${errorsProfile.user_country ? 'form-input--error' : ''}`}
                        {...registerProfile('user_country')}
                      >
                        <option value="">{t('profile:placeholders.select_country')}</option>
                        <option value="DZ">Algeria</option>
                        <option value="MA">Morocco</option>
                        <option value="TN">Tunisia</option>
                        <option value="FR">France</option>
                        <option value="GB">United Kingdom</option>
                        <option value="DE">Germany</option>
                        <option value="ES">Spain</option>
                        <option value="IT">Italy</option>
                        <option value="US">United States</option>
                        {/* Add more countries as needed */}
                      </select>
                      {errorsProfile.user_country && (
                        <span className="form-error">{errorsProfile.user_country.message}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="user_gender" className="form-label">
                        {t('profile:fields.gender')}
                      </label>
                      <select
                        id="user_gender"
                        className={`form-input form-select ${errorsProfile.user_gender ? 'form-input--error' : ''}`}
                        {...registerProfile('user_gender')}
                      >
                        <option value="">{t('profile:placeholders.select_gender')}</option>
                        <option value="M">{t('profile:gender.male')}</option>
                        <option value="F">{t('profile:gender.female')}</option>
                        <option value="O">{t('profile:gender.other')}</option>
                        <option value="P">{t('profile:gender.prefer_not_to_say')}</option>
                      </select>
                      {errorsProfile.user_gender && (
                        <span className="form-error">{errorsProfile.user_gender.message}</span>
                      )}
                    </div>
                  </div>

                  {/* Timezone and Language */}
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="user_timezone" className="form-label">
                        {t('profile:fields.timezone')}
                      </label>
                      <select
                        id="user_timezone"
                        className={`form-input form-select ${errorsProfile.user_timezone ? 'form-input--error' : ''}`}
                        {...registerProfile('user_timezone')}
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
                      {errorsProfile.user_timezone && (
                        <span className="form-error">{errorsProfile.user_timezone.message}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="current_language" className="form-label">
                        {t('profile:fields.language')}
                      </label>
                      <select
                        id="current_language"
                        className={`form-input form-select ${errorsProfile.current_language ? 'form-input--error' : ''}`}
                        {...registerProfile('current_language')}
                      >
                        <option value="en">{t('profile:languages.english')}</option>
                        <option value="fr">{t('profile:languages.french')}</option>
                        <option value="ar">{t('profile:languages.arabic')}</option>
                      </select>
                      {errorsProfile.current_language && (
                        <span className="form-error">{errorsProfile.current_language.message}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={isLoading}
                  >
                    {isLoading ? t('common:loading') : t('profile:actions.save_changes')}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="password-form">
                <div className="form-section">
                  <h3 className="form-section__title">{t('profile:sections.change_password')}</h3>
                  
                  <div className="form-group">
                    <label htmlFor="current_password" className="form-label">
                      {t('profile:fields.current_password')}
                    </label>
                    <input
                      id="current_password"
                      type="password"
                      className={`form-input ${errorsPassword.current_password ? 'form-input--error' : ''}`}
                      {...registerPassword('current_password', {
                        required: t('profile:validation.current_password_required')
                      })}
                    />
                    {errorsPassword.current_password && (
                      <span className="form-error">{errorsPassword.current_password.message}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="new_password" className="form-label">
                      {t('profile:fields.new_password')}
                    </label>
                    <input
                      id="new_password"
                      type="password"
                      className={`form-input ${errorsPassword.new_password ? 'form-input--error' : ''}`}
                      {...registerPassword('new_password', {
                        required: t('profile:validation.new_password_required'),
                        minLength: {
                          value: 8,
                          message: t('profile:validation.password_min_length')
                        }
                      })}
                    />
                    {errorsPassword.new_password && (
                      <span className="form-error">{errorsPassword.new_password.message}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirm_password" className="form-label">
                      {t('profile:fields.confirm_password')}
                    </label>
                    <input
                      id="confirm_password"
                      type="password"
                      className={`form-input ${errorsPassword.confirm_password ? 'form-input--error' : ''}`}
                      {...registerPassword('confirm_password', {
                        required: t('profile:validation.confirm_password_required'),
                        validate: (value) =>
                          value === watchNewPassword || t('profile:validation.passwords_do_not_match')
                      })}
                    />
                    {errorsPassword.confirm_password && (
                      <span className="form-error">{errorsPassword.confirm_password.message}</span>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={isLoading}
                  >
                    {isLoading ? t('common:loading') : t('profile:actions.update_password')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
