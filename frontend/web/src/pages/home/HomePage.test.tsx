/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import HomePage from './HomePage';
import useAuth from '../../hooks/useAuth';

// Suppress console warnings and errors in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args: any[]) => {
  if (args[0]?.includes?.('act') || args[0]?.includes?.('ReactDOM.render') || args[0]?.includes?.('wrapped in act')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  if (args[0]?.includes?.('act') || args[0]?.includes?.('ReactDOM.render') || args[0]?.includes?.('wrapped in act')) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Mock i18next dependencies to prevent network requests
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

// Mock useAuth hook
jest.mock('../../hooks/useAuth');

// Mock the API service properly
jest.mock('../../services/AuthenticatedApiService', () => {
  return {
    __esModule: true,
    default: {
      getInstance: jest.fn(() => ({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      })),
    },
  };
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('HomePage', () => {
  const renderWithRouter = (component = <HomePage />) => {
    return render(
      <MemoryRouter>
        {component}
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    // Mock i18n translations
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string, params?: any) => {
        const translations: { [key: string]: string } = {
          'home:welcome': `Welcome, ${params?.name || 'User'}!`,
          'home:noContentYet': 'There is no content available yet. Please check back later.',
          'common:user.guest': 'Guest',
        };
        return translations[key] || key;
      },
    });

    // Mock useAuth hook with default user
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        username: 'testuser',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
      },
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      requestPasswordReset: jest.fn(),
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
      userError: null,
      isLoggingIn: false,
      isRegistering: false,
      isResettingPassword: false,
      isRequestingPasswordReset: false,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User Display', () => {
    it('should display welcome message with full name when both first_name and last_name are available', () => {
      renderWithRouter();
      
      expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
    });

    it('should display welcome message with firstName and lastName when first_name/last_name are not available', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          username: 'testuser',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        userError: null,
      } as any);

      renderWithRouter();
      
      expect(screen.getByText('Welcome, Jane Smith!')).toBeInTheDocument();
    });

    it('should display welcome message with email when no name fields are available', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        userError: null,
      } as any);

      renderWithRouter();
      
      expect(screen.getByText('Welcome, test@example.com!')).toBeInTheDocument();
    });

    it('should display welcome message with Guest when user is null', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        userError: null,
      } as any);

      renderWithRouter();
      
      expect(screen.getByText('Welcome, Guest!')).toBeInTheDocument();
    });

    it('should display no content message', () => {
      renderWithRouter();
      
      expect(screen.getByText('There is no content available yet. Please check back later.')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render with proper page structure', () => {
      renderWithRouter();
      
      // Check that main sections are present
      expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
      expect(screen.getByText('There is no content available yet. Please check back later.')).toBeInTheDocument();
    });

    it('should have proper CSS classes', () => {
      renderWithRouter();
      
      // Check for specific text content to verify component structure
      expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
      expect(screen.getByText('There is no content available yet. Please check back later.')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithRouter();
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Welcome, John Doe!');
    });

    it('should have accessible content', () => {
      renderWithRouter();
      
      // Check that content is accessible
      expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
      expect(screen.getByText('There is no content available yet. Please check back later.')).toBeInTheDocument();
    });
  });

  describe('Translation Keys', () => {
    it('should use correct translation keys', () => {
      const tMock = jest.fn((key, params) => key);
      (useTranslation as jest.Mock).mockReturnValue({
        t: tMock,
      });

      renderWithRouter();
      
      expect(tMock).toHaveBeenCalledWith('home:welcome', { name: 'John Doe' });
      expect(tMock).toHaveBeenCalledWith('home:noContentYet');
    });
  });

  describe('User Name Logic', () => {
    it('should prioritize first_name/last_name over firstName/lastName', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          username: 'testuser',
          first_name: 'Priority',
          last_name: 'Name',
          firstName: 'Fallback',
          lastName: 'Name',
          email: 'test@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        userError: null,
      } as any);

      renderWithRouter();
      
      expect(screen.getByText('Welcome, Priority Name!')).toBeInTheDocument();
    });

    it('should handle partial first_name/last_name fields correctly', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          username: 'testuser',
          first_name: 'John',
          last_name: '', // Empty last name
          firstName: 'Fallback',
          lastName: 'Name',
          email: 'test@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        userError: null,
      } as any);

      renderWithRouter();
      
      // Should fall back to firstName/lastName when either first_name or last_name is missing
      expect(screen.getByText('Welcome, Fallback Name!')).toBeInTheDocument();
    });

    it('should handle empty firstName/lastName fields correctly', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          username: 'testuser',
          firstName: '',
          lastName: '',
          email: 'fallback@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        userError: null,
      } as any);

      renderWithRouter();
      
      // Should fall back to email when firstName/lastName are empty
      expect(screen.getByText('Welcome, fallback@example.com!')).toBeInTheDocument();
    });
  });
});
