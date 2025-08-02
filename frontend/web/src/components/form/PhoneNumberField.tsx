/**
 * PhoneNumberField Component
 * 
 * Reusable phone number input field with international formatting using react-international-phone
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import UnauthenticatedApiService from '../../services/UnauthenticatedApiService';

import './PhoneNumberField.css';

interface PhoneNumberFieldProps {
  value: string;
  onChange: (value: string) => void;
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
  const { t } = useTranslation();
  const [defaultCountry, setDefaultCountry] = useState<string>('fr');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Fetch user geolocation to set default country
  useEffect(() => {
    const fetchGeolocation = async () => {
      if (!useGeolocation || value) return; // Don't fetch if phone number already set
      
      setIsLoadingLocation(true);
      try {
        const response = await UnauthenticatedApiService.getInstance().getGeolocation();
        if (response && response.data && response.data.country_code) {
          setDefaultCountry(response.data.country_code.toLowerCase());
        }
      } catch (error) {
        console.warn('Failed to fetch geolocation:', error);
        // Keep default 'fr' country
      } finally {
        setIsLoadingLocation(false);
      }
    };

    fetchGeolocation();
  }, [useGeolocation, value]);

  return (
    <div className={`phone-field ${className} ${error ? 'phone-field--error' : ''}`}>
      {label && (
        <label className="phone-field__label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      
      <div className="phone-field__input-wrapper">
        <PhoneInput
          defaultCountry={defaultCountry}
          value={value}
          onChange={onChange}
          placeholder={placeholder || t('common:form.phone_number')}
          disabled={disabled || isLoadingLocation}
          inputProps={{
            'aria-label': label || t('common:form.phone_number'),
            'aria-invalid': !!error,
            'aria-describedby': error ? `${label}-error` : undefined,
          }}
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
