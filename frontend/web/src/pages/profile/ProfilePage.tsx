/**
 * ProfilePage Component
 * 
 * User profile management page
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';

import useAuth, { User } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/LoadingSpinner';

// Validation schemas
interface ProfileFormData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

const profileSchema: yup.ObjectSchema<ProfileFormData> = yup.object({
  firstName: yup.string().optional(),
  lastName: yup.string().optional(), 
  email: yup.string().email('Invalid email format').optional(),
}) as yup.ObjectSchema<ProfileFormData>;

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your new password'),
});

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateProfile, changePassword, isUpdatingProfile, isChangingPassword } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
  });

  // Password form
  const passwordForm = useForm<{
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data as Partial<User>);
      // Reset form with updated data would happen automatically via React Query
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const onPasswordSubmit = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      passwordForm.reset();
    } catch (error) {
      console.error('Password change error:', error);
    }
  };

  const tabs = [
    {
      key: 'profile' as const,
      label: t('profile:tabs.profile'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      key: 'security' as const,
      label: t('profile:tabs.security'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="profile-page">
      <div className="profile-page__container">
        <div className="profile-page__header">
          <h1 className="profile-page__title">
            {t('profile:title')}
          </h1>
          <p className="profile-page__subtitle">
            {t('profile:subtitle')}
          </p>
        </div>

        <div className="profile-page__content">
          {/* Tabs */}
          <div className="profile-tabs">
            <div className="profile-tabs__list">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`profile-tabs__tab ${
                    activeTab === tab.key ? 'profile-tabs__tab--active' : ''
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span className="profile-tabs__tab-icon">
                    {tab.icon}
                  </span>
                  <span className="profile-tabs__tab-text">
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="profile-tabs__content">
            {activeTab === 'profile' && (
              <div className="profile-section">
                <div className="profile-section__header">
                  <h2 className="profile-section__title">
                    {t('profile:profile.title')}
                  </h2>
                  <p className="profile-section__description">
                    {t('profile:profile.description')}
                  </p>
                </div>

                <form className="profile-form" onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                  {/* Profile picture */}
                  <div className="profile-picture">
                    <div className="profile-picture__current">
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.firstName || user.email}
                          className="profile-picture__image"
                        />
                      ) : (
                        <div className="profile-picture__placeholder">
                          {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="profile-picture__actions">
                      <button type="button" className="profile-picture__button">
                        {t('profile:profile.change_photo')}
                      </button>
                      <p className="profile-picture__hint">
                        {t('profile:profile.photo_hint')}
                      </p>
                    </div>
                  </div>

                  {/* Name fields */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="firstName">
                        {t('profile:profile.first_name')}
                      </label>
                      <input
                        {...profileForm.register('firstName')}
                        type="text"
                        id="firstName"
                        className={`form-input ${
                          profileForm.formState.errors.firstName ? 'form-input--error' : ''
                        }`}
                        placeholder={t('profile:profile.first_name_placeholder')}
                      />
                      {profileForm.formState.errors.firstName && (
                        <span className="form-error">
                          {profileForm.formState.errors.firstName.message}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="lastName">
                        {t('profile:profile.last_name')}
                      </label>
                      <input
                        {...profileForm.register('lastName')}
                        type="text"
                        id="lastName"
                        className={`form-input ${
                          profileForm.formState.errors.lastName ? 'form-input--error' : ''
                        }`}
                        placeholder={t('profile:profile.last_name_placeholder')}
                      />
                      {profileForm.formState.errors.lastName && (
                        <span className="form-error">
                          {profileForm.formState.errors.lastName.message}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Email field */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">
                      {t('profile:profile.email')}
                    </label>
                    <input
                      {...profileForm.register('email')}
                      type="email"
                      id="email"
                      className={`form-input ${
                        profileForm.formState.errors.email ? 'form-input--error' : ''
                      }`}
                      placeholder={t('profile:profile.email_placeholder')}
                    />
                    {profileForm.formState.errors.email && (
                      <span className="form-error">
                        {profileForm.formState.errors.email.message}
                      </span>
                    )}
                  </div>

                  {/* Submit button */}
                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="form-button form-button--primary"
                    >
                      {isUpdatingProfile ? (
                        <LoadingSpinner size="small" text={t('profile:profile.updating')} />
                      ) : (
                        t('profile:profile.save_changes')
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="profile-section">
                <div className="profile-section__header">
                  <h2 className="profile-section__title">
                    {t('profile:security.title')}
                  </h2>
                  <p className="profile-section__description">
                    {t('profile:security.description')}
                  </p>
                </div>

                <form className="profile-form" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                  {/* Current password */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="currentPassword">
                      {t('profile:security.current_password')}
                    </label>
                    <div className="form-input-group">
                      <input
                        {...passwordForm.register('currentPassword')}
                        type={showCurrentPassword ? 'text' : 'password'}
                        id="currentPassword"
                        className={`form-input ${
                          passwordForm.formState.errors.currentPassword ? 'form-input--error' : ''
                        }`}
                        placeholder={t('profile:security.current_password_placeholder')}
                      />
                      <button
                        type="button"
                        className="form-input-button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <span className="form-error">
                        {passwordForm.formState.errors.currentPassword.message}
                      </span>
                    )}
                  </div>

                  {/* New password */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="newPassword">
                      {t('profile:security.new_password')}
                    </label>
                    <div className="form-input-group">
                      <input
                        {...passwordForm.register('newPassword')}
                        type={showNewPassword ? 'text' : 'password'}
                        id="newPassword"
                        className={`form-input ${
                          passwordForm.formState.errors.newPassword ? 'form-input--error' : ''
                        }`}
                        placeholder={t('profile:security.new_password_placeholder')}
                      />
                      <button
                        type="button"
                        className="form-input-button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <span className="form-error">
                        {passwordForm.formState.errors.newPassword.message}
                      </span>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="confirmPassword">
                      {t('profile:security.confirm_password')}
                    </label>
                    <div className="form-input-group">
                      <input
                        {...passwordForm.register('confirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        className={`form-input ${
                          passwordForm.formState.errors.confirmPassword ? 'form-input--error' : ''
                        }`}
                        placeholder={t('profile:security.confirm_password_placeholder')}
                      />
                      <button
                        type="button"
                        className="form-input-button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <span className="form-error">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </span>
                    )}
                  </div>

                  {/* Submit button */}
                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="form-button form-button--primary"
                    >
                      {isChangingPassword ? (
                        <LoadingSpinner size="small" text={t('profile:security.changing')} />
                      ) : (
                        t('profile:security.change_password')
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
