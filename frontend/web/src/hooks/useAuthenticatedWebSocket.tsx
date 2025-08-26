/**
 * Hook that automatically manages WebSocket connection based on authentication status
 */

import { useEffect } from 'react';
import useAuth from './useAuth';
import useWebSocket from './useWebSocket';

export const useAuthenticatedWebSocket = () => {
  const { isAuthenticated } = useAuth();
  const { connect, disconnect, ...webSocketState } = useWebSocket();

  useEffect(() => {
    if (isAuthenticated) {
      // Connect when authenticated
      connect().catch((error) => {
        console.error('WebSocket connection error:', error);
      });
    } else {
      // Disconnect when not authenticated
      disconnect();
    }
  }, [isAuthenticated, connect, disconnect]);

  return webSocketState;
};

export default useAuthenticatedWebSocket;
