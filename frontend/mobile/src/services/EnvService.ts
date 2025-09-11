/**
 * Environment Service
 * 
 * Service to handle environment variables and configuration
 * Reads values from .env file using react-native-config
 */

import Config from 'react-native-config';

interface EnvConfig {
  // App Configuration
  REACT_APP_NAME: string;
  REACT_APP_VERSION: string;
  REACT_APP_BACKEND_ENDPOINT: string;
  REACT_APP_DEFAULT_COUNTRY_CODE: string;
  REACT_APP_DISABLE_LOG_MESSAGE: string;
  
  // Feature Flags
  REACT_APP_ENABLE_APPLE_LOGIN: string;
  REACT_APP_ENABLE_EMAIL_VERIFICATION: string;
  REACT_APP_ENABLE_FACEBOOK_LOGIN: string;
  REACT_APP_ENABLE_GOOGLE_LOGIN: string;
  REACT_APP_ENABLE_SIGNUP: string;
  REACT_APP_ENABLE_USERS_REGISTRATION: string;
  
  // Security
  REACT_APP_ENCRYPTION_KEY: string;
  
  // Social Login
  REACT_APP_FACEBOOK_SIGN_IN_WEB_CLIENT_ID: string;
  REACT_APP_GOOGLE_SIGN_IN_WEB_CLIENT_ID: string;
  REACT_APP_APPLE_SIGN_IN_WEB_CLIENT_ID: string;
  
  // Firebase Configuration
  REACT_APP_FIREBASE_VAPID_KEY: string;
  REACT_APP_FIREBASE_WEB_API_KEY: string;
  REACT_APP_FIREBASE_WEB_APP_ID: string;
  REACT_APP_FIREBASE_WEB_AUTH_DOMAIN: string;
  REACT_APP_FIREBASE_WEB_MESSAGING_SENDER_ID: string;
  REACT_APP_FIREBASE_WEB_MEASUREMENT_ID: string;
  REACT_APP_FIREBASE_WEB_PROJECT_ID: string;
  REACT_APP_FIREBASE_WEB_STORAGE_BUCKET: string;
  
  // Development/Testing
  REACT_APP_IS_TEST: string;
  REACT_APP_PIPLINE: string;
  
  // Contact Information
  REACT_APP_SUPPORT_EMAIL: string;
  
  // Social Media
  REACT_APP_SOCIAL_FACEBOOK_URL: string;
  REACT_APP_SOCIAL_TWITTER_URL: string;
  REACT_APP_SOCIAL_INSTAGRAM_URL: string;
  REACT_APP_SOCIAL_TIKTOK_URL: string;
  REACT_APP_SOCIAL_YOUTUBE_URL: string;
  REACT_APP_SOCIAL_LINKEDIN_URL: string;
  
  // WebSocket Configuration
  REACT_APP_USE_WEBSOCKETS: string;
  REACT_APP_WS_BACKEND_HOST: string;
  REACT_APP_WS_BACKEND_PORT: string;
}

// Helper function to read from .env file via react-native-config
// Falls back to default values when variables are not available
const getEnvValue = (key: string, defaultValue: string = ''): string => {
  try {
    return Config[key] || defaultValue;
  } catch {
    console.warn(`Unable to read env variable ${key}, using fallback: ${defaultValue}`);
    return defaultValue;
  }
};

