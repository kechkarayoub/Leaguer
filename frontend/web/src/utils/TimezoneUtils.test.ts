/**
 * @jest-environment jsdom
 */

import { getAllTimezones, getLanguageOptions, getThemeOptions, TimezoneOption } from './TimezoneUtils';

// Mock moment and moment-timezone first before any imports
jest.mock('moment', () => {
  const mockMoment = (date?: any) => ({
    tz: (timezone: string) => ({
      utcOffset: () => {
        // Mock different timezone offsets for testing
        const offsets: { [key: string]: number } = {
          'UTC': 0,
          'America/New_York': -300, // UTC-5
          'Europe/London': 60,      // UTC+1
          'Asia/Tokyo': 540,        // UTC+9
          'Australia/Sydney': 660,  // UTC+11
          'America/Los_Angeles': -480, // UTC-8
          'Africa/Cairo': 120,      // UTC+2
          'Africa/Algiers': 60,     // UTC+1
          'Africa/Casablanca': 60,  // UTC+1
          'Africa/Johannesburg': 120, // UTC+2
          'Africa/Lagos': 60,       // UTC+1
          'Africa/Nairobi': 180,    // UTC+3
          'Africa/Tunis': 60,       // UTC+1
          'Europe/Amsterdam': 60,   // UTC+1
          'Europe/Berlin': 60,      // UTC+1
          'Europe/Brussels': 60,    // UTC+1
          'Europe/Budapest': 60,    // UTC+1
          'Europe/Dublin': 0,       // UTC+0
          'Europe/Madrid': 60,      // UTC+1
          'Europe/Oslo': 60,        // UTC+1
          'Europe/Paris': 60,       // UTC+1
          'Europe/Prague': 60,      // UTC+1
          'Europe/Rome': 60,        // UTC+1
          'Europe/Stockholm': 60,   // UTC+1
          'Europe/Vienna': 60,      // UTC+1
          'Europe/Warsaw': 60,      // UTC+1
          'Europe/Zurich': 60,      // UTC+1
          'Asia/Bangkok': 420,      // UTC+7
          'Asia/Shanghai': 480,     // UTC+8
          'Asia/Dhaka': 360,        // UTC+6
          'Asia/Dubai': 240,        // UTC+4
          'Asia/Hong_Kong': 480,    // UTC+8
          'Asia/Jakarta': 420,      // UTC+7
          'Asia/Karachi': 300,      // UTC+5
          'Asia/Kolkata': 330,      // UTC+5:30
          'Asia/Kuala_Lumpur': 480, // UTC+8
          'Asia/Manila': 480,       // UTC+8
          'Asia/Riyadh': 180,       // UTC+3
          'Asia/Seoul': 540,        // UTC+9
          'Asia/Singapore': 480,    // UTC+8
          'Asia/Tehran': 210,       // UTC+3:30
          'America/Anchorage': -540, // UTC-9
          'America/Argentina/Buenos_Aires': -180, // UTC-3
          'America/Bogota': -300,   // UTC-5
          'America/Chicago': -360,  // UTC-6
          'America/Denver': -420,   // UTC-7
          'America/Mexico_City': -360, // UTC-6
          'America/Phoenix': -420,  // UTC-7
          'America/Sao_Paulo': -180, // UTC-3
          'America/Toronto': -300,  // UTC-5
          'America/Vancouver': -480, // UTC-8
          'Australia/Adelaide': 570, // UTC+9:30
          'Australia/Brisbane': 600, // UTC+10
          'Australia/Melbourne': 660, // UTC+11
          'Australia/Perth': 480,   // UTC+8
          'Pacific/Auckland': 720,  // UTC+12
          'Pacific/Fiji': 720,      // UTC+12
          'Pacific/Honolulu': -600, // UTC-10
          'invalid-timezone': 0,
        };
        return offsets[timezone] !== undefined ? offsets[timezone] : 0;
      }
    }),
    format: (format: string) => {
      if (format === 'YYYY-MM-DD') return '2023-01-01';
      return date || '';
    }
  });
  
  mockMoment.tz = mockMoment;
  return mockMoment;
});

jest.mock('moment-timezone', () => {
  const mockMoment = (date?: any) => ({
    tz: (timezone: string) => ({
      utcOffset: () => {
        const offsets: { [key: string]: number } = {
          'UTC': 0,
          'America/New_York': -300,
          'Europe/London': 60,
          'Asia/Tokyo': 540,
          'Australia/Sydney': 660,
          'America/Los_Angeles': -480,
          'Africa/Cairo': 120,
          'Africa/Algiers': 60,
          'Africa/Casablanca': 60,
          'Africa/Johannesburg': 120,
          'Africa/Lagos': 60,
          'Africa/Nairobi': 180,
          'Africa/Tunis': 60,
          'Europe/Amsterdam': 60,
          'Europe/Berlin': 60,
          'Europe/Brussels': 60,
          'Europe/Budapest': 60,
          'Europe/Dublin': 0,
          'Europe/Madrid': 60,
          'Europe/Oslo': 60,
          'Europe/Paris': 60,
          'Europe/Prague': 60,
          'Europe/Rome': 60,
          'Europe/Stockholm': 60,
          'Europe/Vienna': 60,
          'Europe/Warsaw': 60,
          'Europe/Zurich': 60,
          'Asia/Bangkok': 420,
          'Asia/Shanghai': 480,
          'Asia/Dhaka': 360,
          'Asia/Dubai': 240,
          'Asia/Hong_Kong': 480,
          'Asia/Jakarta': 420,
          'Asia/Karachi': 300,
          'Asia/Kolkata': 330,
          'Asia/Kuala_Lumpur': 480,
          'Asia/Manila': 480,
          'Asia/Riyadh': 180,
          'Asia/Seoul': 540,
          'Asia/Singapore': 480,
          'Asia/Tehran': 210,
          'America/Anchorage': -540,
          'America/Argentina/Buenos_Aires': -180,
          'America/Bogota': -300,
          'America/Chicago': -360,
          'America/Denver': -420,
          'America/Mexico_City': -360,
          'America/Phoenix': -420,
          'America/Sao_Paulo': -180,
          'America/Toronto': -300,
          'America/Vancouver': -480,
          'Australia/Adelaide': 570,
          'Australia/Brisbane': 600,
          'Australia/Melbourne': 660,
          'Australia/Perth': 480,
          'Pacific/Auckland': 720,
          'Pacific/Fiji': 720,
          'Pacific/Honolulu': -600,
        };
        return offsets[timezone] !== undefined ? offsets[timezone] : 0;
      }
    }),
    format: (format: string) => {
      if (format === 'YYYY-MM-DD') return '2023-01-01';
      return date || '';
    }
  });
  
  mockMoment.tz = mockMoment;
  return mockMoment;
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
