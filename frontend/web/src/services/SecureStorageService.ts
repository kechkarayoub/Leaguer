/**
 * Secure Storage Service for Web
 * 
 * Provides secure storage capabilities for sensitive data like tokens.
 * Uses localStorage with encryption for web applications.
 * Note: For true security in production, consider using more robust solutions.
 */

import CryptoJS from 'crypto-js';

class SecureStorageService {
  private static instance: SecureStorageService;
  private readonly encryptionKey: string;

  private constructor() {
    // In a real app, this should be derived from user session or environment
    this.encryptionKey = process.env.REACT_APP_ENCRYPTION_KEY || 'leaguer-default-key';
  }

  public static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  /**
   * Encrypt data
   */
  private encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }

  /**
   * Decrypt data
   */
  private decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Store encrypted data
   */
  public async setItem(key: string, value: string): Promise<void> {
    try {
      const encrypted = this.encrypt(value);
      localStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error(`Failed to store secure item (${key}):`, error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt data
   */
  public async getItem(key: string): Promise<string | null> {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      if (!encrypted) {
        return null;
      }
      return this.decrypt(encrypted);
    } catch (error) {
      console.error(`Failed to retrieve secure item (${key}):`, error);
      return null;
    }
  }

  /**
   * Remove encrypted data
   */
  public async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(`secure_${key}`);
    } catch (error) {
      console.error(`Failed to remove secure item (${key}):`, error);
      throw error;
    }
  }

  /**
   * Clear all encrypted data
   */
  public async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      const secureKeys = keys.filter(key => key.startsWith('secure_'));
      secureKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
      throw error;
    }
  }

  /**
   * Check if encrypted key exists
   */
  public async exists(key: string): Promise<boolean> {
    try {
      return localStorage.getItem(`secure_${key}`) !== null;
    } catch (error) {
      console.error(`Failed to check secure storage existence (${key}):`, error);
      return false;
    }
  }

  /**
   * Store encrypted data in session storage (temporary - cleared when browser closes)
   */
  public async setSessionItem(key: string, value: string): Promise<void> {
    try {
      const encrypted = this.encrypt(value);
      sessionStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error(`Failed to store secure session item (${key}):`, error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt data from session storage
   */
  public async getSessionItem(key: string): Promise<string | null> {
    try {
      const encrypted = sessionStorage.getItem(`secure_${key}`);
      if (!encrypted) {
        return null;
      }
      return this.decrypt(encrypted);
    } catch (error) {
      console.error(`Failed to retrieve secure session item (${key}):`, error);
      return null;
    }
  }

  /**
   * Remove encrypted data from session storage
   */
  public async removeSessionItem(key: string): Promise<void> {
    try {
      sessionStorage.removeItem(`secure_${key}`);
    } catch (error) {
      console.error(`Failed to remove secure session item (${key}):`, error);
      throw error;
    }
  }

  /**
   * Clear all encrypted session data
   */
  public async clearSession(): Promise<void> {
    try {
      const keys = Object.keys(sessionStorage);
      const secureKeys = keys.filter(key => key.startsWith('secure_'));
      secureKeys.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear secure session storage:', error);
      throw error;
    }
  }
}

export default SecureStorageService;
