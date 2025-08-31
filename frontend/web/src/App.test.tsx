/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock all the dependencies
jest.mock('./hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  })),
}));

jest.mock('./hooks/useRTL', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('./i18n', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
    i18n: { language: 'en' },
    ready: true,
  }),
}));

jest.mock('./utils/GlobalUtils', () => ({
  getPageTitle: jest.fn(() => 'Test Page'),
}));

jest.mock('./config/config', () => ({
  __esModule: true,
  default: {
    app: {
      name: 'Leaguer',
    },
  },
}));

jest.mock('./contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTheme: () => ({
    resolvedTheme: 'light',
    theme: 'light',
    setTheme: jest.fn(),
  }),
}));

jest.mock('./components/ErrorBoundary', () => {
  return function MockedErrorBoundary({ children }: { children: React.ReactNode }) {
    return <div data-testid="error-boundary">{children}</div>;
  };
});

jest.mock('./components/LoadingSpinner', () => {
  return function MockedLoadingSpinner({ overlay }: { overlay?: boolean }) {
    return <div data-testid="loading-spinner" data-overlay={overlay}>Loading...</div>;
  };
});

jest.mock('./components/layouts/AuthLayout', () => {
  return function MockedAuthLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="auth-layout">{children}</div>;
  };
});

jest.mock('./components/layouts/MainLayout', () => {
  return function MockedMainLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="main-layout">{children}</div>;
  };
});

jest.mock('./components/ProtectedRoute', () => {
  return function MockedProtectedRoute({ children }: { children: React.ReactNode }) {
    return <div data-testid="protected-route">{children}</div>;
  };
});

jest.mock('./pages/auth/LoginPage', () => {
  return function MockedLoginPage() {
    return <div data-testid="login-page">Login Page</div>;
  };
});

jest.mock('./pages/auth/RegisterPage', () => {
  return function MockedRegisterPage() {
    return <div data-testid="register-page">Register Page</div>;
  };
});

jest.mock('./pages/auth/ForgotPasswordPage', () => {
  return function MockedForgotPasswordPage() {
    return <div data-testid="forgot-password-page">Forgot Password Page</div>;
  };
});

jest.mock('./pages/auth/ResetPasswordPage', () => {
  return function MockedResetPasswordPage() {
    return <div data-testid="reset-password-page">Reset Password Page</div>;
  };
});

jest.mock('./pages/home/HomePage', () => {
  return function MockedHomePage() {
    return <div data-testid="home-page">Home Page</div>;
  };
});

jest.mock('./pages/settings/SettingsPage', () => {
  return function MockedSettingsPage() {
    return <div data-testid="settings-page">Settings Page</div>;
  };
});

jest.mock('./pages/profile/ProfilePage', () => {
  return function MockedProfilePage() {
    return <div data-testid="profile-page">Profile Page</div>;
  };
});

jest.mock('./pages/PageNotFound', () => {
  return function MockedPageNotFound() {
    return <div data-testid="page-not-found">Page Not Found</div>;
  };
});

jest.mock('react-toastify', () => ({
  ToastContainer: ({ theme, position }: any) => (
    <div data-testid="toast-container" data-theme={theme} data-position={position}>
      Toast Container
    </div>
  ),
}));

jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn(() => ({})),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-client-provider">{children}</div>
  ),
}));

// Mock react-router-dom
const mockLocation = { pathname: '/' };
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="browser-router">{children}</div>
  ),
  Routes: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="routes">{children}</div>
  ),
  Route: ({ element }: { element: React.ReactNode }) => (
    <div data-testid="route">{element}</div>
  ),
  Navigate: ({ to, replace }: { to: string; replace?: boolean }) => (
    <div data-testid="navigate" data-to={to} data-replace={replace}>
      Navigate to {to}
    </div>
  ),
  useLocation: () => mockLocation,
  useNavigate: () => mockNavigate,
}));

jest.mock('@tanstack/react-query', () => {
  const mockQueryClient = jest.fn(() => ({}));
  return {
    QueryClient: mockQueryClient,
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="query-client-provider">{children}</div>
    ),
  };
});

// Mock environment variables
const originalEnv = process.env;

const useAuthMock = require('./hooks/useAuth').default;

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    
    // Default mock implementation
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    });

    // Reset location mock
    mockLocation.pathname = '/';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should render without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
  });

  it('should render query client provider', () => {
    render(<App />);
    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
  });

  it('should render toast container with correct theme', () => {
    render(<App />);
    const toastContainer = screen.getByTestId('toast-container');
    expect(toastContainer).toBeInTheDocument();
    expect(toastContainer).toHaveAttribute('data-theme', 'light');
    expect(toastContainer).toHaveAttribute('data-position', 'top-right');
  });

  it('should show loading spinner when auth is loading', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    render(<App />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render main app structure when not loading', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    render(<App />);

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    expect(screen.getAllByTestId('routes')).toHaveLength(3); // Main routes + two nested routes
  });

  it('should update document title when rendered', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, email: 'test@example.com' },
    });

    render(<App />);

    expect(document.title).toContain('Leaguer');
  });

  it('should handle authenticated user state', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, email: 'test@example.com' },
    });

    render(<App />);

    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    expect(screen.getAllByTestId('routes')).toHaveLength(2); // Main routes + one nested route for protected
  });

  it('should handle unauthenticated user state', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    render(<App />);

    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    expect(screen.getAllByTestId('routes')).toHaveLength(3); // Main routes + two nested routes
  });

  it('should render theme provider', () => {
    render(<App />);
    // The ThemeProvider is mocked to render its children directly
    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
  });

  it('should handle environment variables for signup', () => {
    process.env.REACT_APP_ENABLE_SIGNUP = 'true';
    
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    render(<App />);

    // App should render regardless of environment variables
    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
  });

  it('should handle missing environment variables gracefully', () => {
    delete process.env.REACT_APP_ENABLE_SIGNUP;
    
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    render(<App />);

    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
  });

  it('should render error boundary at the top level', () => {
    render(<App />);
    
    const errorBoundary = screen.getByTestId('error-boundary');
    expect(errorBoundary).toBeInTheDocument();
    
    // ErrorBoundary should contain the query client provider
    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
  });

  it('should create query client provider wrapper', () => {
    render(<App />);
    
    // Verify QueryClient provider is present
    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
  });

  it('should handle theme context properly', () => {
    render(<App />);
    
    // Verify toast container uses the correct theme
    const toastContainer = screen.getByTestId('toast-container');
    expect(toastContainer).toHaveAttribute('data-theme', 'light');
  });

  it('should initialize with correct app structure hierarchy', () => {
    render(<App />);
    
    // Verify the component hierarchy
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
  });

  it('should handle RTL initialization', () => {
    const useRTLMock = require('./hooks/useRTL').default;
    
    render(<App />);
    
    // Verify useRTL hook is called during initialization
    expect(useRTLMock).toHaveBeenCalled();
  });
});
