/**
 * Navigation Configuration
 * 
 * React Navigation setup for the mobile app with global header
 */

import React, { useRef, useEffect } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Components
import LoadingSpinner from '../components/LoadingSpinner';

// Hooks
import useAuth from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import config from '../config/config';

// Services
import DeepLinkingService from '../services/DeepLinkingService';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: {
    uid: string;
    token: string;
  };
  VerifyEmail: {
    uid: string;
    token: string;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  AuthStack: undefined;
  MainStack: undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false, // We'll use custom header
      }}
    >
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreen}
      />
      {config.features.enableSignup && (
        <AuthStack.Screen 
          name="Register" 
          component={RegisterScreen}
        />
      )}
      <AuthStack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
      />
      <AuthStack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen}
      />
      <AuthStack.Screen 
        name="VerifyEmail" 
        component={EmailVerificationScreen}
      />
    </AuthStack.Navigator>
  );
};

const MainNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false, // We'll use custom header
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <MainTab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
        }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
      <MainTab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
        }}
      />
    </MainTab.Navigator>
  );
};

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('RootNavigator - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    return <LoadingSpinner visible overlay />;
  }

  return (
    <RootStack.Navigator 
      screenOptions={{ headerShown: false }}
      // This is important: reset navigation state when switching between auth states
      key={isAuthenticated ? 'authenticated' : 'unauthenticated'}
    >
      {isAuthenticated ? (
        <RootStack.Screen name="MainStack" component={MainNavigator} />
      ) : (
        <RootStack.Screen name="AuthStack" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

const AppNavigation = () => {
  const { colors } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  
  console.log('AppNavigation - isAuthenticated:', isAuthenticated);
  
  const [navigationReady, setNavigationReady] = React.useState(false);

  useEffect(() => {
    // Set navigation reference and auth state
    DeepLinkingService.setNavigationRef(navigationRef);
    DeepLinkingService.setAuthState(isAuthenticated, logout);
  }, [isAuthenticated, logout]);

  useEffect(() => {
    if (navigationReady) {
      console.log('Navigation ready, initializing DeepLinkingService');
      // Initialize deep linking service only when navigation is ready
      DeepLinkingService.onNavigationReady();
      const cleanup = DeepLinkingService.init();
      
      return cleanup;
    }
  }, [navigationReady, isAuthenticated]);

  const handleNavigationReady = () => {
    console.log('Navigation container ready');
    setNavigationReady(true);
  };
  
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={handleNavigationReady}
      theme={{
        dark: false,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.error,
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: 'normal',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: 'bold',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '900',
          },
        },
      }}
    >
      <RootNavigator />
    </NavigationContainer>
  );
};

export default AppNavigation;
