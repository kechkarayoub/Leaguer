/**
 * ProfilePage Component
 * 
 * User profile page with form to update personal information and password
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useRef } from 'react';
import { toast } from 'react-toastify';
import { EXCLUDED_COUNTRIES } from '../../utils/GlobalUtils';

import useAuth from '../../hooks/useAuth';
import { useProfileWebSocket } from '../../hooks/useWebSocket';
import PhoneNumberField from '../../components/form/PhoneNumberField';
import CustomDatePicker from '../../components/form/CustomDatePicker';
import CustomSelect, { CustomSelectOption } from '../../components/form/CustomSelect';
import ShowPasswordButton from '../../components/form/ShowPasswordButton'



import { defaultCountries } from 'react-international-phone';
import ImageUpload from '../../components/form/ImageUpload';
import './ProfilePage.css';
import moment from 'moment';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  user_phone_number: string;
  user_address: string;
  user_birthday: string | Date | null;
  user_cin: string;
  user_country: string;
  user_gender: string;
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
  const { t, i18n } = useTranslation();
  const { user, updateProfile, changePassword } = useAuth();
  const { isConnected } = useProfileWebSocket();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [imageUpdated, setImageUpdated] = useState(false);
  const initialUserData = useRef<ProfileFormData | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null | String>(null);
  const countries = defaultCountries.filter(country => {
    return EXCLUDED_COUNTRIES.indexOf(country[1].toLowerCase()) === -1;
  });
  const userPhoneNumber = user?.user_phone_number || '';
  const countryOptions: CustomSelectOption[] = countries.map(country => ({
    value: country[1],
    label: t(`countries:countries.${country[1].toLocaleUpperCase()}`),
  }));
  const genderOptions: CustomSelectOption[] = [
    { value: 'male', label: t('profile:gender.male') },
    { value: 'female', label: t('profile:gender.female') },
  ];

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    setValue: setValueProfile,
    watch: watchProfile,
    reset: resetProfile,
    formState: { errors: errorsProfile, dirtyFields }
  } = useForm<ProfileFormData>();

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    watch: watchPassword,
    reset: resetPassword,
    formState: { errors: errorsPassword, dirtyFields: dirtyFieldsPassword }
  } = useForm<PasswordFormData>();

  const [isPasswordDirty, setIsPasswordDirty] = useState(false);
  const initialPasswordData = useRef<PasswordFormData | null>(null);
  const watchNewPassword = watchPassword('new_password');

  useEffect(() => {
    setIsPasswordDirty(Object.keys(dirtyFieldsPassword).length > 0);
  }, [dirtyFieldsPassword]);

  useEffect(() => {
    // Store initial password form data
    initialPasswordData.current = {
      current_password: '',
      new_password: '',
      confirm_password: '',
    };
    resetPassword(initialPasswordData.current);
    setIsPasswordDirty(false);
  }, [user, resetPassword]);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      const data: ProfileFormData = {
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        user_phone_number: user.user_phone_number || '',
        user_address: user.user_address || '',
        user_birthday: user.user_birthday || '',
        user_cin: user.user_cin || '',
        user_country: user.user_country || '',
        user_gender: user.user_gender || '',
        username: user.username || '',
        email: user.email || '',
        user_image_url: user.user_image_url || null,
      };
      initialUserData.current = data;
      resetProfile(data);
      setIsDirty(false);
    }
  }, [user, resetProfile]);
  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields]);

  const onSubmitProfile = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      
      // Add all the profile data to FormData
      formData.append('action',"update_profile");
      formData.append('current_language', i18n.language);
      formData.append('first_name', (data.first_name || '').trim());
      formData.append('last_name', (data.last_name || '').trim());
      formData.append('user_phone_number', (data.user_phone_number || '').trim());
      formData.append('user_address', (data.user_address || '').trim());
      formData.append('user_birthday', data.user_birthday ? moment(data.user_birthday).format('YYYY-MM-DD') : '');
      formData.append('user_cin', (data.user_cin || '').trim());
      formData.append('user_country', (data.user_country || '').trim());
      formData.append('user_gender', (data.user_gender || '').trim());
      formData.append('username', (data.username || '').trim());
      formData.append('email', (data.email || '').trim());

      // Handle image upload if there's a selected image
      formData.append('image_updated', imageUpdated ? 'true' : 'false');
      if (selectedImage && typeof selectedImage === 'object' && selectedImage instanceof File) {
        formData.append('profile_image', selectedImage);
      }

      // Make the API call with FormData
      const response = await updateProfile(formData);

      if (response.success) {
        
        // Show success message
        toast.success(t('profile:messages.profile_updated'));
        
        // Reset form dirty state
        setIsDirty(false);
      } else {
        toast.error(response.message || t('profile:messages.profile_update_error'));
      }
    } catch (error:any) {
      if(error?.response?.data?.errors){
        let userBirthdayError = error.response.data.errors.user_birthday;
        if(userBirthdayError){
          toast.error(userBirthdayError[0], {
            autoClose: 8000 // 8 seconds
          });
        }
      }
      console.error('Profile update error:', error);
      toast.error(t('profile:messages.profile_update_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      
      // Add all the profile data to FormData
      formData.append('action',"update_password");
      formData.append('current_language', i18n.language);
      formData.append('current_password', data.current_password);
      formData.append('new_password', data.new_password);

      // Make the API call with FormData
      const response = await changePassword(formData);

      if (response.success) {
        if(response.wrong_password){
          toast.warning(response.message || t('profile:messages.current_password_incorrect'));
        }
        else{
          resetPassword();
          
          // Reset form password dirty state
          setIsPasswordDirty(false);
          toast.success(t('profile:messages.password_updated'));
        }
      } else {
        toast.error(response.message || t('profile:messages.password_update_error'));
      }
    } catch (error) {
      console.error('Password update error:', error);
      toast.error(t('profile:messages.password_update_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (file: File | null | String) => {
    setImageUpdated(true);
    setSelectedImage(file);
    setIsDirty(true);
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
                    value={selectedImage === "" ? selectedImage : selectedImage || user?.user_image_url}
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
                        <span className="required-asterisk">*</span>
                      </label>
                      <input
                        id="username"
                        type="text"
                        className={`form-input ${errorsProfile.username ? 'form-input--error' : ''}`}
                        disabled={true} // Always disabled as per requirements
                        {...registerProfile('username', {
                          required: t('profile:validation.username_required')
                        })}
                      />
                      {errorsProfile.username && (
                        <span className="form-error">{errorsProfile.username.message}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email" className="form-label">
                        {t('profile:fields.email')}
                        <span className="required-asterisk">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        className={`form-input ${errorsProfile.email ? 'form-input--error' : ''}`}
                        disabled={true} // Always disabled as per requirements
                        {...registerProfile('email', {
                          required: t('profile:validation.email_required'),
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: t('profile:validation.email_invalid')
                          }
                        })}
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
                        <span className="required-asterisk">*</span>
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
                          },
                          pattern: {
                            value: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/,
                            message: t('profile:validation.first_name_alpha_only')
                          }
                        })}
                        onChange={e => {
                          setIsDirty(true);
                          registerProfile('first_name').onChange(e);
                        }}
                      />
                      {errorsProfile.first_name && (
                        <span className="form-error">{errorsProfile.first_name.message}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="last_name" className="form-label">
                        {t('profile:fields.last_name')}
                        <span className="required-asterisk">*</span>
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
                          },
                          pattern: {
                            value: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/,
                            message: t('profile:validation.last_name_alpha_only')
                          }
                        })}
                        onChange={e => {
                          setIsDirty(true);
                          registerProfile('last_name').onChange(e);
                        }}
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
                      onChange={phone => {
                        setIsDirty(true);
                        setValueProfile('user_phone_number', phone || '');
                      }}
                      error={errorsProfile.user_phone_number?.message}
                      disabled={userPhoneNumber && user?.is_user_phone_number_validated} // Disabled if validated
                      useGeolocation={true}
                    />
                    {userPhoneNumber && user?.is_user_phone_number_validated && (
                      <small className="form-help-text">{t('profile:help.phone_validated')}</small>
                    )}
                    <input
                      type="hidden"
                      {...registerProfile('user_phone_number', {
                        required: t('profile:validation.phone_required'),
                        minLength: {
                          value: 9,
                          message: t('profile:validation.phone_min_length')
                        }
                      })}
                    />
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
                      {...registerProfile('user_address', {
                          required: t('profile:validation.address_required'),
                        })}
                      placeholder={t('profile:placeholders.address')}
                      onChange={e => {
                        setIsDirty(true);
                        registerProfile('user_address').onChange(e);
                      }}
                    />
                    {errorsProfile.user_address && (
                      <span className="form-error">{errorsProfile.user_address.message}</span>
                    )}
                  </div>

                  {/* Birthday and CIN */}
                  <div className="form-grid">
                    <div className="form-group">
                      <CustomDatePicker
                        value={watchProfile('user_birthday')}
                        onChange={date => {
                          setIsDirty(true);
                          setValueProfile('user_birthday', date);
                        }}
                        label={t('profile:fields.birthday')}
                        placeholder={t('profile:placeholders.user_birthday')}
                        error={errorsProfile.user_birthday?.message}
                        required
                        type="date" // or "time" or "datetime"
                        disabled={false}
                        showYearDropdown={true}
                        showMonthDropdown={true}
                        dropdownMode={"scroll"}
                      />
                      <input
                        type="hidden"
                        {...registerProfile('user_birthday', {
                          required: t('profile:validation.birthday_required')
                        })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="user_cin" className="form-label">
                        {t('profile:fields.cin')}
                        <span className="required-asterisk">*</span>
                      </label>
                      <input
                        id="user_cin"
                        type="text"
                        className={`form-input ${errorsProfile.user_cin ? 'form-input--error' : ''}`}
                        {...registerProfile('user_cin', {
                          required: t('profile:validation.cin_required'),
                          pattern: {
                              value: /^[A-Za-z0-9]+$/,
                              message: t('profile:validation.user_cin_alphanum_only')
                          }
                        })}
                        placeholder={t('profile:placeholders.cin')}
                        onChange={e => {
                          setIsDirty(true);
                          registerProfile('user_cin').onChange(e);
                        }}
                      />
                      {errorsProfile.user_cin && (
                        <span className="form-error">{errorsProfile.user_cin.message}</span>
                      )}
                    </div>
                  </div>

                  {/* Country and Gender */}
                  <div className="form-grid">
                    <div className="form-group">
                      <CustomSelect
                        value={watchProfile('user_country')}
                        onChange={val => {
                          setIsDirty(true);
                          setValueProfile('user_country', val || '');
                        }}
                        options={countryOptions}
                        label={t('profile:fields.country')}
                        placeholder={t('profile:placeholders.select_country')}
                        error={errorsProfile.user_country?.message}
                        showCountriesFlags={true} // Show flags in the dropdown
                        required
                      />
                      <input
                        type="hidden"
                        {...registerProfile('user_country', {
                          required: t('profile:validation.country_required')
                        })}
                      />
                    </div>

                    <div className="form-group">                      
                      <CustomSelect
                        value={watchProfile('user_gender')}
                        onChange={val => {
                          setIsDirty(true);
                          setValueProfile('user_gender', val || '');
                        }}
                        options={genderOptions}
                        label={t('profile:fields.gender')}
                        placeholder={t('profile:placeholders.select_gender')}
                        error={errorsProfile.user_gender?.message}
                        required
                      />
                      <input
                        type="hidden"
                        {...registerProfile('user_gender', {
                          required: t('profile:validation.gender_required')
                        })}
                      />
                    </div>
                  </div>

                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={isLoading || !isDirty}
                  >
                    {isLoading ? t('common:loading') : t('profile:actions.save_changes')}
                  </button>
                  {isDirty && (
                    <button
                      type="button"
                      className="btn btn--secondary"
                      style={{ marginLeft: '1rem' }}
                      onClick={() => {
                        if (initialUserData.current) {
                          resetProfile(initialUserData.current);
                          setSelectedImage(user?.user_image_url || null);
                        }
                        setIsDirty(false);
                      }}
                    >
                      {t('common:cancel_changes', 'Cancel Changes')}
                    </button>
                  )}
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
                    <div className="form-input-group">
                      <input
                        id="current_password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        className={`form-input ${errorsPassword.current_password ? 'form-input--error' : ''}`}
                        {...registerPassword('current_password', {
                          required: t('profile:validation.current_password_required')
                        })}
                        onChange={e => {
                          setIsPasswordDirty(true);
                          registerPassword('current_password').onChange(e);
                        }}
                      />
                      <ShowPasswordButton
                        value={showCurrentPassword}
                        onClick={setShowCurrentPassword}
                      />
                    </div>
                    {errorsPassword.current_password && (
                      <span className="form-error">{errorsPassword.current_password.message}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="new_password" className="form-label">
                      {t('profile:fields.new_password')}
                    </label>
                    <div className="form-input-group">
                      <input
                        id="new_password"
                        type={showNewPassword ? 'text' : 'password'}
                        className={`form-input ${errorsPassword.new_password ? 'form-input--error' : ''}`}
                        {...registerPassword('new_password', {
                          required: t('profile:validation.new_password_required'),
                          minLength: {
                            value: 8,
                            message: t('profile:validation.password_min_length')
                          }
                        })}
                        onChange={e => {
                          setIsPasswordDirty(true);
                          registerPassword('new_password').onChange(e);
                        }}
                      />
                      <ShowPasswordButton
                        value={showNewPassword}
                        onClick={setShowNewPassword}
                      />
                    </div>
                    {errorsPassword.new_password && (
                      <span className="form-error">{errorsPassword.new_password.message}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirm_password" className="form-label">
                      {t('profile:fields.confirm_password')}
                    </label>
                    <div className="form-input-group">
                      <input
                        id="confirm_password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`form-input ${errorsPassword.confirm_password ? 'form-input--error' : ''}`}
                        {...registerPassword('confirm_password', {
                          required: t('profile:validation.confirm_password_required'),
                          validate: (value) =>
                            value === watchNewPassword || t('profile:validation.passwords_do_not_match')
                        })}
                        onChange={e => {
                         setIsPasswordDirty(true);
                          registerPassword('confirm_password').onChange(e);
                        }}
                      />
                      <ShowPasswordButton
                        value={showConfirmPassword}
                        onClick={setShowConfirmPassword}
                      />
                    </div>
                    {errorsPassword.confirm_password && (
                      <span className="form-error">{errorsPassword.confirm_password.message}</span>
                    )}
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={isLoading || !isPasswordDirty}
                  >
                    {isLoading ? t('common:loading') : t('profile:actions.update_password')}
                  </button>
                  {isPasswordDirty && (
                    <button
                      type="button"
                      className="btn btn--secondary"
                      style={{ marginLeft: '1rem' }}
                      onClick={() => {
                        if (initialPasswordData.current) {
                          resetPassword(initialPasswordData.current);
                        }
                        setIsPasswordDirty(false);
                      }}
                    >
                      {t('common:cancel_changes', 'Cancel Changes')}
                    </button>
                  )}
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
