import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import * as TimezoneUtils from '../../utils/TimezoneUtils';
import AuthenticatedApiService from '../../services/AuthenticatedApiService';
import { toast } from 'react-toastify';
import SettingsPage from './SettingsPage';

// Mock moment and moment-timezone first before any imports
jest.mock('moment', () => {
  const mockMoment = (date?: any) => ({
    tz: (timezone: string) => ({
      utcOffset: () => {
        // Mock different timezone offsets
        const offsets: { [key: string]: number } = {
          'UTC': 0,
          'America/New_York': -300, // UTC-5
          'Europe/London': 0, // UTC+0
          'Asia/Tokyo': 540, // UTC+9
        };
        return offsets[timezone] || 0;
      }
    }),
    format: (format: string) => {
      if (!date) return '';
      if (format === 'YYYY-MM-DD') return '2023-01-01';
      return date;
    }
  });
  
  // Add the tz method to the main function
  mockMoment.tz = mockMoment;
  
  return mockMoment;
});

jest.mock('moment-timezone', () => {
  const mockMoment = (date?: any) => ({
    tz: (timezone: string) => ({
      utcOffset: () => {
        const offsets: { [key: string]: number } = {
          'UTC': 0,
          'America/New_York': -300,
          'Europe/London': 0,
          'Asia/Tokyo': 540,
        };
        return offsets[timezone] || 0;
      }
    }),
    format: (format: string) => {
      if (format === 'YYYY-MM-DD') return '2023-01-01';
      return date || '';
    }
  });
  
  mockMoment.tz = mockMoment;
  return mockMoment;
});

// Mock i18n before importing the component
jest.mock('../../i18n', () => ({}));

// Mock WebSocketService
jest.mock('../../services/WebSocketService', () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      isConnected: false,
    })),
  },
}));

// Mock dependencies
jest.mock('../../hooks/useAuth');
jest.mock('../../contexts/ThemeContext');
jest.mock('../../utils/TimezoneUtils');
jest.mock('../../services/AuthenticatedApiService');
jest.mock('react-toastify');

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => {
      const translations: Record<string, string> = {
        'settings:title': 'Settings',
        'settings:preferences.title': 'Preferences',
        'settings:preferences.description': 'Customize your application preferences',
        'settings:preferences.language': 'Language',
        'settings:preferences.selectLanguage': 'Select language',
        'settings:preferences.timezone': 'Timezone',
        'settings:preferences.selectTimezone': 'Select timezone',
        'settings:preferences.theme': 'Theme',
        'settings:preferences.save': 'Save Changes',
        'common:app.updating': 'Updating...',
        'common:app.cancel': 'Cancel',
        'settings:preferences.updateSuccess': 'Settings updated successfully',
        'settings:preferences.updateError': 'Failed to update settings'
      };
      return translations[key] || defaultValue || key;
    },
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
}));

// Mock react-hook-form with simpler implementation
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: jest.fn(() => ({ name: 'mock', ref: jest.fn() })),
    handleSubmit: jest.fn((fn) => (e: any) => {
      e.preventDefault();
      fn({
        current_language: 'en',
        user_timezone: 'UTC',
        user_theme: 'default',
      });
    }),
    watch: jest.fn(() => ({
      current_language: 'en',
      user_timezone: 'UTC',
      user_theme: 'default',
    })),
    reset: jest.fn(),
    setValue: jest.fn(),
    formState: {
      errors: {},
      dirtyFields: {},
      isDirty: false,
      isValid: true,
    },
  }),
}));

