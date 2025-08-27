/**
 * Theme Context
 * 
 * React context for managing application theme (light, dark, auto)
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';

export type Theme = 'light' | 'dark' | 'default';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Update theme when user data changes
  useEffect(() => {
    if (user?.user_theme) {
      setThemeState(user.user_theme as Theme);
    }
  }, [user?.user_theme]);

  // Resolve the actual theme (handle 'default' setting)
  useEffect(() => {
    const resolveTheme = () => {
      if (theme === 'default') {
        // For default theme, don't override any styles - let the original CSS take control
        return 'light'; // Use light as fallback for resolved theme tracking
      }
      return theme as ResolvedTheme;
    };

    const resolved = resolveTheme();
    setResolvedTheme(resolved);

    // Apply theme to document
    if (theme === 'default') {
      // For default mode, remove all theme attributes and classes to let original styles show
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.className = '';
      
      // Clear any theme-related CSS custom properties
      const root = document.documentElement;
      root.style.removeProperty('--theme-bg-primary');
      root.style.removeProperty('--theme-bg-secondary');
      root.style.removeProperty('--theme-bg-tertiary');
      root.style.removeProperty('--theme-text-primary');
      root.style.removeProperty('--theme-text-secondary');
      root.style.removeProperty('--theme-text-tertiary');
      root.style.removeProperty('--theme-border-primary');
      root.style.removeProperty('--theme-border-secondary');
      root.style.removeProperty('--theme-shadow');
      root.style.removeProperty('--theme-shadow-hover');
    } else {
      // For explicit light/dark themes, apply theme styling
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.className = `theme-${resolved}`;
      
      // Clear any default mode styles
      const root = document.documentElement;
      root.style.removeProperty('--theme-bg-primary');
      root.style.removeProperty('--theme-bg-secondary');
      root.style.removeProperty('--theme-bg-tertiary');
      root.style.removeProperty('--theme-text-primary');
      root.style.removeProperty('--theme-text-secondary');
      root.style.removeProperty('--theme-text-tertiary');
      root.style.removeProperty('--theme-border-primary');
      root.style.removeProperty('--theme-border-secondary');
      root.style.removeProperty('--theme-shadow');
      root.style.removeProperty('--theme-shadow-hover');
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
