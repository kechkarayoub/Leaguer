import React from 'react';
import Select, { Props as SelectProps, GroupBase } from 'react-select';
import { useTranslation } from 'react-i18next';
import './CustomSelect.css';
import { dir } from 'console';

export interface CustomSelectOption {
  value: string;
  label: string;
}

const CustomSingleValueWithFlag: React.FC<{ data: CustomSelectOption }> = ({ data }) => {
  const { i18n } = useTranslation();
  const direction = i18n.language === 'ar' ? 'rtl' : 'ltr'; // Adjust direction based on language
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <img
        src={`https://flagcdn.com/24x18/${data.value.toLowerCase()}.png`}
        alt={data.value}
        style={direction === 'rtl' ? { marginLeft: 8, width: 24, height: 18 } : { marginRight: 8, width: 24, height: 18 }}
      />
      {data.label}
    </div>
  );
};

const CustomOptionWithFlag: React.FC<{
  data: CustomSelectOption;
  innerRef: React.Ref<HTMLDivElement>;
  innerProps: React.HTMLAttributes<HTMLDivElement>;
}> = ({ data, innerRef, innerProps }) => {
  const { i18n } = useTranslation();
  const direction = i18n.language === 'ar' ? 'rtl' : 'ltr'; // Adjust direction based on language
  return <div ref={innerRef} {...innerProps} style={{ display: 'flex', alignItems: 'center', padding: 8 }}>
    <img
      src={`https://flagcdn.com/24x18/${data.value.toLowerCase()}.png`}
      alt={data.value}
      style={direction === 'rtl' ? { marginLeft: 10, width: 24, height: 18 } : { marginRight: 10, width: 24, height: 18 }}
    />
    {data.label}
  </div>
};


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
  isSearchable?: boolean;
  showCountriesFlags?: boolean; // Whether to show country flags
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
  isSearchable = true,
  showCountriesFlags = false, // Default to not showing flags
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
        className="custom-select__control"
        onChange={opt => onChange(opt ? (opt as CustomSelectOption).value : null)}
        placeholder={placeholder || t('profile:placeholders.select_country')}
        isDisabled={disabled}
        isClearable={isClearable}
        isSearchable={isSearchable}
        classNamePrefix="custom-select"
        aria-label={label || t('profile:placeholders.select_country')}
        aria-invalid={!!error}
        aria-describedby={error ? `${label}-error` : undefined}
        noOptionsMessage={() => t('profile:select.no_options')}
        components={showCountriesFlags ? {
          SingleValue: CustomSingleValueWithFlag,
          Option: CustomOptionWithFlag,
        } : undefined}
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
