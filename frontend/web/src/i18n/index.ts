/**
 * Internationalization (i18n) Configuration
 * 
 * Sets up i18next with:
 * - Browser language detection
 * - HTTP backend for loading translations
 * - React integration
 * - Fallback languages
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

const isDevelopment = process.env.NODE_ENV === 'development';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Debug mode
    debug: isDevelopment,

    // Fallback language
    fallbackLng: 'en',
    
    // Supported languages
    supportedLngs: ['en', 'fr', 'ar'],

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    // Backend options for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      addPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
      formatSeparator: ',',
      format: (value, format) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'capitalize') return value.charAt(0).toUpperCase() + value.slice(1);
        return value;
      },
    },

    // Namespace and key options
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'profile', 'errors'],

    // Key separator
    keySeparator: '.',
    nsSeparator: ':',

    // React specific options
    react: {
      useSuspense: false,
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span'],
    },

    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',

    // Performance
    returnNull: false,
    returnEmptyString: false,
    returnObjects: false,
  });

export default i18n;
