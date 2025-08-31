import WebSocketService from './WebSocketService';

// Mock dependencies
jest.mock('./AuthenticatedApiService');
jest.mock('./DeviceIdService');
jest.mock('./SecureStorageService');

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation((url) => ({
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: WebSocket.CONNECTING,
  url: url,
  protocol: '',
  extensions: '',
  bufferedAmount: 0,
  binaryType: 'blob',
  onopen: null,
  onmessage: null,
  onclose: null,
  onerror: null,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
})) as any;

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockWebSocket: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Reset singleton instance
    (WebSocketService as any).instance = undefined;
    
    // Setup WebSocket mock
    mockWebSocket = {
      close: jest.fn(),
      send: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      readyState: WebSocket.OPEN,
      url: 'ws://test.com',
      protocol: '',
      extensions: '',
      bufferedAmount: 0,
      binaryType: 'blob',
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3
    };
    
    (global.WebSocket as any).mockReturnValue(mockWebSocket);
    
    // Mock AuthenticatedApiService
    const MockedAuthenticatedApiService = require('./AuthenticatedApiService').default;
    MockedAuthenticatedApiService.getInstance.mockReturnValue({
      getCurrentUser: jest.fn().mockResolvedValue({ id: 'user123' }),
      getAccessToken: jest.fn().mockResolvedValue('mock-token'),
      hasValidToken: jest.fn().mockResolvedValue(true)
    });

    // Mock DeviceIdService
    const MockedDeviceIdService = require('./DeviceIdService').default;
    MockedDeviceIdService.getInstance.mockReturnValue({
      getDeviceId: jest.fn().mockResolvedValue('device123')
    });

    // Mock SecureStorageService
    const MockedSecureStorageService = require('./SecureStorageService').default;
    const mockUser = JSON.stringify({ id: 'user123', name: 'Test User' });
    MockedSecureStorageService.getInstance.mockReturnValue({
      getItem: jest.fn().mockImplementation((key: string) => {
        if (key === 'user') return Promise.resolve(mockUser);
        if (key === 'access_token') return Promise.resolve('mock-access-token');
        return Promise.resolve(null);
      }),
      setItem: jest.fn().mockResolvedValue(undefined),
      getSessionItem: jest.fn().mockImplementation((key: string) => {
        if (key === 'user') return Promise.resolve(mockUser);
        if (key === 'access_token') return Promise.resolve('mock-session-access-token');
        return Promise.resolve(null);
      }),
      setSessionItem: jest.fn().mockResolvedValue(undefined),
      removeItem: jest.fn().mockResolvedValue(undefined),
      removeSessionItem: jest.fn().mockResolvedValue(undefined)
    });

    // Wait for async initialization
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = WebSocketService.getInstance();
      const instance2 = WebSocketService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should maintain singleton across multiple calls', () => {
      const instances = Array.from({ length: 5 }, () => WebSocketService.getInstance());
      
      instances.forEach(instance => {
        expect(instance).toBe(instances[0]);
      });
    });
  });

  describe('Basic Functionality', () => {
    beforeEach(() => {
      service = WebSocketService.getInstance();
    });

    it('should create service instance', () => {
      expect(service).toBeInstanceOf(WebSocketService);
      expect(service).toBeTruthy();
    });

    it('should have all required methods', () => {
      expect(typeof service.connect).toBe('function');
      expect(typeof service.disconnect).toBe('function');
      expect(typeof service.send).toBe('function');
      expect(typeof service.isConnected).toBe('function');
    });
  });

  describe('Connection Management', () => {
    beforeEach(() => {
      service = WebSocketService.getInstance();
    });

    it('should handle connect method', () => {
      // Connect method should return a promise
      const result = service.connect();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should handle disconnect method', () => {
      // Disconnect should work even without connection
      expect(() => service.disconnect()).not.toThrow();
    });

    it('should handle isConnected method', () => {
      const result = service.isConnected();
      expect(typeof result).toBe('boolean');
      expect(result).toBe(false); // Should be false initially
    });
  });

  describe('Message Handling', () => {
    beforeEach(() => {
      service = WebSocketService.getInstance();
    });

    it('should reject send when WebSocket not connected', async () => {
      const eventName = 'test_event';
      const data = { message: 'test' };
      
      // Should reject when WebSocket is not connected
      await expect(service.send(eventName, data)).rejects.toThrow('WebSocket not connected');
    });

    it('should handle send method when socket is open', async () => {
      const eventName = 'test_event';
      const data = { message: 'test' };
      
      // Mock the socket as open
      (service as any).socket = {
        ...mockWebSocket,
        readyState: WebSocket.OPEN,
        send: jest.fn()
      };
      
      await expect(service.send(eventName, data)).resolves.not.toThrow();
      expect((service as any).socket.send).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      service = WebSocketService.getInstance();
    });

    it('should handle WebSocket creation errors gracefully', () => {
      (global.WebSocket as any).mockImplementation(() => {
        throw new Error('WebSocket creation failed');
      });
      
      expect(() => WebSocketService.getInstance()).not.toThrow();
    });

    it('should handle connection errors gracefully', () => {
      expect(() => service.connect()).not.toThrow();
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should maintain proper TypeScript types', () => {
      const service = WebSocketService.getInstance();
      
      // Test method signatures exist and return correct types
      expect(service.connect).toBeDefined();
      expect(service.disconnect).toBeDefined();
      expect(service.send).toBeDefined();
      expect(service.isConnected).toBeDefined();
      
      // Test return types
      expect(typeof service.isConnected()).toBe('boolean');
      
      // Test method types
      expect(typeof service.connect).toBe('function');
      expect(typeof service.disconnect).toBe('function');
      expect(typeof service.send).toBe('function');
    });
  });

  describe('Performance', () => {
    it('should create singleton instance efficiently', () => {
      const startTime = performance.now();
      const instance = WebSocketService.getInstance();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
      expect(instance).toBeDefined();
    });

    it('should maintain performance across multiple getInstance calls', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        WebSocketService.getInstance();
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });
  });
});
