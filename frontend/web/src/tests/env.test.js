/**
 * Environment Variables Validation Test
 * This test ensures all required environment variables are present
 */

describe('Environment Variables Validation', () => {
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
    'REACT_APP_APPLE_SIGN_IN_WEB_CLIENT_ID',
    'REACT_APP_FACEBOOK_SIGN_IN_WEB_CLIENT_ID',

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
      test(`${envVar} should be defined`, () => {
        expect(process.env[envVar]).toBeDefined();
        expect(process.env[envVar]).not.toBe('');
        expect(process.env[envVar]).not.toBe('undefined');
      });
    });
  });

  describe('Optional Environment Variables', () => {
    optionalEnvVars.forEach((envVar) => {
      test(`${envVar} should be defined (can be empty)`, () => {
        // Optional variables should be defined but can be empty
        expect(process.env[envVar]).toBeDefined();
      });
    });
  });

  describe('Environment Variable Format Validation', () => {
    test('REACT_APP_BACKEND_ENDPOINT should be a valid URL', () => {
      const backendEndpoint = process.env.REACT_APP_BACKEND_ENDPOINT;
      expect(backendEndpoint).toBeDefined();
      expect(() => new URL(backendEndpoint)).not.toThrow();
    });

    test('REACT_APP_SUPPORT_EMAIL should be a valid email format', () => {
      const supportEmail = process.env.REACT_APP_SUPPORT_EMAIL;
      expect(supportEmail).toBeDefined();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(supportEmail)).toBe(true);
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
        const value = process.env[varName];
        expect(value).toBeDefined();
        expect(['true', 'false', '"true"', '"false"']).toContain(value);
      });
    });

    test('REACT_APP_WS_BACKEND_PORT should be a valid port number', () => {
      const port = process.env.REACT_APP_WS_BACKEND_PORT;
      expect(port).toBeDefined();
      const portNumber = parseInt(port, 10);
      expect(portNumber).toBeGreaterThan(0);
      expect(portNumber).toBeLessThanOrEqual(65535);
    });

    test('REACT_APP_DEFAULT_COUNTRY_CODE should be a valid country code', () => {
      const countryCode = process.env.REACT_APP_DEFAULT_COUNTRY_CODE;
      expect(countryCode).toBeDefined();
      // Remove quotes if present
      const cleanCode = countryCode.replace(/"/g, '');
      expect(cleanCode).toMatch(/^[A-Z]{2}$/);
    });
  });

  describe('Environment Consistency Checks', () => {
    test('WebSocket configuration should be complete', () => {
      const useWebsockets = process.env.REACT_APP_USE_WEBSOCKETS;
      const wsHost = process.env.REACT_APP_WS_BACKEND_HOST;
      const wsPort = process.env.REACT_APP_WS_BACKEND_PORT;

      expect(useWebsockets).toBeDefined();
      expect(wsHost).toBeDefined();
      expect(wsPort).toBeDefined();
      
      // Additional validation when websockets are enabled
      expect(['true', 'false', '"true"', '"false"']).toContain(useWebsockets);
    });

    test('Firebase configuration should be complete when any Firebase var is set', () => {
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
        expect(process.env[varName]).toBeDefined();
      });
    });
  });

  describe('Security Validation', () => {
    test('Encryption key should be properly configured', () => {
      const encryptionKey = process.env.REACT_APP_ENCRYPTION_KEY;
      expect(encryptionKey).toBeDefined();
      expect(encryptionKey).not.toBe('');
      expect(encryptionKey).not.toBe('your-secure-encryption-key-here');
      expect(encryptionKey.length).toBeGreaterThanOrEqual(32);
    });

    test('Pipeline should be set correctly', () => {
      const pipeline = process.env.REACT_APP_PIPLINE;
      expect(pipeline).toBeDefined();
      expect(['development', 'staging', 'production']).toContain(pipeline);
    });
  });
});
