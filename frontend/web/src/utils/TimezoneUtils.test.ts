/**
 * @jest-environment jsdom
 */

import { getAllTimezones, getLanguageOptions, getThemeOptions, TimezoneOption } from './TimezoneUtils';

// Mock moment-timezone
jest.mock('moment-timezone', () => {
  const actualMoment = jest.requireActual('moment-timezone');
  
  return {
    ...actualMoment,
    default: jest.fn(() => ({
      tz: jest.fn((timezone: string) => ({
        utcOffset: jest.fn(() => {
          // Mock different timezone offsets for testing
          const offsets: { [key: string]: number } = {
            'UTC': 0,
            'America/New_York': -300, // UTC-5
            'Europe/London': 60,      // UTC+1
            'Asia/Tokyo': 540,        // UTC+9
            'Australia/Sydney': 660,  // UTC+11
            'America/Los_Angeles': -480, // UTC-8
            'invalid-timezone': 0,
          };
          return offsets[timezone] !== undefined ? offsets[timezone] : 0;
        })
      }))
    }))
  };
});

describe('TimezoneUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTimezones', () => {
    it('should return an array of timezone options', () => {
      const timezones = getAllTimezones();
      
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
    });

    it('should return timezone options with correct structure', () => {
      const timezones = getAllTimezones();
      
      timezones.forEach((timezone: TimezoneOption) => {
        expect(timezone).toHaveProperty('value');
        expect(timezone).toHaveProperty('label');
        expect(typeof timezone.value).toBe('string');
        expect(typeof timezone.label).toBe('string');
      });
    });

    it('should include major timezones from all continents', () => {
      const timezones = getAllTimezones();
      const timezoneValues = timezones.map(tz => tz.value);
      
      // Check for major timezones from each continent
      expect(timezoneValues).toContain('UTC');
      expect(timezoneValues).toContain('America/New_York');
      expect(timezoneValues).toContain('Europe/London');
      expect(timezoneValues).toContain('Asia/Tokyo');
      expect(timezoneValues).toContain('Australia/Sydney');
      expect(timezoneValues).toContain('Africa/Cairo');
    });

    it('should include Africa timezones', () => {
      const timezones = getAllTimezones();
      const timezoneValues = timezones.map(tz => tz.value);
      
      expect(timezoneValues).toContain('Africa/Algiers');
      expect(timezoneValues).toContain('Africa/Cairo');
      expect(timezoneValues).toContain('Africa/Casablanca');
      expect(timezoneValues).toContain('Africa/Johannesburg');
      expect(timezoneValues).toContain('Africa/Lagos');
      expect(timezoneValues).toContain('Africa/Nairobi');
      expect(timezoneValues).toContain('Africa/Tunis');
    });

    it('should include Europe timezones', () => {
      const timezones = getAllTimezones();
      const timezoneValues = timezones.map(tz => tz.value);
      
      expect(timezoneValues).toContain('Europe/Amsterdam');
      expect(timezoneValues).toContain('Europe/Berlin');
      expect(timezoneValues).toContain('Europe/London');
      expect(timezoneValues).toContain('Europe/Paris');
      expect(timezoneValues).toContain('Europe/Rome');
    });

    it('should include Asia timezones', () => {
      const timezones = getAllTimezones();
      const timezoneValues = timezones.map(tz => tz.value);
      
      expect(timezoneValues).toContain('Asia/Bangkok');
      expect(timezoneValues).toContain('Asia/Shanghai');
      expect(timezoneValues).toContain('Asia/Tokyo');
      expect(timezoneValues).toContain('Asia/Dubai');
      expect(timezoneValues).toContain('Asia/Kolkata');
    });

    it('should include America timezones', () => {
      const timezones = getAllTimezones();
      const timezoneValues = timezones.map(tz => tz.value);
      
      expect(timezoneValues).toContain('America/New_York');
      expect(timezoneValues).toContain('America/Los_Angeles');
      expect(timezoneValues).toContain('America/Chicago');
      expect(timezoneValues).toContain('America/Toronto');
      expect(timezoneValues).toContain('America/Sao_Paulo');
    });

    it('should include Australia/Pacific timezones', () => {
      const timezones = getAllTimezones();
      const timezoneValues = timezones.map(tz => tz.value);
      
      expect(timezoneValues).toContain('Australia/Sydney');
      expect(timezoneValues).toContain('Australia/Melbourne');
      expect(timezoneValues).toContain('Pacific/Auckland');
      expect(timezoneValues).toContain('Pacific/Honolulu');
    });

    it('should format labels with timezone names and offsets', () => {
      const timezones = getAllTimezones();
      
      timezones.forEach((timezone: TimezoneOption) => {
        expect(timezone.label).toContain(timezone.value);
        expect(timezone.label).toMatch(/\(UTC[+-]\d{2}:\d{2}\)/);
      });
    });

    it('should return timezones sorted alphabetically by label', () => {
      const timezones = getAllTimezones();
      const labels = timezones.map(tz => tz.label);
      const sortedLabels = [...labels].sort((a, b) => a.localeCompare(b));
      
      expect(labels).toEqual(sortedLabels);
    });

    it('should handle UTC timezone correctly', () => {
      const timezones = getAllTimezones();
      const utcTimezone = timezones.find(tz => tz.value === 'UTC');
      
      expect(utcTimezone).toBeDefined();
      expect(utcTimezone?.label).toContain('UTC');
      expect(utcTimezone?.label).toContain('UTC+00:00');
    });

    it('should not have duplicate timezones', () => {
      const timezones = getAllTimezones();
      const timezoneValues = timezones.map(tz => tz.value);
      const uniqueValues = Array.from(new Set(timezoneValues));
      
      expect(timezoneValues.length).toBe(uniqueValues.length);
    });

    it('should have reasonable number of timezones', () => {
      const timezones = getAllTimezones();
      
      // Should have a good selection but not be overwhelming
      expect(timezones.length).toBeGreaterThan(50);
      expect(timezones.length).toBeLessThan(100);
    });
  });

  describe('getLanguageOptions', () => {
    it('should return an array of language options', () => {
      const languages = getLanguageOptions();
      
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBe(3);
    });

    it('should return language options with correct structure', () => {
      const languages = getLanguageOptions();
      
      languages.forEach(language => {
        expect(language).toHaveProperty('value');
        expect(language).toHaveProperty('label');
        expect(typeof language.value).toBe('string');
        expect(typeof language.label).toBe('string');
      });
    });

    it('should include English, French, and Arabic languages', () => {
      const languages = getLanguageOptions();
      
      expect(languages).toContainEqual({ value: 'en', label: 'English' });
      expect(languages).toContainEqual({ value: 'fr', label: 'Français' });
      expect(languages).toContainEqual({ value: 'ar', label: 'العربية' });
    });

    it('should return consistent language options on multiple calls', () => {
      const languages1 = getLanguageOptions();
      const languages2 = getLanguageOptions();
      
      expect(languages1).toEqual(languages2);
    });

    it('should have unique language values', () => {
      const languages = getLanguageOptions();
      const values = languages.map(lang => lang.value);
      const uniqueValues = Array.from(new Set(values));
      
      expect(values.length).toBe(uniqueValues.length);
    });

    it('should use proper language codes', () => {
      const languages = getLanguageOptions();
      const expectedCodes = ['en', 'fr', 'ar'];
      const actualCodes = languages.map(lang => lang.value);
      
      expect(actualCodes.sort()).toEqual(expectedCodes.sort());
    });
  });

  describe('getThemeOptions', () => {
    it('should return an array of theme options', () => {
      const themes = getThemeOptions();
      
      expect(Array.isArray(themes)).toBe(true);
      expect(themes.length).toBe(3);
    });

    it('should return theme options with correct structure', () => {
      const themes = getThemeOptions();
      
      themes.forEach(theme => {
        expect(theme).toHaveProperty('value');
        expect(theme).toHaveProperty('label');
        expect(typeof theme.value).toBe('string');
        expect(typeof theme.label).toBe('string');
      });
    });

    it('should include default, light, and dark themes', () => {
      const themes = getThemeOptions();
      
      expect(themes).toContainEqual({ value: 'default', label: 'Default' });
      expect(themes).toContainEqual({ value: 'light', label: 'Light' });
      expect(themes).toContainEqual({ value: 'dark', label: 'Dark' });
    });

    it('should return consistent theme options on multiple calls', () => {
      const themes1 = getThemeOptions();
      const themes2 = getThemeOptions();
      
      expect(themes1).toEqual(themes2);
    });

    it('should have unique theme values', () => {
      const themes = getThemeOptions();
      const values = themes.map(theme => theme.value);
      const uniqueValues = Array.from(new Set(values));
      
      expect(values.length).toBe(uniqueValues.length);
    });

    it('should use meaningful theme names', () => {
      const themes = getThemeOptions();
      const expectedThemes = ['default', 'light', 'dark'];
      const actualThemes = themes.map(theme => theme.value);
      
      expect(actualThemes.sort()).toEqual(expectedThemes.sort());
    });

    it('should have proper capitalization in labels', () => {
      const themes = getThemeOptions();
      
      themes.forEach(theme => {
        expect(theme.label).toMatch(/^[A-Z]/); // Should start with capital letter
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work together for creating complete user preference options', () => {
      const timezones = getAllTimezones();
      const languages = getLanguageOptions();
      const themes = getThemeOptions();
      
      // All should return arrays
      expect(Array.isArray(timezones)).toBe(true);
      expect(Array.isArray(languages)).toBe(true);
      expect(Array.isArray(themes)).toBe(true);
      
      // All should have content
      expect(timezones.length).toBeGreaterThan(0);
      expect(languages.length).toBeGreaterThan(0);
      expect(themes.length).toBeGreaterThan(0);
      
      // All should have consistent option structure
      [...timezones, ...languages, ...themes].forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
      });
    });
  });
});
