/**
 * useAuth Hook for React Native
 * 
 * Custom hook for authentication state management
 * Provides authentication status, user data, and auth actions
 */

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { getLocales } from 'react-native-localize';

import AuthenticatedApiService from '../services/AuthenticatedApiService';
import SecureStorageService from '../services/SecureStorageService';
import {
  LoginCredentials,
  RegisterCredentials,
  SocialLoginCredentials,
  SocialRegisterCredentials,
  AuthResponse,
} from '../types/auth.types';

// Create service instances
const apiService = AuthenticatedApiService.getInstance();
const secureStorage = SecureStorageService.getInstance();

const useAuth = () => {
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
      // Check both session and secure storage for user data
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
      throw new Error('No user profile data available. Please log in again.');
    },
    enabled: isAuthenticated,
    retry: false,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });

  // Get current language
  const getCurrentLanguage = () => {
    const locales = getLocales();
    return locales[0]?.languageCode || 'en';
  };

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const loginData = {
        ...credentials,
        selected_language: getCurrentLanguage(),
      };
      const response = await apiService.post('/accounts/sign-in/', loginData);
      return response.data;
    },
    retry: false,
    onSuccess: async (data, variables) => {
      // Store tokens with appropriate persistence
      const rememberMe = variables.rememberMe || false;
      await apiService.setTokens(
        {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        },
        rememberMe
      );
      
      // Store user data
      const userStorage = rememberMe ? secureStorage.setItem : secureStorage.setSessionItem;
      await userStorage.call(secureStorage, 'user', JSON.stringify(data.user));
      
      // Update auth state
      setIsAuthenticated(true);
      
      // Update user data in cache
      queryClient.setQueryData(['user', 'profile'], data.user);
      
      const message = rememberMe 
        ? 'Login successful (remembered)'
        : 'Login successful';
      
      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: message,
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Login failed';
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: message,
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
      const registerData = {
        email: credentials.email.trim(),
        password: credentials.password,
        first_name: credentials.firstName.trim(),
        last_name: credentials.lastName.trim(),
        username: credentials.username.trim(),
        selected_language: getCurrentLanguage(),
      };
      const response = await apiService.post('/accounts/sign-up/', registerData);
      return response.data;
    },
    onSuccess: async (_data) => {
      Toast.show({
        type: 'success',
        text1: 'Registration Successful',
        text2: 'Please check your email to verify your account',
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Registration failed';
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: message,
      });
    },
  });

  // Social register mutation
  const socialRegisterMutation = useMutation({
    mutationFn: async (credentials: SocialRegisterCredentials): Promise<AuthResponse> => {
      const response = await apiService.post('/accounts/sign-up-third-party/', credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      if (data.user) {
        // Store tokens
        await apiService.setTokens(
          {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          },
          true // Remember social logins by default
        );
        
        // Store user data
        await secureStorage.setItem('user', JSON.stringify(data.user));
        
        // Update auth state
        setIsAuthenticated(true);
        
        // Update user data in cache
        queryClient.setQueryData(['user', 'profile'], data.user);

        Toast.show({
          type: 'success',
          text1: data.is_new_user ? 'Registration Successful' : 'Welcome back!',
          text2: data.is_new_user ? 'Account created successfully' : 'Login successful',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Registration Failed',
          text2: data.message || 'Unable to create account',
        });
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Social registration failed';
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: message,
      });
    },
  });

  // Social login mutation
  const socialLoginMutation = useMutation({
    mutationFn: async (credentials: SocialLoginCredentials): Promise<AuthResponse> => {
      const response = await apiService.post('/accounts/sign-in-third-party/', credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      // Store tokens
      await apiService.setTokens(
        {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        },
        true // Remember social logins by default
      );
      
      // Store user data
      await secureStorage.setItem('user', JSON.stringify(data.user));
      
      // Update auth state
      setIsAuthenticated(true);
      
      // Update user data in cache
      queryClient.setQueryData(['user', 'profile'], data.user);
      
      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: 'Login successful',
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Social login failed';
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: message,
      });
    },
  });

  // Logout function
  const logout = useCallback(async (logoutAllDevices: boolean = false) => {
    try {
      console.log('Logging out user...');
      
      const data = {
        logout_all_devices: logoutAllDevices,
        selected_language: getCurrentLanguage(),
      };
      await apiService.logout(data);

    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API call fails, continue with local cleanup
      await apiService.clearTokens();
      await secureStorage.removeItem('user');
      await secureStorage.removeSessionItem('user');
    } finally {
      // Clear additional session data if needed
      await secureStorage.clearSession();
      
      // Update auth state
      setIsAuthenticated(false);
      
      // Clear query cache
      queryClient.clear();
      
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been successfully logged out',
      });
    }
  }, [queryClient]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<FormData>) => {
      const response = await apiService.put('/accounts/update-profile/', profileData);
      return response.data;
    },
    retry: false,
    onSuccess: async (data) => {
      // Update tokens if provided
      if (data.access_token) {
        const hasSessionTokens = await secureStorage.getSessionItem('access_token');
        const rememberMe = !hasSessionTokens;
        
        await apiService.setTokens(
          {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          },
          rememberMe
        );
      }
      
      // Store updated user data
      const hasSessionTokens = await secureStorage.getSessionItem('access_token');
      const userStorage = hasSessionTokens ? secureStorage.setSessionItem : secureStorage.setItem;
      await userStorage.call(secureStorage, 'user', JSON.stringify(data.user));
      
      // Update user data in cache
      queryClient.setQueryData(['user', 'profile'], data.user);
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been updated successfully',
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Profile update failed';
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: message,
      });
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
      if (data.success && !data.wrong_password) {
        // Update tokens if provided
        if (data.access_token) {
          const hasSessionTokens = await secureStorage.getSessionItem('access_token');
          const rememberMe = !hasSessionTokens;
          
          await apiService.setTokens(
            {
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
            },
            rememberMe
          );
        }
        
        Toast.show({
          type: 'success',
          text1: 'Password Changed',
          text2: 'Your password has been updated successfully',
        });
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Password change failed';
      Toast.show({
        type: 'error',
        text1: 'Password Change Failed',
        text2: message,
      });
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

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isSocialLoggingIn: socialLoginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
  };
};

export default useAuth;
