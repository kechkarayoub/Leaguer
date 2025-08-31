/**
 * SettingsPage Component
 * 
 * User settings and preferences page with dirty state management
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';

import useAuth from '../../hooks/useAuth';
import CustomSelect from '../../components/form/CustomSelect';
import { getAllTimezones, getLanguageOptions, getThemeOptions } from '../../utils/TimezoneUtils';
import { useTheme } from '../../contexts/ThemeContext';
import AuthenticatedApiService from '../../services/AuthenticatedApiService';
import './SettingsPage.css';

interface SettingsFormData {
  current_language: string;
  user_timezone: string;
  user_theme: string;
}

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<'preferences'>('preferences');
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<SettingsFormData | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, dirtyFields }
  } = useForm<SettingsFormData>();

  // Get form options
  const languageOptions = getLanguageOptions();
  const timezoneOptions = getAllTimezones();
  const themeOptions = getThemeOptions();

  // Watch all form fields
  const watchedData = watch();

  // Track if initial data has been set to prevent loops
  const initialDataSet = useRef(false);

  // Memoize the initial data to prevent infinite loops
  const initialFormData = useMemo(() => {
    if (!user) return null;
    return {
      current_language: user.current_language || 'en', // Remove i18n.language dependency
      user_timezone: user.user_timezone || 'UTC',
      user_theme: user.user_theme || 'default',
    };
  }, [user]);

  // Set initial form data when user data loads (only once)
  useEffect(() => {
    if (initialFormData && !initialDataSet.current) {
      setInitialData(initialFormData);
      reset(initialFormData);
      setIsDirty(false);
      initialDataSet.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFormData]); // Reset is stable from react-hook-form

  // Track dirty state
  useEffect(() => {
    if (initialData && watchedData) {
      const hasChanges = Object.keys(dirtyFields).length > 0 || 
        watchedData?.current_language !== initialData.current_language ||
        watchedData?.user_timezone !== initialData.user_timezone ||
        watchedData?.user_theme !== initialData.user_theme;
      
      setIsDirty(hasChanges);
    }
  }, [watchedData, dirtyFields, initialData]);

  const sections = [
    {
      key: 'preferences',
      label: t('settings:preferences.title'),
      description: t('settings:preferences.description'),
    },
  ];

  const onSubmit = async (data: SettingsFormData) => {
    if (!isDirty) return;

    setIsLoading(true);
    try {
      const apiService = AuthenticatedApiService.getInstance();
      
      const response = await apiService.put('/accounts/update-settings/', {
        ...data,
        selected_language: i18n.language,
      });

      if (response.data.success && response.data.user) {
        // Update the user context using React Query
        queryClient.setQueryData(['user', 'profile'], response.data.user);
        
        // Update i18n language if it changed
        if (data.current_language !== i18n.language) {
          i18n.changeLanguage(data.current_language);
        }
        
        // Update theme if it changed
        if (data.user_theme !== initialData?.user_theme) {
          setTheme(data.user_theme as 'light' | 'dark' | 'default');
        }
        
        // Update initial data to new values
        setInitialData(data);
        setIsDirty(false);
        
        toast.success(t('settings:preferences.updateSuccess', 'Settings updated successfully'));
      }
    } catch (error: any) {
      console.error('Settings update error:', error);
      const errorMessage = error.response?.data?.message || t('settings:preferences.updateError', 'Failed to update settings');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (initialData) {
      reset(initialData);
      setIsDirty(false);
      // Revert theme to original value
      if (initialData.user_theme) {
        setTheme(initialData.user_theme as 'light' | 'dark' | 'default');
      }
    }
  };

  const handleLanguageChange = (value: string | null) => {
    setValue('current_language', value || 'en', { shouldDirty: true });
  };

  const handleTimezoneChange = (value: string | null) => {
    setValue('user_timezone', value || 'UTC', { shouldDirty: true });
  };

  return (
    <div className="settings-page">
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">{t('settings:title')}</h1>
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
            {activeSection === 'preferences' && (
              <div className="settings-section">
                <div className="settings-section__header">
                  <h2 className="settings-section__title">{t('settings:preferences.title')}</h2>
                  <p className="settings-section__description">{t('settings:preferences.description')}</p>
                </div>

                <form className="settings-form" onSubmit={handleSubmit(onSubmit)}>
                  {/* Language */}
                  <div className="form-group">
                    <CustomSelect
                      label={t('settings:preferences.language')}
                      value={watchedData?.current_language || ''}
                      onChange={handleLanguageChange}
                      options={languageOptions}
                      placeholder={t('settings:preferences.selectLanguage', 'Select language')}
                      error={errors.current_language?.message}
                      required
                      isSearchable={false}
                      isClearable={false}
                    />
                  </div>

                  {/* Timezone */}
                  <div className="form-group">
                    <CustomSelect
                      label={t('settings:preferences.timezone')}
                      value={watchedData?.user_timezone || ''}
                      onChange={handleTimezoneChange}
                      options={timezoneOptions}
                      placeholder={t('settings:preferences.selectTimezone', 'Select timezone')}
                      error={errors.user_timezone?.message}
                      required
                      isSearchable={true}
                      isClearable={false}
                    />
                  </div>

                  {/* Theme */}
                  <div className="form-group">
                    <label className="form-label">{t('settings:preferences.theme')}</label>
                    <div className="radio-group">
                      {themeOptions.map((theme) => (
                        <label key={theme.value} className="radio-option">
                          <input
                            type="radio"
                            {...register('user_theme')}
                            value={theme.value}
                            checked={watchedData?.user_theme === theme.value}
                            onChange={(e) => {
                              setValue('user_theme', e.target.value, { shouldDirty: true });
                              // Immediately preview the theme change
                              setTheme(e.target.value as 'light' | 'dark' | 'default');
                            }}
                          />
                          <span className="radio-option__label">
                            {t(`settings:preferences.theme_${theme.value}`, theme.label)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit"
                      className="btn btn--primary"
                      disabled={isLoading || !isDirty}
                    >
                      {isLoading ? t('common:app.updating', 'Updating...') : t('settings:preferences.save')}
                    </button>
                    
                    {isDirty && (
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={handleCancel}
                        disabled={isLoading}
                      >
                        {t('common:app.cancel', 'Cancel')}
                      </button>
                    )}
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

export default SettingsPage;
