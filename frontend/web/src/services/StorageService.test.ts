/**
 * StorageService Tests
 * 
 * Tests for the general storage service with JSON serialization
 */

import StorageService from './StorageService';

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

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('StorageService', () => {
  beforeEach(() => {
    // Reset singleton instance
    (StorageService as any).instance = undefined;
    
    // Clear all mocks
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockLocalStorage.clear.mockClear();
    mockLocalStorage.key.mockClear();
    mockSessionStorage.getItem.mockClear();
    mockSessionStorage.setItem.mockClear();
    mockSessionStorage.removeItem.mockClear();
    mockSessionStorage.clear.mockClear();
    mockSessionStorage.key.mockClear();
    
    // Reset console errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance for same storage type', () => {
      const instance1 = StorageService.getInstance('local');
      const instance2 = StorageService.getInstance('local');
      
      expect(instance1).toBe(instance2);
    });

    it('should default to localStorage when no type specified', () => {
      const service = StorageService.getInstance();
      
      // Test by making a call and checking which storage is used
      service.set('test', 'value');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('should use sessionStorage when specified', () => {
      const service = StorageService.getInstance('session');
      
      // Test by making a call and checking which storage is used
      service.set('test', 'value');
      
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('LocalStorage Operations', () => {
    let service: StorageService;

    beforeEach(() => {
      service = StorageService.getInstance('local');
    });

    describe('set', () => {
      it('should serialize and store data', async () => {
        const key = 'test_key';
        const value = { name: 'John', age: 30 };
        
        await service.set(key, value);
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          key,
          JSON.stringify(value)
        );
      });

      it('should handle primitive values', async () => {
        const testCases = [
          ['string_key', 'string_value'],
          ['number_key', 42],
          ['boolean_key', true],
          ['null_key', null],
        ];
        
        for (const [key, value] of testCases) {
          await service.set(key as string, value);
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            key,
            JSON.stringify(value)
          );
        }
      });

      it('should handle complex objects', async () => {
        const complexObject = {
          user: {
            id: 1,
            profile: {
              name: 'John Doe',
              preferences: ['dark_mode', 'notifications'],
              settings: {
                theme: 'dark',
                language: 'en',
              },
            },
          },
          metadata: {
            lastLogin: new Date().toISOString(),
            version: '1.0.0',
          },
        };
        
        await service.set('complex', complexObject);
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'complex',
          JSON.stringify(complexObject)
        );
      });

      it('should handle arrays', async () => {
        const arrayValue = [1, 'two', { three: 3 }, [4, 5]];
        
        await service.set('array', arrayValue);
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'array',
          JSON.stringify(arrayValue)
        );
      });

      it('should handle storage errors', async () => {
        const key = 'error_key';
        const value = 'error_value';
        const error = new Error('Storage quota exceeded');
        
        mockLocalStorage.setItem.mockImplementation(() => {
          throw error;
        });
        
        await expect(service.set(key, value)).rejects.toThrow(error);
        expect(console.error).toHaveBeenCalledWith(
          `Failed to save to storage (${key}):`,
          error
        );
      });

      it('should handle JSON serialization errors', async () => {
        const key = 'circular_key';
        const circularValue: any = { name: 'test' };
        circularValue.self = circularValue; // Create circular reference
        
        await expect(service.set(key, circularValue)).rejects.toThrow();
        expect(console.error).toHaveBeenCalledWith(
          `Failed to save to storage (${key}):`,
          expect.any(Error)
        );
      });
    });

    describe('get', () => {
      it('should retrieve and deserialize data', async () => {
        const key = 'test_key';
        const value = { name: 'John', age: 30 };
        const serializedValue = JSON.stringify(value);
        
        mockLocalStorage.getItem.mockReturnValue(serializedValue);
        
        const result = await service.get(key);
        
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith(key);
        expect(result).toEqual(value);
      });

      it('should return null for non-existent keys', async () => {
        const key = 'nonexistent_key';
        mockLocalStorage.getItem.mockReturnValue(null);
        
        const result = await service.get(key);
        
        expect(result).toBeNull();
      });

      it('should handle primitive values', async () => {
        const testCases = [
          ['string_key', 'string_value'],
          ['number_key', 42],
          ['boolean_key', true],
          ['null_key', null],
        ];
        
        for (const [key, expectedValue] of testCases) {
          mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expectedValue));

          const result = await service.get(key as string);
          expect(result).toEqual(expectedValue);
        }
      });

      it('should handle complex objects', async () => {
        const complexObject = {
          user: {
            id: 1,
            profile: {
              name: 'John Doe',
              preferences: ['dark_mode', 'notifications'],
            },
          },
        };
        
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(complexObject));
        
        const result = await service.get('complex');
        expect(result).toEqual(complexObject);
      });

      it('should handle storage errors', async () => {
        const key = 'error_key';
        const error = new Error('Storage access denied');
        
        mockLocalStorage.getItem.mockImplementation(() => {
          throw error;
        });
        
        const result = await service.get(key);
        
        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalledWith(
          `Failed to load from storage (${key}):`,
          error
        );
      });

      it('should handle JSON parsing errors', async () => {
        const key = 'malformed_key';
        const malformedJson = '{"name": "John", "age": }'; // Invalid JSON
        
        mockLocalStorage.getItem.mockReturnValue(malformedJson);
        
        const result = await service.get(key);
        
        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalledWith(
          `Failed to load from storage (${key}):`,
          expect.any(Error)
        );
      });
    });

    describe('remove', () => {
      it('should remove item from storage', async () => {
        const key = 'test_key';
        
        await service.remove(key);
        
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(key);
      });

      it('should handle removal errors', async () => {
        const key = 'error_key';
        const error = new Error('Storage access denied');
        
        mockLocalStorage.removeItem.mockImplementation(() => {
          throw error;
        });
        
        await expect(service.remove(key)).rejects.toThrow(error);
        expect(console.error).toHaveBeenCalledWith(
          `Failed to remove from storage (${key}):`,
          error
        );
      });
    });

    describe('clear', () => {
      it('should clear all storage', async () => {
        await service.clear();
        
        expect(mockLocalStorage.clear).toHaveBeenCalled();
      });

      it('should handle clear errors', async () => {
        const error = new Error('Storage access denied');
        
        mockLocalStorage.clear.mockImplementation(() => {
          throw error;
        });
        
        await expect(service.clear()).rejects.toThrow(error);
        expect(console.error).toHaveBeenCalledWith(
          'Failed to clear storage:',
          error
        );
      });
    });

    describe('exists', () => {
      it('should return true if key exists', async () => {
        const key = 'existing_key';
        mockLocalStorage.getItem.mockReturnValue('some_value');
        
        const result = await service.exists(key);
        
        expect(result).toBe(true);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith(key);
      });

      it('should return false if key does not exist', async () => {
        const key = 'nonexistent_key';
        mockLocalStorage.getItem.mockReturnValue(null);
        
        const result = await service.exists(key);
        
        expect(result).toBe(false);
      });

      it('should handle exists check errors', async () => {
        const key = 'error_key';
        const error = new Error('Storage access denied');
        
        mockLocalStorage.getItem.mockImplementation(() => {
          throw error;
        });
        
        const result = await service.exists(key);
        
        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalledWith(
          `Failed to check storage existence (${key}):`,
          error
        );
      });
    });

    describe('getAllKeys', () => {
      it('should return all storage keys', async () => {
        const expectedKeys = ['key1', 'key2', 'key3'];
        Object.defineProperty(mockLocalStorage, 'length', { value: 3 });
        mockLocalStorage.key
          .mockReturnValueOnce('key1')
          .mockReturnValueOnce('key2')
          .mockReturnValueOnce('key3');
        
        const result = await service.getAllKeys();
        
        expect(result).toEqual(expectedKeys);
        expect(mockLocalStorage.key).toHaveBeenCalledTimes(3);
      });

      it('should handle null keys', async () => {
        Object.defineProperty(mockLocalStorage, 'length', { value: 3 });
        mockLocalStorage.key
          .mockReturnValueOnce('key1')
          .mockReturnValueOnce(null) // This can happen in some browsers
          .mockReturnValueOnce('key3');
        
        const result = await service.getAllKeys();
        
        expect(result).toEqual(['key1', 'key3']);
      });

      it('should return empty array if no keys', async () => {
        Object.defineProperty(mockLocalStorage, 'length', { value: 0 });
        
        const result = await service.getAllKeys();
        
        expect(result).toEqual([]);
      });

      it('should handle getAllKeys errors', async () => {
        const error = new Error('Storage access denied');
        Object.defineProperty(mockLocalStorage, 'length', {
          get: () => {
            throw error;
          },
        });
        
        const result = await service.getAllKeys();
        
        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith(
          'Failed to get all keys from storage:',
          error
        );
      });
    });
  });

  describe('SessionStorage Operations', () => {
    let service: StorageService;

    beforeEach(() => {
      service = StorageService.getInstance('session');
    });

    it('should use sessionStorage for all operations', async () => {
      const key = 'session_key';
      const value = { session: 'data' };
      
      // Test set
      await service.set(key, value);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        key,
        JSON.stringify(value)
      );
      
      // Test get
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(value));
      const result = await service.get(key);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith(key);
      expect(result).toEqual(value);
      
      // Test remove
      await service.remove(key);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(key);
      
      // Test clear
      await service.clear();
      expect(mockSessionStorage.clear).toHaveBeenCalled();
      
      // Test exists
      mockSessionStorage.getItem.mockReturnValue('some_value');
      const exists = await service.exists(key);
      expect(exists).toBe(true);
      
      // Ensure localStorage was not used
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
      expect(mockLocalStorage.clear).not.toHaveBeenCalled();
    });
  });

  describe('TypeScript Generics', () => {
    let service: StorageService;

    beforeEach(() => {
      service = StorageService.getInstance('local');
    });

    it('should maintain type safety with generics', async () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }
      
      const user: User = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      };
      
      await service.set<User>('user', user);
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(user));
      const retrievedUser = await service.get<User>('user');
      
      expect(retrievedUser).toEqual(user);
      expect(retrievedUser?.id).toBe(1);
      expect(retrievedUser?.name).toBe('John Doe');
      expect(retrievedUser?.email).toBe('john@example.com');
    });

    it('should handle array types with generics', async () => {
      const numbers: number[] = [1, 2, 3, 4, 5];
      
      await service.set<number[]>('numbers', numbers);
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(numbers));
      const retrievedNumbers = await service.get<number[]>('numbers');
      
      expect(retrievedNumbers).toEqual(numbers);
      expect(Array.isArray(retrievedNumbers)).toBe(true);
    });
  });

  describe('Data Consistency', () => {
    let service: StorageService;

    beforeEach(() => {
      service = StorageService.getInstance('local');
    });

    it('should maintain data integrity for roundtrip operations', async () => {
      const testData = {
        string: 'test string',
        number: 123.45,
        boolean: true,
        array: [1, 'two', { three: 3 }],
        object: {
          nested: {
            deeply: {
              value: 'deep value',
            },
          },
        },
        nullValue: null,
        undefinedValue: undefined, // Will be lost in JSON serialization
      };
      
      await service.set('roundtrip', testData);
      
      // Get the serialized data that was stored
      const storedCall = mockLocalStorage.setItem.mock.calls[0];
      const serializedData = storedCall[1];
      
      // Mock getItem to return the same serialized data
      mockLocalStorage.getItem.mockReturnValue(serializedData);
      
      const retrievedData = await service.get('roundtrip');
      
      // Note: undefined values are lost in JSON serialization
      const expectedData = { ...testData };
      delete expectedData.undefinedValue;
      
      expect(retrievedData).toEqual(expectedData);
    });

    it('should handle date objects (which get stringified)', async () => {
      const data = {
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date(),
      };
      
      await service.set('dates', data);
      
      const storedCall = mockLocalStorage.setItem.mock.calls[0];
      const serializedData = storedCall[1];
      mockLocalStorage.getItem.mockReturnValue(serializedData);
      
      const retrievedData = await service.get('dates');
      
      // Assert type before property access
      expect(typeof (retrievedData as any).createdAt).toBe('string');
      expect(typeof (retrievedData as any).updatedAt).toBe('string');
    });
  });

  describe('Performance', () => {
    let service: StorageService;

    beforeEach(() => {
      service = StorageService.getInstance('local');
    });

    it('should handle large datasets efficiently', async () => {
      const largeArray = Array(1000).fill(null).map((_, index) => ({
        id: index,
        name: `User ${index}`,
        data: `Large data string for user ${index}`.repeat(10),
      }));
      
      const startTime = performance.now();
      await service.set('large_dataset', largeArray);
      const endTime = performance.now();
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(100); // 100ms threshold
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'large_dataset',
        JSON.stringify(largeArray)
      );
    });

    it('should handle concurrent operations', async () => {
      const operations = [];
      
      // Create 20 concurrent operations
      for (let i = 0; i < 20; i++) {
        operations.push(service.set(`key${i}`, { value: i }));
      }
      
      await expect(Promise.all(operations)).resolves.toBeDefined();
      
      // Each operation should have called setItem
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(20);
    });
  });
});
