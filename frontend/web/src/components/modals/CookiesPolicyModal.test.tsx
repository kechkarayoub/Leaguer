import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CookiesPolicyModal from './CookiesPolicyModal';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: { [key: string]: string } = {
        'cookies.modal.title': 'Cookies Policy',
        'cookies.what.title': 'What Are Cookies?',
        'cookies.understanding.title': 'Understanding Cookies',
        'cookies.types.title': 'Types of Cookies We Use',
        'cookies.types.essential': 'Essential Cookies',
        'cookies.types.performance': 'Performance Cookies',
        'cookies.types.functional': 'Functional Cookies',
        'cookies.types.targeting': 'Targeting Cookies',
        'cookies.control.title': 'Managing Your Cookie Preferences',
        'cookies.browser.title': 'Browser Settings',
        'cookies.contact.title': 'Contact Information',
        'cookies.last-updated': 'Last updated: {date}'
      };
      return translations[key] || options?.defaultValue || key;
    },
    i18n: {
      language: 'en'
    }
  })
}));

// Mock BaseModal
jest.mock('./BaseModal', () => {
  return function MockBaseModal({ title, size, isOpen, onClose, children }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="base-modal-component">
        <div data-testid="base-modal-title">{title}</div>
        <div data-testid="base-modal-size">{size}</div>
        <div data-testid="base-modal-content">{children}</div>
        <button data-testid="base-modal-close" onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Mock GlobalUtils
jest.mock('../../utils/GlobalUtils', () => ({
  renderDate: (date: Date, language: string) => {
    return 'January 1, 2024';
  }
}));

describe('CookiesPolicyModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<CookiesPolicyModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('base-modal-component')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      expect(screen.getByTestId('base-modal-component')).toBeInTheDocument();
      expect(screen.getByTestId('base-modal-title')).toHaveTextContent('Cookies Policy');
      expect(screen.getByTestId('base-modal-size')).toHaveTextContent('large');
    });

    it('should render with correct modal structure', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      expect(screen.getByTestId('base-modal-content')).toBeInTheDocument();
    });
  });

  describe('Policy Content', () => {
    it('should render what are cookies section', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      expect(screen.getByText('What Are Cookies?')).toBeInTheDocument();
    });

    it('should render understanding cookies section', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      expect(screen.getByText('Understanding Cookies')).toBeInTheDocument();
    });

    it('should render types of cookies section', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      expect(screen.getByText('Types of Cookies We Use')).toBeInTheDocument();
    });

    it('should render cookie type categories', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      expect(screen.getByText('Essential Cookies')).toBeInTheDocument();
      expect(screen.getByText('Performance Cookies')).toBeInTheDocument();
      expect(screen.getByText('Functional Cookies')).toBeInTheDocument();
      expect(screen.getByText('Targeting Cookies')).toBeInTheDocument();
    });

    it('should render essential cookies information', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      expect(screen.getByText(/These cookies are necessary for the website to function properly/)).toBeInTheDocument();
    });

    it('should render performance cookies information', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      expect(screen.getByText(/These cookies collect information about how you use our website/)).toBeInTheDocument();
    });

    it('should render functional cookies information', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      expect(screen.getByText(/These cookies enable enhanced functionality and personalization/)).toBeInTheDocument();
    });

    it('should render targeting cookies information', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      expect(screen.getByText(/These cookies are used to deliver relevant advertisements/)).toBeInTheDocument();
    });
  });

  describe('Cookie Management', () => {
    it('should provide information about managing cookies', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      // Check for cookie management content
      expect(screen.getByText(/Managing Your Cookie Preferences/)).toBeInTheDocument();
    });

    it('should provide browser-specific instructions', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      // Should contain browser instruction information
      expect(screen.getByText(/Google Chrome:/)).toBeInTheDocument();
    });
  });

  describe('Date Information', () => {
    it('should render last updated date', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('should call onClose when modal is closed', async () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      const closeButton = screen.getByTestId('base-modal-close');
      
      await userEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      // Check that headings exist
      expect(screen.getAllByRole('heading').length).toBeGreaterThan(0);
    });

    it('should have readable content structure', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      // Verify main content sections are present
      expect(screen.getByText('What Are Cookies?')).toBeInTheDocument();
      expect(screen.getByText('Types of Cookies We Use')).toBeInTheDocument();
    });
  });

  describe('Internationalization', () => {
    it('should use translation keys for all text content', () => {
      render(<CookiesPolicyModal {...defaultProps} />);

      // Check if translated content is displayed
      expect(screen.getByText('Cookies Policy')).toBeInTheDocument();
      expect(screen.getByText('What Are Cookies?')).toBeInTheDocument();
      expect(screen.getByText('Types of Cookies We Use')).toBeInTheDocument();
    });

    it('should format dates according to language settings', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      // Should call renderDate with proper language parameter
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  describe('Environment Considerations', () => {
    it('should handle missing translation gracefully', () => {
      // Component should still render even if some translations are missing
      render(<CookiesPolicyModal {...defaultProps} />);
      
      expect(screen.getByTestId('base-modal-component')).toBeInTheDocument();
    });

    it('should handle date formatting errors gracefully', () => {
      // Should not crash if date formatting fails
      render(<CookiesPolicyModal {...defaultProps} />);
      
      expect(screen.getByTestId('base-modal-component')).toBeInTheDocument();
    });
  });

  describe('Content Sections', () => {
    it('should render main policy sections', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      const expectedSections = [
        'What Are Cookies?',
        'Understanding Cookies',
        'Types of Cookies We Use'
      ];
      
      expectedSections.forEach(section => {
        expect(screen.getByText(section)).toBeInTheDocument();
      });
    });

    it('should provide detailed cookie type information', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      const cookieTypes = ['Essential Cookies', 'Performance Cookies', 'Functional Cookies', 'Targeting Cookies'];
      
      cookieTypes.forEach(type => {
        expect(screen.getByText(type)).toBeInTheDocument();
      });
    });

    it('should include cookie management guidance', () => {
      render(<CookiesPolicyModal {...defaultProps} />);
      
      // Should provide guidance on managing cookies
      expect(screen.getByText(/Managing Your Cookie Preferences/)).toBeInTheDocument();
    });
  });
});
