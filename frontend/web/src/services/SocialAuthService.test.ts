/**
 * SocialAuthService Tests
 * 
 * Tests for the social authentication service
 */

import SocialAuthService from './SocialAuthService';

// Mock environment variables
const mockEnv = {
  REACT_APP_ENABLE_GOOGLE_LOGIN: 'true',
  REACT_APP_GOOGLE_SIGN_IN_WEB_CLIENT_ID: 'test-google-client-id',
  REACT_APP_ENABLE_FACEBOOK_LOGIN: 'false',
  REACT_APP_FACEBOOK_SIGN_IN_WEB_CLIENT_ID: '',
  REACT_APP_ENABLE_APPLE_LOGIN: 'false',
  REACT_APP_APPLE_SIGN_IN_WEB_CLIENT_ID: '',
};

// Mock global objects
Object.defineProperty(window, 'google', {
  value: {
    accounts: {
      id: {
        initialize: jest.fn(),
        prompt: jest.fn(),
        renderButton: jest.fn(),
      },
    },
  },
  writable: true,
});

Object.defineProperty(window, 'open', {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(window, 'dispatchEvent', {
  value: jest.fn(),
  writable: true,
});

describe('SocialAuthService', () => {
  let service: SocialAuthService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Set up test environment
    Object.assign(process.env, mockEnv);
    
    // Reset singleton instance
    (SocialAuthService as any).instance = undefined;
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Get fresh service instance
    service = SocialAuthService.getInstance();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SocialAuthService.getInstance();
      const instance2 = SocialAuthService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(service);
    });

    it('should maintain the same instance across multiple calls', () => {
      const instances = Array(5).fill(null).map(() => SocialAuthService.getInstance());
      
      instances.forEach(instance => {
        expect(instance).toBe(service);
      });
    });
  });

  describe('Provider Availability Checks', () => {
    describe('Google Login', () => {
      it('should return true when Google login is enabled', () => {
        expect(service.isGoogleLoginEnabled()).toBe(true);
      });

      it('should return false when Google login is disabled', () => {
        process.env.REACT_APP_ENABLE_GOOGLE_LOGIN = 'false';
        
        // Create new instance to pick up env change
        (SocialAuthService as any).instance = undefined;
        const newService = SocialAuthService.getInstance();
        
        expect(newService.isGoogleLoginEnabled()).toBe(false);
      });

      it('should return false when Google client ID is missing', () => {
        process.env.REACT_APP_GOOGLE_SIGN_IN_WEB_CLIENT_ID = '';
        
        // Create new instance to pick up env change
        (SocialAuthService as any).instance = undefined;
        const newService = SocialAuthService.getInstance();
        
        expect(newService.isGoogleLoginEnabled()).toBe(false);
      });
    });

    describe('Facebook Login', () => {
      it('should return false when Facebook login is disabled', () => {
        expect(service.isFacebookLoginEnabled()).toBe(false);
      });

      it('should return true when Facebook login is enabled', () => {
        process.env.REACT_APP_ENABLE_FACEBOOK_LOGIN = 'true';
        process.env.REACT_APP_FACEBOOK_SIGN_IN_WEB_CLIENT_ID = 'test-facebook-id';
        
        // Create new instance to pick up env change
        (SocialAuthService as any).instance = undefined;
        const newService = SocialAuthService.getInstance();
        
        expect(newService.isFacebookLoginEnabled()).toBe(true);
      });
    });

    describe('Apple Login', () => {
      it('should return false when Apple login is disabled', () => {
        expect(service.isAppleLoginEnabled()).toBe(false);
      });

      it('should return true when Apple login is enabled', () => {
        process.env.REACT_APP_ENABLE_APPLE_LOGIN = 'true';
        process.env.REACT_APP_APPLE_SIGN_IN_WEB_CLIENT_ID = 'test-apple-id';
        
        // Create new instance to pick up env change
        (SocialAuthService as any).instance = undefined;
        const newService = SocialAuthService.getInstance();
        
        expect(newService.isAppleLoginEnabled()).toBe(true);
      });
    });
  });

  describe('Available Providers', () => {
    it('should return only enabled providers', () => {
      const providers = service.getAvailableProviders();
      
      expect(providers).toEqual(['google']);
    });

    it('should return multiple providers when enabled', () => {
      process.env.REACT_APP_ENABLE_FACEBOOK_LOGIN = 'true';
      process.env.REACT_APP_FACEBOOK_SIGN_IN_WEB_CLIENT_ID = 'test-facebook-id';
      process.env.REACT_APP_ENABLE_APPLE_LOGIN = 'true';
      process.env.REACT_APP_APPLE_SIGN_IN_WEB_CLIENT_ID = 'test-apple-id';
      
      // Create new instance to pick up env changes
      (SocialAuthService as any).instance = undefined;
      const newService = SocialAuthService.getInstance();
      
      const providers = newService.getAvailableProviders();
      
      expect(providers).toEqual(['google', 'facebook', 'apple']);
    });

    it('should return empty array when no providers are enabled', () => {
      process.env.REACT_APP_ENABLE_GOOGLE_LOGIN = 'false';
      process.env.REACT_APP_ENABLE_FACEBOOK_LOGIN = 'false';
      process.env.REACT_APP_ENABLE_APPLE_LOGIN = 'false';
      
      // Create new instance to pick up env changes
      (SocialAuthService as any).instance = undefined;
      const newService = SocialAuthService.getInstance();
      
      const providers = newService.getAvailableProviders();
      
      expect(providers).toEqual([]);
    });
  });

  describe('Google Sign-In', () => {
    it('should initialize Google Sign-In when enabled', async () => {
      // The constructor should have triggered Google initialization
      expect(window.google?.accounts.id.initialize).toHaveBeenCalled();
    });

    it('should throw error when Google login is disabled', async () => {
      process.env.REACT_APP_ENABLE_GOOGLE_LOGIN = 'false';
      
      // Create new instance to pick up env change
      (SocialAuthService as any).instance = undefined;
      const newService = SocialAuthService.getInstance();
      
      await expect(newService.signInWithGoogle()).rejects.toThrow('Google login is not enabled');
    });

    it('should prompt Google sign-in when enabled', async () => {
      await service.signInWithGoogle();
      
      expect(window.google?.accounts.id.prompt).toHaveBeenCalled();
    });

    it('should handle Google popup sign-in', async () => {
      await service.signInWithGooglePopup();
      
      expect(window.google?.accounts.id.prompt).toHaveBeenCalled();
    });

    it('should throw error for popup when Google login is disabled', async () => {
      process.env.REACT_APP_ENABLE_GOOGLE_LOGIN = 'false';
      
      // Create new instance to pick up env change
      (SocialAuthService as any).instance = undefined;
      const newService = SocialAuthService.getInstance();
      
      await expect(newService.signInWithGooglePopup()).rejects.toThrow('Google login is not enabled');
    });
  });

  describe('JWT Token Parsing', () => {
    it('should parse valid JWT token', () => {
      // Create a mock JWT token (header.payload.signature)
      const mockPayload = {
        sub: '123456789',
        name: 'John Doe',
        given_name: 'John',
        family_name: 'Doe',
        email: 'john@example.com',
        picture: 'https://example.com/photo.jpg',
      };
      
      const base64Payload = btoa(JSON.stringify(mockPayload));
      const mockToken = `header.${base64Payload}.signature`;
      
      // Access private method via any type casting
      const parsedPayload = (service as any).parseJwt(mockToken);
      
      expect(parsedPayload).toEqual(mockPayload);
    });

    it('should throw error for invalid JWT token', () => {
      const invalidToken = 'invalid.token';
      
      expect(() => {
        (service as any).parseJwt(invalidToken);
      }).toThrow('Invalid JWT token');
    });

    it('should handle malformed JWT payload', () => {
      const invalidBase64 = 'header.invalid-base64.signature';
      
      expect(() => {
        (service as any).parseJwt(invalidBase64);
      }).toThrow('Invalid JWT token');
    });
  });

  describe('Google Response Handling', () => {
    it('should handle valid Google response', () => {
      const mockCredential = {
        sub: '123456789',
        name: 'John Doe',
        given_name: 'John',
        family_name: 'Doe',
        email: 'john@example.com',
        picture: 'https://example.com/photo.jpg',
      };
      
      const base64Payload = btoa(JSON.stringify(mockCredential));
      const mockToken = `header.${base64Payload}.signature`;
      
      const mockResponse = {
        credential: mockToken,
      };
      
      // Spy on window.dispatchEvent
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
      
      // Call the private method
      (service as any).handleGoogleResponse(mockResponse);
      
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'googleSignInSuccess',
          detail: expect.objectContaining({
            provider: 'google',
            user: expect.objectContaining({
              id: '123456789',
              email: 'john@example.com',
              firstName: 'John',
              lastName: 'Doe',
              picture: 'https://example.com/photo.jpg',
            }),
            accessToken: mockToken,
          }),
        })
      );
    });

    it('should handle Google response with minimal data', () => {
      const mockCredential = {
        sub: '123456789',
        email: 'john@example.com',
        name: 'John Doe',
      };
      
      const base64Payload = btoa(JSON.stringify(mockCredential));
      const mockToken = `header.${base64Payload}.signature`;
      
      const mockResponse = {
        credential: mockToken,
      };
      
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
      
      (service as any).handleGoogleResponse(mockResponse);
      
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'googleSignInSuccess',
          detail: expect.objectContaining({
            user: expect.objectContaining({
              id: '123456789',
              email: 'john@example.com',
              firstName: 'John',
              lastName: 'Doe',
            }),
          }),
        })
      );
    });

    it('should handle Google response error', () => {
      const mockResponse = {
        credential: 'invalid.token',
      };
      
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      (service as any).handleGoogleResponse(mockResponse);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to process Google Sign-In response:',
        expect.any(Error)
      );
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'googleSignInError',
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Script Loading', () => {
    it('should handle successful Google script loading flow', async () => {
      // Test that the loadGoogleScript method exists and can be called
      expect(typeof (service as any).loadGoogleScript).toBe('function');
      
      // Since Google is already available in the test environment, 
      // the method should resolve immediately
      const loadPromise = (service as any).loadGoogleScript();
      await expect(loadPromise).resolves.toBeUndefined();
    });

    it('should validate script loading logic structure', () => {
      // Test that the loadGoogleScript method has the expected structure
      const loadGoogleScript = (service as any).loadGoogleScript;
      const methodString = loadGoogleScript.toString();
      
      // Verify that the method contains the expected logic
      expect(methodString).toContain('window.google');
      expect(methodString).toContain('createElement');
      expect(methodString).toContain('https://accounts.google.com/gsi/client');
      expect(methodString).toContain('Failed to load Google Sign-In script');
    });

    it('should resolve immediately when Google is available', async () => {
      // Ensure Google is available in the test environment
      expect(window.google).toBeDefined();
      expect(window.google?.accounts?.id).toBeDefined();
      
      // The loadGoogleScript should resolve immediately
      const loadPromise = (service as any).loadGoogleScript();
      await expect(loadPromise).resolves.toBeUndefined();
    });
  });

  describe('Environment Configuration', () => {
    it('should log provider availability check', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      service.isGoogleLoginEnabled();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Checking Google login enabled:',
        'true',
        'test-google-client-id'
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle missing environment variables gracefully', () => {
      delete process.env.REACT_APP_ENABLE_GOOGLE_LOGIN;
      delete process.env.REACT_APP_GOOGLE_SIGN_IN_WEB_CLIENT_ID;
      
      // Create new instance to pick up env changes
      (SocialAuthService as any).instance = undefined;
      const newService = SocialAuthService.getInstance();
      
      expect(newService.isGoogleLoginEnabled()).toBe(false);
      expect(newService.getAvailableProviders()).toEqual([]);
    });
  });

  describe('Performance', () => {
    it('should maintain singleton efficiency', () => {
      const instances = Array(10).fill(null).map(() => SocialAuthService.getInstance());
      
      // All instances should be the same
      instances.forEach(instance => {
        expect(instance).toBe(service);
      });
      
      // Should only initialize Google once
      expect(window.google?.accounts.id.initialize).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid availability checks efficiently', () => {
      const results = Array(100).fill(null).map(() => service.isGoogleLoginEnabled());
      
      // All results should be consistent
      expect(results.every(result => result === true)).toBe(true);
    });
  });
});
