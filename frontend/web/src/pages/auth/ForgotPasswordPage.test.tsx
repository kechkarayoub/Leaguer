/**
 * Tests for ForgotPasswordPage Component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import ForgotPasswordPage from './ForgotPasswordPage';

// Mock dependencies first
jest.mock('../../i18n', () => ({}));
jest.mock('../../utils/GlobalUtils', () => ({}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'auth:forgotPassword.title': 'Reset Password',
        'auth:forgotPassword.subtitle': 'Enter your email or username to reset your password',
        'auth:forgotPassword.button': 'Send Reset Link',
        'auth:forgotPassword.emailSent': 'Reset email sent successfully',
        'auth:forgotPassword.emailSentTitle': 'Check Your Email',
        'auth:forgotPassword.emailSentMessage': 'We sent a password reset link to {{email}}',
        'auth:forgotPassword.checkEmail': 'Please check your email for reset instructions',
        'auth:forgotPassword.backToLogin': 'Back to Login',
        'auth:forgotPassword.rememberPassword': 'Remember your password?',
        'common:form.username.label': 'Username',
        'common:form.email.label': 'Email',
        'common:form.emailOrUsername.placeholder': 'Enter your email or username',
        'common:validation.required': '{{field}} is required',
        'common:app.sending': 'Sending...',
        'common:errors.generic': 'Something went wrong. Please try again.',
      };
      
      if (options?.field) {
        return translations[key]?.replace('{{field}}', options.field) || key;
      }
      if (options?.email) {
        return translations[key]?.replace('{{email}}', options.email) || key;
      }
      return translations[key] || key;
    },
  }),
}));

// Mock the API service properly
jest.mock('../../services/AuthenticatedApiService', () => {
  const mockPost = jest.fn();
  
  return {
    __esModule: true,
    default: {
      getInstance: jest.fn(() => ({
        post: mockPost,
      })),
    },
    // Export the mock for testing
    mockPost,
  };
});

// Get the mock post function
const { mockPost } = require('../../services/AuthenticatedApiService');

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the forgot password form', () => {
      render(
        <TestWrapper>
          <ForgotPasswordPage />
        </TestWrapper>
      );

      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
      expect(screen.getByText('Enter your email or username to reset your password')).toBeInTheDocument();
      expect(screen.getByLabelText(/Username \/ Email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
    });

    it('should render navigation links', () => {
      render(
        <TestWrapper>
          <ForgotPasswordPage />
        </TestWrapper>
      );

      expect(screen.getByText('Remember your password?')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Back to Login' })).toHaveAttribute('href', '/auth/login');
    });

    it('should have proper form attributes', () => {
      render(
        <TestWrapper>
          <ForgotPasswordPage />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/Username \/ Email/i);
      expect(emailInput).toHaveAttribute('type', 'text');
      expect(emailInput).toHaveAttribute('placeholder', 'Enter your email or username');
      expect(emailInput).toHaveAttribute('autoComplete', 'username email');
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty email/username field', async () => {
      render(
        <TestWrapper>
          <ForgotPasswordPage />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Username / Email is required')).toBeInTheDocument();
      });
    });

    it('should clear validation error when user types', async () => {
      render(
        <TestWrapper>
          <ForgotPasswordPage />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/Username \/ Email/i);
      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });

      // Trigger validation error
      await userEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText('Username / Email is required')).toBeInTheDocument();
      });

      // Type in field to clear error
      await userEvent.type(emailInput, 'test@example.com');
      
      await waitFor(() => {
        expect(screen.queryByText('Username / Email is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      mockPost.mockResolvedValueOnce({
        data: { success: true },
      });

      render(
        <TestWrapper>
          <ForgotPasswordPage />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/Username \/ Email/i);
      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/accounts/forgot-password/', {
          email_or_username: 'test@example.com',
        });
      });
    });

    it('should handle successful submission with toast', async () => {
      const { toast } = require('react-toastify');
      mockPost.mockResolvedValueOnce({
        data: { success: true },
      });

      render(
        <TestWrapper>
          <ForgotPasswordPage />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/Username \/ Email/i);
      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Reset email sent successfully');
      });
    });

    it('should handle API error with specific message', async () => {
      const { toast } = require('react-toastify');
      const errorMessage = 'User not found';
      mockPost.mockRejectedValueOnce({
        response: {
          data: {
            message: errorMessage,
          },
        },
      });

      render(
        <TestWrapper>
          <ForgotPasswordPage />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/Username \/ Email/i);
      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });
    });

    it('should handle generic API error', async () => {
      const { toast } = require('react-toastify');
      mockPost.mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <ForgotPasswordPage />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/Username \/ Email/i);
      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Something went wrong. Please try again.');
      });
    });
  });

  describe('Success State', () => {
    it('should show success message after email sent', async () => {
      mockPost.mockResolvedValueOnce({
        data: { success: true },
      });

      render(
        <TestWrapper>
          <ForgotPasswordPage />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/Username \/ Email/i);
      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Check Your Email' })).toBeInTheDocument();
      });
      
      expect(screen.getByText('We sent a password reset link to test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Please check your email for reset instructions')).toBeInTheDocument();
    });

    it('should not show original form in success state', async () => {
      mockPost.mockResolvedValueOnce({
        data: { success: true },
      });

      render(
        <TestWrapper>
          <ForgotPasswordPage />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/Username \/ Email/i);
      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByLabelText(/Username \/ Email/i)).not.toBeInTheDocument();
      });
      
      expect(screen.queryByRole('button', { name: 'Send Reset Link' })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(
        <TestWrapper>
          <ForgotPasswordPage />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/Username \/ Email/i);
      expect(emailInput).toHaveAttribute('id', 'email_or_username');
    });

    it('should have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <ForgotPasswordPage />
        </TestWrapper>
      );

      const heading = screen.getByRole('heading', { name: 'Reset Password' });
      expect(heading.tagName).toBe('H1');
    });

    it('should have proper button accessibility', () => {
      render(
        <TestWrapper>
          <ForgotPasswordPage />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });
});
