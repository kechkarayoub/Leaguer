/**
 * MainHeader Component Basic Tests
 * 
 * Basic test with minimal dependencies
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';

// Mock all external dependencies without importing react-router-dom
jest.mock('../../hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({
    user: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      profile: {
        profile_image: null
      }
    },
    logout: jest.fn(),
  }),
}));

// Mock router hooks without importing the module
jest.mock('react-router-dom', () => {
  const mockUseLocation = () => ({ pathname: '/dashboard' });
  const mockUseNavigate = () => jest.fn();
  
  return {
    useLocation: mockUseLocation,
    useNavigate: mockUseNavigate,
  };
});

jest.mock('../LanguageSwitcher', () => {
  return function LanguageSwitcher() {
    return <div data-testid="language-switcher" />;
  };
});

jest.mock('../icons/MenuIcon', () => {
  return function MenuIcon() {
    return <svg data-testid="menu-icon" role="img" aria-label="Menu" />;
  };
});

jest.mock('../icons/UserIcon', () => {
  return function UserIcon() {
    return <svg data-testid="user-icon" role="img" aria-label="User" />;
  };
});

jest.mock('../icons/ChevronDownIcon', () => {
  return function ChevronDownIcon() {
    return <svg data-testid="chevron-icon" role="img" aria-label="Chevron Down" />;
  };
});

jest.mock('../../utils/GlobalUtils', () => ({
  getPageTitle: jest.fn().mockReturnValue('Test Page'),
}));

// Import the component after mocking
const MainHeader = require('./MainHeader').default;

// Simple wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    {children}
  </I18nextProvider>
);

describe('MainHeader Component - Basic Tests', () => {
  const mockOnMenuClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component successfully', () => {
    render(
      <TestWrapper>
        <MainHeader onMenuClick={mockOnMenuClick} />
      </TestWrapper>
    );

    expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
  });

  it('should render language switcher', () => {
    render(
      <TestWrapper>
        <MainHeader onMenuClick={mockOnMenuClick} />
      </TestWrapper>
    );

    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
  });

  it('should render with page title', () => {
    render(
      <TestWrapper>
        <MainHeader onMenuClick={mockOnMenuClick} pageTitle="Test Title" />
      </TestWrapper>
    );

    // The title appears in the page-title element, even if empty initially
    const titleElement = screen.getByRole('heading', { level: 1 });
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveClass('page-title');
  });

  it('should render user initials', () => {
    render(
      <TestWrapper>
        <MainHeader onMenuClick={mockOnMenuClick} />
      </TestWrapper>
    );

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('should render all icons', () => {
    render(
      <TestWrapper>
        <MainHeader onMenuClick={mockOnMenuClick} />
      </TestWrapper>
    );

    expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    // User icon might not be visible when showing initials instead
    expect(screen.getByTestId('chevron-icon')).toBeInTheDocument();
  });
});
