/**
 * Environment Service
 * 
 * Service to handle environment variables and configuration
 * Reads values from .env file using react-native-config
 */

import Config from 'react-native-config';
import GeneratedEnvRaw from '../env.generated';
const GeneratedEnv: Record<string, string> = (GeneratedEnvRaw ?? {}) as any;

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
  REACT_APP_FACEBOOK_SIGN_IN_ANDROID_CLIENT_ID: string;
  REACT_APP_FACEBOOK_SIGN_IN_IOS_CLIENT_ID: string;
  REACT_APP_FACEBOOK_SIGN_IN_WEB_CLIENT_ID: string;
  REACT_APP_GOOGLE_SIGN_IN_ANDROID_CLIENT_ID: string;
  REACT_APP_GOOGLE_SIGN_IN_IOS_CLIENT_ID: string;
  REACT_APP_GOOGLE_SIGN_IN_WEB_CLIENT_ID: string;
  REACT_APP_APPLE_SIGN_IN_ANDROID_CLIENT_ID: string;
  REACT_APP_APPLE_SIGN_IN_IOS_CLIENT_ID: string;
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
    
    // Try react-native-config first
    if (Config[key] !== undefined && Config[key] !== null && Config[key] !== '') {
      if(key === 'REACT_APP_ENABLE_SIGNUP') {
        console.log(`Using react-native-config value for ${key}:`, Config[key]);
      }
      return Config[key];
    }
    // Fallback to generated env
    if (GeneratedEnv && GeneratedEnv[key] !== undefined && GeneratedEnv[key] !== null && GeneratedEnv[key] !== '') {
      if(key === 'REACT_APP_ENABLE_SIGNUP') {
        console.log(`Using generated env value for ${key}:`, GeneratedEnv[key]);
      }
      return GeneratedEnv[key] as string;
    }
    if(key === 'REACT_APP_ENABLE_SIGNUP') {
      console.log(`Using default value for ${key}:`, defaultValue);
    }
    return defaultValue;
  } catch (error) {
    console.warn(`Unable to read env variable ${key}, using fallback: ${defaultValue}`, error);
    return defaultValue;
  }
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
    const value = getEnvValue(key, defaultValue);
    if(key === 'REACT_APP_ENABLE_SIGNUP') {
      console.log(`EnvService: Loaded ${key} = ${value}`);
    }
    return value;
  }

  /**
   * Get boolean environment variable
   */
  public getBoolean(key: keyof EnvConfig, defaultValue: boolean = false): boolean {
    const value = this.get(key, String(defaultValue)).toLowerCase();
    if(key === 'REACT_APP_ENABLE_SIGNUP') {
      console.log(`Debug: REACT_APP_ENABLE_SIGNUP raw value = ${this.get(key)}`);
    }
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
        androidClientId: this.get('REACT_APP_GOOGLE_SIGN_IN_ANDROID_CLIENT_ID'),
        iosClientId: this.get('REACT_APP_GOOGLE_SIGN_IN_IOS_CLIENT_ID'),
        webClientId: this.get('REACT_APP_GOOGLE_SIGN_IN_WEB_CLIENT_ID'),
        enabled: this.getBoolean('REACT_APP_ENABLE_GOOGLE_LOGIN'),
      },
      facebook: {
        androidClientId: this.get('REACT_APP_FACEBOOK_SIGN_IN_ANDROID_CLIENT_ID'),
        iosClientId: this.get('REACT_APP_FACEBOOK_SIGN_IN_IOS_CLIENT_ID'),
        webClientId: this.get('REACT_APP_FACEBOOK_SIGN_IN_WEB_CLIENT_ID'),
        enabled: this.getBoolean('REACT_APP_ENABLE_FACEBOOK_LOGIN'),
      },
      apple: {
        androidClientId: this.get('REACT_APP_APPLE_SIGN_IN_ANDROID_CLIENT_ID'),
        iosClientId: this.get('REACT_APP_APPLE_SIGN_IN_IOS_CLIENT_ID'),
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
