/**
 * React Hook for WebSocket Service
 * 
 * Provides a convenient way to use WebSocket service in React components
 * with proper lifecycle management and message handling.
 */

import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebSocketService, { WebSocketMessage, ConnectionState } from '../services/WebSocketService';
import useAuth from './useAuth';
import { toast } from 'react-toastify';
import { getTranslation } from '../utils/GlobalUtils';

interface UseWebSocketReturn {
  isConnected: boolean;
  connectionState: ConnectionState;
  subscribe: (eventName: string, handler: (message: WebSocketMessage) => void) => () => void;
  send: (eventName: string, data: any) => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0,
    tokenRefreshAttempts: 0,
  });

  const webSocketService = WebSocketService.getInstance();
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    // Set up logout handler for WebSocket service
    const handleLogout = async () => {
      try {
        await logout();
        navigate('/auth/login');
      } catch (error) {
        console.error('Logout error:', error);
        // Fallback navigation if logout fails
        navigate('/auth/login');
      }
    };

    webSocketService.setLogoutHandler(handleLogout);

    // Subscribe to connection state changes
    const unsubscribe = webSocketService.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    // Initialize with current state
    setConnectionState(webSocketService.getConnectionState());

    return unsubscribe;
  }, [webSocketService, logout, navigate]);

  const subscribe = useCallback((eventName: string, handler: (message: WebSocketMessage) => void) => {
    return webSocketService.onMessage(eventName, handler);
  }, [webSocketService]);

  const send = useCallback(async (eventName: string, data: any) => {
    try {
      await webSocketService.send(eventName, data);
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      toast.error(getTranslation('errors:websocket.sendFailed', 'Failed to send message'));
    }
  }, [webSocketService]);

  const connect = useCallback(async () => {
    try {
      await webSocketService.connect();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      toast.error(getTranslation('errors:websocket.connectionFailed', 'Failed to connect'));
    }
  }, [webSocketService]);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, [webSocketService]);

  return {
    isConnected: connectionState.isConnected,
    connectionState,
    subscribe,
    send,
    connect,
    disconnect,
  };
};

/**
 * Hook for handling profile-related WebSocket messages
 */
export const useProfileWebSocket = () => {
  const { subscribe, ...rest } = useWebSocket();

  useEffect(() => {
    const unsubscribeProfileUpdate = subscribe('profile_update', (message) => {
      if (message.data.action === 'profile_updated') {
        toast.success(getTranslation('websockets:profile.updatedRemotely', 'Profile updated from another device'));
      }
    });

    const unsubscribePasswordUpdate = subscribe('profile_password_update', (message) => {
      if (message.data.action === 'password_changed') {
        toast.warning(getTranslation('websockets:auth.passwordChangedElsewhere', 'Password changed from another device. You will be logged out.'));
      }
    });

    const unsubscribePasswordReset = subscribe('profile_password_reset', (message) => {
      if (message.data.action === 'logout_required') {
        toast.warning(getTranslation('websockets:auth.passwordReset', 'Password was reset. You will be logged out.'));
      }
    });

    return () => {
      unsubscribeProfileUpdate();
      unsubscribePasswordUpdate();
      unsubscribePasswordReset();
    };
  }, [subscribe]);

  return rest;
};

export default useWebSocket;
