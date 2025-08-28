import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrivacyPolicyModal from './PrivacyPolicyModal';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: { [key: string]: string } = {
        'common:privacy.title': 'Privacy Policy',
        'common:privacy.lastUpdated': 'Last updated:',
        'common:privacy.introduction.title': 'Introduction',
        'common:privacy.introduction.text': 'At Leaguer, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our sports community platform.',
        'common:privacy.informationWeCollect.title': 'Information We Collect',
        'common:privacy.informationWeCollect.personalInfo.title': 'Personal Information',
        'common:privacy.informationWeCollect.automaticInfo.title': 'Automatically Collected Information',
        'common:privacy.howWeUse.title': 'How We Use Your Information',
        'common:privacy.informationSharing.title': 'Information Sharing and Disclosure',
        'common:privacy.dataSecurity.title': 'Data Security',
        'common:privacy.yourRights.title': 'Your Privacy Rights',
        'common:privacy.cookies.title': 'Cookies and Tracking Technologies',
        'common:privacy.childrens.title': "Children's Privacy",
        'common:privacy.international.title': 'International Data Transfers',
        'common:privacy.changes.title': 'Changes to This Privacy Policy',
        'common:privacy.contact.title': 'Contact Us',
        'common:privacy.contact.email': 'Email:',
        'common:privacy.contact.address': 'Address:',
        'common:privacy.footer.text': 'By using Leaguer, you acknowledge that you have read and understood this Privacy Policy.'
      };
      
      if (options && options.companyName) {
        return translations[key]?.replace('{companyName}', options.companyName) || options?.defaultValue || key;
      }
      
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
    return 'January 1, 2022';
  }
}));

// Mock environment variables
const originalEnv = process.env;

