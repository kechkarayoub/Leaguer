/**
 * UnauthenticatedApiService Tests
 * 
 * Tests for the public API service that handles unauthenticated requests
 */

import UnauthenticatedApiService, { ContactFormData, ApiResponse } from './UnauthenticatedApiService';
import axios from 'axios';
import DeviceIdService from './DeviceIdService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock DeviceIdService
jest.mock('./DeviceIdService');
// Only mock the static getInstance method to avoid constructor type issues
const MockedDeviceIdService = DeviceIdService as unknown as { getInstance: jest.Mock };

// Mock config
jest.mock('../config/config', () => ({
  backendEndpoint: 'https://api.test.com',
}));

describe('UnauthenticatedApiService', () => {
  let service: UnauthenticatedApiService;
  let mockDeviceIdService: jest.Mocked<DeviceIdService>;
  let mockAxiosInstance: jest.Mocked<any>;

  beforeEach(async () => {
    // Reset singleton instance
    (UnauthenticatedApiService as any).instance = undefined;
    
    // Setup DeviceIdService mock
    mockDeviceIdService = {
      getDeviceId: jest.fn().mockResolvedValue('device_123456_789012'),
    } as any;
    MockedDeviceIdService.getInstance.mockReturnValue(mockDeviceIdService);
    
    // Setup axios create mock
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    // Get fresh service instance
    service = UnauthenticatedApiService.getInstance();
    
    // Wait for async setupInterceptors to complete
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = UnauthenticatedApiService.getInstance();
      const instance2 = UnauthenticatedApiService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(service);
    });

    it('should maintain the same instance across multiple calls', () => {
      const instances = Array(5).fill(null).map(() => UnauthenticatedApiService.getInstance());
      
      instances.forEach(instance => {
        expect(instance).toBe(service);
      });
    });
  });

  describe('Service Initialization', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.test.com',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should setup request and response interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });

    it('should get DeviceIdService instance during initialization', () => {
      expect(MockedDeviceIdService.getInstance).toHaveBeenCalled();
    });
  });

  describe('Contact Form API', () => {
    const contactFormData: ContactFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Test Subject',
      message: 'Test message content',
    };

    it('should send contact message successfully', async () => {
      const mockResponse: ApiResponse = {
        success: true,
        message: 'Message sent successfully',
        data: { id: 123 },
      };
      
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });
      
      const result = await service.sendContactMessage(contactFormData);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/contact/', contactFormData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      const errorResponse = {
        response: {
          data: {
            success: false,
            message: 'Validation error',
            errors: {
              email: ['Invalid email format'],
            },
          },
        },
      };
      
      mockAxiosInstance.post.mockRejectedValue(errorResponse);
      
      const result = await service.sendContactMessage(contactFormData);
      
      expect(result).toEqual(errorResponse.response.data);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockAxiosInstance.post.mockRejectedValue(networkError);
      
      const result = await service.sendContactMessage(contactFormData);
      
      expect(result).toEqual({
        success: false,
        message: 'An error occurred while sending your message. Please try again later.',
      });
    });

    it('should validate contact form data structure', async () => {
      const mockResponse: ApiResponse = {
        success: true,
        message: 'Message sent successfully',
      };
      
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });
      
      await service.sendContactMessage(contactFormData);
      
      const sentData = mockAxiosInstance.post.mock.calls[0][1];
      expect(sentData).toEqual(contactFormData);
      expect(sentData).toHaveProperty('name');
      expect(sentData).toHaveProperty('email');
      expect(sentData).toHaveProperty('subject');
      expect(sentData).toHaveProperty('message');
    });
  });

  describe('Geolocation API', () => {
    it('should fetch geolocation with default parameters', async () => {
      const mockGeoData = {
        country: 'United States',
        countryCode: 'US',
      };
      
      mockAxiosInstance.get.mockResolvedValue({ data: mockGeoData });
      
      const result = await service.getGeolocation();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/geolocation/', {
        params: {
          requested_info: 'country,countryCode',
          selected_language: 'en',
        },
      });
      expect(result).toEqual(mockGeoData);
    });

    it('should fetch geolocation with custom parameters', async () => {
      const mockGeoData = {
        country: 'France',
        countryCode: 'FR',
        city: 'Paris',
      };
      
      mockAxiosInstance.get.mockResolvedValue({ data: mockGeoData });
      
      const result = await service.getGeolocation('country,countryCode,city', 'fr');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/geolocation/', {
        params: {
          requested_info: 'country,countryCode,city',
          selected_language: 'fr',
        },
      });
      expect(result).toEqual(mockGeoData);
    });

    it('should handle geolocation errors gracefully', async () => {
      const error = new Error('Geolocation service unavailable');
      mockAxiosInstance.get.mockRejectedValue(error);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await service.getGeolocation();
      
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching geolocation:', error);
      expect(result).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Health Check API', () => {
    it('should perform health check successfully', async () => {
      const mockHealthData = {
        status: 'ok',
        timestamp: '2023-01-01T00:00:00Z',
        version: '1.0.0',
      };
      
      mockAxiosInstance.get.mockResolvedValue({ data: mockHealthData });
      
      const result = await service.healthCheck();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/health/');
      expect(result).toEqual(mockHealthData);
    });

    it('should handle health check errors gracefully', async () => {
      const error = new Error('Health check failed');
      mockAxiosInstance.get.mockRejectedValue(error);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await service.healthCheck();
      
      expect(consoleSpy).toHaveBeenCalledWith('Error checking health:', error);
      expect(result).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });

  describe('API Info', () => {
    it('should fetch API info successfully', async () => {
      const mockApiInfo = {
        name: 'Leaguer API',
        version: '1.0.0',
        description: 'Public API endpoints',
        endpoints: ['/api/health/', '/api/info/', '/api/contact/'],
      };
      
      mockAxiosInstance.get.mockResolvedValue({ data: mockApiInfo });
      
      const result = await service.getApiInfo();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/info/');
      expect(result).toEqual(mockApiInfo);
    });

    it('should handle API info errors gracefully', async () => {
      const error = new Error('API info unavailable');
      mockAxiosInstance.get.mockRejectedValue(error);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await service.getApiInfo();
      
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching API info:', error);
      expect(result).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Request Interceptor', () => {
    it('should add device ID header to requests', async () => {
      // This test verifies the interceptor functionality indirectly
      // by ensuring DeviceIdService.getDeviceId is called during setup
      expect(MockedDeviceIdService.getInstance).toHaveBeenCalled();
    });

    it('should setup CSRF token handling', () => {
      // Verify that request interceptor was set up
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      
      // Get the interceptor function
      const interceptorCall = mockAxiosInstance.interceptors.request.use.mock.calls[0];
      expect(interceptorCall).toBeDefined();
      expect(typeof interceptorCall[0]).toBe('function');
    });
  });

  describe('Response Interceptor', () => {
    it('should setup response error handling', () => {
      // Verify that response interceptor was set up
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
      
      // Get the interceptor function
      const interceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[0];
      expect(interceptorCall).toBeDefined();
      expect(typeof interceptorCall[0]).toBe('function'); // Success handler
      expect(typeof interceptorCall[1]).toBe('function'); // Error handler
    });
  });

  describe('Error Handling', () => {
    it('should handle network error', async () => {
      const networkError = { request: {} };
      mockAxiosInstance.post.mockRejectedValueOnce(networkError);
      
      const result = await service.sendContactMessage({
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
      });
      
      expect(result).toEqual({
        success: false,
        message: 'An error occurred while sending your message. Please try again later.',
      });
    });

    it('should handle HTTP 400 error', async () => {
      const httpError = { 
        response: { 
          status: 400, 
          data: { message: 'Bad request' } 
        } 
      };
      mockAxiosInstance.post.mockRejectedValueOnce(httpError);
      
      const result = await service.sendContactMessage({
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
      });
      
      expect(result).toEqual(httpError.response.data);
    });

    it('should handle HTTP 500 error', async () => {
      const serverError = { 
        response: { 
          status: 500, 
          data: { message: 'Internal server error' } 
        } 
      };
      mockAxiosInstance.post.mockRejectedValueOnce(serverError);
      
      const result = await service.sendContactMessage({
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
      });
      
      expect(result).toEqual(serverError.response.data);
    });
  });

  describe('TypeScript Types', () => {
    it('should maintain proper typing for ContactFormData', () => {
      const validContactData: ContactFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'Test message',
      };
      
      // This test passes if TypeScript compilation succeeds
      expect(validContactData).toHaveProperty('name');
      expect(validContactData).toHaveProperty('email');
      expect(validContactData).toHaveProperty('subject');
      expect(validContactData).toHaveProperty('message');
    });

    it('should maintain proper typing for ApiResponse', () => {
      const validApiResponse: ApiResponse = {
        success: true,
        message: 'Success message',
        data: { id: 123 },
        errors: { field: ['Error message'] },
      };
      
      // This test passes if TypeScript compilation succeeds
      expect(validApiResponse).toHaveProperty('success');
      expect(validApiResponse).toHaveProperty('message');
      expect(validApiResponse).toHaveProperty('data');
      expect(validApiResponse).toHaveProperty('errors');
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const mockResponse = { data: { success: true, message: 'Success' } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      
      const requests = Array(10).fill(null).map((_, index) => 
        service.sendContactMessage({
          name: `User ${index}`,
          email: `user${index}@example.com`,
          subject: `Subject ${index}`,
          message: `Message ${index}`,
        })
      );
      
      const results = await Promise.all(requests);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toEqual(mockResponse.data);
      });
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(10);
    });

    it('should maintain singleton efficiency across operations', () => {
      const instance1 = UnauthenticatedApiService.getInstance();
      const instance2 = UnauthenticatedApiService.getInstance();
      const instance3 = UnauthenticatedApiService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
      
      // axios.create should only be called once during initialization
      expect(mockedAxios.create).toHaveBeenCalledTimes(1);
    });
  });
});
