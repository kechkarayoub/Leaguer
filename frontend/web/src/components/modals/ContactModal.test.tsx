/**
 * ContactModal Component Tests
 * 
 * This test suite covers:
 * - Modal rendering with BaseModal integration
 * - Form validation and error handling
 * - Form submission and API integration
 * - Contact information displa    it('should show validation errors when submitting empty form', async () => {
      render(<ContactModal {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /send message/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getAllByText('This field is required')).toHaveLength(4);
      });
    });er input handling and state management
 * - Success message display
 * - Environment variable usage
 * - Form reset functionality
 * - Internationalization support
 * 
 * The tests mock:
 * - react-i18next for translations
 * - BaseModal component for modal functionality testing
 * - UnauthenticatedApiService for API calls
 * - Logo image imports
 * 
 * Run with: yarn test --testPathPattern=ContactModal.test.tsx --watchAll=false
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactModal from './ContactModal';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: { [key: string]: string } = {
        'common:footer.contact': 'Contact Us',
        'common:contact.title': 'Get in Touch',
        'common:contact.subtitle': 'Have questions or need support? We\'re here to help! Send us a message and we\'ll get back to you as soon as possible.',
        'common:contact.info.title': 'Contact Information',
        'common:contact.info.email': 'Email Support',
        'common:contact.info.emailDesc': 'Get help with your account, billing, or technical issues',
        'common:contact.info.responseTime': 'Response Time',
        'common:contact.info.responseTimeValue': 'Within 24 hours',
        'common:contact.info.responseTimeDesc': 'We respond to all inquiries within one business day',
        'common:contact.info.support': 'Support Available',
        'common:contact.info.supportTime': 'Monday - Friday, 9AM - 6PM EST',
        'common:contact.info.supportDesc': 'Our support team is here to help during business hours',
        'common:contact.form.title': 'Send us a Message',
        'common:contact.form.name': 'Full Name',
        'common:contact.form.namePlaceholder': 'Enter your full name',
        'common:contact.form.email': 'Email Address',
        'common:contact.form.emailPlaceholder': 'Enter your email address',
        'common:contact.form.subject': 'Subject',
        'common:contact.form.subjectPlaceholder': 'Select a subject',
        'common:contact.form.subjectOptions.support': 'Technical Support',
        'common:contact.form.subjectOptions.billing': 'Billing & Account',
        'common:contact.form.subjectOptions.feature': 'Feature Request',
        'common:contact.form.subjectOptions.partnership': 'Partnership',
        'common:contact.form.subjectOptions.other': 'Other',
        'common:contact.form.message': 'Message',
        'common:contact.form.messagePlaceholder': 'Tell us how we can help you...',
        'common:contact.form.send': 'Send Message',
        'common:contact.form.sending': 'Sending...',
        'common:contact.form.successTitle': 'Message Sent Successfully!',
        'common:contact.form.successMessage': 'Thank you for contacting us. We\'ll get back to you within 24 hours.',
        'common:contact.form.messageMinLength': 'Message must be at least 10 characters long',
        'common:validation.required': 'This field is required',
        'common:validation.email': 'Please enter a valid email address',
      };
      return options?.defaultValue || translations[key] || key;
    },
  }),
}));

// Mock BaseModal component
const mockOnClose = jest.fn();
jest.mock('./BaseModal', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ isOpen, onClose, title, size, children }: any) => {
      if (!isOpen) return null;
      
      return (
        <div data-testid="base-modal-component">
          <div data-testid="base-modal-title">{title}</div>
          <div data-testid="base-modal-size">{size}</div>
          <div data-testid="base-modal-content">{children}</div>
          <button
            data-testid="base-modal-close"
            onClick={() => {
              onClose();
              mockOnClose();
            }}
          >
            Close
          </button>
        </div>
      );
    },
  };
});

// Mock logo import
jest.mock('../../logo.png', () => 'mock-logo.png');

// Mock UnauthenticatedApiService
const mockSendContactMessage = jest.fn();
jest.mock('../../services/UnauthenticatedApiService', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      sendContactMessage: mockSendContactMessage,
    }),
  },
}));

describe('ContactModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  // Mock environment variables
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendContactMessage.mockResolvedValue({ success: true });
    process.env = {
      ...originalEnv,
      REACT_APP_SUPPORT_EMAIL: 'test@leaguer.com',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<ContactModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('base-modal-component')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(<ContactModal {...defaultProps} />);
      
      expect(screen.getByTestId('base-modal-component')).toBeInTheDocument();
      expect(screen.getByTestId('base-modal-title')).toHaveTextContent('Contact Us');
      expect(screen.getByTestId('base-modal-size')).toHaveTextContent('large');
    });

    it('should render hero section with logo and title', () => {
      render(<ContactModal {...defaultProps} />);
      
      const logo = screen.getByAltText('Leaguer Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'mock-logo.png');
      
      expect(screen.getByText('Get in Touch')).toBeInTheDocument();
      expect(screen.getByText('Have questions or need support? We\'re here to help! Send us a message and we\'ll get back to you as soon as possible.')).toBeInTheDocument();
    });
  });

  describe('Contact Information Section', () => {
    it('should render contact information section', () => {
      render(<ContactModal {...defaultProps} />);
      
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText('Email Support')).toBeInTheDocument();
      expect(screen.getByText('Response Time')).toBeInTheDocument();
      expect(screen.getByText('Support Available')).toBeInTheDocument();
    });

    it('should render support email link', () => {
      render(<ContactModal {...defaultProps} />);
      
      const emailLink = screen.getByRole('link', { name: 'test@leaguer.com' });
      expect(emailLink).toBeInTheDocument();
      expect(emailLink).toHaveAttribute('href', 'mailto:test@leaguer.com');
    });

    it('should display response time information', () => {
      render(<ContactModal {...defaultProps} />);
      
      expect(screen.getByText('Within 24 hours')).toBeInTheDocument();
      expect(screen.getByText('We respond to all inquiries within one business day')).toBeInTheDocument();
    });

    it('should display support hours', () => {
      render(<ContactModal {...defaultProps} />);
      
      expect(screen.getByText('Monday - Friday, 9AM - 6PM EST')).toBeInTheDocument();
      expect(screen.getByText('Our support team is here to help during business hours')).toBeInTheDocument();
    });
  });

  describe('Contact Form', () => {
    it('should render contact form with all fields', () => {
      render(<ContactModal {...defaultProps} />);
      
      expect(screen.getByText('Send us a Message')).toBeInTheDocument();
      expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Subject/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Message/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send Message' })).toBeInTheDocument();
    });

    it('should render form fields with proper placeholders', () => {
      render(<ContactModal {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Tell us how we can help you...')).toBeInTheDocument();
    });

    it('should render subject options', () => {
      render(<ContactModal {...defaultProps} />);
      
      const subjectSelect = screen.getByLabelText(/Subject/);
      expect(subjectSelect).toBeInTheDocument();
      
      // Check for option elements
      expect(screen.getByText('Select a subject')).toBeInTheDocument();
      expect(screen.getByText('Technical Support')).toBeInTheDocument();
      expect(screen.getByText('Billing & Account')).toBeInTheDocument();
      expect(screen.getByText('Feature Request')).toBeInTheDocument();
      expect(screen.getByText('Partnership')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      // Don't call API for validation-only tests
      mockSendContactMessage.mockResolvedValue({ success: false, errors: {} });
      
      render(<ContactModal {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: 'Send Message' });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getAllByText('This field is required')).toHaveLength(4);
      });
      
      // API should not be called for client-side validation
      expect(mockSendContactMessage).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      render(<ContactModal {...defaultProps} />);
      
      const emailInput = screen.getByLabelText(/Email Address/);
      await userEvent.type(emailInput, 'invalid-email');
      
      const submitButton = screen.getByRole('button', { name: 'Send Message' });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('should validate message minimum length', async () => {
      render(<ContactModal {...defaultProps} />);
      
      const messageInput = screen.getByLabelText(/Message/);
      await userEvent.type(messageInput, 'short');
      
      const submitButton = screen.getByRole('button', { name: 'Send Message' });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Message must be at least 10 characters long')).toBeInTheDocument();
      });
    });

    it('should clear validation errors when user starts typing', async () => {
      render(<ContactModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/Full Name/);
      const submitButton = screen.getByRole('button', { name: 'Send Message' });
      
      // Trigger validation error
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getAllByText('This field is required')).toHaveLength(4);
      });
      
      // Start typing to clear error
      await userEvent.type(nameInput, 'Test Name');
      
      await waitFor(() => {
        expect(screen.getAllByText('This field is required')).toHaveLength(3);
      });
    });
  });

  describe('Form Submission', () => {
    const fillValidForm = async () => {
      await userEvent.type(screen.getByLabelText(/Full Name/), 'John Doe');
      await userEvent.type(screen.getByLabelText(/Email Address/), 'john@example.com');
      await userEvent.selectOptions(screen.getByLabelText(/Subject/), 'support');
      await userEvent.type(screen.getByLabelText(/Message/), 'This is a test message with enough characters');
    };

    it('should submit form with valid data', async () => {
      render(<ContactModal {...defaultProps} />);
      
      await fillValidForm();
      
      const submitButton = screen.getByRole('button', { name: 'Send Message' });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockSendContactMessage).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'support',
          message: 'This is a test message with enough characters',
        });
      });
    });

    it('should show loading state during submission', async () => {
      mockSendContactMessage.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
      render(<ContactModal {...defaultProps} />);
      
      await fillValidForm();
      
      const submitButton = screen.getByRole('button', { name: 'Send Message' });
      await userEvent.click(submitButton);
      
      expect(screen.getByText('Sending...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should show success message after successful submission', async () => {
      render(<ContactModal {...defaultProps} />);
      
      await fillValidForm();
      
      const submitButton = screen.getByRole('button', { name: 'Send Message' });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Message Sent Successfully!')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Thank you for contacting us. We\'ll get back to you within 24 hours.')).toBeInTheDocument();
    });

    it('should reset form after successful submission', async () => {
      render(<ContactModal {...defaultProps} />);
      
      await fillValidForm();
      
      const submitButton = screen.getByRole('button', { name: 'Send Message' });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Full Name/)).toHaveValue('');
      });
      
      expect(screen.getByLabelText(/Email Address/)).toHaveValue('');
      expect(screen.getByLabelText(/Subject/)).toHaveValue('');
      expect(screen.getByLabelText(/Message/)).toHaveValue('');
    });

    it('should handle API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSendContactMessage.mockRejectedValue(new Error('Network error'));
      
      render(<ContactModal {...defaultProps} />);
      
      await fillValidForm();
      
      const submitButton = screen.getByRole('button', { name: 'Send Message' });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error submitting form:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle backend validation errors', async () => {
      mockSendContactMessage.mockResolvedValue({
        success: false,
        errors: {
          email: 'Invalid email format',
        },
      });
      
      render(<ContactModal {...defaultProps} />);
      
      await fillValidForm();
      
      const submitButton = screen.getByRole('button', { name: 'Send Message' });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
    });
  });

  describe('Prefilled Data', () => {
    it('should prefill form with provided user data', () => {
      const prefillData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
      };
      
      render(<ContactModal {...defaultProps} prefillUserData={prefillData} />);
      
      expect(screen.getByLabelText(/Full Name/)).toHaveValue('Jane Smith');
      expect(screen.getByLabelText(/Email Address/)).toHaveValue('jane@example.com');
    });

    it('should handle partial prefill data', () => {
      const prefillData = {
        name: 'Jane Smith',
      };
      
      render(<ContactModal {...defaultProps} prefillUserData={prefillData} />);
      
      expect(screen.getByLabelText(/Full Name/)).toHaveValue('Jane Smith');
      expect(screen.getByLabelText(/Email Address/)).toHaveValue('');
    });

    it('should handle empty prefill data', () => {
      render(<ContactModal {...defaultProps} prefillUserData={{}} />);
      
      expect(screen.getByLabelText(/Full Name/)).toHaveValue('');
      expect(screen.getByLabelText(/Email Address/)).toHaveValue('');
    });
  });

  describe('Modal Interactions', () => {
    it('should reset form when modal is closed', async () => {
      render(<ContactModal {...defaultProps} />);
      
      // Fill form
      await userEvent.type(screen.getByLabelText(/Full Name/), 'Test User');
      await userEvent.type(screen.getByLabelText(/Email Address/), 'test@example.com');
      
      // Close modal
      const closeButton = screen.getByTestId('base-modal-close');
      await userEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should hide success message when modal is closed', async () => {
      const mockOnClose = jest.fn();
      const { rerender } = render(<ContactModal isOpen={true} onClose={mockOnClose} />);
      
      // Submit form successfully first
      await userEvent.type(screen.getByLabelText(/Full Name/), 'John Doe');
      await userEvent.type(screen.getByLabelText(/Email Address/), 'john@example.com');
      await userEvent.selectOptions(screen.getByLabelText(/Subject/), 'support');
      await userEvent.type(screen.getByLabelText(/Message/), 'This is a test message with enough characters');
      
      const submitButton = screen.getByRole('button', { name: 'Send Message' });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Message Sent Successfully!')).toBeInTheDocument();
      });
      
      // Click close button to trigger the close handler
      const closeButton = screen.getByTestId('base-modal-close');
      await userEvent.click(closeButton);
      
      // Verify modal is closed
      expect(mockOnClose).toHaveBeenCalled();
      
      // Reopen modal with fresh state
      rerender(<ContactModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.queryByText('Message Sent Successfully!')).not.toBeInTheDocument();
    });
  });

  describe('Environment Variables', () => {
    it('should use environment variable for support email', () => {
      process.env.REACT_APP_SUPPORT_EMAIL = 'custom@example.com';
      render(<ContactModal {...defaultProps} />);
      
      const emailLink = screen.getByRole('link', { name: 'custom@example.com' });
      expect(emailLink).toBeInTheDocument();
      expect(emailLink).toHaveAttribute('href', 'mailto:custom@example.com');
    });

    it('should use default email when environment variable is missing', () => {
      delete process.env.REACT_APP_SUPPORT_EMAIL;
      render(<ContactModal {...defaultProps} />);
      
      const emailLink = screen.getByRole('link', { name: 'support@leaguer.com' });
      expect(emailLink).toBeInTheDocument();
      expect(emailLink).toHaveAttribute('href', 'mailto:support@leaguer.com');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and structure', () => {
      render(<ContactModal {...defaultProps} />);
      
      expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Subject/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Message/)).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(<ContactModal {...defaultProps} />);
      
      const heroTitle = screen.getByText('Get in Touch');
      expect(heroTitle.tagName).toBe('H3');
      
      const sectionTitles = screen.getAllByText(/Contact Information|Send us a Message/);
      sectionTitles.forEach(title => {
        expect(title.tagName).toBe('H4');
      });
    });

    it('should associate error messages with form fields', async () => {
      render(<ContactModal {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: 'Send Message' });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getAllByText('This field is required')).toHaveLength(4);
      });
      
      const nameInput = screen.getByLabelText(/Full Name/);
      expect(nameInput).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onClose callback gracefully', () => {
      expect(() => {
        render(<ContactModal isOpen={true} onClose={undefined as any} />);
      }).not.toThrow();
    });

    it('should handle rapid form submissions', async () => {
      render(<ContactModal {...defaultProps} />);
      
      await userEvent.type(screen.getByLabelText(/Full Name/), 'John Doe');
      await userEvent.type(screen.getByLabelText(/Email Address/), 'john@example.com');
      await userEvent.selectOptions(screen.getByLabelText(/Subject/), 'support');
      await userEvent.type(screen.getByLabelText(/Message/), 'This is a test message with enough characters');
      
      const submitButton = screen.getByRole('button', { name: 'Send Message' });
      
      // Rapid clicks
      await userEvent.click(submitButton);
      await userEvent.click(submitButton);
      
      // Should only submit once
      await waitFor(() => {
        expect(mockSendContactMessage).toHaveBeenCalledTimes(1);
      });
    });
  });
});
