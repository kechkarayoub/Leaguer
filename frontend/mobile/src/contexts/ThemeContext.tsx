/**
 * Theme Context for React Native
 * 
 * Provides theme management with light/dark mode support
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import useAuth from '../hooks/useAuth';

export type Theme = 'light' | 'dark' | 'default';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
}

interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textDisabled: string;
  
  // Brand colors
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Border colors
  border: string;
  borderLight: string;
  
  // Other colors
  shadow: string;
  overlay: string;
}

const lightColors: ThemeColors = {
  // Background colors
  background: '#FFFFFF',
  surface: '#F8F9FA',
  card: '#FFFFFF',
  
  // Text colors
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  
  // Brand colors
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  secondary: '#64748B',
  accent: '#8B5CF6',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#06B6D4',
  
  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Other colors
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

const darkColors: ThemeColors = {
  // Background colors
  background: '#0F172A',
  surface: '#1E293B',
  card: '#1E293B',
  
  // Text colors
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textDisabled: '#64748B',
  
  // Brand colors
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  secondary: '#94A3B8',
  accent: '#A78BFA',
  
  // Status colors
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#22D3EE',
  
  // Border colors
  border: '#374151',
  borderLight: '#4B5563',
  
  // Other colors
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('default');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Update theme when user data changes
  useEffect(() => {
    if (user?.user_theme) {
      setThemeState(user.user_theme as Theme);
    }
  }, [user?.user_theme]);

  // Resolve the actual theme (handle 'default' setting)
  useEffect(() => {
    if (theme === 'default') {
      setResolvedTheme(systemColorScheme === 'dark' ? 'dark' : 'light');
    } else {
      setResolvedTheme(theme as ResolvedTheme);
    }
  }, [theme, systemColorScheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const colors = resolvedTheme === 'dark' ? darkColors : lightColors;

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    colors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
