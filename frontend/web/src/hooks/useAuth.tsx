/**
 * useAuth Hook
 * 
 * Custom hook for authentication state management
 * Provides authentication status, user data, and auth actions
 */

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

import AuthenticatedApiService from '../services/AuthenticatedApiService';
import SecureStorageService from '../services/SecureStorageService';
import WebSocketService from '../services/WebSocketService';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email_or_username: string; // Changed to match backend API field name
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

export interface SocialLoginCredentials {
  email: string;
  id_token: string;
  type_third_party: 'google' | 'facebook' | 'apple';
  from_platform: 'web' | 'android' | 'ios';
  selected_language?: string;
}

interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  success: boolean;
  message?: string;
}

// Create service instances
const apiService = AuthenticatedApiService.getInstance();
const secureStorage = SecureStorageService.getInstance();
const webSocketService = WebSocketService.getInstance();

const useAuth = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if user is authenticated by looking for tokens
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize authentication state
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const hasToken = await apiService.hasValidToken();
        setIsAuthenticated(hasToken);
      } catch (error) {
        console.error('Error checking auth state:', error);
        setIsAuthenticated(false);
      } finally {
        setIsInitialized(true);
      }
    };

    checkAuthState();
  }, []);

  // Get current user data
  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      // Check both session and local storage for user data
      let storedUser = await secureStorage.getSessionItem('user');
      if (!storedUser) {
        storedUser = await secureStorage.getItem('user');
      }
      
      if (storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
        }
      }
      
      // If no stored user data, we need to re-authenticate
      // This should not happen in normal flow as login provides user data
      throw new Error('No user profile data available. Please log in again.');
    },
    enabled: isAuthenticated,
    retry: false, // Don't retry as there's no backend endpoint
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      // Add current language to login request
      const loginData = {
        ...credentials,
        selected_language: i18n.language,
      };
      const response = await apiService.post('/accounts/sign-in/', loginData);
      return response.data;
    },
    onSuccess: async (data, variables) => {
      // Determine storage type based on "Remember me" checkbox
      const useSessionStorage = !variables.rememberMe;
      
      // Store tokens with appropriate persistence
      if (useSessionStorage) {
        // Session storage - cleared when browser closes
        await secureStorage.setSessionItem('access_token', data.access_token);
        await secureStorage.setSessionItem('refresh_token', data.refresh_token);
        await secureStorage.setSessionItem('user', JSON.stringify(data.user));
      } else {
        // Local storage - persistent across browser sessions
        await secureStorage.setItem('access_token', data.access_token);
        await secureStorage.setItem('refresh_token', data.refresh_token);
        await secureStorage.setItem('user', JSON.stringify(data.user));
      }
      
      // Update auth state
      setIsAuthenticated(true);
      
      // Update user data in cache
      queryClient.setQueryData(['user', 'profile'], data.user);
      
      // Connect WebSocket
      await webSocketService.connect();
      
      const message = variables.rememberMe 
        ? t('messages.login_success_remembered')
        : t('messages.login_success');
      toast.success(message);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('messages.login_failed');
      toast.error(message);
    },
  });

  // Register mutation - TODO: Uncomment when backend SignUpView is implemented
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
      // Add current language to register request
      const registerData = {
        ...credentials,
        selected_language: i18n.language,
      };
      // TODO: Backend SignUpView is currently commented out
      throw new Error('Registration functionality not yet implemented in backend');
      // const response = await apiService.post('/accounts/sign-up/', registerData);
      // return response.data;
    },
    onSuccess: async (data) => {
      // Store tokens (backend returns access_token and refresh_token)
      await secureStorage.setItem('access_token', data.access_token);
      await secureStorage.setItem('refresh_token', data.refresh_token);
      
      // Store user data for profile queries
      await secureStorage.setItem('user', JSON.stringify(data.user));
      
      // Update auth state
      setIsAuthenticated(true);
      
      // Update user data in cache
      queryClient.setQueryData(['user', 'profile'], data.user);
      
      // Connect WebSocket
      await webSocketService.connect();
      
      toast.success(t('messages.register_success'));
    },
    onError: (error: any) => {
      const message = error?.message || t('messages.register_failed');
      toast.error(message);
    },
  });

  // Logout function
  const logout = useCallback(async () => {
    try {
      // For JWT, logout is handled client-side by clearing tokens
      // No backend call needed as JWT tokens are stateless
      console.log('Logging out user...');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear stored data from both storages
      await apiService.clearTokens();
      await secureStorage.removeItem('user');
      await secureStorage.removeSessionItem('user');
      await secureStorage.clearSession(); // Clear all session data
      await secureStorage.clear(); // Clear all session data
      
      // Update auth state
      setIsAuthenticated(false);
      
      // Clear query cache
      queryClient.clear();
      
      // Disconnect WebSocket
      await webSocketService.disconnect();
      
      toast.success(t('messages.logout_success'));
    }
  }, [isAuthenticated, queryClient, t]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<User>) => {
      const response = await apiService.put('/accounts/update-profile/', profileData);
      return response.data;
    },
    onSuccess: async (data) => {
      // Update user data in cache
      queryClient.setQueryData(['user', 'profile'], data.user);
      
      // Store updated user data
      await secureStorage.setItem('user', JSON.stringify(data.user));
      
      toast.success(t('messages.profile_updated'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('messages.profile_update_failed');
      toast.error(message);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: { currentPassword: string; newPassword: string }) => {
      const updateData = {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        update_password: true,
      };
      const response = await apiService.put('/accounts/update-profile/', updateData);
      return response.data;
    },
    onSuccess: (data) => {
      // If password was updated, new tokens may be provided
      if (data.access_token && data.refresh_token) {
        // Store new tokens
        secureStorage.setItem('access_token', data.access_token);
        secureStorage.setItem('refresh_token', data.refresh_token);
      }
      toast.success(t('messages.password_changed'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('messages.password_change_failed');
      toast.error(message);
    },
  });

  // Request password reset mutation
  const requestPasswordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      // TODO: Implement forgot password endpoint in backend
      throw new Error('Forgot password functionality not yet implemented');
    },
    onSuccess: () => {
      toast.success(t('messages.password_reset_sent'));
    },
    onError: (error: any) => {
      const message = error?.message || t('messages.password_reset_failed');
      toast.error(message);
    },
  });

  // Social login mutation
  const socialLoginMutation = useMutation({
    mutationFn: async (credentials: SocialLoginCredentials): Promise<AuthResponse> => {
      const response = await apiService.post('/accounts/sign-in-third-party/', credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      // Store tokens (backend returns access_token and refresh_token)
      await secureStorage.setItem('access_token', data.access_token);
      await secureStorage.setItem('refresh_token', data.refresh_token);
      
      // Store user data for profile queries
      await secureStorage.setItem('user', JSON.stringify(data.user));
      
      // Update auth state
      setIsAuthenticated(true);
      
      // Update user data in cache
      queryClient.setQueryData(['user', 'profile'], data.user);
      
      // Connect WebSocket
      await webSocketService.connect();
      
      toast.success(t('messages.login_success'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('messages.social_login_failed');
      toast.error(message);
    },
  });

  return {
    // Auth state
    isAuthenticated,
    isLoading: !isInitialized || isUserLoading,
    isInitialized,
    user,
    userError,

    // Auth actions
    login: loginMutation.mutateAsync,
    socialLogin: socialLoginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    updateProfile: updateProfileMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    requestPasswordReset: requestPasswordResetMutation.mutateAsync,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isSocialLoggingIn: socialLoginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    isRequestingPasswordReset: requestPasswordResetMutation.isPending,
  };
};

export default useAuth;
