import React from 'react';
import Select, { Props as SelectProps, GroupBase } from 'react-select';
import { useTranslation } from 'react-i18next';
import './CustomSelect.css';

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: CustomSelectOption[];
  error?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  isClearable?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  error,
  label,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  isClearable = true,
}) => {
  const { t } = useTranslation();

  // Find the selected option object
  const selectedOption = options.find(opt => opt.value === value) || null;

  return (
    <div className={`custom-select ${className} ${error ? 'custom-select--error' : ''}`}>
      {label && (
        <label className="custom-select__label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      <Select
        options={options}
        value={selectedOption}
        onChange={opt => onChange(opt ? (opt as CustomSelectOption).value : null)}
        placeholder={placeholder || t('common:form.select_placeholder')}
        isDisabled={disabled}
        isClearable={isClearable}
        classNamePrefix="custom-select"
        aria-label={label || t('common:form.select_placeholder')}
        aria-invalid={!!error}
        aria-describedby={error ? `${label}-error` : undefined}
      />
      {error && (
        <div className="custom-select__error" id={`${label}-error`} role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
