/**
 * useWebSocket Hook Tests
 * 
 * Tests for the WebSocket hook that provides React interface to WebSocketService
 */

import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { toast } from 'react-toastify';
import { act } from 'react';

import useWebSocket, { useProfileWebSocket } from './useWebSocket';
import { ConnectionState, WebSocketMessage } from '../services/WebSocketService';

// Mock dependencies
const mockWebSocketService = {
  getInstance: jest.fn(),
  onConnectionStateChange: jest.fn(),
  getConnectionState: jest.fn(),
  onMessage: jest.fn(),
  send: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  setLogoutHandler: jest.fn(),
};

jest.mock('../services/WebSocketService', () => ({
  __esModule: true,
  default: {
    getInstance: () => mockWebSocketService,
  },
}));

// Mock useAuth hook
const mockUseAuth = {
  logout: jest.fn(),
  isAuthenticated: false,
  user: null,
  isLoading: false,
};

jest.mock('./useAuth', () => ({
  __esModule: true,
  default: () => mockUseAuth,
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  },
}));

// Get the mocked toast for testing
const mockToast = toast as jest.Mocked<typeof toast>;

// Mock GlobalUtils
jest.mock('../utils/GlobalUtils', () => ({
  getTranslation: (key: string, fallback: string) => fallback,
}));

