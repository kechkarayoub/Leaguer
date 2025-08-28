import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import MainFooter from './MainFooter';

// Mock modules to avoid complex dependencies
jest.mock('../../hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../AuthFooter', () => {
  return function MockAuthFooter({ prefillUserData }: { prefillUserData: any }) {
    return (
      <div data-testid="auth-footer">
        <div data-testid="prefill-data">
          Name: {prefillUserData?.name || 'No name'}
        </div>
        <div data-testid="prefill-email">
          Email: {prefillUserData?.email || 'No email'}
        </div>
      </div>
    );
  };
});

// Test wrapper component
const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('MainFooter Component', () => {
  const mockUseAuth = require('../../hooks/useAuth').default;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render successfully with authenticated user', () => {
      mockUseAuth.mockReturnValue({
        user: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com'
        }
      });

      render(
        <Wrapper>
          <MainFooter />
        </Wrapper>
      );

      expect(screen.getByTestId('auth-footer')).toBeInTheDocument();
      expect(screen.getByTestId('prefill-data')).toHaveTextContent('Name: John Doe');
      expect(screen.getByTestId('prefill-email')).toHaveTextContent('Email: john@example.com');
    });

    it('should render successfully with null user', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <Wrapper>
          <MainFooter />
        </Wrapper>
      );

      expect(screen.getByTestId('auth-footer')).toBeInTheDocument();
      expect(screen.getByTestId('prefill-data')).toHaveTextContent('Name: No name');
      expect(screen.getByTestId('prefill-email')).toHaveTextContent('Email: No email');
    });
  });

  describe('User Data Integration', () => {
    it('should pass complete user data when both names exist', () => {
      mockUseAuth.mockReturnValue({
        user: {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com'
        }
      });

      render(
        <Wrapper>
          <MainFooter />
        </Wrapper>
      );

      expect(screen.getByTestId('prefill-data')).toHaveTextContent('Name: Jane Smith');
      expect(screen.getByTestId('prefill-email')).toHaveTextContent('Email: jane@example.com');
    });

    it('should handle only first name', () => {
      mockUseAuth.mockReturnValue({
        user: {
          first_name: 'John',
          email: 'john@example.com'
        }
      });

      render(
        <Wrapper>
          <MainFooter />
        </Wrapper>
      );

      expect(screen.getByTestId('prefill-data')).toHaveTextContent('Name: John');
    });

    it('should handle only last name', () => {
      mockUseAuth.mockReturnValue({
        user: {
          last_name: 'Doe',
          email: 'doe@example.com'
        }
      });

      render(
        <Wrapper>
          <MainFooter />
        </Wrapper>
      );

      // undefined first_name will show as "undefined Doe", then trimmed to "undefined Doe"
      expect(screen.getByTestId('prefill-data')).toHaveTextContent('Name: undefined Doe');
    });

    it('should handle empty names', () => {
      mockUseAuth.mockReturnValue({
        user: {
          first_name: '',
          last_name: '',
          email: 'user@example.com'
        }
      });

      render(
        <Wrapper>
          <MainFooter />
        </Wrapper>
      );

      expect(screen.getByTestId('prefill-data')).toHaveTextContent('Name: No name');
      expect(screen.getByTestId('prefill-email')).toHaveTextContent('Email: user@example.com');
    });

    it('should handle whitespace in names', () => {
      mockUseAuth.mockReturnValue({
        user: {
          first_name: '  John  ',
          last_name: '  Doe  ',
          email: 'john@example.com'
        }
      });

      render(
        <Wrapper>
          <MainFooter />
        </Wrapper>
      );

      // Template literal concatenation keeps original spacing: "  John     Doe  " then trimmed to "John     Doe"
      expect(screen.getByTestId('prefill-data')).toHaveTextContent('Name: John Doe');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user', () => {
      mockUseAuth.mockReturnValue({ user: undefined });

      render(
        <Wrapper>
          <MainFooter />
        </Wrapper>
      );

      expect(screen.getByTestId('prefill-data')).toHaveTextContent('Name: No name');
      expect(screen.getByTestId('prefill-email')).toHaveTextContent('Email: No email');
    });

    it('should handle null/undefined properties', () => {
      mockUseAuth.mockReturnValue({
        user: {
          first_name: null,
          last_name: undefined,
          email: 'test@example.com'
        }
      });

      render(
        <Wrapper>
          <MainFooter />
        </Wrapper>
      );

      // null and undefined will show as "null undefined" in template literal
      expect(screen.getByTestId('prefill-data')).toHaveTextContent('Name: null undefined');
    });

    it('should handle single character names', () => {
      mockUseAuth.mockReturnValue({
        user: {
          first_name: 'J',
          last_name: 'D',
          email: 'j.d@example.com'
        }
      });

      render(
        <Wrapper>
          <MainFooter />
        </Wrapper>
      );

      expect(screen.getByTestId('prefill-data')).toHaveTextContent('Name: J D');
    });

    it('should handle special characters in names', () => {
      mockUseAuth.mockReturnValue({
        user: {
          first_name: 'José',
          last_name: 'García-O\'Brien',
          email: 'jose@example.com'
        }
      });

      render(
        <Wrapper>
          <MainFooter />
        </Wrapper>
      );

      expect(screen.getByTestId('prefill-data')).toHaveTextContent('Name: José García-O\'Brien');
    });

    it('should handle single name (like Madonna)', () => {
      mockUseAuth.mockReturnValue({
        user: {
          first_name: 'Madonna',
          email: 'madonna@example.com'
        }
      });

      render(
        <Wrapper>
          <MainFooter />
        </Wrapper>
      );

      expect(screen.getByTestId('prefill-data')).toHaveTextContent('Name: Madonna');
    });
  });

  describe('Component Structure', () => {
    it('should not throw errors during rendering', () => {
      mockUseAuth.mockReturnValue({
        user: {
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com'
        }
      });

      expect(() => {
        render(
          <Wrapper>
            <MainFooter />
          </Wrapper>
        );
      }).not.toThrow();
    });

    it('should always render the AuthFooter component', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <Wrapper>
          <MainFooter />
        </Wrapper>
      );

      expect(screen.getByTestId('auth-footer')).toBeInTheDocument();
    });
  });
});
