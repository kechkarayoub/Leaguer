/**
 * Device ID Service
 * 
 * A singleton service that generates and manages a unique device identifier
 * for HTTP requests. This service ensures that each device has a persistent,
 * unique ID that can be used to:
 * 
 * - Track requests from specific devices
 * - Prevent duplicate updates on the originating device
 * - Enable device-specific audit trails
 * - Support multi-device synchronization
 */

class DeviceIdService {
  private static instance: DeviceIdService;
  private deviceId: string | null = null;
  private readonly storageKey = 'device_id';

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): DeviceIdService {
    if (!DeviceIdService.instance) {
      DeviceIdService.instance = new DeviceIdService();
    }
    return DeviceIdService.instance;
  }

  /**
   * Generate a new device ID
   * Format: "device_timestamp_randomSuffix"
   * Example: "device_1641234567890_123456"
   */
  private generateDeviceId(): string {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `device_${timestamp}_${randomSuffix}`;
  }

  /**
   * Get the device ID. Creates one if it doesn't exist.
   */
  public async getDeviceId(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId;
    }

    // Try to load from localStorage
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.deviceId = stored;
        return this.deviceId;
      }
    } catch (error) {
      console.warn('Failed to load device ID from localStorage:', error);
    }

    // Generate new device ID
    this.deviceId = this.generateDeviceId();

    // Try to save to localStorage
    try {
      localStorage.setItem(this.storageKey, this.deviceId);
    } catch (error) {
      console.warn('Failed to save device ID to localStorage:', error);
    }

    return this.deviceId;
  }

  /**
   * Reset device ID (useful for testing)
   */
  public reset(): void {
    this.deviceId = null;
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to remove device ID from localStorage:', error);
    }
  }
}

export default DeviceIdService;
