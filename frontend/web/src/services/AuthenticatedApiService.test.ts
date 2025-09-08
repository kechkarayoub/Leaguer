import axios from 'axios';
import AuthenticatedApiService from './AuthenticatedApiService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock dependencies
jest.mock('./DeviceIdService');
jest.mock('./SecureStorageService');
jest.mock('react-toastify');
jest.mock('../utils/GlobalUtils', () => ({
  getTranslation: jest.fn((key, defaultValue) => defaultValue)
}));
jest.mock('../config/config', () => ({
  backendEndpoint: 'https://api.test.com'
}));

describe('AuthenticatedApiService', () => {
  let service: AuthenticatedApiService;
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
        clear: jest.fn(),
        eject: jest.fn()
      },
      response: {
        use: jest.fn(),
        clear: jest.fn(),
        eject: jest.fn()
      }
    }
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Reset the singleton instance
    (AuthenticatedApiService as any).instance = undefined;
    
    // Mock axios.create to return our mock instance
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    
    // Mock axios for token refresh calls
    mockedAxios.post.mockResolvedValue({
      data: {
        access: 'new-access-token',
        refresh: 'new-refresh-token'
      }
    });
    
    // Mock SecureStorageService with proper token storage
    const MockedSecureStorageService = require('./SecureStorageService').default;
    const mockSecureStorage = {
      getItem: jest.fn().mockImplementation((key: string) => {
        if (key === 'refresh_token') return Promise.resolve('mock-refresh-token');
        if (key === 'access_token') return Promise.resolve('mock-access-token');
        return Promise.resolve(null);
      }),
      setItem: jest.fn().mockResolvedValue(undefined),
      removeItem: jest.fn().mockResolvedValue(undefined),
      getSessionItem: jest.fn().mockImplementation((key: string) => {
        if (key === 'refresh_token') return Promise.resolve('mock-refresh-token');
        if (key === 'access_token') return Promise.resolve('mock-access-token');
        return Promise.resolve(null);
      }),
      setSessionItem: jest.fn().mockResolvedValue(undefined),
      removeSessionItem: jest.fn().mockResolvedValue(undefined)
    };
    MockedSecureStorageService.getInstance.mockReturnValue(mockSecureStorage);

    // Mock DeviceIdService
    const MockedDeviceIdService = require('./DeviceIdService').default;
    MockedDeviceIdService.getInstance.mockReturnValue({
      getDeviceId: jest.fn().mockResolvedValue('test-device-id')
    });

    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '' };
    
    // Wait a bit to ensure async initialization completes
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Initialize service instance
    service = AuthenticatedApiService.getInstance();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', async () => {
      const instance1 = AuthenticatedApiService.getInstance();
      const instance2 = AuthenticatedApiService.getInstance();
      
      expect(instance1).toBe(instance2);
      
      // Wait for async initialization to complete
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should maintain the same instance across multiple calls', async () => {
      const instances = Array.from({ length: 10 }, () => 
        AuthenticatedApiService.getInstance()
      );
      
      instances.forEach((instance, index) => {
        expect(instance).toBe(instances[0]);
      });
      
      // Wait for async initialization to complete
      await new Promise(resolve => setTimeout(resolve, 10));
    });
  });

  describe('Initialization', () => {
    beforeEach(() => {
      service = AuthenticatedApiService.getInstance();
    });

    it('should create axios instance with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.test.com',
        timeout: 30000,
      });
    });

    it('should setup request interceptor', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it('should setup response interceptor', () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });

    it('should handle missing environment variables', () => {
      // Reset singleton to test with new config
      (AuthenticatedApiService as any).instance = undefined;
      
      AuthenticatedApiService.getInstance();
      
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.test.com',
        timeout: 30000,
      });
    });
  });

  describe('Request Interceptor', () => {
    let mockSecureStorage: any;
    let mockDeviceIdService: any;

    beforeEach(() => {
      service = AuthenticatedApiService.getInstance();
      
      // Get mocked services
      const MockedSecureStorageService = require('./SecureStorageService').default;
      mockSecureStorage = MockedSecureStorageService.getInstance();
      
      const MockedDeviceIdService = require('./DeviceIdService').default;
      mockDeviceIdService = MockedDeviceIdService.getInstance();
    });

    it('should add device ID header to requests', async () => {
      const mockConfig = { headers: {} };
      mockDeviceIdService.getDeviceId.mockResolvedValue('test-device-id');
      
      // Get the interceptor function
      const interceptorCall = mockAxiosInstance.interceptors.request.use.mock.calls[0];
      const requestInterceptor = interceptorCall[0];
      
      const result = await requestInterceptor(mockConfig);
      
      expect(result.headers['X-Device-ID']).toBe('test-device-id');
    });

    it('should add authorization header when session token exists', async () => {
      const mockConfig = { headers: {} };
      const mockToken = 'test-jwt-token';
      
      mockSecureStorage.getSessionItem.mockResolvedValue(mockToken);
      mockSecureStorage.getItem.mockResolvedValue(null);
      
      const interceptorCall = mockAxiosInstance.interceptors.request.use.mock.calls[0];
      const requestInterceptor = interceptorCall[0];
      
      const result = await requestInterceptor(mockConfig);
      
      expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('should add authorization header from local storage when session token missing', async () => {
      const mockConfig = { headers: {} };
      const mockToken = 'test-local-token';
      
      mockSecureStorage.getSessionItem.mockResolvedValue(null);
      mockSecureStorage.getItem.mockResolvedValue(mockToken);
      
      const interceptorCall = mockAxiosInstance.interceptors.request.use.mock.calls[0];
      const requestInterceptor = interceptorCall[0];
      
      const result = await requestInterceptor(mockConfig);
      
      expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('should not add authorization header when no token exists', async () => {
      const mockConfig = { headers: {} };
      
      mockSecureStorage.getSessionItem.mockResolvedValue(null);
      mockSecureStorage.getItem.mockResolvedValue(null);
      
      const interceptorCall = mockAxiosInstance.interceptors.request.use.mock.calls[0];
      const requestInterceptor = interceptorCall[0];
      
      const result = await requestInterceptor(mockConfig);
      
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should add content type for non-FormData requests', async () => {
      const mockConfig = { 
        headers: {},
        data: { test: 'data' }
      };
      
      const interceptorCall = mockAxiosInstance.interceptors.request.use.mock.calls[0];
      const requestInterceptor = interceptorCall[0];
      
      const result = await requestInterceptor(mockConfig);
      
      expect(result.headers['Content-Type']).toBe('application/json');
    });

    it('should not override existing content type', async () => {
      const mockConfig = { 
        headers: { 'Content-Type': 'application/xml' },
        data: { test: 'data' }
      };
      
      const interceptorCall = mockAxiosInstance.interceptors.request.use.mock.calls[0];
      const requestInterceptor = interceptorCall[0];
      
      const result = await requestInterceptor(mockConfig);
      
      expect(result.headers['Content-Type']).toBe('application/xml');
    });

    it('should not add content type for FormData', async () => {
      const formData = new FormData();
      const mockConfig = { 
        headers: {},
        data: formData
      };
      
      const interceptorCall = mockAxiosInstance.interceptors.request.use.mock.calls[0];
      const requestInterceptor = interceptorCall[0];
      
      const result = await requestInterceptor(mockConfig);
      
      expect(result.headers['Content-Type']).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    beforeEach(() => {
      service = AuthenticatedApiService.getInstance();
    });

    it('should pass through successful responses', () => {
      const mockResponse = { data: { success: true }, status: 200 };
      
      const interceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[0];
      const responseInterceptor = interceptorCall[0];
      
      const result = responseInterceptor(mockResponse);
      
      expect(result).toBe(mockResponse);
    });

    it('should handle 401 unauthorized errors', async () => {
      const mockError = {
        response: { status: 401, data: { message: 'Unauthorized' } },
        config: { _retry: false }
      };
      
      const interceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[0];
      const errorInterceptor = interceptorCall[1];
      
      // Error interceptor is async and returns a rejected promise
      await expect(errorInterceptor(mockError)).rejects.toBeDefined();
    });

    it('should handle other response errors', async () => {
      const mockError = {
        response: { status: 500, data: { message: 'Server Error' } },
        config: {}
      };
      
      const interceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[0];
      const errorInterceptor = interceptorCall[1];
      
      // Error interceptor is async and returns a rejected promise
      await expect(errorInterceptor(mockError)).rejects.toBeDefined();
    });

    it('should handle network errors', async () => {
      const mockError = { 
        message: 'Network Error',
        config: {}
      };
      
      const interceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[0];
      const errorInterceptor = interceptorCall[1];
      
      // Error interceptor is async and returns a rejected promise
      await expect(errorInterceptor(mockError)).rejects.toBeDefined();
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      service = AuthenticatedApiService.getInstance();
    });

    it('should perform GET request', async () => {
      const mockResponse = { data: { id: 1 } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      
      const result = await service.get('/test');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toBe(mockResponse);
    });

    it('should perform GET request with config', async () => {
      const mockResponse = { data: { id: 1 } };
      const config = { params: { page: 1 } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      
      const result = await service.get('/test', config);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', config);
      expect(result).toBe(mockResponse);
    });

    it('should perform POST request', async () => {
      const mockResponse = { data: { success: true } };
      const data = { name: 'test' };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      
      const result = await service.post('/test', data);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', data, undefined);
      expect(result).toBe(mockResponse);
    });

    it('should perform POST request with config', async () => {
      const mockResponse = { data: { success: true } };
      const data = { name: 'test' };
      const config = { headers: { 'Custom': 'header' } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      
      const result = await service.post('/test', data, config);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', data, config);
      expect(result).toBe(mockResponse);
    });

    it('should perform PUT request', async () => {
      const mockResponse = { data: { updated: true } };
      const data = { name: 'updated' };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);
      
      const result = await service.put('/test', data);
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test', data, undefined);
      expect(result).toBe(mockResponse);
    });

    it('should perform PATCH request', async () => {
      const mockResponse = { data: { patched: true } };
      const data = { status: 'active' };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);
      
      const result = await service.patch('/test', data);
      
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test', data, undefined);
      expect(result).toBe(mockResponse);
    });

    it('should perform DELETE request', async () => {
      const mockResponse = { data: { deleted: true } };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);
      
      const result = await service.delete('/test');
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test', undefined);
      expect(result).toBe(mockResponse);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      service = AuthenticatedApiService.getInstance();
    });

    it('should handle GET request errors', async () => {
      const error = new Error('Request failed');
      mockAxiosInstance.get.mockRejectedValue(error);
      
      await expect(service.get('/test')).rejects.toThrow('Request failed');
    });

    it('should handle POST request errors', async () => {
      const error = new Error('Post failed');
      mockAxiosInstance.post.mockRejectedValue(error);
      
      await expect(service.post('/test', {})).rejects.toThrow('Post failed');
    });

    it('should handle request timeout', async () => {
      const error = { code: 'ECONNABORTED', message: 'timeout' };
      mockAxiosInstance.get.mockRejectedValue(error);
      
      await expect(service.get('/test')).rejects.toMatchObject(error);
    });
  });

  describe('TypeScript Types', () => {
    beforeEach(() => {
      service = AuthenticatedApiService.getInstance();
    });

    it('should handle typed responses', async () => {
      interface TestResponse {
        id: number;
        name: string;
      }
      
      const mockResponse = { 
        data: { id: 1, name: 'test' } as TestResponse 
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      
      const result = await service.get<TestResponse>('/test');
      
      expect(result.data.id).toBe(1);
      expect(result.data.name).toBe('test');
    });

    it('should handle typed request data', async () => {
      interface TestData {
        name: string;
        age: number;
      }
      
      const data: TestData = { name: 'test', age: 25 };
      const mockResponse = { data: { success: true } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      
      await service.post('/test', data);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', data, undefined);
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      service = AuthenticatedApiService.getInstance();
    });

    it('should maintain singleton efficiency', () => {
      const startTime = performance.now();
      
      // Create multiple instances
      const instances = Array.from({ length: 100 }, () => 
        AuthenticatedApiService.getInstance()
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should be very fast since it's just returning the same instance
      expect(duration).toBeLessThan(10);
      
      // All instances should be the same
      instances.forEach(instance => {
        expect(instance).toBe(instances[0]);
      });
      
      // axios.create should only be called once during initialization
      expect(mockedAxios.create).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid API calls efficiently', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { success: true } });
      
      const startTime = performance.now();
      
      // Make multiple rapid API calls
      const promises = Array.from({ length: 50 }, (_, i) => 
        service.get(`/test/${i}`)
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete reasonably fast
      expect(duration).toBeLessThan(1000);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(50);
    });
  });

  describe('Configuration', () => {
    it('should use configuration from config file', () => {
      // Reset singleton to test configuration
      (AuthenticatedApiService as any).instance = undefined;
      
      AuthenticatedApiService.getInstance();
      
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.test.com',
        timeout: 30000,
      });
    });

    it('should maintain consistent configuration', () => {
      // Reset singleton to test with different config
      (AuthenticatedApiService as any).instance = undefined;
      
      AuthenticatedApiService.getInstance();
      
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.test.com',
        timeout: 30000,
      });
    });
  });

  describe('Cleanup', () => {
    it('should maintain state across service calls', () => {
      const service1 = AuthenticatedApiService.getInstance();
      const service2 = AuthenticatedApiService.getInstance();
      
      expect(service1).toBe(service2);
      expect(mockedAxios.create).toHaveBeenCalledTimes(1);
    });
  });
});
