/**
 * Authenticated API Service for React Native
 * 
 * Handles authenticated requests to the backend API with:
 * - Automatic token attachment
 * - Token refresh on expiry
 * - Device ID integration
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { t } from 'i18next';

import config from '../config/config';
import DeviceIdService from './DeviceIdService';
import SecureStorageService from './SecureStorageService';
import { AuthTokens } from '../types/auth.types';

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
      timeout: config.apiTimeout,
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
      async (requestConfig) => {
        // Add device ID header
        const deviceId = await this.deviceIdService.getDeviceId();
        requestConfig.headers['X-Device-ID'] = deviceId;

        // Add platform header
        requestConfig.headers['X-Platform'] = Platform.OS;

        // Add access token
        let accessToken = await this.secureStorage.getSessionItem('access_token');
        if (!accessToken) {
          accessToken = await this.secureStorage.getSecureItem('access_token');
        }
        if (accessToken) {
          requestConfig.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Add content type for non-form data
        if (!requestConfig.headers['Content-Type'] && !(requestConfig.data instanceof FormData)) {
          requestConfig.headers['Content-Type'] = 'application/json';
        }

        return requestConfig;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Only retry for 401 errors (token expired) and only once
        console.log('API response error status:', error.response?.status);
        console.log('Original request _retry flag:', originalRequest._retry);
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
        } else if (error.response?.status === 401) {
          await this.handleSessionExpired();
        }
        console.log('end calllllllllllllllllllllllllllll');

        // For all other error codes, handle the error and reject
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
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
        refreshToken = await this.secureStorage.getSecureItem('refresh_token');
      }
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      this.refreshPromise = this.performTokenRefresh(refreshToken);
      const tokens = await this.refreshPromise;

      // Determine if we should use session or secure storage based on existing tokens
      const hasSessionTokens = await this.secureStorage.getSessionItem('access_token');
      
      if (hasSessionTokens) {
        // User chose not to be remembered, use session storage
        await this.secureStorage.setSessionItem('access_token', tokens.accessToken);
        await this.secureStorage.setSessionItem('refresh_token', tokens.refreshToken);
      } else {
        // User chose to be remembered, use secure storage
        await this.secureStorage.setSecureItem('access_token', tokens.accessToken);
        await this.secureStorage.setSecureItem('refresh_token', tokens.refreshToken);
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

  private async handleSessionExpired(): Promise<void> {
    console.log('Session expired - clearing tokens');
    
    // Clear tokens
    await this.clearTokens();

    // Clear user data
    await this.secureStorage.removeSessionItem('user');
    await this.secureStorage.removeItem('user');

    // Show toast message
    Toast.show({
      type: 'error',
      text1: t('errors:authentication.title', { defaultValue: t('errors:title', { defaultValue: 'Error' }) }),
      text2: t('errors:authentication.sessionExpired', { defaultValue: 'Your session has expired. Please log in again.' }),
    });
    
    // Notify callback if set (for additional cleanup)
    this.onSessionExpired?.();
  }

  private handleApiError(error: any): void {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          // Don't show toast for validation errors
          break;
        case 403:
          Toast.show({
            type: 'error',
            text1: t('errors:general.accessDenied', { defaultValue: 'Access denied' }),
            text2: t('errors:general.contactSupport', { defaultValue: 'If the problem persists, please contact support' }),
          });
          break;
        case 404:
          Toast.show({
            type: 'error',
            text1: t('errors:general.notFound', { defaultValue: 'Resource not found' }),
            text2: t('errors:server.notFound', { defaultValue: 'Resource not found' }),
          });
          break;
        case 409:
          // Don't show toast for 409 (Conflict) errors - these are usually validation errors
          console.log('Validation/Conflict error (409):', data);
          break;
        case 500:
          Toast.show({
            type: 'error',
            text1: t('errors:server.title', { defaultValue: 'Server Error' }),
            text2: t('errors:server.internal', { defaultValue: 'Internal server error' }),
          });
          break;
        default:
          if (status !== 409) {
            const fallbackGeneric = t('errors:general.generic', { defaultValue: 'An error occurred' });
            const serverMessage = typeof data?.message === 'string' && data.message.trim() ? data.message : undefined;
            Toast.show({
              type: 'error',
              text1: t('errors:title', { defaultValue: 'Error' }),
              text2: serverMessage || fallbackGeneric,
            });
          }
      }
    } else if (error.request) {
      Toast.show({
        type: 'error',
        text1: t('errors:network.title', { defaultValue: 'Network Error' }),
        text2: t('errors:network.message', { defaultValue: 'Unable to connect to the server. Please check your internet connection.' }),
      });
    } else {
      Toast.show({
        type: 'error',
        text1: t('errors:general.unexpected', { defaultValue: 'An unexpected error occurred' }),
        text2: t('errors:errorDescription', { defaultValue: 'An unexpected error occurred. Please try refreshing the page.' }),
      });
    }
  }

  // Public API methods
  public async get<T = any>(url: string, requestConfig?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get(url, requestConfig);
  }

  public async post<T = any>(url: string, data?: any, requestConfig?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post(url, data, requestConfig);
  }

  public async put<T = any>(url: string, data?: any, requestConfig?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put(url, data, requestConfig);
  }

  public async patch<T = any>(url: string, data?: any, requestConfig?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch(url, data, requestConfig);
  }

  public async delete<T = any>(url: string, requestConfig?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete(url, requestConfig);
  }

  // Authentication methods
  public async setTokens(tokens: AuthTokens, useSessionStorage: boolean = false): Promise<void> {
    if (useSessionStorage) {
      await this.secureStorage.setSessionItem('access_token', tokens.accessToken);
      await this.secureStorage.setSessionItem('refresh_token', tokens.refreshToken);
    } else {
      await this.secureStorage.setSecureItem('access_token', tokens.accessToken);
      await this.secureStorage.setSecureItem('refresh_token', tokens.refreshToken);
    }
  }

  public async clearTokens(): Promise<void> {
    // Clear tokens from both storages
    await this.secureStorage.removeSecureItem('access_token');
    await this.secureStorage.removeSecureItem('refresh_token');
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
        refreshToken = await this.secureStorage.getSecureItem('refresh_token');
      }

      if (refreshToken) {
        // Call logout endpoint to blacklist the token
        data.refresh_token = refreshToken;
        await this.axiosInstance.post('/accounts/logout/', data);
      }
    } catch (error) {
      // If logout API call fails, still proceed with local cleanup
      console.error('Logout API call failed:', error);
    }
  }

  public async hasValidToken(): Promise<boolean> {
    // Check for token in either session or secure storage
    let accessToken = await this.secureStorage.getSessionItem('access_token');
    if (!accessToken) {
      accessToken = await this.secureStorage.getSecureItem('access_token');
    }
    return !!accessToken;
  }
}

export default AuthenticatedApiService;
