/**
 * Sidebar Component Basic Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import Sidebar from './Sidebar';
import i18n from '../../i18n';

// Mock axios and services
jest.mock('axios');
jest.mock('../../services/AuthenticatedApiService');
jest.mock('../../services/DeviceIdService');
jest.mock('../../services/SecureStorageService');

// Mock useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({
    user: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
    },
    logout: jest.fn(),
    isAuthenticated: true,
  }),
}));

// Mock router hooks
jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/dashboard' }),
  useNavigate: () => jest.fn(),
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock icons
jest.mock('../icons/HomeIcon', () => {
  return function HomeIcon() {
    return <svg data-testid="home-icon" role="img" aria-label="Home" />;
  };
});

jest.mock('../icons/SettingsIcon', () => {
  return function SettingsIcon() {
    return <svg data-testid="settings-icon" role="img" aria-label="Settings" />;
  };
});

// Simple wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    {children}
  </I18nextProvider>
);

describe('Sidebar Component - Basic Tests', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component successfully when open', () => {
    render(
      <TestWrapper>
        <Sidebar isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toBeInTheDocument();
  });

  it('should render the component when closed', () => {
    render(
      <TestWrapper>
        <Sidebar isOpen={false} onClose={mockOnClose} />
      </TestWrapper>
    );

    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toBeInTheDocument();
  });

  it('should have sidebar class', () => {
    render(
      <TestWrapper>
        <Sidebar isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const sidebarAside = screen.getByRole('complementary');
    expect(sidebarAside).toHaveClass('sidebar');
  });

  it('should render navigation links', () => {
    render(
      <TestWrapper>
        <Sidebar isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    // Check for navigation structure
    const navigation = screen.getByRole('navigation');
    expect(navigation).toBeInTheDocument();
    
    // Look for navigation buttons instead of links
    const navButtons = screen.getAllByRole('button');
    expect(navButtons.length).toBeGreaterThan(0);
    
    // Check for specific navigation items
    expect(screen.getByText('home')).toBeInTheDocument();
    expect(screen.getByText('settings')).toBeInTheDocument();
  });

  it('should handle isOpen prop correctly', () => {
    const { rerender } = render(
      <TestWrapper>
        <Sidebar isOpen={false} onClose={mockOnClose} />
      </TestWrapper>
    );

    let sidebar = screen.getByRole('navigation');
    expect(sidebar).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <Sidebar isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    sidebar = screen.getByRole('navigation');
    expect(sidebar).toBeInTheDocument();
  });

  it('should be a semantic navigation element', () => {
    render(
      <TestWrapper>
        <Sidebar isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const nav = screen.getByRole('navigation');
    expect(nav.tagName.toLowerCase()).toBe('nav');
  });

  it('should render without crashing with required props', () => {
    expect(() => {
      render(
        <TestWrapper>
          <Sidebar isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );
    }).not.toThrow();
  });
});