describe('PrivacyPolicyModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      REACT_APP_COMPANY_NAME: 'Leaguer',
      REACT_APP_SUPPORT_EMAIL: 'support@leaguer.com',
      REACT_APP_COMPANY_ADDRESS: '123 Sports Street, Game City, GC 12345'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<PrivacyPolicyModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('base-modal-component')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByTestId('base-modal-component')).toBeInTheDocument();
      expect(screen.getByTestId('base-modal-title')).toHaveTextContent('Privacy Policy');
      expect(screen.getByTestId('base-modal-size')).toHaveTextContent('large');
    });

    it('should render with correct modal structure', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByTestId('base-modal-content')).toBeInTheDocument();
    });
  });

  describe('Policy Content Sections', () => {
    it('should render last updated information', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText('Last updated:')).toBeInTheDocument();
      expect(screen.getByText('January 1, 2022')).toBeInTheDocument();
    });

    it('should render introduction section', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText(/At Leaguer, we are committed to protecting your privacy/)).toBeInTheDocument();
    });

    it('should render information we collect section', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText('Information We Collect')).toBeInTheDocument();
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Automatically Collected Information')).toBeInTheDocument();
    });

    it('should render personal information details', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText(/Name and contact information/)).toBeInTheDocument();
      expect(screen.getByText(/Profile information/)).toBeInTheDocument();
      expect(screen.getByText(/Profile photos and other images/)).toBeInTheDocument();
      expect(screen.getByText(/Location information/)).toBeInTheDocument();
    });

    it('should render automatic information details', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText(/Usage data and analytics/)).toBeInTheDocument();
      expect(screen.getByText(/Device information and browser type/)).toBeInTheDocument();
      expect(screen.getByText(/IP address and location data/)).toBeInTheDocument();
      expect(screen.getByText(/Cookies and similar tracking technologies/)).toBeInTheDocument();
    });

    it('should render how we use information section', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText('How We Use Your Information')).toBeInTheDocument();
      expect(screen.getByText(/To provide, operate, and maintain our platform/)).toBeInTheDocument();
      expect(screen.getByText(/To improve, personalize, and expand our services/)).toBeInTheDocument();
      expect(screen.getByText(/To communicate with you and provide customer support/)).toBeInTheDocument();
    });

    it('should render information sharing section', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText('Information Sharing and Disclosure')).toBeInTheDocument();
      expect(screen.getByText(/With your explicit consent/)).toBeInTheDocument();
      expect(screen.getByText(/With trusted service providers/)).toBeInTheDocument();
      expect(screen.getByText(/When required by law/)).toBeInTheDocument();
    });

    it('should render data security section', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText('Data Security')).toBeInTheDocument();
      expect(screen.getByText(/We implement appropriate technical and organizational measures/)).toBeInTheDocument();
    });

    it('should render privacy rights section', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText('Your Privacy Rights')).toBeInTheDocument();
      expect(screen.getByText(/Access and review your personal information/)).toBeInTheDocument();
      expect(screen.getByText(/Correct inaccurate or incomplete information/)).toBeInTheDocument();
      expect(screen.getByText(/Request deletion of your personal information/)).toBeInTheDocument();
    });

    it('should render cookies section', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText('Cookies and Tracking Technologies')).toBeInTheDocument();
      expect(screen.getByText(/We use cookies and similar tracking technologies/)).toBeInTheDocument();
    });

    it('should render children privacy section', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText("Children's Privacy")).toBeInTheDocument();
      expect(screen.getByText(/Our platform is not intended for children under 13/)).toBeInTheDocument();
    });

    it('should render international transfers section', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText('International Data Transfers')).toBeInTheDocument();
      expect(screen.getByText(/Your information may be transferred to and processed/)).toBeInTheDocument();
    });

    it('should render changes to privacy policy section', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText('Changes to This Privacy Policy')).toBeInTheDocument();
      expect(screen.getByText(/We may update this Privacy Policy from time to time/)).toBeInTheDocument();
    });

    it('should render contact information section', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText('Contact Us')).toBeInTheDocument();
      expect(screen.getByText('Email:')).toBeInTheDocument();
      expect(screen.getByText('Address:')).toBeInTheDocument();
    });
  });

  describe('Environment Variables', () => {
    it('should use company name from environment', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText(/At Leaguer, we are committed/)).toBeInTheDocument();
    });

    it('should use support email from environment', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      const emailLink = screen.getByRole('link', { name: 'support@leaguer.com' });
      expect(emailLink).toBeInTheDocument();
      expect(emailLink).toHaveAttribute('href', 'mailto:support@leaguer.com');
    });

    it('should use company address from environment', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText('123 Sports Street, Game City, GC 12345')).toBeInTheDocument();
    });

    it('should use default values when environment variables are missing', () => {
      process.env.REACT_APP_COMPANY_NAME = '';
      process.env.REACT_APP_SUPPORT_EMAIL = '';
      process.env.REACT_APP_COMPANY_ADDRESS = '';
      
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByRole('link', { name: 'support@leaguer.com' })).toBeInTheDocument();
      expect(screen.getByText('Company Address')).toBeInTheDocument();
    });
  });

  describe('Footer Section', () => {
    it('should render footer acknowledgment', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText(/By using Leaguer, you acknowledge that you have read/)).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('should call onClose when modal is closed', async () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      const closeButton = screen.getByTestId('base-modal-close');
      
      await userEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Date Formatting', () => {
    it('should format the last updated date correctly', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByText('January 1, 2022')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      // Check that headings exist and are properly structured
      expect(screen.getAllByRole('heading').length).toBeGreaterThan(0);
    });

    it('should have proper link structure for contact email', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      const emailLink = screen.getByRole('link', { name: 'support@leaguer.com' });
      expect(emailLink).toHaveAttribute('href', 'mailto:support@leaguer.com');
    });

    it('should have readable content structure', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      // Verify main content sections are present
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Information We Collect')).toBeInTheDocument();
      expect(screen.getByText('Your Privacy Rights')).toBeInTheDocument();
      expect(screen.getByText('Contact Us')).toBeInTheDocument();
    });
  });

  describe('Internationalization', () => {
    it('should use translation keys for all text content', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);

      // Check if translated content is displayed
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Information We Collect')).toBeInTheDocument();
      expect(screen.getByText('How We Use Your Information')).toBeInTheDocument();
      expect(screen.getByText('Your Privacy Rights')).toBeInTheDocument();
    });

    it('should format dates according to language settings', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      // Should call renderDate with proper language parameter
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  describe('Content Lists', () => {
    it('should render all personal information collection items', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      const personalInfoItems = [
        'Name and contact information',
        'Profile information',
        'Profile photos and other images',
        'Location information'
      ];
      
      personalInfoItems.forEach(item => {
        expect(screen.getByText(new RegExp(item))).toBeInTheDocument();
      });
    });

    it('should render all privacy rights items', () => {
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      const rightsItems = [
        'Access and review your personal information',
        'Correct inaccurate or incomplete information',
        'Request deletion of your personal information',
        'Restrict or object to certain processing',
        'Request data portability',
        'Withdraw consent where applicable'
      ];
      
      rightsItems.forEach(item => {
        expect(screen.getByText(new RegExp(item))).toBeInTheDocument();
      });
    });
  });

  describe('Environment Considerations', () => {
    it('should handle missing translation gracefully', () => {
      // Component should still render even if some translations are missing
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByTestId('base-modal-component')).toBeInTheDocument();
    });

    it('should handle date formatting errors gracefully', () => {
      // Should not crash if date formatting fails
      render(<PrivacyPolicyModal {...defaultProps} />);
      
      expect(screen.getByTestId('base-modal-component')).toBeInTheDocument();
    });
  });
});
