/**
 * WebSocket Service for React Web App
 * 
 * Handles WebSocket connections with:
 * - Automatic reconnection
 * - Device ID filtering (prevents self-updates)
 * - Event-based message handling
 * - Connection state management
 */

import { io, Socket } from 'socket.io-client';
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
  private socket: Socket | null = null;
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
    if (this.socket?.connected) {
      return;
    }

    this.updateConnectionState({
      isConnecting: true,
      error: null,
    });

    try {
      const accessToken = await this.secureStorage.getItem('access_token');
      const deviceId = await this.deviceIdService.getDeviceId();

      this.socket = io(config.wsEndpoint, {
        auth: {
          token: accessToken,
          deviceId: deviceId,
        },
        transports: ['websocket'],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.setupEventHandlers();
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
      this.socket.disconnect();
      this.socket = null;
    }

    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnectAttempts: 0,
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.updateConnectionState({
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectAttempts: 0,
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.updateConnectionState({
        isConnected: false,
        isConnecting: false,
        error: `Disconnected: ${reason}`,
      });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.updateConnectionState({
        isConnecting: false,
        error: error.message,
        reconnectAttempts: this.connectionState.reconnectAttempts + 1,
      });
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`WebSocket reconnection attempt ${attemptNumber}`);
      this.updateConnectionState({
        isConnecting: true,
        reconnectAttempts: attemptNumber,
      });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      this.updateConnectionState({
        isConnecting: false,
        error: 'Reconnection failed',
      });
    });

    // Handle incoming messages
    this.socket.onAny((eventName, message) => {
      this.handleIncomingMessage(eventName, message);
    });
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
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    const deviceId = await this.deviceIdService.getDeviceId();
    const message = {
      ...data,
      deviceId,
      timestamp: new Date().toISOString(),
    };

    this.socket.emit(eventName, message);
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
