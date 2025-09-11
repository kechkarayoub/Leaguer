/**
 * App Configuration
 * 
 * Central configuration for the mobile application with environment variables support
 */

import EnvService from '../services/EnvService';

const isDevelopment = __DEV__;
const env = EnvService;

// Backend configuration
const BACKEND_URL = env.get('REACT_APP_BACKEND_ENDPOINT', isDevelopment 
  ? 'http://10.0.2.2:8080' // Android emulator localhost
  : 'https://your-production-api.com');

const config = {
  // API Configuration
  backendEndpoint: BACKEND_URL,
  apiTimeout: 30000,
  wsEndpoint: `ws://${env.get('REACT_APP_WS_BACKEND_HOST', '10.0.2.2')}:${env.get('REACT_APP_WS_BACKEND_PORT', '9000')}`,
  
  // Storage keys
  storageKeys: {
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
    user: 'user',
    language: 'language',
    theme: 'theme',
    deviceId: 'device_id',
  },
  
  // App settings
  app: env.getAppConfig(),
  
  // Social login configuration
  social: env.getSocialConfig(),
  
  // Firebase configuration
  firebase: env.getFirebaseConfig(),
  
  // Feature flags
  features: {
    ...env.getFeatureFlags(),
    enableSocialLogin: env.getBoolean('REACT_APP_ENABLE_GOOGLE_LOGIN') || 
                      env.getBoolean('REACT_APP_ENABLE_FACEBOOK_LOGIN') || 
                      env.getBoolean('REACT_APP_ENABLE_APPLE_LOGIN'),
    enablePushNotifications: true,
    enableBiometrics: true,
    enableDarkMode: true,
  },
  
  // Validation rules
  validation: {
    password: {
      minLength: 6,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
    },
    username: {
      minLength: 3,
      maxLength: 30,
    },
    name: {
      minLength: 1,
      maxLength: 50,
    },
  },
  
  // UI Configuration
  ui: {
    animations: {
      duration: 300,
      easing: 'ease-in-out',
    },
    loading: {
      timeout: 10000,
    },
  },
  
  // Regional settings
  regional: {
    defaultCountryCode: env.get('REACT_APP_DEFAULT_COUNTRY_CODE', 'US'),
  },
  
  // Contact information
  contact: env.getContactInfo(),
  
  // Social media links
  socialMedia: env.getSocialMediaLinks(),
  
  // Security
  security: env.getSecurityConfig(),
  
  // WebSocket
  websocket: env.getWebSocketConfig(),
};

export default config;
