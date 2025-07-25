/**
 * Unauthenticated API Service for React Web App
 * 
 * Handles public API requests that don't require authentication
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '../config/config';
import DeviceIdService from './DeviceIdService';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

class UnauthenticatedApiService {
  private static instance: UnauthenticatedApiService;
  private axiosInstance: AxiosInstance;
  private deviceIdService: DeviceIdService;

  private constructor() {
    this.deviceIdService = DeviceIdService.getInstance();
    
    this.axiosInstance = axios.create({
      baseURL: config.backendEndpoint,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): UnauthenticatedApiService {
    if (!UnauthenticatedApiService.instance) {
      UnauthenticatedApiService.instance = new UnauthenticatedApiService();
    }
    return UnauthenticatedApiService.instance;
  }

  private async setupInterceptors(): Promise<void> {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Add device ID header
        const deviceId = await this.deviceIdService.getDeviceId();
        config.headers['X-Device-ID'] = deviceId;

        // Add CSRF token for POST requests
        if (config.method === 'post' || config.method === 'put' || config.method === 'patch' || config.method === 'delete') {
          const csrfToken = this.getCSRFToken();
          if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken;
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle network errors
        if (!error.response) {
          console.error('Network error:', error.message);
          return Promise.reject(new Error('Network error. Please check your internet connection.'));
        }

        // Handle other HTTP errors
        const status = error.response.status;
        const message = error.response.data?.message || `HTTP ${status} Error`;
        
        console.error(`API Error ${status}:`, message);
        return Promise.reject(error);
      }
    );
  }

  private getCSRFToken(): string | null {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
  }

  /**
   * Send a contact form message
   */
  public async sendContactMessage(data: ContactFormData): Promise<ApiResponse> {
    try {
      const response = await this.axiosInstance.post('/api/contact/', data);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: 'An error occurred while sending your message. Please try again later.',
      };
    }
  }

  /**
   * Get geolocation information
   */
  public async getGeolocation(requestedInfo: string = 'country,countryCode', language: string = 'en'): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/api/geolocation/', {
        params: {
          requested_info: requestedInfo,
          selected_language: language,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching geolocation:', error);
      return null;
    }
  }

  /**
   * Health check endpoint
   */
  public async healthCheck(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/api/health/');
      return response.data;
    } catch (error: any) {
      console.error('Error checking health:', error);
      return null;
    }
  }

  /**
   * Get API information
   */
  public async getApiInfo(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/api/info/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching API info:', error);
      return null;
    }
  }
}

export default UnauthenticatedApiService;
