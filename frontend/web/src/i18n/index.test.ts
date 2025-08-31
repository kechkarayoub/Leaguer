/**
 * Tests for i18n Configuration
 * 
 * Tests the i18next configuration setup including:
 * - Basic initialization
 * - Configuration options
 * - Language detection
 * - Backend setup
 * - Namespace configuration
 */


import i18n from './index';

// Mock the external modules to avoid loading issues BEFORE importing i18n
jest.mock('i18next-http-backend', () => {
  const MockHttpBackend = function() {
    return {
      type: 'backend',
      init: jest.fn(),
      read: jest.fn(),
      save: jest.fn(),
    };
  };
  MockHttpBackend.type = 'backend';
  return MockHttpBackend;
});

jest.mock('i18next-browser-languagedetector', () => {
  const MockLanguageDetector = function() {
    return {
      type: 'languageDetector',
      init: jest.fn(),
      detect: jest.fn(() => 'en'),
      cacheUserLanguage: jest.fn(),
    };
  };
  MockLanguageDetector.type = 'languageDetector';
  return MockLanguageDetector;
});

describe('i18n Configuration', () => {
  describe('Basic Setup', () => {
    it('should be properly initialized', () => {
      expect(i18n).toBeDefined();
      // Check that i18n instance exists and has basic properties
      expect(i18n.options).toBeDefined();
      expect(i18n.services).toBeDefined();
    });

    it('should have correct language configuration', () => {
      // fallbackLng can be an array or string - check if 'en' is included
      const fallbackLng = i18n.options.fallbackLng;
      expect(fallbackLng).toBeDefined();
      // Check that either it's 'en' or contains 'en'
      const isValidFallback = fallbackLng === 'en' || (Array.isArray(fallbackLng) && fallbackLng.includes('en'));
      expect(isValidFallback).toBe(true);
      
      expect(i18n.options.supportedLngs).toContain('en');
      expect(i18n.options.supportedLngs).toContain('fr');
      expect(i18n.options.supportedLngs).toContain('ar');
    });

    it('should have default namespace configured', () => {
      expect(i18n.options.defaultNS).toBe('common');
    });

    it('should have all required namespaces', () => {
      const expectedNamespaces = [
        'common', 
        'auth', 
        'countries', 
        'dashboard', 
        'home', 
        'navigation', 
        'settings', 
        'profile', 
        'errors', 
        'websockets'
      ];
      expect(i18n.options.ns).toEqual(expectedNamespaces);
    });
  });

  describe('Language Detection', () => {
    it('should have language detection configured', () => {
      expect(i18n.options.detection).toBeDefined();
      const detection = i18n.options.detection as any;
      expect(detection.order).toEqual(['localStorage', 'navigator', 'htmlTag']);
      expect(detection.caches).toEqual(['localStorage']);
      expect(detection.lookupLocalStorage).toBe('i18nextLng');
    });
  });

  describe('Backend Configuration', () => {
    it('should have backend load path configured', () => {
      expect(i18n.options.backend).toBeDefined();
      const backend = i18n.options.backend as any;
      expect(backend.loadPath).toBe('/locales/{{lng}}/{{ns}}.json');
      expect(backend.addPath).toBe('/locales/{{lng}}/{{ns}}.json');
    });
  });

  describe('Interpolation Options', () => {
    it('should have interpolation configured', () => {
      expect(i18n.options.interpolation).toBeDefined();
      const interpolation = i18n.options.interpolation as any;
      expect(interpolation.escapeValue).toBe(false);
      expect(interpolation.formatSeparator).toBe(',');
    });

    it('should have custom format function', () => {
      expect(i18n.options.interpolation).toBeDefined();
      const interpolation = i18n.options.interpolation as any;
      expect(interpolation.format).toBeDefined();
      expect(typeof interpolation.format).toBe('function');
    });

    it('should format values correctly', () => {
      const interpolation = i18n.options.interpolation as any;
      const formatFn = interpolation.format;
      
      expect(formatFn('hello', 'uppercase')).toBe('HELLO');
      expect(formatFn('WORLD', 'lowercase')).toBe('world');
      expect(formatFn('test', 'capitalize')).toBe('Test');
      expect(formatFn('unchanged', 'unknown')).toBe('unchanged');
    });
  });

  describe('Key and Namespace Separators', () => {
    it('should have correct separators configured', () => {
      expect(i18n.options.keySeparator).toBe('.');
      expect(i18n.options.nsSeparator).toBe(':');
      expect(i18n.options.pluralSeparator).toBe('_');
      expect(i18n.options.contextSeparator).toBe('_');
    });
  });

  describe('React Integration', () => {
    it('should have React options configured', () => {
      expect(i18n.options.react).toBeDefined();
      const react = i18n.options.react as any;
      expect(react.useSuspense).toBe(false);
      expect(react.transSupportBasicHtmlNodes).toBe(true);
      expect(react.transKeepBasicHtmlNodesFor).toEqual(['br', 'strong', 'i', 'em', 'span']);
    });
  });

  describe('Return Value Options', () => {
    it('should have correct return options', () => {
      expect(i18n.options.returnNull).toBe(false);
      expect(i18n.options.returnEmptyString).toBe(false);
      expect(i18n.options.returnObjects).toBe(false);
    });
  });

  describe('Environment Configuration', () => {
    it('should set debug based on environment', () => {
      // Note: This test depends on the NODE_ENV at test time
      // In test environment, debug should be false
      expect(typeof i18n.options.debug).toBe('boolean');
    });
  });

  describe('Services', () => {
    it('should have required services loaded', () => {
      expect(i18n.services).toBeDefined();
      expect(i18n.services.resourceStore).toBeDefined();
      expect(i18n.services.backendConnector).toBeDefined();
      expect(i18n.services.languageDetector).toBeDefined();
    });
  });

  describe('Language Support', () => {
    it('should support English as fallback', () => {
      expect(i18n.options.supportedLngs).toContain('en');
      const fallbackLng = i18n.options.fallbackLng;
      expect(fallbackLng).toBeDefined();
      // Check that either it's 'en' or contains 'en'
      const isValidFallback = fallbackLng === 'en' || (Array.isArray(fallbackLng) && fallbackLng.includes('en'));
      expect(isValidFallback).toBe(true);
    });

    it('should support French and Arabic', () => {
      expect(i18n.options.supportedLngs).toContain('fr');
      expect(i18n.options.supportedLngs).toContain('ar');
    });

    it('should have at least 3 supported languages', () => {
      // i18next may add 'cimode' for test mode
      const supportedLngs = i18n.options.supportedLngs;
      expect(supportedLngs).toBeDefined();
      expect(Array.isArray(supportedLngs)).toBe(true);
      
      const languages = supportedLngs as string[];
      expect(languages.length).toBeGreaterThanOrEqual(3);
      expect(languages).toContain('en');
      expect(languages).toContain('fr');
      expect(languages).toContain('ar');
    });
  });

  describe('Namespace Coverage', () => {
    it('should include all application areas', () => {
      const namespaces = i18n.options.ns;
      
      // Core functionality
      expect(namespaces).toContain('common');
      expect(namespaces).toContain('auth');
      expect(namespaces).toContain('errors');
      
      // Pages
      expect(namespaces).toContain('dashboard');
      expect(namespaces).toContain('home');
      expect(namespaces).toContain('profile');
      expect(namespaces).toContain('settings');
      
      // Features
      expect(namespaces).toContain('navigation');
      expect(namespaces).toContain('countries');
      expect(namespaces).toContain('websockets');
    });

    it('should have reasonable number of namespaces', () => {
      expect(i18n.options.ns).toHaveLength(10);
    });
  });
});