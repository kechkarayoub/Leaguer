/**
 * UserUtils Tests
 * 
 * Tests for user-related utility functions
 */

import { getMenuItems } from './UserUtils';
import HomeIcon from '../components/icons/HomeIcon';
import SettingsIcon from '../components/icons/SettingsIcon';

// Mock the icon components
jest.mock('../components/icons/HomeIcon', () => 'HomeIcon');
jest.mock('../components/icons/SettingsIcon', () => 'SettingsIcon');

describe('UserUtils', () => {
  describe('getMenuItems', () => {
    let mockT: jest.Mock;

    beforeEach(() => {
      mockT = jest.fn((key: string) => {
        const translations: { [key: string]: string } = {
          'navigation:home': 'Home',
          'navigation:settings': 'Settings',
        };
        return translations[key] || key;
      });
    });

    it('should return basic menu items for regular user', () => {
      const user = { isAdmin: false };
      
      const menuItems = getMenuItems(user, mockT);
      
      expect(menuItems).toHaveLength(2);
      expect(menuItems[0]).toEqual({
        key: 'home',
        label: 'Home',
        path: '/',
        icon: HomeIcon,
      });
      expect(menuItems[1]).toEqual({
        key: 'settings',
        label: 'Settings',
        path: '/settings',
        icon: SettingsIcon,
      });
    });

    it('should return basic menu items for admin user', () => {
      const user = { isAdmin: true };
      
      const menuItems = getMenuItems(user, mockT);
      
      // Currently admin users get the same menu items
      // This test documents the current behavior
      expect(menuItems).toHaveLength(2);
      expect(menuItems[0]).toEqual({
        key: 'home',
        label: 'Home',
        path: '/',
        icon: HomeIcon,
      });
      expect(menuItems[1]).toEqual({
        key: 'settings',
        label: 'Settings',
        path: '/settings',
        icon: SettingsIcon,
      });
    });

    it('should handle null user', () => {
      const user = null as any; // Cast to allow null for testing
      
      const menuItems = getMenuItems(user, mockT);
      
      expect(menuItems).toHaveLength(2);
      expect(menuItems[0].key).toBe('home');
      expect(menuItems[1].key).toBe('settings');
    });

    it('should handle undefined user', () => {
      const user = undefined as any; // Cast to allow undefined for testing
      
      const menuItems = getMenuItems(user, mockT);
      
      expect(menuItems).toHaveLength(2);
      expect(menuItems[0].key).toBe('home');
      expect(menuItems[1].key).toBe('settings');
    });

    it('should handle user without isAdmin property', () => {
      const user = { name: 'John Doe' };
      
      const menuItems = getMenuItems(user, mockT);
      
      expect(menuItems).toHaveLength(2);
      expect(menuItems[0].key).toBe('home');
      expect(menuItems[1].key).toBe('settings');
    });

    it('should use translation function for labels', () => {
      const user = { isAdmin: false };
      
      getMenuItems(user, mockT);
      
      expect(mockT).toHaveBeenCalledWith('navigation:home');
      expect(mockT).toHaveBeenCalledWith('navigation:settings');
      expect(mockT).toHaveBeenCalledTimes(2);
    });

    it('should handle custom translation function', () => {
      const customT = jest.fn((key: string) => `Custom ${key}`);
      const user = { isAdmin: false };
      
      const menuItems = getMenuItems(user, customT);
      
      expect(menuItems[0].label).toBe('Custom navigation:home');
      expect(menuItems[1].label).toBe('Custom navigation:settings');
    });

    it('should maintain consistent menu structure', () => {
      const user = { isAdmin: false };
      
      const menuItems = getMenuItems(user, mockT);
      
      menuItems.forEach(item => {
        expect(item).toHaveProperty('key');
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('path');
        expect(item).toHaveProperty('icon');
        expect(typeof item.key).toBe('string');
        expect(typeof item.label).toBe('string');
        expect(typeof item.path).toBe('string');
      });
    });

    it('should have correct icon assignments', () => {
      const user = { isAdmin: false };
      
      const menuItems = getMenuItems(user, mockT);
      
      const homeItem = menuItems.find(item => item.key === 'home');
      const settingsItem = menuItems.find(item => item.key === 'settings');
      
      expect(homeItem?.icon).toBe(HomeIcon);
      expect(settingsItem?.icon).toBe(SettingsIcon);
    });

    it('should have correct paths', () => {
      const user = { isAdmin: false };
      
      const menuItems = getMenuItems(user, mockT);
      
      const homeItem = menuItems.find(item => item.key === 'home');
      const settingsItem = menuItems.find(item => item.key === 'settings');
      
      expect(homeItem?.path).toBe('/');
      expect(settingsItem?.path).toBe('/settings');
    });
  });

  describe('Menu Items Structure', () => {
    let mockT: jest.Mock;

    beforeEach(() => {
      mockT = jest.fn((key: string) => key);
    });

    it('should always include home as first item', () => {
      const user = { isAdmin: true };
      
      const menuItems = getMenuItems(user, mockT);
      
      expect(menuItems[0].key).toBe('home');
      expect(menuItems[0].path).toBe('/');
    });

    it('should always include settings as last item', () => {
      const user = { isAdmin: true };
      
      const menuItems = getMenuItems(user, mockT);
      
      const lastItem = menuItems[menuItems.length - 1];
      expect(lastItem.key).toBe('settings');
      expect(lastItem.path).toBe('/settings');
    });

    it('should return menu items in consistent order', () => {
      const user1 = { isAdmin: false };
      const user2 = { isAdmin: true };
      
      const menuItems1 = getMenuItems(user1, mockT);
      const menuItems2 = getMenuItems(user2, mockT);
      
      // Keys should be in the same order regardless of user type
      const keys1 = menuItems1.map(item => item.key);
      const keys2 = menuItems2.map(item => item.key);
      
      expect(keys1).toEqual(keys2);
    });
  });

  describe('Edge Cases', () => {
    let mockT: jest.Mock;

    beforeEach(() => {
      mockT = jest.fn((key: string) => key);
    });

    it('should handle translation function that throws error', () => {
      const errorT = jest.fn(() => {
        throw new Error('Translation error');
      });
      const user = { isAdmin: false };
      
      expect(() => getMenuItems(user, errorT)).toThrow('Translation error');
    });

    it('should handle translation function that returns undefined', () => {
      const undefinedT = jest.fn(() => undefined) as any; // Cast to allow undefined return
      const user = { isAdmin: false };
      
      const menuItems = getMenuItems(user, undefinedT);
      
      expect(menuItems[0].label).toBeUndefined();
      expect(menuItems[1].label).toBeUndefined();
    });

    it('should handle complex user object', () => {
      const user = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        isAdmin: false,
        permissions: ['read', 'write'],
        profile: {
          avatar: 'avatar.jpg',
          preferences: {
            theme: 'dark'
          }
        }
      };
      
      const menuItems = getMenuItems(user, mockT);
      
      expect(menuItems).toHaveLength(2);
      expect(menuItems[0].key).toBe('home');
      expect(menuItems[1].key).toBe('settings');
    });
  });
});
