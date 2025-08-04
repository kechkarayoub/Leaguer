import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import './CustomDatePicker.css';

// Optionally import locales from date-fns
import {enUS} from 'date-fns/locale/en-US';
import {fr} from 'date-fns/locale/fr';
import {ar} from 'date-fns/locale/ar';

registerLocale('en', enUS);
registerLocale('fr', fr);
registerLocale('ar', ar);

export type CustomDatePickerType = 'date' | 'time' | 'datetime';

interface CustomDatePickerProps {
  value: string | Date | null;
  onChange: (value: string | Date | null) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  dropdownMode?: "select" | "scroll";
  yearDropdownItemNumber?: number;
  showYearDropdown?: boolean;
  showMonthDropdown?: boolean;
  className?: string;
  type?: CustomDatePickerType;
  minDate?: Date;
  maxDate?: Date;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  error,
  label,
  placeholder,
  required = false,
  disabled = false,
  dropdownMode = "select",
  yearDropdownItemNumber = 50,
  showYearDropdown = false,
  showMonthDropdown = false,
  className = '',
  type = 'date',
  minDate,
  maxDate = new Date(),
}) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? 'ar' : i18n.language === 'fr' ? 'fr' : 'en';

  // Convert string value to Date if needed
  let dateValue: Date | null = null;
  if (typeof value === 'string' && value) {
    dateValue = parseISO(value);
  } else if (value instanceof Date) {
    dateValue = value;
  }

  let dateFormat = 'yyyy-MM-dd';
  let showTimeSelect = false;
  let showTimeSelectOnly = false;
  if (type === 'datetime') {
    dateFormat = 'yyyy-MM-dd HH:mm';
    showTimeSelect = true;
  } else if (type === 'time') {
    dateFormat = 'HH:mm';
    showTimeSelectOnly = true;
  }

  return (
    <div className={`custom-datepicker ${className} ${error ? 'custom-datepicker--error' : ''}`}>
      {label && (
        <label className="custom-datepicker__label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      <DatePicker
        selected={dateValue}
        onChange={date => onChange(date || null)}
        locale={locale}
        dateFormat={dateFormat}
        showTimeSelect={showTimeSelect}
        showTimeSelectOnly={showTimeSelectOnly}
        timeIntervals={15}
        minDate={minDate}
        maxDate={maxDate}
        placeholderText={placeholder || t('profile:placeholders.date_placeholder')}
        disabled={disabled}
        yearDropdownItemNumber={yearDropdownItemNumber}
        scrollableYearDropdown={true}
        dropdownMode={dropdownMode}
        showYearDropdown={showYearDropdown}
        showMonthDropdown={showMonthDropdown}
        className="custom-datepicker__input"
        aria-label={label || t('profile:placeholders.date_placeholder')}
        aria-invalid={!!error}
        aria-describedby={error ? `${label}-error` : undefined}
      />
      {error && (
        <div className="custom-datepicker__error" id={`${label}-error`} role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
