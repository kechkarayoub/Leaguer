/**
 * PhoneNumberField Component Tests
 * 
 * This test suite covers:
 * - Component rendering with various props
 * - International phone number formatting
 * - Geolocation-based country detection
 * - Error handling and validation
 * - Accessibility features
 * - Language switching and localization
 * - Disabled state handling
 * 
 * The tests mock:
 * - react-i18next for translations
 *  * - react-phone-input-2 for phone input
 * - UnauthenticatedApiService for geolocation
 * 
 * Run with: yarn test --testPathPattern=PhoneNumberField.test.tsx --watchAll=false
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import PhoneNumberField from './PhoneNumberField';
import UnauthenticatedApiService from '../../services/UnauthenticatedApiService';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => {
      const translations: { [key: string]: string } = {
        'common:form.phone_number': 'Phone Number',
        'common:form.phone.search_placeholder': 'Search countries',
        'common:form.phone.searchNotFound': 'No countries found',
      };
      return translations[key] || defaultValue || key;
    },
    i18n: {
      language: 'en',
    },
  }),
}));

// Mock GlobalUtils to avoid i18n initialization
jest.mock('../../utils/GlobalUtils', () => ({
  EXCLUDED_COUNTRIES: ['us', 'ca', 'mx'],
  getTranslation: (key: string, fallback: string) => fallback,
}));

// Mock react-phone-input-2
jest.mock('react-phone-input-2', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ onChange, value, inputProps, country, ...props }: any) => (
      <div data-testid="phone-input-container">
        <input
          data-testid={inputProps?.['data-testid'] || 'phone-input'}
          value={value || ''}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={inputProps?.placeholder}
          disabled={inputProps?.disabled}
          aria-label={inputProps?.['aria-label']}
          aria-invalid={inputProps?.['aria-invalid']}
          aria-describedby={inputProps?.['aria-describedby']}
          required={inputProps?.required}
        />
        <span data-testid="default-country">{country}</span>
      </div>
    ),
  };
});

// Mock UnauthenticatedApiService
jest.mock('../../services/UnauthenticatedApiService', () => ({
  getInstance: jest.fn(() => ({
    getGeolocation: jest.fn(),
  })),
}));

describe('PhoneNumberField', () => {
  const mockApiService = {
    getGeolocation: jest.fn(),
  };

  // Helper function to render component and wait for async operations
  const renderPhoneNumberField = async (props = {}) => {
    const defaultProps = {
      value: '',
      onChange: jest.fn(),
      ...props
    };
    
    const view = render(
      <PhoneNumberField
        {...defaultProps}
      />
    );
    
    // Wait for component to stabilize after async geolocation calls
    await waitFor(() => {
      expect(screen.getByTestId('phone-input-field')).toBeInTheDocument();
    });
    return view;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (UnauthenticatedApiService.getInstance as jest.Mock).mockReturnValue(mockApiService);
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('should render with default props', async () => {
      await renderPhoneNumberField();
      
      expect(screen.getByTestId('phone-input-field')).toBeInTheDocument();
      expect(screen.getByTestId('default-country')).toHaveTextContent('ma');
    });

    it('should render with label', async () => {
      await renderPhoneNumberField({ label: "Contact Number" });
      
      expect(screen.getByText('Contact Number')).toBeInTheDocument();
    });

    it('should render with required asterisk when required', async () => {
      await renderPhoneNumberField({ label: "Phone", required: true });
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render with error message', async () => {
      await renderPhoneNumberField({ error: "Invalid phone number" });
      
      expect(screen.getByText('Invalid phone number')).toBeInTheDocument();
      expect(screen.getByTestId('phone-input-field')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should render with custom placeholder', async () => {
      await renderPhoneNumberField({ placeholder: "Enter your phone" });
      
      expect(screen.getByTestId('phone-input-field')).toHaveAttribute('placeholder', 'Enter your phone');
    });

    it('should render with default placeholder when none provided', async () => {
      await renderPhoneNumberField();
      
      expect(screen.getByTestId('phone-input-field')).toHaveAttribute('placeholder', 'Phone Number');
    });

    it('should apply error class when error exists', async () => {
      await renderPhoneNumberField({ error: "Error message" });
      
      const container = screen.getByTestId('phone-field-container');
      expect(container).toHaveClass('phone-field--error');
    });

    it('should apply custom className', async () => {
      await renderPhoneNumberField({ className: "custom-class" });
      
      const container = screen.getByTestId('phone-field-container');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Value and onChange', () => {
    it('should display the current value', async () => {
      await renderPhoneNumberField({ value: "+1234567890" });
      
      expect(screen.getByTestId('phone-input-field')).toHaveValue('+1234567890');
    });

    it('should call onChange when value changes', async () => {
      const mockOnChange = jest.fn();
      await renderPhoneNumberField({ onChange: mockOnChange });
      
      const input = screen.getByTestId('phone-input-field');
      
      // Use fireEvent to trigger onChange
      fireEvent.change(input, { target: { value: '123' } });
      
      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnChange).toHaveBeenLastCalledWith('123');
    });

    it('should handle empty value', async () => {
      await renderPhoneNumberField({ value: "" });
      
      expect(screen.getByTestId('phone-input-field')).toHaveValue('');
    });

    it('should handle undefined value', async () => {
      await renderPhoneNumberField({ value: undefined as any });
      
      expect(screen.getByTestId('phone-input-field')).toHaveValue('');
    });
  });

  describe('Disabled State', () => {
    it('should disable input when disabled prop is true', async () => {
      await renderPhoneNumberField({ disabled: true });
      
      expect(screen.getByTestId('phone-input-field')).toBeDisabled();
    });

    it('should not fetch geolocation when disabled', async () => {
      await renderPhoneNumberField({ disabled: true });
      
      expect(mockApiService.getGeolocation).not.toHaveBeenCalled();
    });

    it('should disable input while loading geolocation', async () => {
      // Mock a delayed geolocation response
      mockApiService.getGeolocation.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { country_code: 'US' } }), 100))
      );

      await renderPhoneNumberField();
      
      // Input should be initially disabled while loading
      expect(screen.getByTestId('phone-input-field')).toBeDisabled();
    });
  });

  describe('Geolocation', () => {
    it('should fetch geolocation by default', async () => {
      mockApiService.getGeolocation.mockResolvedValue({ data: { country_code: 'US' } });
      
      await renderPhoneNumberField();
      
      expect(mockApiService.getGeolocation).toHaveBeenCalledTimes(1);
    });

    it('should not fetch geolocation when useGeolocation is false', async () => {
      await renderPhoneNumberField({ useGeolocation: false });
      
      expect(mockApiService.getGeolocation).not.toHaveBeenCalled();
    });

    it('should update default country when geolocation succeeds', async () => {
      mockApiService.getGeolocation.mockResolvedValue({ data: { country_code: 'US' } });
      
      await renderPhoneNumberField();
      
      await waitFor(() => {
        expect(screen.getByTestId('default-country')).toHaveTextContent('us');
      });
    });

    it('should keep default country when geolocation fails', async () => {
      mockApiService.getGeolocation.mockRejectedValue(new Error('Geolocation failed'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await renderPhoneNumberField();
      
      await waitFor(() => {
        expect(screen.getByTestId('default-country')).toHaveTextContent('ma');
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch geolocation:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle geolocation response without country_code', async () => {
      mockApiService.getGeolocation.mockResolvedValue({ data: {} });
      
      await renderPhoneNumberField();
      
      await waitFor(() => {
        expect(screen.getByTestId('default-country')).toHaveTextContent('ma');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', async () => {
      await renderPhoneNumberField({ label: "Contact Phone" });
      
      expect(screen.getByTestId('phone-input-field')).toHaveAttribute('aria-label', 'Contact Phone');
    });

    it('should have default aria-label when no label provided', async () => {
      await renderPhoneNumberField();
      
      expect(screen.getByTestId('phone-input-field')).toHaveAttribute('aria-label', 'Phone Number');
    });

    it('should have aria-invalid when error exists', async () => {
      await renderPhoneNumberField({ error: "Invalid phone number" });
      
      expect(screen.getByTestId('phone-input-field')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have aria-describedby when error exists', async () => {
      await renderPhoneNumberField({ error: "Phone number is required", label: "Phone" });
      
      expect(screen.getByTestId('phone-input-field')).toHaveAttribute('aria-describedby', 'Phone-error');
    });

    it('should have required attribute when required', async () => {
      await renderPhoneNumberField({ required: true });
      
      expect(screen.getByTestId('phone-input-field')).toHaveAttribute('required');
    });

    it('should not have required attribute when not required', async () => {
      await renderPhoneNumberField();
      
      expect(screen.getByTestId('phone-input-field')).not.toHaveAttribute('required');
    });
  });

  describe('Error Display', () => {
    it('should display error message with proper styling', async () => {
      await renderPhoneNumberField({ error: "Phone number is required" });
      
      const errorElement = screen.getByTestId('phone-field-error');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('form-error');
      expect(errorElement).toHaveTextContent('Phone number is required');
    });

    it('should not display error when no error provided', async () => {
      await renderPhoneNumberField();
      
      expect(screen.queryByTestId('phone-field-error')).not.toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render with proper CSS classes', async () => {
      await renderPhoneNumberField();
      
      const container = screen.getByTestId('phone-field-container');
      expect(container).toHaveClass('phone-field');
      
      const wrapper = screen.getByTestId('phone-field-wrapper');
      expect(wrapper).toHaveClass('phone-field__input-wrapper');
    });

    it('should render label with proper CSS class', async () => {
      await renderPhoneNumberField({ label: "Test Label" });
      
      const label = screen.getByTestId('phone-field-label');
      expect(label).toHaveClass('phone-field__label');
      expect(label).toHaveTextContent('Test Label');
    });

    it('should render required asterisk with proper class', async () => {
      await renderPhoneNumberField({ label: "Phone", required: true });
      
      const asterisk = screen.getByText('*');
      expect(asterisk).toHaveClass('required-asterisk');
    });
  });

  describe('Language Support', () => {
    it('should render wrapper with proper test id for language changes', async () => {
      await renderPhoneNumberField();
      
      const wrapper = screen.getByTestId('phone-field-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('phone-field__input-wrapper');
    });
  });
});
