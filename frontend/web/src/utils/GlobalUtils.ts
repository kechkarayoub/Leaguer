import moment from "moment";

import i18n from '../i18n';


// Helper function to safely get translations
export const getTranslation = (key: string, fallback: string): string => {
  if (i18n.isInitialized && i18n.exists(key)) {
    return (i18n.t as any)(key) as string;
  }
  return fallback;
};

// Get page title based on current route
export const getPageTitle = (path: string, t: Function, pageTitle?: string | undefined) => {
  if (pageTitle) return pageTitle;

  switch (path) {
    case '/':
      return t('navigation.home', { defaultValue: 'Home' });
    case '/auth/login':
      return t('navigation.login', { defaultValue: 'Login' });
    case '/auth/forgot-password':
      return t('navigation.forgotPassword', { defaultValue: 'Forgot Password' });
    case '/auth/register':
      return t('navigation.register', { defaultValue: 'Register' });
    case '/auth/reset-password':
      return t('navigation.resetPassword', { defaultValue: 'Reset Password' });
    case '/profile':
      return t('navigation.profile', { defaultValue: 'Profile' });
    case '/settings':
      return t('navigation.settings', { defaultValue: 'Settings' });
    default:
      return t('navigation.pageNotFound', { defaultValue: 'Page Not Found' });
  }
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
