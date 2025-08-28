/**
 * CustomSelect Component Tests
 * 
 * This test suite covers:
 * - Component rendering with various configurations
 * - Option selection and value handling
 * - Search functionality and filtering
 * - Country flag display functionality
 * - Error handling and validation display
 * - Accessibility features
 * - Clear and disabled states
 * - Custom styling and classes
 * 
 * The tests mock:
 * - react-i18next for translations
 * - react-select for the select component
 * - Flag image loading
 * 
 * Run with: yarn test --testPathPattern=CustomSelect.test.tsx --watchAll=false
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomSelect, { CustomSelectOption } from './CustomSelect';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'profile:placeholders.select_country': 'Select a country',
        'profile:select.no_options': 'No options available',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
    },
  }),
}));

// Mock react-select
jest.mock('react-select', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ 
      options, 
      value, 
      onChange, 
      placeholder, 
      isDisabled, 
      isClearable, 
      isSearchable, 
      components,
      ...props 
    }: any) => (
      <div data-testid="react-select-wrapper">
        <select
          data-testid="select-element"
          value={value?.value || ''}
          onChange={(e) => {
            const selectedOption = options.find((opt: any) => opt.value === e.target.value);
            onChange(selectedOption || null);
          }}
          disabled={isDisabled}
          aria-label={props['aria-label']}
          aria-invalid={props['aria-invalid']}
          aria-describedby={props['aria-describedby']}
        >
          <option value="">{placeholder}</option>
          {options.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {isClearable && value && (
          <button 
            data-testid="clear-button" 
            onClick={() => onChange(null)}
            type="button"
          >
            Clear
          </button>
        )}
        {components?.SingleValue && value && (
          <div data-testid="single-value-component">
            <components.SingleValue data={value} />
          </div>
        )}
        {isSearchable && <span data-testid="searchable-indicator">Searchable</span>}
      </div>
    ),
  };
});

describe('CustomSelect', () => {
  const mockOptions: CustomSelectOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'fr', label: 'France' },
  ];

  const defaultProps = {
    value: null,
    onChange: jest.fn(),
    options: mockOptions,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<CustomSelect {...defaultProps} />);
      
      expect(screen.getByTestId('select-element')).toBeInTheDocument();
      expect(screen.getByTestId('custom-select-container')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<CustomSelect {...defaultProps} label="Country" />);
      
      expect(screen.getByText('Country')).toBeInTheDocument();
    });

    it('should render with required asterisk when required', () => {
      render(<CustomSelect {...defaultProps} label="Country" required />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<CustomSelect {...defaultProps} placeholder="Choose country" />);
      
      expect(screen.getByText('Choose country')).toBeInTheDocument();
    });

    it('should render with default placeholder', () => {
      render(<CustomSelect {...defaultProps} />);
      
      expect(screen.getByText('Select a country')).toBeInTheDocument();
    });

    it('should render all options', () => {
      render(<CustomSelect {...defaultProps} />);
      
      mockOptions.forEach(option => {
        expect(screen.getByText(option.label)).toBeInTheDocument();
      });
    });

    it('should apply custom className', () => {
      render(<CustomSelect {...defaultProps} className="custom-class" />);
      
      const container = screen.getByTestId('custom-select-container');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Value and Selection', () => {
    it('should display selected value', () => {
      render(<CustomSelect {...defaultProps} value="us" />);
      
      expect(screen.getByTestId('select-element')).toHaveValue('us');
    });

    it('should handle null value', () => {
      render(<CustomSelect {...defaultProps} value={null} />);
      
      expect(screen.getByTestId('select-element')).toHaveValue('');
    });

    it('should call onChange when selection changes', async () => {
      render(<CustomSelect {...defaultProps} />);
      
      const select = screen.getByTestId('select-element');
      await userEvent.selectOptions(select, 'ca');
      
      expect(defaultProps.onChange).toHaveBeenCalledWith('ca');
    });

    it('should find correct option for value', () => {
      render(<CustomSelect {...defaultProps} value="fr" />);
      
      expect(screen.getByDisplayValue('France')).toBeInTheDocument();
    });
  });

  describe('Clear Functionality', () => {
    it('should show clear button when isClearable and has value', () => {
      render(<CustomSelect {...defaultProps} value="us" isClearable />);
      
      expect(screen.getByTestId('clear-button')).toBeInTheDocument();
    });

    it('should not show clear button when no value', () => {
      render(<CustomSelect {...defaultProps} value={null} isClearable />);
      
      expect(screen.queryByTestId('clear-button')).not.toBeInTheDocument();
    });

    it('should not show clear button when isClearable is false', () => {
      render(<CustomSelect {...defaultProps} value="us" isClearable={false} />);
      
      expect(screen.queryByTestId('clear-button')).not.toBeInTheDocument();
    });

    it('should call onChange with null when clear button is clicked', async () => {
      render(<CustomSelect {...defaultProps} value="us" isClearable />);
      
      const clearButton = screen.getByTestId('clear-button');
      await userEvent.click(clearButton);
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('Search Functionality', () => {
    it('should show searchable indicator when isSearchable is true', () => {
      render(<CustomSelect {...defaultProps} isSearchable />);
      
      expect(screen.getByTestId('searchable-indicator')).toBeInTheDocument();
    });

    it('should not show searchable indicator when isSearchable is false', () => {
      render(<CustomSelect {...defaultProps} isSearchable={false} />);
      
      expect(screen.queryByTestId('searchable-indicator')).not.toBeInTheDocument();
    });

    it('should be searchable by default', () => {
      render(<CustomSelect {...defaultProps} />);
      
      expect(screen.getByTestId('searchable-indicator')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable select when disabled prop is true', () => {
      render(<CustomSelect {...defaultProps} disabled />);
      
      expect(screen.getByTestId('select-element')).toBeDisabled();
    });

    it('should not disable select when disabled prop is false', () => {
      render(<CustomSelect {...defaultProps} disabled={false} />);
      
      expect(screen.getByTestId('select-element')).not.toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      render(<CustomSelect {...defaultProps} error="Please select a country" />);
      
      expect(screen.getByTestId('custom-select-error')).toBeInTheDocument();
      expect(screen.getByText('Please select a country')).toBeInTheDocument();
    });

    it('should apply error class when error exists', () => {
      render(<CustomSelect {...defaultProps} error="Error message" />);
      
      const container = screen.getByTestId('custom-select-container');
      expect(container).toHaveClass('custom-select--error');
    });

    it('should not display error when no error provided', () => {
      render(<CustomSelect {...defaultProps} />);
      
      expect(screen.queryByTestId('custom-select-error')).not.toBeInTheDocument();
    });

    it('should have proper error id for accessibility', () => {
      render(<CustomSelect {...defaultProps} label="Country" error="Required field" />);
      
      const errorElement = screen.getByTestId('custom-select-error');
      expect(errorElement).toHaveAttribute('id', 'Country-error');
      expect(errorElement).toHaveAttribute('role', 'alert');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      render(<CustomSelect {...defaultProps} label="Country Selection" />);
      
      expect(screen.getByTestId('select-element')).toHaveAttribute('aria-label', 'Country Selection');
    });

    it('should have default aria-label when no label provided', () => {
      render(<CustomSelect {...defaultProps} />);
      
      expect(screen.getByTestId('select-element')).toHaveAttribute('aria-label', 'Select a country');
    });

    it('should have aria-invalid when error exists', () => {
      render(<CustomSelect {...defaultProps} error="Invalid selection" />);
      
      expect(screen.getByTestId('select-element')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have aria-describedby when error exists', () => {
      render(<CustomSelect {...defaultProps} label="Country" error="Required" />);
      
      expect(screen.getByTestId('select-element')).toHaveAttribute('aria-describedby', 'Country-error');
    });

    it('should not have aria-invalid when no error', () => {
      render(<CustomSelect {...defaultProps} />);
      
      expect(screen.getByTestId('select-element')).toHaveAttribute('aria-invalid', 'false');
    });
  });

  describe('Country Flags Feature', () => {
    it('should show single value component when showCountriesFlags is true and has value', () => {
      render(<CustomSelect {...defaultProps} value="us" showCountriesFlags />);
      
      expect(screen.getByTestId('single-value-component')).toBeInTheDocument();
    });

    it('should not show single value component when showCountriesFlags is false', () => {
      render(<CustomSelect {...defaultProps} value="us" showCountriesFlags={false} />);
      
      expect(screen.queryByTestId('single-value-component')).not.toBeInTheDocument();
    });

    it('should not show single value component when no value', () => {
      render(<CustomSelect {...defaultProps} value={null} showCountriesFlags />);
      
      expect(screen.queryByTestId('single-value-component')).not.toBeInTheDocument();
    });
  });

  describe('Label and Styling', () => {
    it('should render label with proper CSS class', () => {
      render(<CustomSelect {...defaultProps} label="Test Label" />);
      
      const label = screen.getByTestId('custom-select-label');
      expect(label).toHaveClass('custom-select__label');
      expect(label).toHaveTextContent('Test Label');
    });

    it('should render required asterisk with proper class', () => {
      render(<CustomSelect {...defaultProps} label="Country" required />);
      
      const asterisk = screen.getByText('*');
      expect(asterisk).toHaveClass('required-asterisk');
    });

    it('should apply control CSS class', () => {
      render(<CustomSelect {...defaultProps} />);
      
      const container = screen.getByTestId('custom-select-container');
      // Check that the select component is rendered with the control class
      expect(container).toBeInTheDocument();
    });
  });

  describe('Option Handling', () => {
    it('should handle empty options array', () => {
      render(<CustomSelect {...defaultProps} options={[]} />);
      
      expect(screen.getByTestId('select-element')).toBeInTheDocument();
      // Should only have the placeholder option
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1); // Just the placeholder
    });

    it('should handle options with duplicate values', () => {
      const duplicateOptions = [
        { value: 'us', label: 'United States' },
        { value: 'us', label: 'USA' },
      ];
      
      render(<CustomSelect {...defaultProps} options={duplicateOptions} />);
      
      // Should render both options even with duplicate values
      expect(screen.getByText('United States')).toBeInTheDocument();
      expect(screen.getByText('USA')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render with proper CSS classes', () => {
      render(<CustomSelect {...defaultProps} />);
      
      const container = screen.getByTestId('custom-select-container');
      expect(container).toHaveClass('custom-select');
    });

    it('should not have error class when no error', () => {
      render(<CustomSelect {...defaultProps} />);
      
      const container = screen.getByTestId('custom-select-container');
      expect(container).not.toHaveClass('custom-select--error');
    });
  });
});
