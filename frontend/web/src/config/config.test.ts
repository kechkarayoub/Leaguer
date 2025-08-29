/**
 * Config Tests
 * 
 * Tests for application configuration module
 */

import config from './config';

// Mock environment variables
const originalEnv = process.env;

describe('Config', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Default Configuration', () => {
    it('should export a config object with correct structure', () => {
      expect(config).toBeDefined();
      expect(config).toMatchObject({
        backendEndpoint: expect.any(String),
        wsEndpoint: expect.any(String),
        firebase: {
          apiKey: expect.any(String),
          authDomain: expect.any(String),
          projectId: expect.any(String),
          storageBucket: expect.any(String),
          messagingSenderId: expect.any(String),
          appId: expect.any(String),
        },
        app: {
          name: expect.any(String),
          version: expect.any(String),
        },
      });
    });

    it('should have default backend endpoint', () => {
      expect(config.backendEndpoint).toBe('http://localhost:8080');
    });

    it('should have default websocket endpoint', () => {
      expect(config.wsEndpoint).toBe('ws://localhost:9000');
    });

    it('should have default app name', () => {
      expect(config.app.name).toBe('Leaguer');
    });

    it('should have default app version', () => {
      expect(config.app.version).toBe('1.0.0');
    });

    it('should have firebase config values', () => {
      // These might be set in environment variables, so just check they exist
      expect(config.firebase.apiKey).toBeDefined();
      expect(config.firebase.authDomain).toBeDefined();
      expect(config.firebase.projectId).toBeDefined();
      expect(config.firebase.storageBucket).toBeDefined();
      expect(config.firebase.messagingSenderId).toBeDefined();
      expect(config.firebase.appId).toBeDefined();
    });
  });

  describe('Environment Variable Override', () => {
    it('should use REACT_APP_BACKEND_ENDPOINT when provided', () => {
      process.env.REACT_APP_BACKEND_ENDPOINT = 'https://api.example.com';
      
      // Re-import config to get new environment values
      jest.resetModules();
      const { default: newConfig } = require('./config');
      
      expect(newConfig.backendEndpoint).toBe('https://api.example.com');
    });

    it('should construct websocket endpoint from host and port', () => {
      process.env.REACT_APP_WS_BACKEND_HOST = 'ws.example.com';
      process.env.REACT_APP_WS_BACKEND_PORT = '8080';

      jest.resetModules();
      const { default: newConfig } = require('./config');
      
      expect(newConfig.wsEndpoint).toBe('ws://ws.example.com:8080');
    });

    it('should use default websocket endpoint when only host is provided', () => {
      process.env.REACT_APP_WS_BACKEND_HOST = 'ws.example.com';
      delete process.env.REACT_APP_WS_BACKEND_PORT; // Ensure port is not set
      
      jest.resetModules();
      const { default: newConfig } = require('./config');
      
      expect(newConfig.wsEndpoint).toBe('ws://localhost:9000');
    });

    it('should use default websocket endpoint when only port is provided', () => {
      delete process.env.REACT_APP_WS_BACKEND_HOST; // Ensure host is not set
      process.env.REACT_APP_WS_BACKEND_PORT = '8080';
      
      jest.resetModules();
      const { default: newConfig } = require('./config');
      
      expect(newConfig.wsEndpoint).toBe('ws://localhost:9000');
    });

    it('should use Firebase environment variables when provided', () => {
      process.env.REACT_APP_FIREBASE_WEB_API_KEY = 'test-api-key';
      process.env.REACT_APP_FIREBASE_WEB_AUTH_DOMAIN = 'test.firebaseapp.com';
      process.env.REACT_APP_FIREBASE_WEB_PROJECT_ID = 'test-project';
      process.env.REACT_APP_FIREBASE_WEB_STORAGE_BUCKET = 'test.appspot.com';
      process.env.REACT_APP_FIREBASE_WEB_MESSAGING_SENDER_ID = '123456789';
      process.env.REACT_APP_FIREBASE_WEB_APP_ID = 'test-app-id';

      jest.resetModules();
      const { default: newConfig } = require('./config');
      
      expect(newConfig.firebase).toEqual({
        apiKey: 'test-api-key',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test.appspot.com',
        messagingSenderId: '123456789',
        appId: 'test-app-id',
      });
    });

    it('should use app environment variables when provided', () => {
      process.env.REACT_APP_NAME = 'Custom App Name';
      process.env.REACT_APP_VERSION = '2.0.0';

      jest.resetModules();
      const { default: newConfig } = require('./config');
      
      expect(newConfig.app.name).toBe('Custom App Name');
      expect(newConfig.app.version).toBe('2.0.0');
    });
  });

  describe('Config Type Safety', () => {
    it('should match Config interface structure', () => {
      // Type checking is done at compile time, but we can verify runtime structure
      const expectedKeys = [
        'backendEndpoint',
        'wsEndpoint',
        'firebase',
        'app',
      ];
      
      expectedKeys.forEach(key => {
        expect(config).toHaveProperty(key);
      });

      const expectedFirebaseKeys = [
        'apiKey',
        'authDomain',
        'projectId',
        'storageBucket',
        'messagingSenderId',
        'appId',
      ];
      
      expectedFirebaseKeys.forEach(key => {
        expect(config.firebase).toHaveProperty(key);
      });

      const expectedAppKeys = ['name', 'version'];
      expectedAppKeys.forEach(key => {
        expect(config.app).toHaveProperty(key);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty environment variables', () => {
      process.env.REACT_APP_BACKEND_ENDPOINT = '';
      process.env.REACT_APP_FIREBASE_WEB_API_KEY = '';

      jest.resetModules();
      const { default: newConfig } = require('./config');
      
      expect(newConfig.backendEndpoint).toBe('http://localhost:8000');
      expect(newConfig.firebase.apiKey).toBe('');
    });

    it('should handle undefined environment variables', () => {
      delete process.env.REACT_APP_BACKEND_ENDPOINT;
      delete process.env.REACT_APP_FIREBASE_WEB_API_KEY;

      jest.resetModules();
      const { default: newConfig } = require('./config');
      
      expect(newConfig.backendEndpoint).toBe('http://localhost:8000');
      expect(newConfig.firebase.apiKey).toBe('');
    });
  });

  describe('Production Configuration', () => {
    it('should handle production-like environment variables', () => {
      process.env.REACT_APP_BACKEND_ENDPOINT = 'https://api.leaguer.com';
      process.env.REACT_APP_WS_BACKEND_HOST = 'ws.leaguer.com';
      process.env.REACT_APP_WS_BACKEND_PORT = '443';
      process.env.REACT_APP_NAME = 'Leaguer Production';
      process.env.REACT_APP_VERSION = '1.2.3';

      jest.resetModules();
      const { default: newConfig } = require('./config');
      
      expect(newConfig.backendEndpoint).toBe('https://api.leaguer.com');
      expect(newConfig.wsEndpoint).toBe('ws://ws.leaguer.com:443');
      expect(newConfig.app.name).toBe('Leaguer Production');
      expect(newConfig.app.version).toBe('1.2.3');
    });
  });
});
