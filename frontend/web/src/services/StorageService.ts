/**
 * Storage Service
 * 
 * A service for managing local storage operations.
 * Supports both localStorage and sessionStorage with automatic JSON serialization.
 */

export type StorageType = 'local' | 'session';

class StorageService {
  private static instance: StorageService;
  private storage: Storage;

  private constructor(type: StorageType = 'local') {
    this.storage = type === 'local' ? localStorage : sessionStorage;
  }

  public static getInstance(type: StorageType = 'local'): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService(type);
    }
    return StorageService.instance;
  }

  /**
   * Save data to storage
   */
  public async set<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      this.storage.setItem(key, serialized);
    } catch (error) {
      console.error(`Failed to save to storage (${key}):`, error);
      throw error;
    }
  }

  /**
   * Get data from storage
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      const serialized = this.storage.getItem(key);
      if (serialized === null) {
        return null;
      }
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error(`Failed to load from storage (${key}):`, error);
      return null;
    }
  }

  /**
   * Remove data from storage
   */
  public async remove(key: string): Promise<void> {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove from storage (${key}):`, error);
      throw error;
    }
  }

  /**
   * Clear all data from storage
   */
  public async clear(): Promise<void> {
    try {
      this.storage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  /**
   * Check if key exists in storage
   */
  public async exists(key: string): Promise<boolean> {
    try {
      return this.storage.getItem(key) !== null;
    } catch (error) {
      console.error(`Failed to check storage existence (${key}):`, error);
      return false;
    }
  }

  /**
   * Get all keys from storage
   */
  public async getAllKeys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error('Failed to get all keys from storage:', error);
      return [];
    }
  }
}

export default StorageService;