// Default configuration for fallback values when .env is not available
const defaultConfig: EnvConfig = {
  // App Configuration
  REACT_APP_NAME: "Leaguer",
  REACT_APP_VERSION: "1.0.0",
  REACT_APP_BACKEND_ENDPOINT: "http://localhost:8080",
  REACT_APP_DEFAULT_COUNTRY_CODE: "MA",
  REACT_APP_DISABLE_LOG_MESSAGE: "true",
  
  // Feature Flags
  REACT_APP_ENABLE_APPLE_LOGIN: "false",
  REACT_APP_ENABLE_EMAIL_VERIFICATION: "false",
  REACT_APP_ENABLE_FACEBOOK_LOGIN: "false",
  REACT_APP_ENABLE_GOOGLE_LOGIN: "true",
  REACT_APP_ENABLE_SIGNUP: "true",
  REACT_APP_ENABLE_USERS_REGISTRATION: "true",
  
  // Security - empty in default config for security
  REACT_APP_ENCRYPTION_KEY: "",
  
  // Social Login - empty in default config for security
  REACT_APP_FACEBOOK_SIGN_IN_WEB_CLIENT_ID: "",
  REACT_APP_GOOGLE_SIGN_IN_WEB_CLIENT_ID: "",
  REACT_APP_APPLE_SIGN_IN_WEB_CLIENT_ID: "",
  
  // Firebase Configuration - empty in default config for security
  REACT_APP_FIREBASE_VAPID_KEY: "",
  REACT_APP_FIREBASE_WEB_API_KEY: "",
  REACT_APP_FIREBASE_WEB_APP_ID: "",
  REACT_APP_FIREBASE_WEB_AUTH_DOMAIN: "",
  REACT_APP_FIREBASE_WEB_MESSAGING_SENDER_ID: "",
  REACT_APP_FIREBASE_WEB_MEASUREMENT_ID: "",
  REACT_APP_FIREBASE_WEB_PROJECT_ID: "",
  REACT_APP_FIREBASE_WEB_STORAGE_BUCKET: "",
  
  // Development/Testing
  REACT_APP_IS_TEST: "false",
  REACT_APP_PIPLINE: "development",
  
  // Contact Information
  REACT_APP_SUPPORT_EMAIL: "support@leaguer.com",
  
  // Social Media
  REACT_APP_SOCIAL_FACEBOOK_URL: "https://facebook.com/leaguer",
  REACT_APP_SOCIAL_TWITTER_URL: "https://twitter.com/leaguer",
  REACT_APP_SOCIAL_INSTAGRAM_URL: "https://instagram.com/leaguer",
  REACT_APP_SOCIAL_TIKTOK_URL: "https://tiktok.com/@leaguer",
  REACT_APP_SOCIAL_YOUTUBE_URL: "https://youtube.com/@leaguer",
  REACT_APP_SOCIAL_LINKEDIN_URL: "",
  
  // WebSocket Configuration
  REACT_APP_USE_WEBSOCKETS: "true",
  REACT_APP_WS_BACKEND_HOST: "localhost",
  REACT_APP_WS_BACKEND_PORT: "9000",
};

class EnvService {
  private static instance: EnvService;

  private constructor() {
    // Constructor is private to enforce singleton
  }

  public static getInstance(): EnvService {
    if (!EnvService.instance) {
      EnvService.instance = new EnvService();
    }
    return EnvService.instance;
  }

  /**
   * Get environment variable value from .env file
   */
  public get(key: keyof EnvConfig, defaultValue?: string): string {
    const fallback = defaultValue || defaultConfig[key] || '';
    return getEnvValue(key, fallback);
  }

  /**
   * Get boolean environment variable
   */
  public getBoolean(key: keyof EnvConfig, defaultValue: boolean = false): boolean {
    const value = this.get(key, String(defaultValue)).toLowerCase();
    return value === 'true' || value === '1' || value === 'yes';
  }