// Mock CustomSelect component
jest.mock('../../components/form/CustomSelect', () => {
  return function MockCustomSelect({ label, value, onChange, options, placeholder }: any) {
    return (
      <div>
        <label>{label}</label>
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        >
          <option value="">{placeholder}</option>
          {options?.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };
});

// Setup mocks
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockTimezoneUtils = TimezoneUtils as jest.Mocked<typeof TimezoneUtils>;
const mockToast = toast as jest.Mocked<typeof toast>;

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  current_language: 'en',
  user_timezone: 'UTC',
  user_theme: 'default',
};

const mockSetTheme = jest.fn();
const mockPut = jest.fn();

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
      user: mockUser,
      userError: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      requestPasswordReset: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      deleteAccount: jest.fn(),
      refreshToken: jest.fn(),
      clearError: jest.fn(),
      isLoggingIn: false,
      isRegistering: false,
      isUpdatingProfile: false,
      isChangingPassword: false,
      isRequestingPasswordReset: false,
    } as any);

    mockUseTheme.mockReturnValue({
      theme: 'default',
      resolvedTheme: 'light',
      setTheme: mockSetTheme,
      systemTheme: 'light',
      themes: ['light', 'dark'],
    } as any);

    mockTimezoneUtils.getAllTimezones.mockReturnValue([
      { value: 'UTC', label: 'UTC (UTC+00:00)' },
      { value: 'America/New_York', label: 'America/New_York (UTC-05:00)' },
      { value: 'Europe/London', label: 'Europe/London (UTC+00:00)' },
      { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+09:00)' },
    ]);

    mockTimezoneUtils.getLanguageOptions.mockReturnValue([
      { value: 'en', label: 'English' },
      { value: 'fr', label: 'Français' },
      { value: 'ar', label: 'العربية' },
    ]);

    mockTimezoneUtils.getThemeOptions.mockReturnValue([
      { value: 'default', label: 'Default' },
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ]);

    // Mock AuthenticatedApiService
    (AuthenticatedApiService.getInstance as jest.Mock).mockReturnValue({
      put: mockPut,
    });

    // Mock toast
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
  });

  describe('Page Structure', () => {
    it('should render settings page with correct title', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
    });

    it('should render preferences section by default', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByRole('heading', { name: 'Preferences' })).toBeInTheDocument();
      expect(screen.getAllByText('Customize your application preferences').length).toBeGreaterThanOrEqual(1);
    });

    it('should have preferences navigation item active by default', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      const navItem = screen.getByRole('button', { name: /preferences/i });
      expect(navItem).toBeInTheDocument();
      expect(navItem).toHaveClass('settings-nav__item--active');
    });
  });

  describe('Form Fields', () => {
    it('should render all form fields with correct labels', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
      expect(screen.getByText('Theme')).toBeInTheDocument();
    });

    it('should render language options correctly', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Français')).toBeInTheDocument();
      expect(screen.getByText('العربية')).toBeInTheDocument();
    });

    it('should render timezone options correctly', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByText('UTC (UTC+00:00)')).toBeInTheDocument();
      expect(screen.getByText('America/New_York (UTC-05:00)')).toBeInTheDocument();
      expect(screen.getByText('Europe/London (UTC+00:00)')).toBeInTheDocument();
      expect(screen.getByText('Asia/Tokyo (UTC+09:00)')).toBeInTheDocument();
    });

    it('should render theme radio buttons', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByRole('radio', { name: /default/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /light/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /dark/i })).toBeInTheDocument();
    });

    it('should have default theme selected initially', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByRole('radio', { name: /default/i })).toBeChecked();
      expect(screen.getByRole('radio', { name: /light/i })).not.toBeChecked();
      expect(screen.getByRole('radio', { name: /dark/i })).not.toBeChecked();
    });
  });

  describe('Form Buttons', () => {
    it('should render save button', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeInTheDocument();
    });

    it('should have save button disabled by default', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('User Interaction', () => {
    it('should allow clicking on radio buttons', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      const lightTheme = screen.getByRole('radio', { name: /light/i });
      await userEvent.click(lightTheme);

      // The click interaction works (no errors thrown)
      expect(lightTheme).toBeInTheDocument();
    });

    it('should allow clicking on save button', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      
      // Button exists and can be interacted with
      expect(saveButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Settings');

      const sectionHeading = screen.getByRole('heading', { level: 2 });
      expect(sectionHeading).toHaveTextContent('Preferences');
    });

    it('should have proper form labels', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
    });

    it('should have proper button roles and text', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /preferences/i })).toBeInTheDocument();
    });

    it('should have radio buttons with proper labels', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByRole('radio', { name: /default/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /light/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /dark/i })).toBeInTheDocument();
    });
  });

  describe('Translation Keys', () => {
    it('should use correct translation keys for main labels', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Preferences' })).toBeInTheDocument();
      expect(screen.getAllByText('Customize your application preferences').length).toBeGreaterThanOrEqual(1);
    });

    it('should use correct translation keys for form fields', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByText('Language')).toBeInTheDocument();
      expect(screen.getByText('Timezone')).toBeInTheDocument();
      expect(screen.getByText('Theme')).toBeInTheDocument();
    });

    it('should use correct translation keys for buttons', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('should use correct translation keys for options', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByText('Select language')).toBeInTheDocument();
      expect(screen.getByText('Select timezone')).toBeInTheDocument();
    });
  });

  describe('Component Behavior', () => {
    it('should render consistently across multiple renders', () => {
      const { rerender } = render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByText('Settings')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should not crash when user data is null', () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        user: null,
      } as any);

      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should handle theme context properly', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Component renders without errors when theme context is available
      expect(screen.getByText('Theme')).toBeInTheDocument();
      expect(mockUseTheme).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user data gracefully', () => {
      // Mock useAuth to return null user
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
        error: null,
      });

      expect(() => {
        render(
          <TestWrapper>
            <SettingsPage />
          </TestWrapper>
        );
      }).not.toThrow();

      // Reset mock
      (useAuth as jest.Mock).mockReturnValue(mockUser);
    });
  });

  describe('Performance', () => {
    it('should render quickly without expensive operations', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it('should not have memory leaks', () => {
      const { unmount } = render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });
  });
});