// Test wrapper with QueryClient and Router
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('useWebSocket', () => {
  let wrapper: ReturnType<typeof createWrapper>;
  
  const mockConnectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0,
    tokenRefreshAttempts: 0,
  };

  beforeEach(() => {
    wrapper = createWrapper();
    jest.clearAllMocks();
    
    // Setup default mock returns
    mockWebSocketService.getConnectionState.mockReturnValue(mockConnectionState);
    mockWebSocketService.onConnectionStateChange.mockReturnValue(() => {});
    mockWebSocketService.onMessage.mockReturnValue(() => {});
    mockWebSocketService.send.mockResolvedValue(undefined);
    mockWebSocketService.connect.mockResolvedValue(undefined);
  });

  describe('Hook Initialization', () => {
    it('should initialize with WebSocket service state', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toEqual(mockConnectionState);
      expect(typeof result.current.subscribe).toBe('function');
      expect(typeof result.current.send).toBe('function');
      expect(typeof result.current.connect).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
    });

    it('should set up logout handler on mount', () => {
      renderHook(() => useWebSocket(), { wrapper });

      expect(mockWebSocketService.setLogoutHandler).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should subscribe to connection state changes', () => {
      renderHook(() => useWebSocket(), { wrapper });

      expect(mockWebSocketService.onConnectionStateChange).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should get initial connection state', () => {
      renderHook(() => useWebSocket(), { wrapper });

      expect(mockWebSocketService.getConnectionState).toHaveBeenCalled();
    });
  });

  describe('Connection State Management', () => {
    it('should update state when WebSocket service state changes', () => {
      let stateChangeHandler: (state: ConnectionState) => void;
      
      mockWebSocketService.onConnectionStateChange.mockImplementation((handler) => {
        stateChangeHandler = handler;
        return () => {};
      });

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.isConnected).toBe(false);

      // Simulate connection state change
      const newState: ConnectionState = {
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectAttempts: 0,
        tokenRefreshAttempts: 0,
      };

      act(() => {
        stateChangeHandler!(newState);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionState).toEqual(newState);
    });

    it('should handle error states', () => {
      let stateChangeHandler: (state: ConnectionState) => void;
      
      mockWebSocketService.onConnectionStateChange.mockImplementation((handler) => {
        stateChangeHandler = handler;
        return () => {};
      });

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      const errorState: ConnectionState = {
        isConnected: false,
        isConnecting: false,
        error: 'Connection failed',
        reconnectAttempts: 1,
        tokenRefreshAttempts: 0,
      };

      act(() => {
        stateChangeHandler!(errorState);
      });

      expect(result.current.connectionState.error).toBe('Connection failed');
      expect(result.current.connectionState.reconnectAttempts).toBe(1);
    });
  });

  describe('Message Handling', () => {
    it('should provide subscribe function', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      const mockHandler = jest.fn();

      result.current.subscribe('test_event', mockHandler);

      expect(mockWebSocketService.onMessage).toHaveBeenCalledWith('test_event', mockHandler);
    });

    it('should return unsubscribe function from subscribe', () => {
      const mockUnsubscribe = jest.fn();
      mockWebSocketService.onMessage.mockReturnValue(mockUnsubscribe);

      const { result } = renderHook(() => useWebSocket(), { wrapper });
      const mockHandler = jest.fn();

      const unsubscribe = result.current.subscribe('test_event', mockHandler);

      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should maintain subscribe function reference', () => {
      const { result, rerender } = renderHook(() => useWebSocket(), { wrapper });

      const firstSubscribe = result.current.subscribe;
      rerender();

      expect(result.current.subscribe).toBe(firstSubscribe);
    });
  });

  describe('Message Sending', () => {
    it('should send messages through WebSocket service', async () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      await result.current.send('test_event', { data: 'test' });

      expect(mockWebSocketService.send).toHaveBeenCalledWith('test_event', { data: 'test' });
    });

    it('should handle send errors gracefully', async () => {
      const sendError = new Error('Send failed');
      mockWebSocketService.send.mockRejectedValueOnce(sendError);

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      await result.current.send('test_event', { data: 'test' });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to send message');
    });

    it('should maintain send function reference', () => {
      const { result, rerender } = renderHook(() => useWebSocket(), { wrapper });

      const firstSend = result.current.send;
      rerender();

      expect(result.current.send).toBe(firstSend);
    });
  });

  describe('Connection Management', () => {
    it('should connect through WebSocket service', async () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      await result.current.connect();

      expect(mockWebSocketService.connect).toHaveBeenCalled();
    });

    it('should handle connection errors gracefully', async () => {
      const connectionError = new Error('Connection failed');
      mockWebSocketService.connect.mockRejectedValueOnce(connectionError);

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      await result.current.connect();

      expect(mockToast.error).toHaveBeenCalledWith('Failed to connect');
    });

    it('should disconnect through WebSocket service', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      result.current.disconnect();

      expect(mockWebSocketService.disconnect).toHaveBeenCalled();
    });

    it('should maintain connect function reference', () => {
      const { result, rerender } = renderHook(() => useWebSocket(), { wrapper });

      const firstConnect = result.current.connect;
      rerender();

      expect(result.current.connect).toBe(firstConnect);
    });

    it('should maintain disconnect function reference', () => {
      const { result, rerender } = renderHook(() => useWebSocket(), { wrapper });

      const firstDisconnect = result.current.disconnect;
      rerender();

      expect(result.current.disconnect).toBe(firstDisconnect);
    });
  });

  describe('Logout Handling', () => {
    it('should handle logout through useAuth and navigate', async () => {
      let logoutHandler: () => Promise<void>;
      
      mockWebSocketService.setLogoutHandler.mockImplementation((handler) => {
        logoutHandler = handler;
      });

      renderHook(() => useWebSocket(), { wrapper });

      await logoutHandler!();

      expect(mockUseAuth.logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });

    it('should navigate to login even if logout fails', async () => {
      let logoutHandler: () => Promise<void>;
      const logoutError = new Error('Logout failed');
      
      mockUseAuth.logout.mockRejectedValueOnce(logoutError);
      mockWebSocketService.setLogoutHandler.mockImplementation((handler) => {
        logoutHandler = handler;
      });

      renderHook(() => useWebSocket(), { wrapper });

      await logoutHandler!();

      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe from connection state changes on unmount', () => {
      const mockUnsubscribe = jest.fn();
      mockWebSocketService.onConnectionStateChange.mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useWebSocket(), { wrapper });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});

describe('useProfileWebSocket', () => {
  let wrapper: ReturnType<typeof createWrapper>;
  
  const mockConnectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0,
    tokenRefreshAttempts: 0,
  };

  beforeEach(() => {
    wrapper = createWrapper();
    jest.clearAllMocks();
    
    // Setup default mock returns
    mockWebSocketService.getConnectionState.mockReturnValue(mockConnectionState);
    mockWebSocketService.onConnectionStateChange.mockReturnValue(() => {});
    mockWebSocketService.onMessage.mockReturnValue(() => {});
  });

  describe('Profile Message Handling', () => {
    it('should subscribe to profile update messages', () => {
      renderHook(() => useProfileWebSocket(), { wrapper });

      expect(mockWebSocketService.onMessage).toHaveBeenCalledWith('profile_update', expect.any(Function));
    });

    it('should subscribe to password update messages', () => {
      renderHook(() => useProfileWebSocket(), { wrapper });

      expect(mockWebSocketService.onMessage).toHaveBeenCalledWith('profile_password_update', expect.any(Function));
    });

    it('should subscribe to password reset messages', () => {
      renderHook(() => useProfileWebSocket(), { wrapper });

      expect(mockWebSocketService.onMessage).toHaveBeenCalledWith('profile_password_reset', expect.any(Function));
    });

    it('should handle profile update messages', () => {
      let profileUpdateHandler: (message: WebSocketMessage) => void;
      
      mockWebSocketService.onMessage.mockImplementation((eventName: string, handler: any) => {
        if (eventName === 'profile_update') {
          profileUpdateHandler = handler;
        }
        return () => {};
      });

      renderHook(() => useProfileWebSocket(), { wrapper });

      const mockMessage: WebSocketMessage = {
        type: 'profile_update',
        data: { action: 'profile_updated' },
        deviceId: 'test-device',
        timestamp: new Date().toISOString(),
      };

      profileUpdateHandler!(mockMessage);

      expect(mockToast.success).toHaveBeenCalledWith('Profile updated from another device');
    });

    it('should handle password change messages', () => {
      let passwordUpdateHandler: (message: WebSocketMessage) => void;
      
      mockWebSocketService.onMessage.mockImplementation((eventName: string, handler: any) => {
        if (eventName === 'profile_password_update') {
          passwordUpdateHandler = handler;
        }
        return () => {};
      });

      renderHook(() => useProfileWebSocket(), { wrapper });

      const mockMessage: WebSocketMessage = {
        type: 'profile_password_update',
        data: { action: 'password_changed' },
        deviceId: 'test-device',
        timestamp: new Date().toISOString(),
      };

      passwordUpdateHandler!(mockMessage);

      expect(mockToast.warning).toHaveBeenCalledWith('Password changed from another device. You will be logged out.');
    });

    it('should handle password reset messages', () => {
      let passwordResetHandler: (message: WebSocketMessage) => void;
      
      mockWebSocketService.onMessage.mockImplementation((eventName: string, handler: any) => {
        if (eventName === 'profile_password_reset') {
          passwordResetHandler = handler;
        }
        return () => {};
      });

      renderHook(() => useProfileWebSocket(), { wrapper });

      const mockMessage: WebSocketMessage = {
        type: 'profile_password_reset',
        data: { action: 'logout_required' },
        deviceId: 'test-device',
        timestamp: new Date().toISOString(),
      };

      passwordResetHandler!(mockMessage);

      expect(mockToast.warning).toHaveBeenCalledWith('Password was reset. You will be logged out.');
    });
  });

  describe('WebSocket State Forwarding', () => {
    it('should forward all WebSocket state except subscribe', () => {
      const { result } = renderHook(() => useProfileWebSocket(), { wrapper });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toEqual(mockConnectionState);
      expect(typeof result.current.send).toBe('function');
      expect(typeof result.current.connect).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
      
      // subscribe should not be exposed since it's handled internally
      expect('subscribe' in result.current).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe from all profile messages on unmount', () => {
      const mockUnsubscribeProfile = jest.fn();
      const mockUnsubscribePassword = jest.fn();
      const mockUnsubscribeReset = jest.fn();
      
      mockWebSocketService.onMessage.mockImplementation((eventName: string) => {
        if (eventName === 'profile_update') return mockUnsubscribeProfile;
        if (eventName === 'profile_password_update') return mockUnsubscribePassword;
        if (eventName === 'profile_password_reset') return mockUnsubscribeReset;
        return () => {};
      });

      const { unmount } = renderHook(() => useProfileWebSocket(), { wrapper });

      unmount();

      expect(mockUnsubscribeProfile).toHaveBeenCalled();
      expect(mockUnsubscribePassword).toHaveBeenCalled();
      expect(mockUnsubscribeReset).toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('should work with connection state changes', () => {
      let stateChangeHandler: (state: ConnectionState) => void;
      
      mockWebSocketService.onConnectionStateChange.mockImplementation((handler) => {
        stateChangeHandler = handler;
        return () => {};
      });

      const { result } = renderHook(() => useProfileWebSocket(), { wrapper });

      expect(result.current.isConnected).toBe(false);

      // Simulate connection
      const connectedState: ConnectionState = {
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectAttempts: 0,
        tokenRefreshAttempts: 0,
      };

      act(() => {
        stateChangeHandler!(connectedState);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionState).toEqual(connectedState);
    });
  });
});
