/**
 * SecureStorageService Tests - Simplified Version
 * 
 * Tests for the secure storage service with encryption capabilities
 */

import SecureStorageService from './SecureStorageService';
import CryptoJS from 'crypto-js';

// Mock CryptoJS properly - define the mock object first
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
  enc: {
    Utf8: 'utf8', // This is used as a parameter to toString()
  },
}));

// Mock Storage APIs
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

// Mock global storage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('SecureStorageService', () => {
  let service: SecureStorageService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up CryptoJS mocks properly
    (CryptoJS.AES.encrypt as jest.Mock).mockReturnValue({
      toString: jest.fn().mockReturnValue('encrypted_data')
    });
    
    (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
      toString: jest.fn().mockImplementation((encoding) => {
        if (encoding === 'utf8') {
          return 'decrypted_data';
        }
        return 'decrypted_data';
      })
    });
    
    // Reset singleton instance
    (SecureStorageService as any).instance = undefined;
    
    // Get fresh service instance
    service = SecureStorageService.getInstance();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SecureStorageService.getInstance();
      const instance2 = SecureStorageService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(service);
    });

    it('should maintain the same instance across multiple calls', () => {
      const instances = Array.from({ length: 5 }, () => 
        SecureStorageService.getInstance()
      );
      
      instances.forEach(instance => {
        expect(instance).toBe(service);
      });
    });
  });

  describe('Local Storage Operations', () => {
    describe('setItem and getItem', () => {
      it('should encrypt and store data', async () => {
        const key = 'test_key';
        const value = 'test_value';
        
        await service.setItem(key, value);
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          `secure_${key}`,
          'encrypted_data'
        );
      });

      it('should retrieve and decrypt data', async () => {
        const key = 'test_key';
        mockLocalStorage.getItem.mockReturnValue('encrypted_data');
        
        const result = await service.getItem(key);
        
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith(`secure_${key}`);
        expect(result).toBe('decrypted_data');
      });

      it('should return null for non-existent items', async () => {
        const key = 'non_existent_key';
        mockLocalStorage.getItem.mockReturnValue(null);
        
        const result = await service.getItem(key);
        
        expect(result).toBeNull();
      });
    });

    describe('removeItem', () => {
      it('should remove item from localStorage', async () => {
        const key = 'test_key';
        
        await service.removeItem(key);
        
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(`secure_${key}`);
      });
    });

    describe('exists', () => {
      it('should return true if key exists', async () => {
        const key = 'test_key';
        mockLocalStorage.getItem.mockReturnValue('some_value');
        
        const result = await service.exists(key);
        
        expect(result).toBe(true);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith(`secure_${key}`);
      });

      it('should return false if key does not exist', async () => {
        const key = 'test_key';
        mockLocalStorage.getItem.mockReturnValue(null);
        
        const result = await service.exists(key);
        
        expect(result).toBe(false);
      });
    });
  });

  describe('Session Storage Operations', () => {
    describe('setSessionItem and getSessionItem', () => {
      it('should encrypt and store data in session storage', async () => {
        const key = 'test_key';
        const value = 'test_value';
        
        await service.setSessionItem(key, value);
        
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          `secure_${key}`,
          'encrypted_data'
        );
      });

      it('should retrieve and decrypt data from session storage', async () => {
        const key = 'test_key';
        mockSessionStorage.getItem.mockReturnValue('encrypted_data');
        
        const result = await service.getSessionItem(key);
        
        expect(mockSessionStorage.getItem).toHaveBeenCalledWith(`secure_${key}`);
        expect(result).toBe('decrypted_data');
      });

      it('should return null for non-existent session items', async () => {
        const key = 'non_existent_key';
        mockSessionStorage.getItem.mockReturnValue(null);
        
        const result = await service.getSessionItem(key);
        
        expect(result).toBeNull();
      });
    });

    describe('removeSessionItem', () => {
      it('should remove item from sessionStorage', async () => {
        const key = 'test_key';
        
        await service.removeSessionItem(key);
        
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(`secure_${key}`);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle storage access errors gracefully', async () => {
      const key = 'test_key';
      const value = 'test_value';
      const error = new Error('Storage quota exceeded');
      
      mockLocalStorage.setItem.mockImplementation(() => {
        throw error;
      });
      
      await expect(service.setItem(key, value)).rejects.toThrow(error);
    });

    it('should handle encryption errors gracefully', async () => {
      const key = 'test_key';
      const value = 'test_value';
      
      const CryptoJS = require('crypto-js');
      CryptoJS.AES.encrypt.mockImplementation(() => {
        throw new Error('Encryption failed');
      });
      
      await expect(service.setItem(key, value)).rejects.toThrow('Encryption failed');
    });

    it('should handle decryption errors gracefully', async () => {
      const key = 'test_key';
      mockLocalStorage.getItem.mockReturnValue('invalid_encrypted_data');
      
      const CryptoJS = require('crypto-js');
      CryptoJS.AES.decrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });
      
      const result = await service.getItem(key);
      expect(result).toBeNull();
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should maintain proper TypeScript types', async () => {
      // Test method signatures
      expect(typeof service.setItem).toBe('function');
      expect(typeof service.getItem).toBe('function');
      expect(typeof service.removeItem).toBe('function');
      expect(typeof service.exists).toBe('function');
      expect(typeof service.setSessionItem).toBe('function');
      expect(typeof service.getSessionItem).toBe('function');
      expect(typeof service.removeSessionItem).toBe('function');
      
      // Test return types
      const existsResult = await service.exists('test');
      expect(typeof existsResult).toBe('boolean');
      
      // Test null handling
      mockLocalStorage.getItem.mockReturnValue(null);
      const nullResult = await service.getItem('test');
      expect(nullResult).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should create singleton instance efficiently', () => {
      const startTime = performance.now();
      const instance = SecureStorageService.getInstance();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
      expect(instance).toBeDefined();
    });

    it('should handle multiple operations efficiently', async () => {
      const startTime = performance.now();
      
      // Perform multiple operations
      await service.setItem('key1', 'value1');
      await service.setItem('key2', 'value2');
      await service.getItem('key1');
      await service.getItem('key2');
      await service.exists('key1');
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(200); // Should complete quickly
    });

    it('should maintain singleton efficiency across operations', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        SecureStorageService.getInstance();
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });
  });
});
