/**
 * Authenticated API Service for React Web App
 * 
 * Handles authenticated requests to the backend API with:
 * - Automatic token attachment
 * - Token refresh on expiry
 * - Session management
 * - Device ID integration
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '../config/config';
import DeviceIdService from './DeviceIdService';
import SecureStorageService from './SecureStorageService';
import { toast } from 'react-toastify';
import { getTranslation } from '../utils/GlobalUtils'; // Import the translation helper

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: string;
  isActive: boolean;
  lastLogin?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}


class AuthenticatedApiService {
  private static instance: AuthenticatedApiService;
  private axiosInstance: AxiosInstance;
  private deviceIdService: DeviceIdService;
  private secureStorage: SecureStorageService;
  private isRefreshing = false;
  private refreshPromise: Promise<AuthTokens> | null = null;
  
  // Callbacks
  public onSessionExpired?: () => void;
  public onTokenRefreshed?: (tokens: AuthTokens) => void;

  private constructor() {
    this.deviceIdService = DeviceIdService.getInstance();
    this.secureStorage = SecureStorageService.getInstance();
    
    this.axiosInstance = axios.create({
      baseURL: config.backendEndpoint,
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  public static getInstance(): AuthenticatedApiService {
    if (!AuthenticatedApiService.instance) {
      AuthenticatedApiService.instance = new AuthenticatedApiService();
    }
    return AuthenticatedApiService.instance;
  }

  private async setupInterceptors(): Promise<void> {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Add device ID header
        const deviceId = await this.deviceIdService.getDeviceId();
        config.headers['X-Device-ID'] = deviceId;

        // Add access token from either session or local storage
        let accessToken = await this.secureStorage.getSessionItem('access_token');
        if (!accessToken) {
          accessToken = await this.secureStorage.getItem('access_token');
        }
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Add content type for non-form data
        if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
          config.headers['Content-Type'] = 'application/json';
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Only retry for 401 errors (token expired) and only once
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            // Try to refresh token
            const tokens = await this.refreshTokens();
            if (tokens) {
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
              return this.axiosInstance(originalRequest);
            }

          } catch (refreshError) {
            // Refresh failed, logout user
            await this.handleSessionExpired();
            return Promise.reject(refreshError);
          }
        }
        else if(error.response?.status === 401){
          await this.handleSessionExpired();
        }

        // For all other error codes (including 409), don't retry
        // Just handle the error and reject
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  public async publicRefreshTokens(): Promise<AuthTokens | null> {
    return this.refreshTokens();
  }
  private async refreshTokens(): Promise<AuthTokens | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    
    try {
      // Check for refresh token in both storages
      let refreshToken = await this.secureStorage.getSessionItem('refresh_token');
      if (!refreshToken) {
        refreshToken = await this.secureStorage.getItem('refresh_token');
      }
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      this.refreshPromise = this.performTokenRefresh(refreshToken);
      const tokens = await this.refreshPromise;

      // Determine if we should use session or local storage based on existing tokens
      const hasSessionTokens = await this.secureStorage.getSessionItem('access_token');
      
      if (hasSessionTokens) {
        // User chose not to be remembered, use session storage
        await this.secureStorage.setSessionItem('access_token', tokens.accessToken);
        await this.secureStorage.setSessionItem('refresh_token', tokens.refreshToken);
      } else {
        // User chose to be remembered, use local storage
        await this.secureStorage.setItem('access_token', tokens.accessToken);
        await this.secureStorage.setItem('refresh_token', tokens.refreshToken);
      }

      // Notify listeners
      this.onTokenRefreshed?.(tokens);

      return tokens;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<AuthTokens> {
    const response = await axios.post(`${config.backendEndpoint}/accounts/api/token/refresh/`, {
      refresh: refreshToken,
    });

    return {
      accessToken: response.data.access,
      refreshToken: response.data.refresh || refreshToken,
    };
  }

  public async publicHandleSessionExpired(): Promise<void> {
    this.handleSessionExpired();
  }
  private async handleSessionExpired(): Promise<void> {
    console.log('Session expired - clearing tokens and redirecting to login');
    
    // Clear tokens
    await this.clearTokens();

    // Clear user data
    await this.secureStorage.removeSessionItem('user');
    await this.secureStorage.removeItem('user');

    // Show toast message
    toast.error(getTranslation('errors:authentication.sessionExpired', 'Session expired. Please login again.'));
    
    // Notify callback if set (for additional cleanup)
    this.onSessionExpired?.();
    
    // Force navigation to login page using window.location
    window.location.href = '/auth/login';
  }

  private handleApiError(error: any): void {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          // toast.error(data.message || getTranslation('errors:general.badRequest', 'Bad request'));
          break;
        case 403:
          toast.error(getTranslation('errors:general.accessDenied', 'Access denied'));
          break;
        case 404:
          toast.error(getTranslation('errors:general.resourceNotFound', 'Resource not found'));
          break;
        case 409:
          // Don't show toast for 409 (Conflict) errors - these are usually validation errors
          // that should be handled by the component itself
          console.log('Validation/Conflict error (409):', data);
          break;
        case 500:
          toast.error(getTranslation('errors:general.serverError', 'Server error. Please try again.'));
          break;
        default:
          // For other errors, only show toast if it's not a 409
          if (status !== 409) {
            toast.error(data.message || getTranslation('errors:general.generic', 'An error occurred'));
          }
      }
    } else if (error.request) {
      toast.error(getTranslation('errors:general.network', 'Network error. Please check your connection.'));
    } else {
      toast.error(getTranslation('errors:general.unexpected', 'An unexpected error occurred'));
    }
  }

  // Public API methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get(url, config);
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post(url, data, config);
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put(url, data, config);
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch(url, data, config);
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete(url, config);
  }

  // Authentication methods
  public async setTokens(tokens: AuthTokens): Promise<void> {
    await this.secureStorage.setItem('access_token', tokens.accessToken);
    await this.secureStorage.setItem('refresh_token', tokens.refreshToken);
  }

  public async clearTokens(): Promise<void> {
    // Clear tokens from both storages
    await this.secureStorage.removeItem('access_token');
    await this.secureStorage.removeItem('refresh_token');
    await this.secureStorage.removeSessionItem('access_token');
    await this.secureStorage.removeSessionItem('refresh_token');
  }

  /**
   * Logout user by blacklisting their tokens on the server
   */
  public async logout(data: any = {}): Promise<void> {
    try {
      // Get refresh token for blacklisting
      let refreshToken = await this.secureStorage.getSessionItem('refresh_token');
      if (!refreshToken) {
        refreshToken = await this.secureStorage.getItem('refresh_token');
      }

      if (refreshToken) {
        // Call logout endpoint to blacklist the token
        data.refresh_token = refreshToken;
        await this.axiosInstance.post('/accounts/logout/', data);
      }
    } catch (error) {
      // If logout API call fails, still proceed with local cleanup
      console.error('Logout API call failed:', error);
    } finally {
    }
  }

  public async hasValidToken(): Promise<boolean> {
    // Check for token in either session or local storage
    let accessToken = await this.secureStorage.getSessionItem('access_token');
    if (!accessToken) {
      accessToken = await this.secureStorage.getItem('access_token');
    }
    return !!accessToken;
  }
}

export default AuthenticatedApiService;
