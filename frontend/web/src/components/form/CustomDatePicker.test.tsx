/**
 * CustomDatePicker Component Tests
 * 
 * This test suite covers:
 * - Component rendering with different picker types (date, time, datetime)
 * - Date value handling and formatting
 * - Min/Max date constraints
 * - Localization and language support
 * - Dropdown configurations
 * - Error handling and validation display
 * - Accessibility features
 * - Disabled state handling
 * 
 * The tests mock:
 * - react-i18next for translations
 * - react-datepicker for the date picker component
 * - date-fns for date formatting and locales
 * 
 * Run with: yarn test --testPathPattern=CustomDatePicker.test.tsx --watchAll=false
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomDatePicker from './CustomDatePicker';
import { parseISO } from 'date-fns';

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date) => date.toISOString()),
  parseISO: jest.fn((str) => new Date(str)),
}));

const mockParseISO = parseISO as jest.MockedFunction<typeof parseISO>;
// Mock react-i18next
const mockUseTranslation = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation(),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date) => date.toISOString()),
  parseISO: jest.fn((str) => new Date(str)),
}));

// Mock date-fns locales
jest.mock('date-fns/locale/en-US', () => ({ enUS: {} }));
jest.mock('date-fns/locale/fr', () => ({ fr: {} }));
jest.mock('date-fns/locale/ar', () => ({ ar: {} }));

// Mock react-datepicker
jest.mock('react-datepicker', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ 
      selected, 
      onChange, 
      placeholderText, 
      disabled, 
      dateFormat,
      showTimeSelect,
      showTimeSelectOnly,
      minDate,
      maxDate,
      locale,
      ...props 
    }: any) => (
      <div data-testid="date-picker-wrapper">
        <input
          data-testid="date-picker-input"
          type={showTimeSelectOnly ? 'time' : showTimeSelect ? 'datetime-local' : 'date'}
          value={selected ? selected.toISOString().split('T')[0] : ''}
          onChange={(e) => {
            if (e.target.value) {
              onChange(new Date(e.target.value));
            } else {
              onChange(null);
            }
          }}
          placeholder={placeholderText}
          disabled={disabled}
          min={minDate ? minDate.toISOString().split('T')[0] : undefined}
          max={maxDate ? maxDate.toISOString().split('T')[0] : undefined}
          aria-label={props['aria-label']}
          aria-invalid={props['aria-invalid']}
          aria-describedby={props['aria-describedby']}
        />
        <span data-testid="date-format">{dateFormat}</span>
        <span data-testid="locale">{locale}</span>
        {showTimeSelect && <span data-testid="time-select">Has Time</span>}
        {showTimeSelectOnly && <span data-testid="time-only">Time Only</span>}
      </div>
    ),
    registerLocale: jest.fn(),
  };
});

describe('CustomDatePicker', () => {
  const defaultProps = {
    value: null,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockParseISO.mockImplementation((str: string) => new Date(str));
    
    // Set up default translation mock
    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: { [key: string]: string } = {
          'profile:placeholders.date_placeholder': 'Select date',
        };
        return translations[key] || key;
      },
      i18n: {
        language: 'en',
      },
    });
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      expect(screen.getByTestId('date-picker-input')).toBeInTheDocument();
      expect(screen.getByTestId('date-picker-wrapper')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<CustomDatePicker {...defaultProps} label="Birth Date" />);
      
      expect(screen.getByText('Birth Date')).toBeInTheDocument();
    });

    it('should render with required asterisk when required', () => {
      render(<CustomDatePicker {...defaultProps} label="Date" required />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<CustomDatePicker {...defaultProps} placeholder="Choose date" />);
      
      expect(screen.getByTestId('date-picker-input')).toHaveAttribute('placeholder', 'Choose date');
    });

    it('should render with default placeholder', () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      expect(screen.getByTestId('date-picker-input')).toHaveAttribute('placeholder', 'Select date');
    });

    it('should apply custom className', () => {
      render(<CustomDatePicker {...defaultProps} className="custom-class" />);
      
      const container = screen.getByTestId('custom-datepicker-container');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Date Types', () => {
    it('should render date picker by default', () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      expect(screen.getByTestId('date-picker-input')).toHaveAttribute('type', 'date');
      expect(screen.getByTestId('date-format')).toHaveTextContent('yyyy-MM-dd');
      expect(screen.queryByTestId('time-select')).not.toBeInTheDocument();
      expect(screen.queryByTestId('time-only')).not.toBeInTheDocument();
    });

    it('should render time picker when type is time', () => {
      render(<CustomDatePicker {...defaultProps} type="time" />);
      
      expect(screen.getByTestId('date-picker-input')).toHaveAttribute('type', 'time');
      expect(screen.getByTestId('date-format')).toHaveTextContent('HH:mm');
      expect(screen.getByTestId('time-only')).toBeInTheDocument();
      expect(screen.queryByTestId('time-select')).not.toBeInTheDocument();
    });

    it('should render datetime picker when type is datetime', () => {
      render(<CustomDatePicker {...defaultProps} type="datetime" />);
      
      expect(screen.getByTestId('date-picker-input')).toHaveAttribute('type', 'datetime-local');
      expect(screen.getByTestId('date-format')).toHaveTextContent('yyyy-MM-dd HH:mm');
      expect(screen.getByTestId('time-select')).toBeInTheDocument();
      expect(screen.queryByTestId('time-only')).not.toBeInTheDocument();
    });
  });

  describe('Value Handling', () => {
    it('should display Date value', () => {
      const testDate = new Date('2023-12-25');
      render(<CustomDatePicker {...defaultProps} value={testDate} />);
      
      expect(screen.getByTestId('date-picker-input')).toHaveValue('2023-12-25');
    });

    it('should display string value by parsing ISO string', () => {
      const testDate = "2023-12-25T10:30:00Z";
      render(<CustomDatePicker {...defaultProps} value={testDate} />);
      
      const input = screen.getByTestId('date-picker-input');
      
      // Verify parseISO was called
      expect(mockParseISO).toHaveBeenCalledWith(testDate);
      
      // The mock should convert the ISO string to Date, then format as YYYY-MM-DD
      expect(input).toHaveValue('2023-12-25');
    });

    it('should handle null value', () => {
      render(<CustomDatePicker {...defaultProps} value={null} />);
      
      expect(screen.getByTestId('date-picker-input')).toHaveValue('');
    });

    it('should handle empty string value', () => {
      render(<CustomDatePicker {...defaultProps} value="" />);
      
      expect(screen.getByTestId('date-picker-input')).toHaveValue('');
    });

    it('should call onChange when value changes', async () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      const input = screen.getByTestId('date-picker-input');
      await userEvent.clear(input);
      await userEvent.type(input, '2023-12-25');
      
      expect(defaultProps.onChange).toHaveBeenCalled();
    });

    it('should call onChange with null when clearing value', async () => {
      render(<CustomDatePicker {...defaultProps} value={new Date('2023-12-25')} />);
      
      const input = screen.getByTestId('date-picker-input');
      await userEvent.clear(input);
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('Date Constraints', () => {
    it('should set min date when provided', () => {
      const minDate = new Date('2023-01-01');
      render(<CustomDatePicker {...defaultProps} minDate={minDate} />);
      
      expect(screen.getByTestId('date-picker-input')).toHaveAttribute('min', '2023-01-01');
    });

    it('should set max date when provided', () => {
      const maxDate = new Date('2023-12-31');
      render(<CustomDatePicker {...defaultProps} maxDate={maxDate} />);
      
      expect(screen.getByTestId('date-picker-input')).toHaveAttribute('max', '2023-12-31');
    });

    it('should set default max date to current date', () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      const input = screen.getByTestId('date-picker-input');
      const maxAttr = input.getAttribute('max');
      expect(maxAttr).toBeTruthy();
      expect(new Date(maxAttr!)).toBeInstanceOf(Date);
    });

    it('should handle both min and max dates', () => {
      const minDate = new Date('2023-01-01');
      const maxDate = new Date('2023-12-31');
      render(<CustomDatePicker {...defaultProps} minDate={minDate} maxDate={maxDate} />);
      
      const input = screen.getByTestId('date-picker-input');
      expect(input).toHaveAttribute('min', '2023-01-01');
      expect(input).toHaveAttribute('max', '2023-12-31');
    });
  });

  describe('Localization', () => {
    it('should use English locale by default', () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      expect(screen.getByTestId('locale')).toHaveTextContent('en');
    });

    it('should use French locale when language is fr', () => {
      // Mock French language
      mockUseTranslation.mockReturnValue({
        t: (key: string) => key,
        i18n: { language: 'fr' },
      });

      render(<CustomDatePicker {...defaultProps} />);
      expect(screen.getByTestId('locale')).toHaveTextContent('fr');
    });

    it('should use Arabic locale when language is ar', () => {
      // Mock Arabic language  
      mockUseTranslation.mockReturnValue({
        t: (key: string) => key,
        i18n: { language: 'ar' },
      });

      render(<CustomDatePicker {...defaultProps} />);
      expect(screen.getByTestId('locale')).toHaveTextContent('ar');
    });
  });

  describe('Disabled State', () => {
    it('should disable input when disabled prop is true', () => {
      render(<CustomDatePicker {...defaultProps} disabled />);
      
      expect(screen.getByTestId('date-picker-input')).toBeDisabled();
    });

    it('should not disable input when disabled prop is false', () => {
      render(<CustomDatePicker {...defaultProps} disabled={false} />);
      
      expect(screen.getByTestId('date-picker-input')).not.toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      render(<CustomDatePicker {...defaultProps} error="Invalid date" />);
      
      expect(screen.getByText('Invalid date')).toBeInTheDocument();
    });

    it('should apply error class when error exists', () => {
      render(<CustomDatePicker {...defaultProps} error="Error message" />);
      
      const container = screen.getByTestId('custom-datepicker-container');
      expect(container).toHaveClass('custom-datepicker--error');
    });

    it('should not display error when no error provided', () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should have proper error id for accessibility', () => {
      render(<CustomDatePicker {...defaultProps} label="Date" error="Required field" />);
      
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('id', 'Date-error');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      render(<CustomDatePicker {...defaultProps} label="Birth Date" />);
      
      expect(screen.getByTestId('date-picker-input')).toHaveAttribute('aria-label', 'Birth Date');
    });

    it('should have default aria-label when no label provided', () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      expect(screen.getByTestId('date-picker-input')).toHaveAttribute('aria-label', 'Select date');
    });

    it('should have aria-invalid when error exists', () => {
      render(<CustomDatePicker {...defaultProps} error="Invalid date" />);
      
      expect(screen.getByTestId('date-picker-input')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have aria-describedby when error exists', () => {
      render(<CustomDatePicker {...defaultProps} label="Date" error="Required" />);
      
      expect(screen.getByTestId('date-picker-input')).toHaveAttribute('aria-describedby', 'Date-error');
    });
  });

  describe('Component Structure', () => {
    it('should render with proper CSS classes', () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      const container = screen.getByTestId('custom-datepicker-container');
      expect(container).toHaveClass('custom-datepicker');
    });

    it('should render label with proper CSS class', () => {
      render(<CustomDatePicker {...defaultProps} label="Test Label" />);
      
      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('custom-datepicker__label');
    });

    it('should render required asterisk with proper class', () => {
      render(<CustomDatePicker {...defaultProps} label="Date" required />);
      
      const asterisk = screen.getByText('*');
      expect(asterisk).toHaveClass('required-asterisk');
    });

    it('should not have error class when no error', () => {
      render(<CustomDatePicker {...defaultProps} />);
      
      const container = screen.getByTestId('custom-datepicker-container');
      expect(container).not.toHaveClass('custom-datepicker--error');
    });
  });

  describe('Dropdown Configuration', () => {
    it('should handle showYearDropdown prop', () => {
      render(<CustomDatePicker {...defaultProps} showYearDropdown />);
      
      // Component should render without errors
      expect(screen.getByTestId('date-picker-input')).toBeInTheDocument();
    });

    it('should handle showMonthDropdown prop', () => {
      render(<CustomDatePicker {...defaultProps} showMonthDropdown />);
      
      // Component should render without errors
      expect(screen.getByTestId('date-picker-input')).toBeInTheDocument();
    });

    it('should handle dropdownMode prop', () => {
      render(<CustomDatePicker {...defaultProps} dropdownMode="scroll" />);
      
      // Component should render without errors
      expect(screen.getByTestId('date-picker-input')).toBeInTheDocument();
    });

    it('should handle yearDropdownItemNumber prop', () => {
      render(<CustomDatePicker {...defaultProps} yearDropdownItemNumber={100} />);
      
      // Component should render without errors
      expect(screen.getByTestId('date-picker-input')).toBeInTheDocument();
    });
  });
});
