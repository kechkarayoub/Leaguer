/**
 * Device ID Service for React Native
 * 
 * Provides unique device identification for API requests
 */

import DeviceInfo from 'react-native-device-info';
import SecureStorageService from './SecureStorageService';
import config from '../config/config';

class DeviceIdService {
  private static instance: DeviceIdService;
  private secureStorage: SecureStorageService;
  private deviceId: string | null = null;

  private constructor() {
    this.secureStorage = SecureStorageService.getInstance();
  }

  public static getInstance(): DeviceIdService {
    if (!DeviceIdService.instance) {
      DeviceIdService.instance = new DeviceIdService();
    }
    return DeviceIdService.instance;
  }

  /**
   * Get or generate a unique device ID
   */
  public async getDeviceId(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId;
    }

    // Try to get stored device ID
    let storedDeviceId = await this.secureStorage.getItem(config.storageKeys.deviceId);
    
    if (storedDeviceId) {
      this.deviceId = storedDeviceId;
      return this.deviceId;
    }

    // Generate new device ID
    try {
      const uniqueId = await DeviceInfo.getUniqueId();
      this.deviceId = uniqueId;
    } catch (error) {
      console.error('Error getting device unique ID:', error);
      // Fallback to a generated ID
      this.deviceId = this.generateFallbackId();
    }

    // Store the device ID
    await this.secureStorage.setItem(config.storageKeys.deviceId, this.deviceId);
    
    return this.deviceId;
  }

  /**
   * Get device information for API requests
   */
  public async getDeviceInfo(): Promise<{
    deviceId: string;
    platform: string;
    osVersion: string;
    appVersion: string;
    model: string;
    brand: string;
  }> {
    const deviceId = await this.getDeviceId();
    
    return {
      deviceId,
      platform: DeviceInfo.getSystemName(),
      osVersion: DeviceInfo.getSystemVersion(),
      appVersion: DeviceInfo.getVersion(),
      model: DeviceInfo.getModel(),
      brand: DeviceInfo.getBrand(),
    };
  }

  /**
   * Generate a fallback device ID if native methods fail
   */
  private generateFallbackId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 9);
    return `fallback_${timestamp}_${random}`;
  }

  /**
   * Reset device ID (useful for testing or privacy)
   */
  public async resetDeviceId(): Promise<void> {
    this.deviceId = null;
    await this.secureStorage.removeItem(config.storageKeys.deviceId);
  }
}

export default DeviceIdService;