  /**
   * Get number environment variable
   */
  public getNumber(key: keyof EnvConfig, defaultValue: number = 0): number {
    const value = this.get(key, String(defaultValue));
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Get app configuration
   */
  public getAppConfig() {
    return {
      name: this.get('REACT_APP_NAME'),
      version: this.get('REACT_APP_VERSION'),
      backendEndpoint: this.get('REACT_APP_BACKEND_ENDPOINT'),
      defaultCountryCode: this.get('REACT_APP_DEFAULT_COUNTRY_CODE'),
      isTest: this.getBoolean('REACT_APP_IS_TEST'),
      pipeline: this.get('REACT_APP_PIPLINE'),
      disableLogMessage: this.getBoolean('REACT_APP_DISABLE_LOG_MESSAGE'),
    };
  }

  /**
   * Get feature flags
   */
  public getFeatureFlags() {
    return {
      enableSignup: this.getBoolean('REACT_APP_ENABLE_SIGNUP'),
      enableGoogleLogin: this.getBoolean('REACT_APP_ENABLE_GOOGLE_LOGIN'),
      enableFacebookLogin: this.getBoolean('REACT_APP_ENABLE_FACEBOOK_LOGIN'),
      enableAppleLogin: this.getBoolean('REACT_APP_ENABLE_APPLE_LOGIN'),
      enableEmailVerification: this.getBoolean('REACT_APP_ENABLE_EMAIL_VERIFICATION'),
    };
  }

  /**
   * Get Firebase configuration
   */
  public getFirebaseConfig() {
    return {
      apiKey: this.get('REACT_APP_FIREBASE_WEB_API_KEY'),
      authDomain: this.get('REACT_APP_FIREBASE_WEB_AUTH_DOMAIN'),
      projectId: this.get('REACT_APP_FIREBASE_WEB_PROJECT_ID'),
      storageBucket: this.get('REACT_APP_FIREBASE_WEB_STORAGE_BUCKET'),
      messagingSenderId: this.get('REACT_APP_FIREBASE_WEB_MESSAGING_SENDER_ID'),
      appId: this.get('REACT_APP_FIREBASE_WEB_APP_ID'),
      measurementId: this.get('REACT_APP_FIREBASE_WEB_MEASUREMENT_ID'),
      vapidKey: this.get('REACT_APP_FIREBASE_VAPID_KEY'),
    };
  }

  /**
   * Get social login configuration
   */
  public getSocialConfig() {
    return {
      google: {
        webClientId: this.get('REACT_APP_GOOGLE_SIGN_IN_WEB_CLIENT_ID'),
        enabled: this.getBoolean('REACT_APP_ENABLE_GOOGLE_LOGIN'),
      },
      facebook: {
        webClientId: this.get('REACT_APP_FACEBOOK_SIGN_IN_WEB_CLIENT_ID'),
        enabled: this.getBoolean('REACT_APP_ENABLE_FACEBOOK_LOGIN'),
      },
      apple: {
        webClientId: this.get('REACT_APP_APPLE_SIGN_IN_WEB_CLIENT_ID'),
        enabled: this.getBoolean('REACT_APP_ENABLE_APPLE_LOGIN'),
      },
    };
  }

  /**
   * Get WebSocket configuration
   */
  public getWebSocketConfig() {
    return {
      enabled: this.getBoolean('REACT_APP_USE_WEBSOCKETS'),
      host: this.get('REACT_APP_WS_BACKEND_HOST'),
      port: this.get('REACT_APP_WS_BACKEND_PORT'),
    };
  }

  /**
   * Get contact information
   */
  public getContactInfo() {
    return {
      supportEmail: this.get('REACT_APP_SUPPORT_EMAIL'),
    };
  }

  /**
   * Get social media links
   */
  public getSocialMediaLinks() {
    return {
      facebook: this.get('REACT_APP_SOCIAL_FACEBOOK_URL'),
      twitter: this.get('REACT_APP_SOCIAL_TWITTER_URL'),
      instagram: this.get('REACT_APP_SOCIAL_INSTAGRAM_URL'),
      tiktok: this.get('REACT_APP_SOCIAL_TIKTOK_URL'),
      youtube: this.get('REACT_APP_SOCIAL_YOUTUBE_URL'),
      linkedin: this.get('REACT_APP_SOCIAL_LINKEDIN_URL'),
    };
  }

  /**
   * Get security configuration
   */
  public getSecurityConfig() {
    return {
      encryptionKey: this.get('REACT_APP_ENCRYPTION_KEY'),
    };
  }

  /**
   * Check if running in development mode
   */
  public isDevelopment(): boolean {
    return __DEV__;
  }

  /**
   * Check if running in test mode
   */
  public isTest(): boolean {
    return this.getBoolean('REACT_APP_IS_TEST');
  }

  /**
   * Get all configuration as a single object
   */
  public getAllConfig() {
    return {
      app: this.getAppConfig(),
      features: this.getFeatureFlags(),
      firebase: this.getFirebaseConfig(),
      social: this.getSocialConfig(),
      websocket: this.getWebSocketConfig(),
      contact: this.getContactInfo(),
      socialMedia: this.getSocialMediaLinks(),
      security: this.getSecurityConfig(),
    };
  }
}

// Export singleton instance
export default EnvService.getInstance();

// Export types for TypeScript support
export type { EnvConfig };
