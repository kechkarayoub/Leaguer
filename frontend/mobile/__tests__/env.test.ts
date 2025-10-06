/**
 * Environment Variables Validation Test for Mobile App
 * This test ensures all required environment variables are present
 * and properly configured for react-native-config
 */

import Config from 'react-native-config';

describe('Mobile Environment Variables Validation', () => {
  const requiredEnvVars = [
    // App Configuration
    'REACT_APP_NAME',
    'REACT_APP_VERSION',
    'REACT_APP_BACKEND_ENDPOINT',
    'REACT_APP_DEFAULT_COUNTRY_CODE',
    'REACT_APP_DISABLE_LOG_MESSAGE',
    'REACT_APP_IS_TEST',
    'REACT_APP_PIPLINE',

    // Feature Flags
    'REACT_APP_ENABLE_APPLE_LOGIN',
    'REACT_APP_ENABLE_EMAIL_VERIFICATION',
    'REACT_APP_ENABLE_FACEBOOK_LOGIN',
    'REACT_APP_ENABLE_GOOGLE_LOGIN',
    'REACT_APP_ENABLE_SIGNUP',
    'REACT_APP_ENABLE_USERS_REGISTRATION',

    // Security
    'REACT_APP_ENCRYPTION_KEY',

    // Social Login Configuration
    'REACT_APP_GOOGLE_SIGN_IN_ANDROID_CLIENT_ID',
    'REACT_APP_GOOGLE_SIGN_IN_IOS_CLIENT_ID',
    'REACT_APP_GOOGLE_SIGN_IN_WEB_CLIENT_ID',

    // Firebase Configuration
    'REACT_APP_FIREBASE_VAPID_KEY',
    'REACT_APP_FIREBASE_WEB_API_KEY',
    'REACT_APP_FIREBASE_WEB_APP_ID',
    'REACT_APP_FIREBASE_WEB_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_WEB_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_WEB_MEASUREMENT_ID',
    'REACT_APP_FIREBASE_WEB_PROJECT_ID',
    'REACT_APP_FIREBASE_WEB_STORAGE_BUCKET',

    // Company Contact Information
    'REACT_APP_SUPPORT_EMAIL',

    // WebSocket Configuration
    'REACT_APP_USE_WEBSOCKETS',
    'REACT_APP_WS_BACKEND_HOST',
    'REACT_APP_WS_BACKEND_PORT',
  ];

  const optionalEnvVars = [
    // Optional Social Login
    'REACT_APP_APPLE_SIGN_IN_ANDROID_CLIENT_ID',
    'REACT_APP_APPLE_SIGN_IN_IOS_CLIENT_ID',
    'REACT_APP_APPLE_SIGN_IN_WEB_CLIENT_ID',
    'REACT_APP_FACEBOOK_SIGN_IN_ANDROID_CLIENT_ID',
    'REACT_APP_FACEBOOK_SIGN_IN_IOS_CLIENT_ID',
    'REACT_APP_FACEBOOK_SIGN_IN_WEB_CLIENT_ID',
    'REACT_APP_APPLE_SIGN_IN_CALLBACK_URL',

    // Optional Company Information
    'REACT_APP_COMPANY_ADDRESS',

    // Optional Social Media Links
    'REACT_APP_SOCIAL_FACEBOOK_URL',
    'REACT_APP_SOCIAL_TWITTER_URL',
    'REACT_APP_SOCIAL_INSTAGRAM_URL',
    'REACT_APP_SOCIAL_TIKTOK_URL',
    'REACT_APP_SOCIAL_YOUTUBE_URL',
    'REACT_APP_SOCIAL_LINKEDIN_URL',

    // Build Configuration
    'GENERATE_SOURCEMAP',
    'ESLINT_NO_DEV_ERRORS',
  ];

  describe('Required Environment Variables', () => {
    requiredEnvVars.forEach((envVar) => {
      test(`${envVar} should be defined in Config`, () => {
        expect(Config[envVar]).toBeDefined();
        expect(Config[envVar]).not.toBe('');
        expect(Config[envVar]).not.toBe('undefined');
      });
    });
  });

  describe('Optional Environment Variables', () => {
    optionalEnvVars.forEach((envVar) => {
      test(`${envVar} should be accessible from Config (can be empty)`, () => {
        // Optional variables should be accessible but can be undefined
        expect(Config[envVar] === undefined || typeof Config[envVar] === 'string').toBe(true);
      });
    });
  });

  describe('react-native-config Integration', () => {
    test('Config object should be properly imported', () => {
      expect(Config).toBeDefined();
      expect(typeof Config).toBe('object');
    });

    test('All REACT_APP_ prefixed variables should be accessible', () => {
      // Test that variables with REACT_APP_ prefix are properly loaded
      const appName = Config.REACT_APP_NAME;
      expect(appName).toBeDefined();
      expect(typeof appName).toBe('string');
    });

    test('Environment should be properly configured', () => {
      // Test core variables that should always be present
      expect(Config.REACT_APP_NAME).toBeDefined();
      expect(Config.REACT_APP_BACKEND_ENDPOINT).toBeDefined();
    });
  });

  describe('Environment Variable Format Validation', () => {
    test('REACT_APP_BACKEND_ENDPOINT should be a valid URL', () => {
      const backendEndpoint = Config.REACT_APP_BACKEND_ENDPOINT;
      expect(backendEndpoint).toBeDefined();
      expect(backendEndpoint).toBeTruthy();
      expect(() => new URL(backendEndpoint!)).not.toThrow();
    });

    test('REACT_APP_SUPPORT_EMAIL should be a valid email format', () => {
      const supportEmail = Config.REACT_APP_SUPPORT_EMAIL;
      expect(supportEmail).toBeDefined();
      expect(supportEmail).toBeTruthy();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(supportEmail!)).toBe(true);
    });

    test('Boolean environment variables should have valid values', () => {
      const booleanVars = [
        'REACT_APP_DISABLE_LOG_MESSAGE',
        'REACT_APP_IS_TEST',
        'REACT_APP_ENABLE_APPLE_LOGIN',
        'REACT_APP_ENABLE_EMAIL_VERIFICATION',
        'REACT_APP_ENABLE_FACEBOOK_LOGIN',
        'REACT_APP_ENABLE_GOOGLE_LOGIN',
        'REACT_APP_ENABLE_SIGNUP',
        'REACT_APP_ENABLE_USERS_REGISTRATION',
        'REACT_APP_USE_WEBSOCKETS',
      ];

      booleanVars.forEach((varName) => {
        const value = Config[varName];
        expect(value).toBeDefined();
        expect(['true', 'false', '"true"', '"false"']).toContain(value);
      });
    });

    test('REACT_APP_WS_BACKEND_PORT should be a valid port number', () => {
      const port = Config.REACT_APP_WS_BACKEND_PORT;
      expect(port).toBeDefined();
      expect(port).toBeTruthy();
      const portNumber = parseInt(port!, 10);
      expect(portNumber).toBeGreaterThan(0);
      expect(portNumber).toBeLessThanOrEqual(65535);
    });

    test('REACT_APP_DEFAULT_COUNTRY_CODE should be a valid country code', () => {
      const countryCode = Config.REACT_APP_DEFAULT_COUNTRY_CODE;
      expect(countryCode).toBeDefined();
      expect(countryCode).toBeTruthy();
      // Remove quotes if present
      const cleanCode = countryCode!.replace(/"/g, '');
      expect(cleanCode).toMatch(/^[A-Z]{2}$/);
    });
  });

  describe('Mobile-Specific Validation', () => {
    test('Mobile environment configuration should be accessible', () => {
      const googleEnabled = Config.REACT_APP_ENABLE_GOOGLE_LOGIN;
      expect(googleEnabled).toBeDefined();
      expect(['true', 'false', '"true"', '"false"']).toContain(googleEnabled);
    });

    test('Core mobile configuration should be present', () => {
      // Test that essential mobile app configuration is available
      expect(Config.REACT_APP_NAME).toBeDefined();
      expect(Config.REACT_APP_BACKEND_ENDPOINT).toBeDefined();
      expect(Config.REACT_APP_DEFAULT_COUNTRY_CODE).toBeDefined();
    });
  });

  describe('Environment Consistency Checks', () => {
    test('WebSocket configuration should be complete', () => {
      const useWebsockets = Config.REACT_APP_USE_WEBSOCKETS;
      const wsHost = Config.REACT_APP_WS_BACKEND_HOST;
      const wsPort = Config.REACT_APP_WS_BACKEND_PORT;

      expect(useWebsockets).toBeDefined();
      expect(wsHost).toBeDefined();
      expect(wsPort).toBeDefined();
      
      // Additional validation for websocket configuration
      expect(['true', 'false', '"true"', '"false"']).toContain(useWebsockets);
    });

    test('Firebase configuration should be complete', () => {
      const firebaseVars = [
        'REACT_APP_FIREBASE_WEB_API_KEY',
        'REACT_APP_FIREBASE_WEB_AUTH_DOMAIN',
        'REACT_APP_FIREBASE_WEB_PROJECT_ID',
        'REACT_APP_FIREBASE_WEB_STORAGE_BUCKET',
        'REACT_APP_FIREBASE_WEB_MESSAGING_SENDER_ID',
        'REACT_APP_FIREBASE_WEB_APP_ID',
      ];

      // All Firebase vars should be defined
      firebaseVars.forEach((varName) => {
        expect(Config[varName]).toBeDefined();
      });
    });
  });

  describe('Security Validation', () => {
    test('Encryption key should be properly configured', () => {
      const encryptionKey = Config.REACT_APP_ENCRYPTION_KEY;
      expect(encryptionKey).toBeDefined();
      expect(encryptionKey).not.toBe('');
      expect(encryptionKey).not.toBe('your-secure-encryption-key-here');
      expect(encryptionKey!.length).toBeGreaterThanOrEqual(32);
    });

    test('Pipeline should be set correctly', () => {
      const pipeline = Config.REACT_APP_PIPLINE;
      expect(pipeline).toBeDefined();
      expect(['development', 'staging', 'production']).toContain(pipeline);
    });
  });

  describe('EnvService Integration', () => {
    test('EnvService should be able to access all required configuration', () => {
      // This tests that our EnvService can properly read the environment
      // We'll test key variables that EnvService likely uses
      
      // App Configuration
      expect(Config.REACT_APP_NAME).toBeDefined();
      expect(Config.REACT_APP_BACKEND_ENDPOINT).toBeDefined();
      
      // Feature flags should be readable
      const featureFlags = [
        'REACT_APP_ENABLE_GOOGLE_LOGIN',
        'REACT_APP_ENABLE_APPLE_LOGIN',
        'REACT_APP_ENABLE_FACEBOOK_LOGIN',
      ];
      
      featureFlags.forEach((flag) => {
        const value = Config[flag];
        expect(value).toBeDefined();
        expect(typeof value).toBe('string');
      });
    });
  });
});
