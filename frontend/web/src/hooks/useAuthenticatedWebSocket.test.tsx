/**
 * useAuthenticatedWebSocket Hook Tests
 * 
 * Tests for the authenticated WebSocket hook that manages connection based on auth status
 */

import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import useAuthenticatedWebSocket from './useAuthenticatedWebSocket';

// Mock the useAuth hook
const mockUseAuth = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  isInitialized: true,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  updateProfile: jest.fn(),
};

jest.mock('./useAuth', () => ({
  __esModule: true,
  default: () => mockUseAuth,
}));

// Mock the useWebSocket hook
const mockUseWebSocket = {
  isConnected: false,
  connectionState: {
    isConnected: false,
    isConnecting: false,
    error: null as string | null,
    reconnectAttempts: 0,
    tokenRefreshAttempts: 0,
  },
  subscribe: jest.fn(),
  send: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn(),
};

jest.mock('./useWebSocket', () => ({
  __esModule: true,
  default: () => mockUseWebSocket,
}));

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

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

describe('useAuthenticatedWebSocket', () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    wrapper = createWrapper();
    jest.clearAllMocks();
    
    // Reset mock states
    mockUseAuth.isAuthenticated = false;
    mockUseWebSocket.isConnected = false;
    mockUseWebSocket.connectionState = {
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnectAttempts: 0,
      tokenRefreshAttempts: 0,
    };
    
    // Reset mock functions to their default implementations
    mockUseWebSocket.connect = jest.fn().mockResolvedValue(undefined);
    mockUseWebSocket.disconnect = jest.fn();
    mockUseWebSocket.subscribe = jest.fn();
    mockUseWebSocket.send = jest.fn();
  });

  afterEach(() => {
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('Hook Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAuthenticatedWebSocket(), { wrapper });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toEqual({
        isConnected: false,
        isConnecting: false,
        error: null,
        reconnectAttempts: 0,
        tokenRefreshAttempts: 0,
      });
      expect(typeof result.current.subscribe).toBe('function');
      expect(typeof result.current.send).toBe('function');
    });

    it('should not have connect and disconnect functions exposed', () => {
      const { result } = renderHook(() => useAuthenticatedWebSocket(), { wrapper });

      // These should not be exposed as they're managed automatically
      expect('connect' in result.current).toBe(false);
      expect('disconnect' in result.current).toBe(false);
    });
  });

  describe('Authentication-based Connection Management', () => {
    it('should not connect when user is not authenticated', () => {
      mockUseAuth.isAuthenticated = false;
      
      renderHook(() => useAuthenticatedWebSocket(), { wrapper });

      expect(mockUseWebSocket.connect).not.toHaveBeenCalled();
      expect(mockUseWebSocket.disconnect).toHaveBeenCalledTimes(1);
    });

    it('should connect when user is authenticated', () => {
      mockUseAuth.isAuthenticated = true;
      
      renderHook(() => useAuthenticatedWebSocket(), { wrapper });

      expect(mockUseWebSocket.connect).toHaveBeenCalledTimes(1);
      expect(mockUseWebSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect when user becomes unauthenticated', () => {
      mockUseAuth.isAuthenticated = true;
      
      const { rerender } = renderHook(() => useAuthenticatedWebSocket(), { wrapper });

      expect(mockUseWebSocket.connect).toHaveBeenCalledTimes(1);
      expect(mockUseWebSocket.disconnect).not.toHaveBeenCalled();

      // Change authentication status
      mockUseAuth.isAuthenticated = false;
      rerender();

      expect(mockUseWebSocket.disconnect).toHaveBeenCalledTimes(1);
    });

    it('should reconnect when user becomes authenticated again', () => {
      // Start unauthenticated
      mockUseAuth.isAuthenticated = false;
      
      const { rerender } = renderHook(() => useAuthenticatedWebSocket(), { wrapper });

      expect(mockUseWebSocket.disconnect).toHaveBeenCalledTimes(1);
      expect(mockUseWebSocket.connect).not.toHaveBeenCalled();

      // Become authenticated
      mockUseAuth.isAuthenticated = true;
      rerender();

      expect(mockUseWebSocket.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('WebSocket State Forwarding', () => {
    it('should forward connection state from useWebSocket', () => {
      const mockConnectionState = {
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectAttempts: 0,
        tokenRefreshAttempts: 0,
      };

      mockUseWebSocket.connectionState = mockConnectionState;
      mockUseWebSocket.isConnected = true;

      const { result } = renderHook(() => useAuthenticatedWebSocket(), { wrapper });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionState).toEqual(mockConnectionState);
    });

    it('should forward subscribe function from useWebSocket', () => {
      const { result } = renderHook(() => useAuthenticatedWebSocket(), { wrapper });

      expect(result.current.subscribe).toBe(mockUseWebSocket.subscribe);
    });

    it('should forward send function from useWebSocket', () => {
      const { result } = renderHook(() => useAuthenticatedWebSocket(), { wrapper });

      expect(result.current.send).toBe(mockUseWebSocket.send);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      mockUseAuth.isAuthenticated = true;
      mockUseWebSocket.connect.mockRejectedValueOnce(new Error('Connection failed'));

      renderHook(() => useAuthenticatedWebSocket(), { wrapper });

      expect(mockUseWebSocket.connect).toHaveBeenCalledTimes(1);
      
      // Wait for the promise rejection to be handled
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        'WebSocket connection error:',
        expect.any(Error)
      );
    });

    it('should not throw error when connect fails', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseWebSocket.connect.mockRejectedValueOnce(new Error('Connection failed'));

      expect(() => {
        renderHook(() => useAuthenticatedWebSocket(), { wrapper });
      }).not.toThrow();
    });
  });

  describe('Hook Dependencies', () => {
    it('should react to changes in authentication status', () => {
      mockUseAuth.isAuthenticated = false;
      
      const { rerender } = renderHook(() => useAuthenticatedWebSocket(), { wrapper });

      // Verify initial state
      expect(mockUseWebSocket.disconnect).toHaveBeenCalledTimes(1);
      expect(mockUseWebSocket.connect).not.toHaveBeenCalled();

      // Clear mocks and change auth status
      jest.clearAllMocks();
      mockUseAuth.isAuthenticated = true;
      rerender();

      expect(mockUseWebSocket.connect).toHaveBeenCalledTimes(1);
      expect(mockUseWebSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should handle multiple authentication state changes', () => {
      mockUseAuth.isAuthenticated = false;
      
      const { rerender } = renderHook(() => useAuthenticatedWebSocket(), { wrapper });

      // Start unauthenticated -> authenticated -> unauthenticated
      mockUseAuth.isAuthenticated = true;
      rerender();

      mockUseAuth.isAuthenticated = false;
      rerender();

      mockUseAuth.isAuthenticated = true;
      rerender();

      // Should have called connect twice (initial true, then true again after false)
      expect(mockUseWebSocket.connect).toHaveBeenCalledTimes(2);
      // Should have called disconnect twice (initial false, then false after true)
      expect(mockUseWebSocket.disconnect).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance', () => {
    it('should not cause excessive re-renders', () => {
      mockUseAuth.isAuthenticated = true;
      
      const { rerender } = renderHook(() => useAuthenticatedWebSocket(), { wrapper });

      // Clear initial calls
      jest.clearAllMocks();

      // Multiple re-renders with same auth state should not cause additional connect/disconnect calls
      rerender();
      rerender();
      rerender();

      expect(mockUseWebSocket.connect).not.toHaveBeenCalled();
      expect(mockUseWebSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should maintain function references', () => {
      const { result, rerender } = renderHook(() => useAuthenticatedWebSocket(), { wrapper });

      const firstSubscribe = result.current.subscribe;
      const firstSend = result.current.send;

      rerender();

      // Functions should maintain their references (from useWebSocket)
      expect(result.current.subscribe).toBe(firstSubscribe);
      expect(result.current.send).toBe(firstSend);
    });
  });

  describe('Integration', () => {
    it('should work correctly when useWebSocket state changes', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseWebSocket.isConnected = false;
      mockUseWebSocket.connectionState.isConnecting = true;

      const { result, rerender } = renderHook(() => useAuthenticatedWebSocket(), { wrapper });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState.isConnecting).toBe(true);

      // Simulate successful connection
      mockUseWebSocket.isConnected = true;
      mockUseWebSocket.connectionState = {
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectAttempts: 0,
        tokenRefreshAttempts: 0,
      };
      rerender();

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionState.isConnected).toBe(true);
      expect(result.current.connectionState.isConnecting).toBe(false);
    });

    it('should handle error states from useWebSocket', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseWebSocket.connectionState = {
        isConnected: false,
        isConnecting: false,
        error: 'Connection failed',
        reconnectAttempts: 1,
        tokenRefreshAttempts: 0,
      };

      const { result } = renderHook(() => useAuthenticatedWebSocket(), { wrapper });

      expect(result.current.connectionState.error).toBe('Connection failed');
      expect(result.current.connectionState.reconnectAttempts).toBe(1);
    });
  });
});
