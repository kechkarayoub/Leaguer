/**
 * PhoneNumberField Component
 * 
 * Reusable phone number input field with international formatting using react-international-phone
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EXCLUDED_COUNTRIES } from '../../utils/GlobalUtils';
import PhoneInput from 'react-phone-input-2';
import ar from 'react-phone-input-2/lang/ar.json'
import fr from 'react-phone-input-2/lang/fr.json'
import 'react-phone-input-2/lib/style.css';
import UnauthenticatedApiService from '../../services/UnauthenticatedApiService';

import './PhoneNumberField.css';

interface PhoneNumberFieldProps {
  value: string;
  onChange: (value: string | undefined) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  useGeolocation?: boolean;
}

const PhoneNumberField: React.FC<PhoneNumberFieldProps> = ({
  value,
  onChange,
  error,
  label,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  useGeolocation = true,
}) => {
  const { t, i18n } = useTranslation();
  const [defaultCountry, setDefaultCountry] = useState<string>('ma');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const currentLanguage = i18n.language;


  // Fetch user geolocation to set default country
  useEffect(() => {
    const fetchGeolocation = async () => {
      if (!useGeolocation || disabled) return;
      setIsLoadingLocation(true);
      try {
        const response = await UnauthenticatedApiService.getInstance().getGeolocation();
        if (response && response.data && response.data.country_code) {
          setDefaultCountry(response.data.country_code.toLowerCase());
        }
      } catch (error) {
        console.warn('Failed to fetch geolocation:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    };
    fetchGeolocation();
  }, [useGeolocation, disabled, currentLanguage]);

        console.log('Current language:', currentLanguage)
  return (
    <div className={`phone-field ${className} ${error ? 'phone-field--error' : ''}`}>
      {label && (
        <label className="phone-field__label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      <div className="phone-field__input-wrapper" key={currentLanguage}>
        <PhoneInput
          country={defaultCountry}
          localization={currentLanguage === 'ar' ? ar : currentLanguage === 'fr' ? fr : undefined}
          value={value || ''}
          onChange={onChange}
          excludeCountries={EXCLUDED_COUNTRIES}
          preferredCountries={['ma'].concat(defaultCountry === 'ma' ? [] : [defaultCountry])}
          inputProps={{
            placeholder: placeholder || t('common:form.phone_number'),
            disabled: disabled || isLoadingLocation,
            'aria-label': label || t('common:form.phone_number'),
            'aria-invalid': !!error,
            'aria-describedby': error ? `${label}-error` : undefined,
            required,
          }}
          searchPlaceholder={t('common:form.phone.search_placeholder')}
          searchNotFound={t('common:form.phone.searchNotFound')}
          enableSearch
          disableDropdown={disabled || isLoadingLocation}
        />
      </div>
      {error && (
        <div className="phone-field__error" id={`${label}-error`} role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default PhoneNumberField;
