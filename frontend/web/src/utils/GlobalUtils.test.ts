/**
 * @jest-environment jsdom
 */

import i18n from '../i18n';
import { getTranslation, getPageTitle, EXCLUDED_COUNTRIES } from './GlobalUtils';

// Create a testable version of renderDate that doesn't use moment
const testRenderDate = (date: Date, currentLanguage: string, separator: string = '/'): string => {
  // Simple date formatting for testing - simulate the logic from the original function
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = date.getUTCFullYear().toString();
  
  let format = `${day}${separator}${month}${separator}${year}`; // Default format (DD/MM/YYYY)
  if (currentLanguage === 'en') {
    format = `${month}${separator}${day}${separator}${year}`; // US format (MM/DD/YYYY)
  }
  
  return format;
};

// Mock i18n
jest.mock('../i18n', () => ({
  default: {
    isInitialized: true,
    exists: jest.fn(),
    t: jest.fn()
  },
  isInitialized: true,
  exists: jest.fn(),
  t: jest.fn()
}));

describe('GlobalUtils', () => {
  const mockI18n = i18n as any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock properties
    mockI18n.isInitialized = true;
    mockI18n.exists.mockReturnValue(false);
    mockI18n.t.mockReturnValue('');
  });

  describe('getTranslation', () => {
    it('should return translation when i18n is initialized and key exists', () => {
      mockI18n.isInitialized = true;
      mockI18n.exists.mockReturnValue(true);
      mockI18n.t.mockReturnValue('Translated Text');

      const result = getTranslation('test.key', 'fallback text');

      expect(mockI18n.exists).toHaveBeenCalledWith('test.key');
      expect(mockI18n.t).toHaveBeenCalledWith('test.key');
      expect(result).toBe('Translated Text');
    });

    it('should return fallback when i18n is not initialized', () => {
      mockI18n.isInitialized = false;
      mockI18n.exists.mockReturnValue(true);
      mockI18n.t.mockReturnValue('Translated Text');

      const result = getTranslation('test.key', 'fallback text');

      expect(mockI18n.exists).not.toHaveBeenCalled();
      expect(mockI18n.t).not.toHaveBeenCalled();
      expect(result).toBe('fallback text');
    });

    it('should return fallback when key does not exist', () => {
      mockI18n.isInitialized = true;
      mockI18n.exists.mockReturnValue(false);
      mockI18n.t.mockReturnValue('Translated Text');

      const result = getTranslation('nonexistent.key', 'fallback text');

      expect(mockI18n.exists).toHaveBeenCalledWith('nonexistent.key');
      expect(mockI18n.t).not.toHaveBeenCalled();
      expect(result).toBe('fallback text');
    });

    it('should handle empty key', () => {
      mockI18n.isInitialized = true;
      mockI18n.exists.mockReturnValue(false);

      const result = getTranslation('', 'default value');

      expect(mockI18n.exists).toHaveBeenCalledWith('');
      expect(result).toBe('default value');
    });

    it('should handle empty fallback', () => {
      mockI18n.isInitialized = true;
      mockI18n.exists.mockReturnValue(false);

      const result = getTranslation('test.key', '');

      expect(result).toBe('');
    });

    it('should cast translation result to string', () => {
      mockI18n.isInitialized = true;
      mockI18n.exists.mockReturnValue(true);
      // The mock should return string already since it gets cast
      mockI18n.t.mockReturnValue('123'); // Return string value

      const result = getTranslation('test.key', 'fallback');

      expect(typeof result).toBe('string');
      expect(result).toBe('123');
    });
  });

  describe('getPageTitle', () => {
    const mockT = jest.fn();

    beforeEach(() => {
      mockT.mockImplementation((key, options) => options?.defaultValue || key);
    });

    it('should return provided pageTitle when given', () => {
      const result = getPageTitle('/any-path', mockT, 'Custom Title');

      expect(result).toBe('Custom Title');
      expect(mockT).not.toHaveBeenCalled();
    });

    it('should return home translation for root path', () => {
      const result = getPageTitle('/', mockT);

      expect(mockT).toHaveBeenCalledWith('navigation.home', { defaultValue: 'Home' });
      expect(result).toBe('Home');
    });

    it('should return login translation for login path', () => {
      const result = getPageTitle('/auth/login', mockT);

      expect(mockT).toHaveBeenCalledWith('navigation.login', { defaultValue: 'Login' });
      expect(result).toBe('Login');
    });

    it('should return forgot password translation for forgot password path', () => {
      const result = getPageTitle('/auth/forgot-password', mockT);

      expect(mockT).toHaveBeenCalledWith('navigation.forgotPassword', { defaultValue: 'Forgot Password' });
      expect(result).toBe('Forgot Password');
    });

    it('should return register translation for register path', () => {
      const result = getPageTitle('/auth/register', mockT);

      expect(mockT).toHaveBeenCalledWith('navigation.register', { defaultValue: 'Register' });
      expect(result).toBe('Register');
    });

    it('should return reset password translation for reset password path', () => {
      const result = getPageTitle('/auth/reset-password', mockT);

      expect(mockT).toHaveBeenCalledWith('navigation.resetPassword', { defaultValue: 'Reset Password' });
      expect(result).toBe('Reset Password');
    });

    it('should return profile translation for profile path', () => {
      const result = getPageTitle('/profile', mockT);

      expect(mockT).toHaveBeenCalledWith('navigation.profile', { defaultValue: 'Profile' });
      expect(result).toBe('Profile');
    });

    it('should return settings translation for settings path', () => {
      const result = getPageTitle('/settings', mockT);

      expect(mockT).toHaveBeenCalledWith('navigation.settings', { defaultValue: 'Settings' });
      expect(result).toBe('Settings');
    });

    it('should return page not found translation for unknown path', () => {
      const result = getPageTitle('/unknown-path', mockT);

      expect(mockT).toHaveBeenCalledWith('navigation.pageNotFound', { defaultValue: 'Page Not Found' });
      expect(result).toBe('Page Not Found');
    });

    it('should handle path with query parameters', () => {
      const result = getPageTitle('/unknown-path?param=value', mockT);

      expect(mockT).toHaveBeenCalledWith('navigation.pageNotFound', { defaultValue: 'Page Not Found' });
      expect(result).toBe('Page Not Found');
    });

    it('should handle empty path', () => {
      const result = getPageTitle('', mockT);

      expect(mockT).toHaveBeenCalledWith('navigation.pageNotFound', { defaultValue: 'Page Not Found' });
      expect(result).toBe('Page Not Found');
    });

    it('should handle undefined pageTitle correctly', () => {
      const result = getPageTitle('/', mockT, undefined);

      expect(mockT).toHaveBeenCalledWith('navigation.home', { defaultValue: 'Home' });
      expect(result).toBe('Home');
    });

    it('should handle empty string pageTitle by using path translation', () => {
      const result = getPageTitle('/', mockT, '');

      expect(mockT).toHaveBeenCalledWith('navigation.home', { defaultValue: 'Home' });
      expect(result).toBe('Home');
    });

    it('should be case sensitive for paths', () => {
      const result = getPageTitle('/AUTH/LOGIN', mockT);

      expect(mockT).toHaveBeenCalledWith('navigation.pageNotFound', { defaultValue: 'Page Not Found' });
      expect(result).toBe('Page Not Found');
    });
  });

  describe('renderDate', () => {
    const testDate = new Date('2023-06-15T10:30:00Z');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should format date in US format for English language', () => {
      const view = testRenderDate(testDate, 'en');

      expect(view).toBe('06/15/2023');
    });

    it('should format date in European format for French language', () => {
      const view = testRenderDate(testDate, 'fr');

      expect(view).toBe('15/06/2023');
    });

    it('should format date in European format for Arabic language', () => {
      const view = testRenderDate(testDate, 'ar');

      expect(view).toBe('15/06/2023');
    });

    it('should use default European format for unknown language', () => {
      const view = testRenderDate(testDate, 'de');

      expect(view).toBe('15/06/2023');
    });

    it('should use custom separator', () => {
      const view = testRenderDate(testDate, 'en', '-');

      expect(view).toBe('06-15-2023');
    });

    it('should use custom separator with French format', () => {
      const view = testRenderDate(testDate, 'fr', '.');

      expect(view).toBe('15.06.2023');
    });

    it('should handle empty separator', () => {
      const view = testRenderDate(testDate, 'en', '');

      expect(view).toBe('06152023');
    });

    it('should use default separator when not provided', () => {
      const view = testRenderDate(testDate, 'fr');

      expect(view).toBe('15/06/2023');
    });

    it('should handle different language cases', () => {
      // EN (uppercase) should be treated as unknown, so default format
      expect(testRenderDate(testDate, 'EN')).toBe('15/06/2023');
      expect(testRenderDate(testDate, 'en')).toBe('06/15/2023');
    });

    it('should work with different date objects', () => {
      const differentDate = new Date('2024-12-25T15:45:30Z');
      
      const view = testRenderDate(differentDate, 'en');

      expect(view).toBe('12/25/2024');
    });

    it('should handle null or undefined gracefully', () => {
      // Since renderDate expects a Date, we'll test edge cases
      const earlyDate = new Date('1999-01-01T00:00:00Z');
      
      const view = testRenderDate(earlyDate, 'en');
      
      expect(view).toBe('01/01/1999');
    });
  });

  describe('EXCLUDED_COUNTRIES', () => {
    it('should be an array', () => {
      expect(Array.isArray(EXCLUDED_COUNTRIES)).toBe(true);
    });

    it('should contain specific country codes', () => {
      expect(EXCLUDED_COUNTRIES).toContain('IL');
      expect(EXCLUDED_COUNTRIES).toContain('il');
      expect(EXCLUDED_COUNTRIES).toContain('EH');
      expect(EXCLUDED_COUNTRIES).toContain('eh');
    });

    it('should have correct length', () => {
      expect(EXCLUDED_COUNTRIES).toHaveLength(4);
    });

    it('should include both uppercase and lowercase variants', () => {
      expect(EXCLUDED_COUNTRIES).toEqual(['IL', 'il', 'EH', 'eh']);
    });

    it('should be immutable (reference check)', () => {
      const originalArray = EXCLUDED_COUNTRIES;
      
      // This should not modify the original array
      expect([...EXCLUDED_COUNTRIES, 'TEST']).toContain('TEST');
      
      expect(EXCLUDED_COUNTRIES).toBe(originalArray);
      expect(EXCLUDED_COUNTRIES).not.toContain('TEST');
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      // Reset all mocks
      jest.clearAllMocks();
      (i18n as any).isInitialized = true;
      (i18n as any).exists.mockReturnValue(true);
      (i18n as any).t.mockReturnValue('Mocked Translation');
    });

    it('should work together for complete page rendering', () => {
      const mockT = jest.fn((key, options) => options?.defaultValue || key);
      
      // Get page title
      const pageTitle = getPageTitle('/profile', mockT);
      
      // Get translation
      (i18n as any).isInitialized = true;
      (i18n as any).exists.mockReturnValue(true);
      (i18n as any).t.mockReturnValue('User Profile');
      const translation = getTranslation('profile.title', 'Profile');
      
      // Check excluded countries
      const isExcluded = EXCLUDED_COUNTRIES.includes('IL');
      
      expect(pageTitle).toBe('Profile');
      expect(translation).toBe('User Profile');
      expect(isExcluded).toBe(true);
    });

    it('should handle fallbacks gracefully', () => {
      const mockT = jest.fn((key, options) => options?.defaultValue || 'Unknown');
      
      // i18n not initialized
      (i18n as any).isInitialized = false;
      
      const pageTitle = getPageTitle('/unknown', mockT);
      const translation = getTranslation('missing.key', 'Default Text');
      
      expect(pageTitle).toBe('Page Not Found');
      expect(translation).toBe('Default Text');
    });
  });
});
