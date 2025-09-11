/**
 * Secure Storage Service for React Native
 * 
 * Provides secure storage capabilities using Keychain (iOS) and EncryptedSharedPreferences (Android)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Keychain from 'react-native-keychain';

class SecureStorageService {
  private static instance: SecureStorageService;

  private constructor() {}

  public static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  /**
   * Store a value securely (for sensitive data like tokens)
   */
  public async setSecureItem(key: string, value: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(key, key, value);
    } catch (error) {
      console.error('Error storing secure item:', error);
      // Fallback to AsyncStorage (less secure but better than nothing)
      await AsyncStorage.setItem(key, value);
    }
  }

  /**
   * Retrieve a value securely
   */
  public async getSecureItem(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(key);
      if (credentials && credentials.password) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving secure item:', error);
      // Fallback to AsyncStorage
      return await AsyncStorage.getItem(key);
    }
  }

  /**
   * Remove a secure item
   */
  public async removeSecureItem(key: string): Promise<void> {
    try {
      await Keychain.resetInternetCredentials({ service: key });
    } catch (error) {
      console.error('Error removing secure item:', error);
      // Fallback to AsyncStorage
      await AsyncStorage.removeItem(key);
    }
  }

  /**
   * Store a regular item (for non-sensitive data)
   */
  public async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error storing item:', error);
      throw error;
    }
  }

  /**
   * Retrieve a regular item
   */
  public async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error retrieving item:', error);
      return null;
    }
  }

  /**
   * Remove a regular item
   */
  public async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item:', error);
      throw error;
    }
  }

  /**
   * Clear all storage
   */
  public async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      // Note: Keychain items need to be cleared individually
      // This is a simplified implementation
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Get all keys
   */
  public async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Session storage methods (same as regular storage in mobile)
   * Note: React Native doesn't have session storage concept
   */
  public async setSessionItem(key: string, value: string): Promise<void> {
    return this.setItem(`session_${key}`, value);
  }

  public async getSessionItem(key: string): Promise<string | null> {
    return this.getItem(`session_${key}`);
  }

  public async removeSessionItem(key: string): Promise<void> {
    return this.removeItem(`session_${key}`);
  }

  public async clearSession(): Promise<void> {
    try {
      const allKeys = await this.getAllKeys();
      const sessionKeys = allKeys.filter(key => key.startsWith('session_'));
      await AsyncStorage.multiRemove(sessionKeys);
    } catch (error) {
      console.error('Error clearing session:', error);
      throw error;
    }
  }
}

export default SecureStorageService;
