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
  first_name?: string;
  last_name?: string;
  firstName?: string; // Keep for backward compatibility
  lastName?: string; // Keep for backward compatibility
  user_phone_number?: string;
  user_image_url?: string;
  profileImage?: string; // Keep for backward compatibility
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfileUpdate {
  email: string;
  first_name: string;
  last_name: string;
  user_phone_number: string;
  user_address: string;
  user_birthday: string | Date | null;
  user_cin: string;
  user_country: string;
  user_gender: string;
  username: string;
  profile_image?: File | null | String; // File or URL string
  image_updated: boolean | String;
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
  firstName: string;
  lastName: string;
  username: string;
}

export interface SocialLoginCredentials {
  email: string;
  id_token: string;
  type_third_party: 'google' | 'facebook' | 'apple';
  from_platform: 'web' | 'android' | 'ios';
  selected_language?: string;
}

export interface SocialRegisterCredentials {
  email: string;
  id_token: string;
  type_third_party: 'google' | 'facebook' | 'apple';
  from_platform: 'web' | 'android' | 'ios';
  selected_language?: string;
  first_name: string; // Optional for registration
  last_name: string; // Optional for registration
  user_image_url?: string; // Optional for registration
}

interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  success: boolean;
  message?: string;
  is_new_user?: boolean; // Added to indicate if this is a new user registration
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
    staleTime: 0, // Always consider data stale so invalidateQueries works immediately
    gcTime: 5 * 60 * 1000, // Keep data in cache for 5 minutes after component unmounts
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
    retry: false,
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

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
      // Add current language to register request
      const registerData = {
        email: credentials.email.trim(),
        password: credentials.password,
        first_name: credentials.firstName.trim(),
        last_name: credentials.lastName.trim(),
        username: credentials.username.trim(),
        selected_language: i18n.language,
      };
      const response = await apiService.post('/accounts/sign-up/', registerData);
      return response.data;
    },
    onSuccess: async (data) => {
      // Store tokens (backend returns access_token and refresh_token)
      // await secureStorage.setItem('access_token', data.access_token);
      // await secureStorage.setItem('refresh_token', data.refresh_token);
      
      // // Store user data for profile queries
      // await secureStorage.setItem('user', JSON.stringify(data.user));
      
      // // Update auth state
      // setIsAuthenticated(true);
      
      // // Update user data in cache
      // queryClient.setQueryData(['user', 'profile'], data.user);
      
      // Connect WebSocket
      // await webSocketService.connect();

      toast.success(t('messages.register_success'));
    },
    onError: (error: any) => {
      const message = error?.message || t('messages.register_failed');
      toast.error(message);
    },
  });

  const socialRegisterMutation = useMutation({
    mutationFn: async (credentials: SocialRegisterCredentials): Promise<AuthResponse> => {
      // Add current language to register request
      const response = await apiService.post('/accounts/sign-up-third-party/', credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      if(data.user){
        
        // Store tokens (backend returns access_token and refresh_token)
        await secureStorage.setItem('access_token', data.access_token);
        await secureStorage.setItem('refresh_token', data.refresh_token);
        
        // Store user data for profile queries
        await secureStorage.setItem('user', JSON.stringify(data.user));
        
        // Update auth state
        setIsAuthenticated(true);
        
        // Update user data in cache
        queryClient.setQueryData(['user', 'profile'], data.user);
        
        // // Connect WebSocket
        // await webSocketService.connect();

        toast.success(t(data.is_new_user ? 'messages.register_success' : 'messages.login_success'));
      }
      else{
        toast.error(t(data.message || 'messages.register_failed'));
        console.error('Social registration failed: No user data returned from server');
      }
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
  }, [queryClient, t]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<FormData>) => {
      const response = await apiService.put('/accounts/update-profile/', profileData);
      return response.data;
    },
    retry: false, // Disable automatic retries to prevent double requests on errors
    onSuccess: async (data) => {
      // Store updated user data in the same storage type as tokens first
      const hasSessionTokens = await secureStorage.getSessionItem('access_token');
      const hasLocalTokens = await secureStorage.getItem('access_token');
      
      if(data.access_token){
        if (hasSessionTokens) {
          // User chose not to be remembered, use session storage
          await secureStorage.setSessionItem('access_token', data.access_token);
          await secureStorage.setSessionItem('refresh_token', data.refresh_token);
        } else if (hasLocalTokens) {
          // User chose to be remembered, use local storage
          await secureStorage.setItem('access_token', data.access_token);
          await secureStorage.setItem('refresh_token', data.refresh_token);
        }
      }
      
      // Store updated user data in the same storage type as tokens
      if (hasSessionTokens) {
        await secureStorage.setSessionItem('user', JSON.stringify(data.user));
      } else {
        await secureStorage.setItem('user', JSON.stringify(data.user));
      }
      
      // Update user data in cache immediately (this is synchronous)
      queryClient.setQueryData(['user', 'profile'], data.user);
      
      // Force an immediate cache update by removing stale state
      queryClient.removeQueries({ queryKey: ['user', 'profile'] });
      queryClient.setQueryData(['user', 'profile'], data.user);
      
      // Force all components to re-fetch user data from storage 
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      
      // Trigger a manual refetch to ensure immediate UI update
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['user', 'profile'] });
      }, 0);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('messages.profile_update_failed');
      toast.error(message);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: FormData) => {
      const response = await apiService.put('/accounts/update-profile/', passwordData);
      return response.data;
    },
    retry: false,
    onSuccess: async (data) => {
      if(data.success && !data.wrong_password){
        // Store updated user data in the same storage type as tokens first
        const hasSessionTokens = await secureStorage.getSessionItem('access_token');
        const hasLocalTokens = await secureStorage.getItem('access_token');
        
        if(data.access_token){
          if (hasSessionTokens) {
            // User chose not to be remembered, use session storage
            await secureStorage.setSessionItem('access_token', data.access_token);
            await secureStorage.setSessionItem('refresh_token', data.refresh_token);
          } else if (hasLocalTokens) {
            // User chose to be remembered, use local storage
            await secureStorage.setItem('access_token', data.access_token);
            await secureStorage.setItem('refresh_token', data.refresh_token);
          }
        }
      }
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
    socialRegister: socialRegisterMutation.mutateAsync,
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
