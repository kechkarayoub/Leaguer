import moment from "moment";

import i18n from '../i18n';


// Helper function to safely get translations
export const getTranslation = (key: string, fallback: string): string => {
  if (i18n.isInitialized && i18n.exists(key)) {
    return (i18n.t as any)(key) as string;
  }
  return fallback;
};

export const renderDate = (date: Date, currentLanguage: string, separator: string = '/'): string => {
  let format = `DD${separator}MM${separator}YYYY`; // Default format
  if (currentLanguage === 'en') {
    format = `MM${separator}DD${separator}YYYY`; // US format
  }
  else if (currentLanguage === 'fr') {
    format = `DD${separator}MM${separator}YYYY`; // French format
  }
  else if (currentLanguage === 'ar') {
    format = `DD${separator}MM${separator}YYYY`; // Arabic format
  }
  return moment(date).format(format);
};

export const EXCLUDED_COUNTRIES = ['IL', 'il', 'EH', 'eh'];
