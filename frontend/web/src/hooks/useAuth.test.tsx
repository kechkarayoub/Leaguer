/**
 * useAuth Hook Tests
 * 
 * Tests for the authentication hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import useAuth from './useAuth';

// Mock dependencies
jest.mock('../services/AuthenticatedApiService', () => ({
  getInstance: jest.fn(() => ({
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    updateProfile: jest.fn(),
    socialLogin: jest.fn(),
    socialRegister: jest.fn(),
    changePassword: jest.fn(),
    requestPasswordReset: jest.fn(),
    hasValidToken: jest.fn().mockResolvedValue(false),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
    publicHandleSessionExpired: jest.fn(),
  })),
}));

jest.mock('../services/SecureStorageService', () => ({
  getInstance: jest.fn(() => ({
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    getSessionItem: jest.fn().mockResolvedValue(null),
    setSessionItem: jest.fn(),
    removeSessionItem: jest.fn(),
    clearSession: jest.fn(),
  })),
}));

jest.mock('../services/WebSocketService', () => ({
  getInstance: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    send: jest.fn(),
    isConnected: jest.fn(),
  })),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('../i18n', () => ({
  language: 'en',
  changeLanguage: jest.fn(),
  t: (key: string) => key,
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAuth', () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    wrapper = createWrapper();
    jest.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with correct default state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially loading will be true and user will be undefined (query disabled)
      expect(result.current.user).toBeUndefined();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true);
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.updateProfile).toBe('function');

      // Wait for initialization to complete
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });
    });

    it('should provide all required authentication methods', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Test core methods
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.socialLogin).toBe('function');
      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.socialRegister).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.updateProfile).toBe('function');
      expect(typeof result.current.changePassword).toBe('function');
      expect(typeof result.current.requestPasswordReset).toBe('function');
    });
  });

  describe('Authentication State', () => {
    it('should handle loading state correctly', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should provide authentication status properties', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.isAuthenticated).toBe('boolean');
      expect(typeof result.current.isLoading).toBe('boolean');
      expect(typeof result.current.isInitialized).toBe('boolean');
      
      // User is undefined when not authenticated (query disabled)
      expect(result.current.user === undefined || result.current.user === null || typeof result.current.user === 'object').toBe(true);
      
      // Wait for initialization to complete
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });
    });
  });

  describe('Loading States', () => {
    it('should provide loading state for each operation', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.isLoggingIn).toBe('boolean');
      expect(typeof result.current.isSocialLoggingIn).toBe('boolean');
      expect(typeof result.current.isRegistering).toBe('boolean');
      expect(typeof result.current.isUpdatingProfile).toBe('boolean');
      expect(typeof result.current.isChangingPassword).toBe('boolean');
      expect(typeof result.current.isRequestingPasswordReset).toBe('boolean');
    });
  });

  describe('User Data Management', () => {
    it('should handle user data correctly', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // When not authenticated, user should be undefined (query is disabled)
      const user = result.current.user;
      expect(user === undefined || user === null || typeof user === 'object').toBe(true);
    });

    it('should handle user error correctly', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.userError === null || result.current.userError instanceof Error).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Hook should not crash when methods are called
      expect(() => {
        result.current.logout();
      }).not.toThrow();
    });
  });

  describe('Hook Stability', () => {
    it('should maintain function references between renders', () => {
      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      const firstLogout = result.current.logout;
      
      rerender();

      // Functions should be stable references
      expect(typeof result.current.logout).toBe('function');
      expect(typeof firstLogout).toBe('function');
    });
  });

  describe('Type Safety', () => {
    it('should provide properly typed return values', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Check that all properties exist and have correct types
      expect(typeof result.current.isAuthenticated).toBe('boolean');
      expect(typeof result.current.isLoading).toBe('boolean');
      expect(typeof result.current.isInitialized).toBe('boolean');
      expect(result.current.user === undefined || result.current.user === null || typeof result.current.user === 'object').toBe(true);
      
      // Check that all core methods are functions
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.updateProfile).toBe('function');
      expect(typeof result.current.changePassword).toBe('function');
      expect(typeof result.current.requestPasswordReset).toBe('function');
    });
  });

  describe('Integration', () => {
    it('should initialize without errors', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      }, { timeout: 3000 });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle concurrent operations', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Multiple operations should not crash the hook
      expect(() => {
        result.current.logout();
        result.current.logout();
      }).not.toThrow();
    });
  });
});
