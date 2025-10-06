/**
 * useAuth Hook for React Native
 * 
 * Custom hook for authentication state management
 * Provides authentication status, user data, and auth actions
 */

import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import AuthenticatedApiService from '../services/AuthenticatedApiService';
import SecureStorageService from '../services/SecureStorageService';
import {
  LoginCredentials,
  RegisterCredentials,
  ResendEmailVerificationCredentials,
  SocialLoginCredentials,
  SocialRegisterCredentials,
  AuthResponse,
} from '../types/auth.types';

// Create service instances
const apiService = AuthenticatedApiService.getInstance();
const secureStorage = SecureStorageService.getInstance();

// ---------------------------
// Internal implementation hook
// ---------------------------
const useProvideAuth = () => {
  const { t, i18n } = useTranslation();
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


  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const loginData = {
        ...credentials, 
        selected_language: i18n.language,
      };
      const response = await apiService.post('/accounts/sign-in/', loginData);
      return response.data;
    },
    retry: false,
    onSuccess: async (data, variables) => {
      // Store tokens with appropriate persistence
      const useSessionStorage = !(variables.rememberMe || false);
      await apiService.setTokens(
        {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        },
        useSessionStorage
      );
      
      // Store user data
      const userStorage = useSessionStorage ? secureStorage.setSessionItem : secureStorage.setItem;
      await userStorage.call(secureStorage, 'user', JSON.stringify(data.user));
      
      // Update auth state
      setIsAuthenticated(true);
      
      // Update user data in cache
      queryClient.setQueryData(['user', 'profile'], data.user);
      
      const message = useSessionStorage 
        ? t('messages:loginSuccess')
        : t('messages:loginSuccessRemembered');

      Toast.show({
        type: 'success',
        text1: t('messages:loginSuccessTitle'),
        text2: message,
      });
    },
    onError: (error: any) => {
      const message = t(error?.response?.data?.message || 'messages:loginFailed');
      Toast.show({
        type: 'error',
        text1: t('messages:loginFailedTitle'),
        text2: message,
      });
    },
  });

  // Resend email verification mutation
  const resendEmailVerificationMutation = useMutation({
    mutationFn: async (credentials: ResendEmailVerificationCredentials): Promise<AuthResponse> => {
      // Use user_id instead of username to match backend expectations
      const data = {
        user_id: credentials.user_id,
        selected_language: credentials.selected_language || i18n.language,
      };
      const response = await apiService.post('/accounts/send-verification-email-link/', data);
      return response.data;
    },
    onSuccess: (data) => {
      const message = data.message || t('auth:emailVerification.resendSuccess');
      Toast.show({
        type: 'success',
        text1: t('auth:emailVerification.resendTitle'),
        text2: message,
      });
    },
    onError: (error: any) => {
      let message = t('auth:emailVerification.resendError');
      if (error?.response?.data?.message) {
        message = error.response.data.message;
      }
      
      Toast.show({
        type: 'error',
        text1: t('auth:emailVerification.resendTitle'),
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
        selected_language: i18n.language,
      };
      const response = await apiService.post('/accounts/sign-up/', registerData);
      return response.data;
    },
    retry: false, // Explicitly disable retry for registration
    onSuccess: async (_data) => {
      Toast.show({
        type: 'success',
        text1: t('auth:register.title'),
        text2: t('auth:register.success'),
      });
    },
    onError: (error: any) => {
      const message = t(error?.response?.data?.message || 'auth:messages.registerFailed');
      Toast.show({
        type: 'error',
        text1: t('auth:register.title'),
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
          text1: data.is_new_user ? t('auth:register.title') : t('auth:login.welcomeBack'),
          text2: data.is_new_user ? t('auth:register.success') : t('auth:login.success'),
        });
      } else {
        Toast.show({
          type: 'error',
          text1: t('auth:register.title'),
          text2: t(data.message || 'auth:register.error'),
        });
      }
    },
    onError: (error: any) => {
      const message = t(error?.response?.data?.message || 'auth:messages.registerFailed');
      Toast.show({
        type: 'error',
        text1: t('auth:register.title'),
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
        text1: t('auth:login.welcomeBack'),
        text2: t('auth:login.success'),
      });
    },
    onError: (error: any) => {
      const message = t(error?.response?.data?.message || 'auth:messages.loginFailed');
      Toast.show({
        type: 'error',
        text1: t('messages:loginFailedTitle'),
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
        selected_language: i18n.language,
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
        text1: t('auth:logout.title'),
        text2: t('auth:logout.success'),
      });
    }
  }, [queryClient, t, i18n.language]);

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
        text1: t('profile:title'),
        text2: t('auth:messages.profileUpdated'),
      });
    },
    onError: (error: any) => {
      const message = t(error?.response?.data?.message || 'auth:messages.profileUpdateFailed');
      Toast.show({
        type: 'error',
        text1: t('errors:title', { defaultValue: 'Error' }),
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
          text1: t('auth:changePassword.title', { defaultValue: 'Change Password' }),
          text2: t('auth:messages.passwordChanged'),
        });
      }
    },
    onError: (error: any) => {
      const message = t(error?.response?.data?.message || 'auth:messages.passwordChangeFailed');
      Toast.show({
        type: 'error',
        text1: t('errors:title', { defaultValue: 'Error' }),
        text2: message,
      });
    },
  });

  // Attach session expired callback once
  useEffect(() => {
    apiService.onSessionExpired = () => {
      setIsAuthenticated(false);
    };
  }, []);

  const value = useMemo(() => ({
    // Auth state
    isAuthenticated,
    isLoading: !isInitialized || isUserLoading,
    isInitialized,
    user,
    userError,

    // Auth actions
    login: loginMutation.mutateAsync,
    socialLogin: socialLoginMutation.mutateAsync,
    resendEmailVerification: resendEmailVerificationMutation.mutateAsync,
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
    isResendingEmailVerification: resendEmailVerificationMutation.isPending,
  }), [
    isAuthenticated,
    isInitialized,
    isUserLoading,
    user,
    userError,
    loginMutation.isPending,
    socialLoginMutation.isPending,
    registerMutation.isPending,
    resendEmailVerificationMutation.isPending,
    updateProfileMutation.isPending,
    changePasswordMutation.isPending,
    logout,
    loginMutation.mutateAsync,
    socialLoginMutation.mutateAsync,
    registerMutation.mutateAsync,
    resendEmailVerificationMutation.mutateAsync,
    socialRegisterMutation.mutateAsync,
    updateProfileMutation.mutateAsync,
    changePasswordMutation.mutateAsync,
  ]);

  return value;
};

// ---------------------------
// Context + Provider
// ---------------------------
type AuthContextType = ReturnType<typeof useProvideAuth>;

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useProvideAuth();
  return React.createElement(AuthContext.Provider, { value: auth }, children);
};

// Public hook consumed by components
const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

export default useAuth;
