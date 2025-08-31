/**
 * DeviceIdService Tests
 * 
 * Tests for the device ID generation and management service
 */

import DeviceIdService from './DeviceIdService';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('DeviceIdService', () => {
  let service: DeviceIdService;

  beforeEach(() => {
    // Clear all mocks first
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    
    // Reset console warnings
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Completely reset the singleton - clear both instance and any internal state
    if ((DeviceIdService as any).instance) {
      (DeviceIdService as any).instance.deviceId = null;
    }
    (DeviceIdService as any).instance = undefined;
    
    // Get fresh instance for each test
    service = DeviceIdService.getInstance();
    
    // Ensure the internal device ID is null for each test
    (service as any).deviceId = null;
  });

  afterEach(() => {
    // Additional cleanup after each test
    if (service) {
      (service as any).deviceId = null;
    }
    if ((DeviceIdService as any).instance) {
      (DeviceIdService as any).instance.deviceId = null;
    }
  });

  afterEach(() => {
    // Clean up after each test
    if (service) {
      service.reset();
    }
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DeviceIdService.getInstance();
      const instance2 = DeviceIdService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should maintain the same instance across multiple calls', () => {
      const instances = Array(5).fill(null).map(() => DeviceIdService.getInstance());
      
      instances.forEach(instance => {
        expect(instance).toBe(service);
      });
    });
  });

  describe('Device ID Generation', () => {
    it('should generate a device ID with correct format when none exists', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const deviceId = await service.getDeviceId();
      
      expect(deviceId).toMatch(/^device_\d+_\d{6}$/);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('device_id', deviceId);
    });

    it('should generate unique device IDs on multiple calls after reset', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const deviceId1 = await service.getDeviceId();
      service.reset();
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const deviceId2 = await service.getDeviceId();
      
      expect(deviceId1).not.toBe(deviceId2);
      expect(deviceId1).toMatch(/^device_\d+_\d{6}$/);
      expect(deviceId2).toMatch(/^device_\d+_\d{6}$/);
    });

    it('should include timestamp in device ID', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const beforeTimestamp = Date.now();
      const deviceId = await service.getDeviceId();
      const afterTimestamp = Date.now();
      
      const timestampPart = deviceId.split('_')[1];
      const timestamp = parseInt(timestampPart, 10);
      
      expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(timestamp).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should include 6-digit random suffix', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const deviceId = await service.getDeviceId();
      const randomPart = deviceId.split('_')[2];
      
      expect(randomPart).toHaveLength(6);
      expect(/^\d{6}$/.test(randomPart)).toBe(true);
    });
  });

  describe('Device ID Persistence', () => {
    it('should load existing device ID from localStorage', async () => {
      const existingDeviceId = 'device_1641234567890_123456';
      mockLocalStorage.getItem.mockReturnValue(existingDeviceId);
      
      const deviceId = await service.getDeviceId();
      
      expect(deviceId).toBe(existingDeviceId);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('device_id');
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should return cached device ID on subsequent calls', async () => {
      const existingDeviceId = 'device_1641234567890_123456';
      mockLocalStorage.getItem.mockReturnValue(existingDeviceId);
      
      const deviceId1 = await service.getDeviceId();
      const deviceId2 = await service.getDeviceId();
      const deviceId3 = await service.getDeviceId();
      
      expect(deviceId1).toBe(existingDeviceId);
      expect(deviceId2).toBe(existingDeviceId);
      expect(deviceId3).toBe(existingDeviceId);
      
      // localStorage should only be accessed once for the first call
      expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(1);
    });

    it('should save new device ID to localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const deviceId = await service.getDeviceId();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('device_id', deviceId);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage getItem errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });
      
      const deviceId = await service.getDeviceId();
      
      expect(deviceId).toMatch(/^device_\d+_\d{6}$/);
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to load device ID from localStorage:',
        expect.any(Error)
      );
    });

    it('should handle localStorage setItem errors gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded');
      });
      
      const deviceId = await service.getDeviceId();
      
      expect(deviceId).toMatch(/^device_\d+_\d{6}$/);
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to save device ID to localStorage:',
        expect.any(Error)
      );
    });

    it('should still work when localStorage is completely unavailable', async () => {
      // Simulate localStorage being unavailable
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });
      
      const newService = DeviceIdService.getInstance();
      const deviceId = await newService.getDeviceId();
      
      expect(deviceId).toMatch(/^device_\d+_\d{6}$/);
    });
  });

  describe('Reset Functionality', () => {
    it('should clear cached device ID', async () => {
      const existingDeviceId = 'device_1641234567890_123456';
      
      // Completely reset everything at the start of this test
      (service as any).deviceId = null;
      
      // Re-establish the localStorage mock to ensure it's working
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
        configurable: true
      });
      
      mockLocalStorage.getItem.mockClear();
      mockLocalStorage.setItem.mockClear();
      mockLocalStorage.removeItem.mockClear();
      
      // First, mock localStorage to return existing device ID and verify it loads
      mockLocalStorage.getItem.mockReturnValue(existingDeviceId);
      const deviceId1 = await service.getDeviceId();
      expect(deviceId1).toBe(existingDeviceId);
      
      // Reset should clear the cached device ID
      service.reset();
      
      // After reset, mock localStorage to return null (no stored device ID)
      mockLocalStorage.getItem.mockReturnValue(null);
      const deviceId2 = await service.getDeviceId();
      
      expect(deviceId2).toMatch(/^device_\d+_\d{6}$/);
      expect(deviceId2).not.toBe(deviceId1);
    });

    it('should remove device ID from localStorage when reset is called', () => {
      // Reset test state completely and re-establish localStorage mock
      (service as any).deviceId = null;
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
        configurable: true
      });
      mockLocalStorage.getItem.mockClear();
      mockLocalStorage.setItem.mockClear();
      mockLocalStorage.removeItem.mockClear();
      
      // Reset should call removeItem
      service.reset();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('device_id');
    });

    it('should handle localStorage removeItem errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });
      
      service.reset();
      
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to remove device ID from localStorage:',
        expect.any(Error)
      );
    });

    it('should allow generating new device ID after reset', async () => {
      const existingDeviceId = 'old_device_id';
      
      // Reset test state completely and re-establish localStorage mock
      (service as any).deviceId = null;
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
        configurable: true
      });
      mockLocalStorage.getItem.mockClear();
      mockLocalStorage.setItem.mockClear();
      mockLocalStorage.removeItem.mockClear();
      
      // Set up existing device ID in localStorage
      mockLocalStorage.getItem.mockReturnValue(existingDeviceId);
      const oldDeviceId = await service.getDeviceId();
      expect(oldDeviceId).toBe(existingDeviceId);
      
      // Reset and setup for new device ID generation
      service.reset();
      
      // Mock localStorage to return null after reset (simulating cleared storage)
      mockLocalStorage.getItem.mockReturnValue(null);
      const newDeviceId = await service.getDeviceId();
      
      expect(newDeviceId).toMatch(/^device_\d+_\d{6}$/);
      expect(newDeviceId).not.toBe(oldDeviceId);
    });
  });

  describe('Multiple Instance Prevention', () => {
    it('should maintain state across getInstance calls', async () => {
      const existingDeviceId = 'device_1641234567890_123456';
      
      // Reset test state completely and re-establish localStorage mock
      (service as any).deviceId = null;
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
        configurable: true
      });
      mockLocalStorage.getItem.mockClear();
      mockLocalStorage.setItem.mockClear();
      mockLocalStorage.removeItem.mockClear();
      
      // Set up localStorage mock before any calls
      mockLocalStorage.getItem.mockReturnValue(existingDeviceId);
      
      // Get device ID from first instance 
      const instance1 = DeviceIdService.getInstance();
      const deviceId1 = await instance1.getDeviceId();
      
      // Get device ID from second instance (should be same due to singleton)
      const instance2 = DeviceIdService.getInstance();
      const deviceId2 = await instance2.getDeviceId();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(service); // Should be same as the service from beforeEach
      expect(deviceId1).toBe(deviceId2);
      expect(deviceId1).toBe(existingDeviceId);
      // localStorage.getItem should only be called once since second call is cached
      expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance', () => {
    it('should be fast for cached device ID retrieval', async () => {
      const existingDeviceId = 'device_1641234567890_123456';
      mockLocalStorage.getItem.mockReturnValue(existingDeviceId);
      
      // First call loads from localStorage
      const start1 = performance.now();
      await service.getDeviceId();
      const duration1 = performance.now() - start1;
      
      // Subsequent calls should be much faster (cached)
      const start2 = performance.now();
      await service.getDeviceId();
      const duration2 = performance.now() - start2;
      
      expect(duration2).toBeLessThan(duration1);
      expect(duration2).toBeLessThan(1); // Should be less than 1ms for cached access
    });

    it('should handle rapid successive calls efficiently', async () => {
      // Reset test state completely and re-establish localStorage mock
      (service as any).deviceId = null;
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
        configurable: true
      });
      mockLocalStorage.getItem.mockClear();
      mockLocalStorage.setItem.mockClear();
      mockLocalStorage.removeItem.mockClear();
      
      // Reset the service and set up for new device ID generation
      service.reset();
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const promises = Array(100).fill(null).map(() => service.getDeviceId());
      const results = await Promise.all(promises);
      
      // All calls should return the same device ID
      const uniqueIds = Array.from(new Set(results));
      expect(uniqueIds).toHaveLength(1);
      expect(uniqueIds[0]).toMatch(/^device_\d+_\d{6}$/);
      
      // localStorage should only be accessed once despite 100 calls
      expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(1);
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
    });
  });
});
