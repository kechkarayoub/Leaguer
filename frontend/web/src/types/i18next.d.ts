/**
 * TypeScript declarations for i18next
 * 
 * Extends the default i18next types to include our namespaces
 */

import 'react-i18next';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof import('../locales/en/common.json');
      auth: typeof import('../locales/en/auth.json');
      dashboard: typeof import('../locales/en/dashboard.json');
      profile: typeof import('../locales/en/profile.json');
      errors: typeof import('../locales/en/errors.json');
      countries: typeof import('../public/locales/en/countries.json');
    };
  }
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof import('../public/locales/en/common.json');
      auth: typeof import('../public/locales/en/auth.json');
      dashboard: {};
      profile: {};
      errors: {};
      countries: typeof import('../public/locales/en/countries.json');
    };
  }
}
