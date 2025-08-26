/**
 * WebSocket Service for React Web App
 * 
 * Handles WebSocket connections with:
 * - Automatic reconnection with exponential backoff
 * - Device ID filtering (prevents self-updates)
 * - Event-based message handling
 * - Connection state management
 * - Intelligent token refresh (reuses AuthenticatedApiService)
 * - Proper error handling with specific close codes
 * - Automatic logout for password-related events
 */

// No socket.io-client: use native WebSocket
import config from '../config/config';
import DeviceIdService from './DeviceIdService';
import SecureStorageService from './SecureStorageService';
import AuthenticatedApiService from './AuthenticatedApiService';
import { toast } from 'react-toastify';

export interface WebSocketMessage {
  type: string;
  data: any;
  deviceId?: string;
  timestamp?: string;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  tokenRefreshAttempts: number;
}

type MessageHandler = (message: WebSocketMessage) => void;
type ConnectionStateHandler = (state: ConnectionState) => void;
type LogoutHandler = () => void;

class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private deviceIdService: DeviceIdService;
  private secureStorage: SecureStorageService;
  private apiService: AuthenticatedApiService;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private connectionStateHandlers: ConnectionStateHandler[] = [];
  private logoutHandler: LogoutHandler | null = null;
  private lastAuthError: { error: string; message: string } | null = null;
  private connectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0,
    tokenRefreshAttempts: 0,
  };
  private pingIntervalId: NodeJS.Timeout | null = null;
  private maxReconnectAttempts = 3;
  private maxTokenRefreshAttempts = 2;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {
    this.deviceIdService = DeviceIdService.getInstance();
    this.secureStorage = SecureStorageService.getInstance();
    this.apiService = AuthenticatedApiService.getInstance();
    
    // Listen for token refresh events from AuthenticatedApiService
    this.apiService.onTokenRefreshed = (tokens) => {
      console.log('Tokens refreshed by API service, WebSocket will use new tokens on next connect');
      // Note: We don't auto-reconnect here to avoid conflicts with our own refresh logic
      // The new tokens will be used automatically on the next connection attempt
    };
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Set logout handler (to be called by React components with access to useAuth)
   */
  public setLogoutHandler(handler: LogoutHandler): void {
    this.logoutHandler = handler;
  }

  /**
   * Connect to WebSocket server
   */
  public async connect(): Promise<void> {
    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.connectionState.isConnecting) {
      return;
    }

    // Check if already connected
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.connectionState.isConnected) {
      return;
    }

    // Check if we've exhausted both regular and token refresh attempts
    if (this.connectionState.reconnectAttempts >= this.maxReconnectAttempts && this.connectionState.tokenRefreshAttempts >= this.maxTokenRefreshAttempts) {
      console.log('Max connection and token refresh attempts reached');
      return;
    }

    const hasValidToken = await this.apiService.hasValidToken();
    if(!hasValidToken){
      console.log('No valid token available for WebSocket connection');
      return;
    }

    // Create and store the connection promise
    this.connectionPromise = this.performConnection();
    
    try {
      console.log('Starting WebSocket connection...');
      this.updateConnectionState({
        isConnecting: true,
        error: null,
      }); 
      await this.connectionPromise;
    } finally {
      // Clear the connection promise when done (success or failure)
      this.connectionPromise = null;
    }
  }

  /**
   * Internal method to perform the actual connection
   */
  private async performConnection(): Promise<void> {


    try {
      // Get current access token using the same logic as AuthenticatedApiService
      let accessToken = await this.secureStorage.getSessionItem('access_token');
      if (!accessToken) {
        accessToken = await this.secureStorage.getItem('access_token');
      }

      // Get user data
      const userFromSession = await this.secureStorage.getSessionItem('user');
      const userFromLocal = await this.secureStorage.getItem('user');
      const userString = userFromSession || userFromLocal;
      const user = userString ? JSON.parse(userString) : null;
      const deviceId = await this.deviceIdService.getDeviceId();

      if (!user?.id) {
        throw new Error('User ID not found');
      }

      // Build query params for authentication
      const params = new URLSearchParams({
        token: accessToken || '',
        deviceId: deviceId || '',
      });
      // ws://host:port/ws/profile/<user_id>/?token=...&deviceId=...
      const wsUrl = `${config.wsEndpoint}/ws/profile/${user.id}/?${params.toString()}`.replace('http','ws').replace('https','wss');
      
      console.log('Attempting WebSocket connection to:', wsUrl.replace(/token=[^&]*/, 'token=***'));

      // Create a promise that resolves when connection is established or rejects on error
      return new Promise<void>((resolve, reject) => {
        this.socket = new WebSocket(wsUrl);
        
        const onOpen = () => {
          console.log('WebSocket connection established successfully');
          cleanup();
          resolve();
        };

        const onError = (error: Event) => {
          console.error('WebSocket connection failed:', error);
          cleanup();
          this.updateConnectionState({
            isConnecting: false,
            error: 'Failed to establish WebSocket connection',
          });
          reject(new Error('WebSocket connection failed'));
        };

        const onClose = (event: CloseEvent) => {
          console.log('WebSocket closed during connection:', event.code, event.reason);
          cleanup();
          // Only reject if we haven't already resolved (connection never fully established)
          if (this.connectionState.isConnecting) {
            this.updateConnectionState({
              isConnecting: false,
              error: `Connection failed: ${event.reason || event.code}`,
            });
            reject(new Error(`WebSocket connection closed: ${event.reason || event.code}`));
          }
        };

        const cleanup = () => {
          if (this.socket) {
            this.socket.removeEventListener('open', onOpen);
            this.socket.removeEventListener('error', onError);
            this.socket.removeEventListener('close', onClose);
          }
        };

        // Set up temporary event listeners for connection establishment
        this.socket.addEventListener('open', onOpen);
        this.socket.addEventListener('error', onError);
        this.socket.addEventListener('close', onClose);

        // Set up the permanent event handlers after connection
        this.socket.addEventListener('open', () => {
          this.setupEventHandlers();
          this.startPing();
        }, { once: true });
      });
    } catch (error) {
      console.error('WebSocket connection setup failed:', error);
      this.updateConnectionState({
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      });
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.stopPing();
    this.clearReconnectTimeout();
    this.connectionPromise = null; // Clear any pending connection promise
    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnectAttempts: 0,
      tokenRefreshAttempts: 0,
    });
  }

  /**
   * Clear reconnect timeout
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  /**
   * Reset connection attempts (useful when user manually reconnects or after successful login)
   */
  public resetConnectionAttempts(): void {
    this.clearReconnectTimeout();
    this.connectionPromise = null; // Clear any pending connection
    this.updateConnectionState({
      reconnectAttempts: 0,
      tokenRefreshAttempts: 0,
      error: null,
    });
  }

  /**
   * Manually retry connection (resets attempts and tries to connect)
   */
  public async retryConnection(): Promise<void> {
    this.resetConnectionAttempts();
    return this.connect();
  }

  /**
   * Refresh access token using AuthenticatedApiService
   */
  private async refreshAccessToken(): Promise<string | null> {
    try {
      const tokens = await this.apiService.publicRefreshTokens();
      if (tokens) {
        return tokens.accessToken;
      }
      return null;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      await this.apiService.publicHandleSessionExpired();
      return null;
    }
    
  }
  /**
   * Start sending ping messages every 30 seconds to keep the connection alive
   */
  private startPing(): void {
    this.stopPing();
    this.pingIntervalId = setInterval(async () => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          const deviceId = await this.deviceIdService.getDeviceId();
          // Get current access token using consistent logic
          let accessToken = await this.secureStorage.getSessionItem('access_token');
          if (!accessToken) {
            accessToken = await this.secureStorage.getItem('access_token');
          }
          this.socket.send(JSON.stringify({ 
            type: 'ping', 
            deviceId, 
            token: accessToken || '', 
            timestamp: new Date().toISOString() 
          }));
        } catch (err) {
          // Ignore ping errors
        }
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop the ping interval
   */
  private stopPing(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket fully connected and ready');
      // Update connection state - we're connected but wait for first message to confirm auth
      this.updateConnectionState({
        isConnecting: false,
        error: null,
      });
    };

    this.socket.onclose = async (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      
      // Check if we received an auth error message before the close
      if (this.lastAuthError) {
        const authError = this.lastAuthError;
        this.lastAuthError = null; // Clear the error
        
        console.log('Handling auth error from message:', authError.error);
        
        if (authError.error === 'token_expired') {
          await this.handleTokenExpired();
        } else if (authError.error === 'token_blacklisted') {
          // Token has been blacklisted (logged out from another device), force logout
          console.log('Token has been blacklisted, forcing logout');
          this.handleAuthenticationError(event.code, 'Token has been blacklisted - please login again');
        } else {
          // Other auth errors require logout
          this.handleAuthenticationError(event.code, authError.message);
        }
        return;
      }
      
      // Handle different close codes - but since browsers often convert custom codes to 1006,
      // we primarily rely on auth_error messages received before the close
      if (event.code === 4001 && event.reason === 'token_expired') {
        // Token expired - try to refresh and reconnect
        await this.handleTokenExpired();
      } else if (event.code === 4002 || event.code === 4003 || event.code === 4004 || event.code === 4005) {
        // Authentication errors that require user login
        this.handleAuthenticationError(event.code, event.reason);
      } else if (event.code === 1006) {
        // Abnormal closure - could be due to auth error, check if we received an auth_error message
        // If not, treat as general connection error
        console.log('Connection closed abnormally (1006) - treating as connection error');
        this.handleConnectionError(`Disconnected abnormally: ${event.reason || 'Unknown reason'}`);
      } else {
        // Other connection errors - try to reconnect
        this.handleConnectionError(`Disconnected: ${event.reason || event.code}`);
      }
    };

    this.socket.onerror = (event) => {
      console.error('WebSocket connection error:', event);
      this.updateConnectionState({
        isConnecting: false,
        error: 'WebSocket error',
        reconnectAttempts: this.connectionState.reconnectAttempts + 1,
      });
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle auth_error messages specially
        if (data.type === 'auth_error') {
          this.lastAuthError = { error: data.error, message: data.message };
          console.log('Received auth error:', data.error, data.message);
          // Don't process this as a regular message - connection will close soon
          return;
        }

        if(this.lastAuthError || !this.connectionState.isConnected || this.connectionState.isConnecting || this.connectionState.error || this.connectionState.reconnectAttempts || this.connectionState.tokenRefreshAttempts) {
          this.lastAuthError = null; // Clear the error
          this.updateConnectionState({
            isConnected: true,
            isConnecting: false,
            error: null,
            reconnectAttempts: 0,
            tokenRefreshAttempts: 0,
          });
        }
        this.handleIncomingMessage(data.type, data);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
  }

  /**
   * Handle token expiration
   */
  private async handleTokenExpired(): Promise<void> {
    if (this.connectionState.tokenRefreshAttempts >= this.maxTokenRefreshAttempts) {
      // Max refresh attempts reached, logout user
      console.error('Max token refresh attempts reached, logging out user');
      this.updateConnectionState({
        isConnected: false,
        isConnecting: false,
        error: 'Session expired - please login again',
        tokenRefreshAttempts: this.connectionState.tokenRefreshAttempts + 1,
      });
      // // Trigger logout - use callback if available, fallback to window.location
      // if (this.logoutHandler) {
      //   this.logoutHandler();
      // }
      return;
    }

    console.log('Attempting to refresh token...');
    this.updateConnectionState({
      tokenRefreshAttempts: this.connectionState.tokenRefreshAttempts + 1,
    });

    const newToken = await this.refreshAccessToken();
    if (newToken) {
      console.log('Token refreshed successfully, reconnecting...');
      // Reset connection attempts when token refresh succeeds - give fresh start
      this.updateConnectionState({
        isConnecting: false,
        reconnectAttempts: 0, // Reset reconnect attempts after successful token refresh
      });
      // Attempt to reconnect with new token
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection after token refresh failed:', error);
        // Error handling is already done in connect method
      }
    } else {
      console.error('Failed to refresh token, logging out user');
      this.updateConnectionState({
        isConnected: false,
        isConnecting: false,
        error: 'Failed to refresh token - please login again',
      });
      // // Trigger logout
      // if (this.logoutHandler) {
      //   this.logoutHandler();
      // } else {
      //   console.warn('No logout handler set, falling back to window.location.href');
      //   window.location.href = '/auth/login';
      // }
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthenticationError(code: number, reason: string): void {
    console.error(`Authentication error: ${code} - ${reason}`);
    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      error: `Authentication failed: ${reason}`,
    });
    // Trigger logout for authentication errors
    this.logoutUser();
  }

  /**
   * Handle general connection errors with retry logic
   */
  private handleConnectionError(errorMessage: string): void {
    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      error: errorMessage,
    });

    // Only retry if we haven't exceeded max attempts
    if (this.connectionState.reconnectAttempts < this.maxReconnectAttempts) {
      const retryDelay = Math.min(1000 * Math.pow(2, this.connectionState.reconnectAttempts), 10000); // Exponential backoff, max 10s
      console.log(`Retrying connection in ${retryDelay}ms (attempt ${this.connectionState.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeoutId = setTimeout(async () => {
        this.updateConnectionState({
          reconnectAttempts: this.connectionState.reconnectAttempts + 1,
        });
        try {
          await this.connect();
        } catch (error) {
          console.error('Retry connection failed:', error);
          // Error handling is already done in connect method
        }
      }, retryDelay);
    } else {
      console.error('Max reconnection attempts reached');
      this.updateConnectionState({
        error: 'Connection failed after multiple attempts',
      });
      toast.warning("common.websocket.connectionFailedAfterMultipleAttempts");
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleIncomingMessage(eventName: string, message: any): Promise<void> {
    try {
      // Skip messages from this device to prevent self-updates
      const deviceId = await this.deviceIdService.getDeviceId();
      if (message.device_id === deviceId) {
        return;
      }

      const wsMessage: WebSocketMessage = {
        type: eventName,
        data: message,
        deviceId: message.device_id,
        timestamp: message.timestamp || new Date().toISOString(),
      };

      // Handle specific actions for profile updates
      if (eventName === 'profile_update' && message.action === 'profile_updated') {
        // Update local storage with new profile data
        this.updateLocalProfile(message.data);
      } else if (eventName === 'profile_password_update' && message.action === 'password_changed') {
        // Password was changed from another device - logout if different device
        this.handlePasswordChanged();
      } else if (eventName === 'profile_password_reset' && message.action === 'logout_required') {
        // Password was reset - logout immediately
        this.handlePasswordReset();
      }

      // Notify handlers
      const handlers = this.messageHandlers.get(eventName) || [];
      const globalHandlers = this.messageHandlers.get('*') || [];
      
      [...handlers, ...globalHandlers].forEach(handler => {
        try {
          handler(wsMessage);
        } catch (error) {
          console.error(`Error in message handler for ${eventName}:`, error);
        }
      });
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  /**
   * Send message to server
   */
  public async send(eventName: string, data: any): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const deviceId = await this.deviceIdService.getDeviceId();
    const message = {
      type: eventName,
      ...data,
      deviceId,
      timestamp: new Date().toISOString(),
    };

    this.socket.send(JSON.stringify(message));
  }

  /**
   * Subscribe to messages of a specific type
   */
  public onMessage(eventName: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(eventName)) {
      this.messageHandlers.set(eventName, []);
    }
    
    this.messageHandlers.get(eventName)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(eventName);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to all messages
   */
  public onAnyMessage(handler: MessageHandler): () => void {
    return this.onMessage('*', handler);
  }

  /**
   * Subscribe to connection state changes
   */
  public onConnectionStateChange(handler: ConnectionStateHandler): () => void {
    this.connectionStateHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.connectionStateHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionStateHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Update connection state and notify handlers
   */
  private updateConnectionState(updates: Partial<ConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates };
    
    this.connectionStateHandlers.forEach(handler => {
      try {
        handler(this.connectionState);
      } catch (error) {
        console.error('Error in connection state handler:', error);
      }
    });
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connectionState.isConnected;
  }

  /**
   * Update local profile data in storage
   */
  private async updateLocalProfile(profileData: any): Promise<void> {
    try {
      // Update user data in both session and local storage if it exists
      const userFromSession = await this.secureStorage.getSessionItem('user');
      if (userFromSession) {
        const sessionUser = JSON.parse(userFromSession);
        const updatedUser = { ...sessionUser, ...profileData };
        await this.secureStorage.setSessionItem('user', JSON.stringify(updatedUser));
      }

      const userFromLocal = await this.secureStorage.getItem('user');
      if (userFromLocal) {
        const localUser = JSON.parse(userFromLocal);
        const updatedUser = { ...localUser, ...profileData };
        await this.secureStorage.setItem('user', JSON.stringify(updatedUser));
      }

      console.log('Profile updated in local storage');
    } catch (error) {
      console.error('Failed to update local profile:', error);
    }
  }

  /**
   * Handle password change from another device
   */
  private handlePasswordChanged(): void {
    console.log('Password changed on another device - logging out');
    this.logoutUser();
  }

  /**
   * Handle password reset (from email link)
   */
  private handlePasswordReset(): void {
    console.log('Password reset detected - logging out');
    this.logoutUser();
  }

  /**
   * Logout user and redirect to login
   */
  private async logoutUser(): Promise<void> {
    // Disconnect WebSocket
    this.disconnect();
    // Use callback if available, fallback to window.location
    if (this.logoutHandler) {
      this.logoutHandler();
    }
  }
}

export default WebSocketService;
