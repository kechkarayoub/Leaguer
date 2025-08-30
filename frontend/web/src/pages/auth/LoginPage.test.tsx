/**
 * LoginPage Component Tests
 * 
 * Tests for the login page with form validation and authentication
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import LoginPage from './LoginPage';

// Mock dependencies
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('../../i18n', () => ({
  language: 'en',
}));

jest.mock('../../components/LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

jest.mock('../../components/SocialLoginButton', () => {
  return function MockSocialLoginButton({ provider, onSuccess, onError }: any) {
    return (
      <button
        data-testid={`social-login-${provider}`}
        onClick={() => {
          if (provider === 'google') {
            onSuccess({
              user: { email: 'test@example.com' },
              accessToken: 'mock-token',
              provider: 'google',
            });
          }
        }}
      >
        Sign in with {provider}
      </button>
    );
  };
});

jest.mock('../../components/form/ShowPasswordButton', () => {
  return function MockShowPasswordButton({ value, onClick }: any) {
    return (
      <button
        data-testid="show-password-button"
        onClick={() => onClick(!value)}
        type="button"
      >
        {value ? 'Hide' : 'Show'}
      </button>
    );
  };
});

// Mock useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'auth:login.title': 'Sign In',
        'auth:login.subtitle': 'Welcome back to your account',
        'auth:login.button': 'Sign In',
        'auth:login.noAccount': "Don't have an account?",
        'auth:login.signUp': 'Sign Up',
        'auth:oauth.or': 'Or',
        'auth:forgotPassword.title': 'Forgot Password?',
        'common:form.username.label': 'Username',
        'common:form.email.label': 'Email',
        'common:form.password.label': 'Password',
        'common:form.emailOrUsername.placeholder': 'Enter your email or username',
        'common:form.password.placeholder': 'Enter your password',
        'common:app.remember': 'Remember me',
        'common:app.loading': 'Loading...',
        'common:validation.required': `${options?.field || 'Field'} is required`,
        'common:validation.min': `${options?.field || 'Field'} must be at least ${options?.min || 0} characters`,
      };
      return translations[key] || key;
    },
  }),
}));

// Create test wrapper
const createWrapper = (initialEntries = ['/auth/login']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Mock useAuth hook
const mockUseAuth = {
  login: jest.fn(),
  socialLogin: jest.fn(),
  isLoggingIn: false,
  isSocialLoggingIn: false,
  user: null,
  isAuthenticated: false,
  isInitialized: true,
  isLoading: false,
  userError: null,
  register: jest.fn(),
  socialRegister: jest.fn(),
  logout: jest.fn(),
  isRegistering: false,
  isRequestingPasswordReset: false,
  clearSession: jest.fn(),
  hasValidToken: jest.fn(),
  refreshToken: jest.fn(),
  tokenError: null,
  isRefreshingToken: false,
};

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    state: {},
    pathname: '/auth/login',
  }),
}));

jest.mock('../../hooks/useAuth', () => ({
  __esModule: true,
  default: () => mockUseAuth,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockUseAuth.login = jest.fn();
    mockUseAuth.socialLogin = jest.fn();
    mockUseAuth.isLoggingIn = false;
    mockUseAuth.isSocialLoggingIn = false;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form with all required fields', () => {
      render(<LoginPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByText('Welcome back to your account')).toBeInTheDocument();
      expect(screen.getByLabelText(/username.*email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('should render social login button when enabled', () => {
      const originalEnv = process.env.REACT_APP_ENABLE_GOOGLE_LOGIN;
      process.env.REACT_APP_ENABLE_GOOGLE_LOGIN = 'true';

      render(<LoginPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId('social-login-google')).toBeInTheDocument();
      expect(screen.getByText('Or')).toBeInTheDocument();

      process.env.REACT_APP_ENABLE_GOOGLE_LOGIN = originalEnv;
    });

    it('should render signup link when enabled', () => {
      const originalEnv = process.env.REACT_APP_ENABLE_SIGNUP;
      process.env.REACT_APP_ENABLE_SIGNUP = 'true';

      render(<LoginPage />, { wrapper: createWrapper() });

      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Sign Up' })).toBeInTheDocument();

      process.env.REACT_APP_ENABLE_SIGNUP = originalEnv;
    });

    it('should render forgot password link', () => {
      render(<LoginPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('link', { name: 'Forgot Password?' })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty fields', async () => {
      render(<LoginPage />, { wrapper: createWrapper() });

      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 6 characters/)).toBeInTheDocument();
      });
    });

    it('should validate minimum username length', async () => {
      render(<LoginPage />, { wrapper: createWrapper() });

      const usernameInput = screen.getByLabelText(/username.*email/i);
      const submitButton = screen.getByRole('button', { name: 'Sign In' });

      await userEvent.type(usernameInput, 'ab'); // Too short
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
      });
    });

    it('should validate minimum password length', async () => {
      render(<LoginPage />, { wrapper: createWrapper() });

      const usernameInput = screen.getByLabelText(/username.*email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: 'Sign In' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, '12345'); // Too short
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility', () => {
    it('should toggle password visibility', async () => {
      render(<LoginPage />, { wrapper: createWrapper() });

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const showPasswordButton = screen.getByTestId('show-password-button');

      expect(passwordInput.type).toBe('password');

      await userEvent.click(showPasswordButton);
      expect(passwordInput.type).toBe('text');

      await userEvent.click(showPasswordButton);
      expect(passwordInput.type).toBe('password');
    });
  });

  describe('Form Submission', () => {
    it('should submit login form with valid data', async () => {
      mockUseAuth.login.mockResolvedValue({ user: { id: 1, email: 'test@example.com' } });

      render(<LoginPage />, { wrapper: createWrapper() });

      const usernameInput = screen.getByLabelText(/username.*email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const rememberCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
      const submitButton = screen.getByRole('button', { name: 'Sign In' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(rememberCheckbox);
      
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUseAuth.login).toHaveBeenCalledWith(
          expect.objectContaining({
            email_or_username: 'testuser',
            password: 'password123',
          })
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('should navigate to intended location after login', async () => {
      mockUseAuth.login.mockResolvedValue({ user: { id: 1, email: 'test@example.com' } });

      // Mock location with 'from' state
      const mockUseLocation = jest.fn(() => ({
        state: { from: { pathname: '/dashboard' } },
        pathname: '/auth/login',
      }));

      jest.spyOn(require('react-router-dom'), 'useLocation').mockImplementation(mockUseLocation);

      render(<LoginPage />, { wrapper: createWrapper() });

      const usernameInput = screen.getByLabelText(/username.*email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: 'Sign In' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    it('should prefill form with provided email/username', () => {
      // Mock location with prefilled data
      const mockUseLocation = jest.fn(() => ({
        state: { 
          email: 'test@example.com',
          username: 'testuser',
        },
        pathname: '/auth/login',
      }));

      jest.spyOn(require('react-router-dom'), 'useLocation').mockImplementation(mockUseLocation);

      render(<LoginPage />, { wrapper: createWrapper() });

      const usernameInput = screen.getByLabelText(/username.*email/i) as HTMLInputElement;
      expect(usernameInput.value).toBe('testuser'); // Username takes precedence
    });
  });

  describe('Error Handling', () => {
    it('should handle login errors', async () => {
      const mockError = {
        response: {
          data: {
            errors: {
              email_or_username: 'User not found',
              password: 'Invalid password',
            },
          },
        },
      };

      mockUseAuth.login.mockRejectedValue(mockError);

      render(<LoginPage />, { wrapper: createWrapper() });

      const usernameInput = screen.getByLabelText(/username.*email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: 'Sign In' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'wrongpassword');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Invalid password')).toBeInTheDocument();
      });
    });

    it('should handle generic login errors gracefully', async () => {
      mockUseAuth.login.mockRejectedValue(new Error('Network error'));

      render(<LoginPage />, { wrapper: createWrapper() });

      const usernameInput = screen.getByLabelText(/username.*email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: 'Sign In' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUseAuth.login).toHaveBeenCalled();
      });

      // Should not crash and should not navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Social Login', () => {
    it('should handle successful social login', async () => {
      const originalEnv = process.env.REACT_APP_ENABLE_GOOGLE_LOGIN;
      process.env.REACT_APP_ENABLE_GOOGLE_LOGIN = 'true';

      mockUseAuth.socialLogin.mockResolvedValue({ user: { id: 1, email: 'test@example.com' } });

      render(<LoginPage />, { wrapper: createWrapper() });

      const socialButton = screen.getByTestId('social-login-google');
      await userEvent.click(socialButton);

      await waitFor(() => {
        expect(mockUseAuth.socialLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          id_token: 'mock-token',
          type_third_party: 'google',
          from_platform: 'web',
          selected_language: 'en',
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });

      process.env.REACT_APP_ENABLE_GOOGLE_LOGIN = originalEnv;
    });

    it('should handle social login errors', async () => {
      const originalEnv = process.env.REACT_APP_ENABLE_GOOGLE_LOGIN;
      process.env.REACT_APP_ENABLE_GOOGLE_LOGIN = 'true';

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockUseAuth.socialLogin.mockRejectedValue(new Error('Social login failed'));

      render(<LoginPage />, { wrapper: createWrapper() });

      const socialButton = screen.getByTestId('social-login-google');
      await userEvent.click(socialButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Social login failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
      process.env.REACT_APP_ENABLE_GOOGLE_LOGIN = originalEnv;
    });
  });

  describe('Loading States', () => {
    it('should show loading state during login', () => {
      mockUseAuth.isLoggingIn = true;

      render(<LoginPage />, { wrapper: createWrapper() });

      const submitButton = screen.getByRole('button', { name: /loading/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show loading state during social login', () => {
      mockUseAuth.isSocialLoggingIn = true;

      render(<LoginPage />, { wrapper: createWrapper() });

      const submitButton = screen.getByRole('button', { name: /loading/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and accessibility attributes', () => {
      render(<LoginPage />, { wrapper: createWrapper() });

      const usernameInput = screen.getByLabelText(/username.*email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(usernameInput).toHaveAttribute('autoComplete', 'username');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should associate error messages with form fields', async () => {
      render(<LoginPage />, { wrapper: createWrapper() });

      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        const usernameInput = screen.getByLabelText(/username.*email/i);
        expect(usernameInput).toHaveClass('error');
      });

      await waitFor(() => {
        const passwordInput = screen.getByLabelText(/password/i);
        expect(passwordInput).toHaveClass('error');
      });
    });
  });
});
