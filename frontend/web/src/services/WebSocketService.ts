/**
 * WebSocket Service for React Web App
 * 
 * Handles WebSocket connections with:
 * - Automatic reconnection
 * - Device ID filtering (prevents self-updates)
 * - Event-based message handling
 * - Connection state management
 */

// No socket.io-client: use native WebSocket
import config from '../config/config';
import DeviceIdService from './DeviceIdService';
import SecureStorageService from './SecureStorageService';

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
}

type MessageHandler = (message: WebSocketMessage) => void;
type ConnectionStateHandler = (state: ConnectionState) => void;

class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private deviceIdService: DeviceIdService;
  private secureStorage: SecureStorageService;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private connectionStateHandlers: ConnectionStateHandler[] = [];
  private connectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0,
  };
  private pingIntervalId: NodeJS.Timeout | null = null;

  private constructor() {
    this.deviceIdService = DeviceIdService.getInstance();
    this.secureStorage = SecureStorageService.getInstance();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket server
   */
  public async connect(): Promise<void> {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.updateConnectionState({
      isConnecting: true,
      error: null,
    });

    try {
      const accessTokenFromSession = await this.secureStorage.getSessionItem('access_token');
      const accessTokenFromLocal = await this.secureStorage.getItem('access_token');
      const accessToken = accessTokenFromSession || accessTokenFromLocal;
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

      this.socket = new WebSocket(wsUrl);
      this.setupEventHandlers();
      this.startPing();
    } catch (error) {
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
    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnectAttempts: 0,
    });
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
          const accessTokenFromSession = await this.secureStorage.getSessionItem('access_token');
          const accessTokenFromLocal = await this.secureStorage.getItem('access_token');
          const accessToken = accessTokenFromSession || accessTokenFromLocal;
          this.socket.send(JSON.stringify({ type: 'ping', deviceId, token: accessToken || '', timestamp: new Date().toISOString() }));
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
      console.log('WebSocket connected');
      this.updateConnectionState({
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectAttempts: 0,
      });
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.reason);
      this.updateConnectionState({
        isConnected: false,
        isConnecting: false,
        error: `Disconnected: ${event.reason || event.code}`,
      });
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
        this.handleIncomingMessage(data.type, data);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleIncomingMessage(eventName: string, message: any): Promise<void> {
    try {
      // Skip messages from this device to prevent self-updates
      const deviceId = await this.deviceIdService.getDeviceId();
      if (message.deviceId === deviceId) {
        return;
      }

      const wsMessage: WebSocketMessage = {
        type: eventName,
        data: message,
        deviceId: message.deviceId,
        timestamp: message.timestamp || new Date().toISOString(),
      };

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
}

export default WebSocketService;
