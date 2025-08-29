/**
 * ThemeContext Tests
 * 
 * Tests for the theme context and provider
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme, Theme, ResolvedTheme } from './ThemeContext';

// Mock useAuth hook
jest.mock('../hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  })),
}));

const mockUseAuth = require('../hooks/useAuth').default;

// Test component that uses the theme context
const TestComponent: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <button data-testid="set-light" onClick={() => setTheme('light')}>
        Set Light
      </button>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>
        Set Dark
      </button>
      <button data-testid="set-default" onClick={() => setTheme('default')}>
        Set Default
      </button>
    </div>
  );
};

// Wrapper component with required providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  );
};

describe('ThemeContext', () => {
  let setAttributeSpy: jest.SpyInstance;
  let removeAttributeSpy: jest.SpyInstance;
  let setPropertySpy: jest.SpyInstance;
  let removePropertySpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    // Mock document.documentElement methods using spies
    setAttributeSpy = jest.spyOn(document.documentElement, 'setAttribute').mockImplementation();
    removeAttributeSpy = jest.spyOn(document.documentElement, 'removeAttribute').mockImplementation();
    setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty').mockImplementation();
    removePropertySpy = jest.spyOn(document.documentElement.style, 'removeProperty').mockImplementation();

    // Mock className property
    Object.defineProperty(document.documentElement, 'className', {
      value: '',
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    setAttributeSpy.mockRestore();
    removeAttributeSpy.mockRestore();
    setPropertySpy.mockRestore();
    removePropertySpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Provider Initialization', () => {
    it('should render children without crashing', () => {
      render(
        <TestWrapper>
          <div data-testid="child">Test Child</div>
        </TestWrapper>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide default theme context values', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('light');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
    });

    it('should throw error when useTheme is used outside provider', () => {
      // Temporarily suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Theme State Management', () => {
    it('should change theme when setTheme is called', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Initial state
      expect(screen.getByTestId('theme')).toHaveTextContent('light');

      // Change to dark theme
      act(() => {
        screen.getByTestId('set-dark').click();
      });

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    });

    it('should handle default theme correctly', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Change to default theme
      act(() => {
        screen.getByTestId('set-default').click();
      });

      expect(screen.getByTestId('theme')).toHaveTextContent('default');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
    });

    it('should cycle through all theme options', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Test light theme
      act(() => {
        screen.getByTestId('set-light').click();
      });
      expect(screen.getByTestId('theme')).toHaveTextContent('light');

      // Test dark theme
      act(() => {
        screen.getByTestId('set-dark').click();
      });
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');

      // Test default theme
      act(() => {
        screen.getByTestId('set-default').click();
      });
      expect(screen.getByTestId('theme')).toHaveTextContent('default');
    });
  });

  describe('User Theme Integration', () => {
    it('should use user theme when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { user_theme: 'dark' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    });

    it('should update theme when user data changes', () => {
      mockUseAuth.mockReturnValue({
        user: { user_theme: 'light' },
        isAuthenticated: true,
        isLoading: false,
      });

      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('light');

      // Update user theme
      mockUseAuth.mockReturnValue({
        user: { user_theme: 'dark' },
        isAuthenticated: true,
        isLoading: false,
      });

      rerender(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });

    it('should handle user with no theme preference', () => {
      mockUseAuth.mockReturnValue({
        user: {},
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('light');
    });
  });

  describe('DOM Manipulation', () => {
    it('should set data-theme attribute for light theme', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      act(() => {
        screen.getByTestId('set-light').click();
      });

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    it('should set data-theme attribute for dark theme', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      act(() => {
        screen.getByTestId('set-dark').click();
      });

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should remove data-theme attribute for default theme', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      act(() => {
        screen.getByTestId('set-default').click();
      });

      expect(document.documentElement.removeAttribute).toHaveBeenCalledWith('data-theme');
    });

    it('should set className for light theme', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      act(() => {
        screen.getByTestId('set-light').click();
      });

      expect(document.documentElement.className).toBe('theme-light');
    });

    it('should set className for dark theme', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      act(() => {
        screen.getByTestId('set-dark').click();
      });

      expect(document.documentElement.className).toBe('theme-dark');
    });

    it('should clear className for default theme', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // First set a theme
      act(() => {
        screen.getByTestId('set-light').click();
      });

      // Then set to default
      act(() => {
        screen.getByTestId('set-default').click();
      });

      expect(document.documentElement.className).toBe('');
    });

    it('should remove CSS custom properties for default theme', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      act(() => {
        screen.getByTestId('set-default').click();
      });

      expect(document.documentElement.style.removeProperty).toHaveBeenCalledWith('--theme-bg-primary');
      expect(document.documentElement.style.removeProperty).toHaveBeenCalledWith('--theme-text-primary');
      expect(document.documentElement.style.removeProperty).toHaveBeenCalledWith('--theme-border-primary');
    });
  });

  describe('Type Safety', () => {
    it('should accept valid theme values', () => {
      const validThemes: Theme[] = ['light', 'dark', 'default'];
      const validResolvedThemes: ResolvedTheme[] = ['light', 'dark'];

      expect(validThemes).toContain('light');
      expect(validThemes).toContain('dark');
      expect(validThemes).toContain('default');
      expect(validResolvedThemes).toContain('light');
      expect(validResolvedThemes).toContain('dark');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid theme changes', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Rapidly change themes
      act(() => {
        screen.getByTestId('set-light').click();
        screen.getByTestId('set-dark').click();
        screen.getByTestId('set-default').click();
        screen.getByTestId('set-light').click();
      });

      expect(screen.getByTestId('theme')).toHaveTextContent('light');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
    });

    it('should handle user data changing from null to object', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('light');

      // User logs in with theme preference
      mockUseAuth.mockReturnValue({
        user: { user_theme: 'dark' },
        isAuthenticated: true,
        isLoading: false,
      });

      rerender(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });
  });
});
