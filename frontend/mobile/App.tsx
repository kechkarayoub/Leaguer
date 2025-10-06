/**
 * Main App Component
 * 
 * Entry point for the Leaguer mobile application
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RNBootSplash from 'react-native-bootsplash';

// i18n - ensure it's imported first
import './src/i18n';

// Context providers
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';

// Components
import SplashScreen from './src/components/SplashScreen';

// Navigation
import AppNavigation from './src/navigation/AppNavigation';

// Hooks
import useAuth, { AuthProvider } from './src/hooks/useAuth';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: false, // Disable retry for mutations to prevent double submissions
    },
  },
});

const AppContent: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { isLoading: authLoading, isInitialized } = useAuth();
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Handle Metro reloads - always show splash on app start
  useEffect(() => {
    setShowSplash(true);
    setIsAppLoading(true);
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Always hide native splash screen first (important for Metro reloads)
        setTimeout(async () => {
          try {
            await RNBootSplash.hide({ fade: true });
          } catch (error) {
            console.log('RNBootSplash already hidden or error:', error);
          }
        }, 100);

        // Wait for auth to initialize
        if (isInitialized) {
          // Show custom splash for a minimum time
          setTimeout(() => {
            setIsAppLoading(false);
          }, 1500); // Reduced time for better dev experience
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsAppLoading(false);
      }
    };

    initApp();
  }, [isInitialized]);

  useEffect(() => {
    if (!isAppLoading && !authLoading) {
      // Hide custom splash screen after everything is loaded
      setTimeout(() => {
        setShowSplash(false);
      }, 500);
    }
  }, [isAppLoading, authLoading]);
console.log({isAppLoading, authLoading, showSplash});
  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar
        barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      <AppNavigation />
      
      {(showSplash || isAppLoading || authLoading) && (
        <SplashScreen
          isVisible={true}
          onAnimationComplete={() => setShowSplash(false)}
        />
      )}
      
      <Toast />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
