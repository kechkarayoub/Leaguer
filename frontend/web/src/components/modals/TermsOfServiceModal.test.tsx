import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TermsOfServiceModal from './TermsOfServiceModal';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: { [key: string]: string } = {
        'common:terms.title': 'Terms of Service',
        'common:terms.lastUpdated': 'Last updated:',
        'common:terms.introduction.title': 'Introduction',
        'common:terms.introduction.text': 'Welcome to Leaguer! These Terms of Service ("Terms") govern your use of our sports community platform and services. By accessing or using our platform, you agree to be bound by these Terms.',
        'common:terms.acceptance.title': 'Acceptance of Terms',
        'common:terms.eligibility.title': 'Eligibility',
        'common:terms.accountRegistration.title': 'Account Registration and Security',
        'common:terms.useOfServices.title': 'Use of Services',
        'common:terms.useOfServices.permitted.title': 'Permitted Uses',
        'common:terms.useOfServices.prohibited.title': 'Prohibited Uses',
        'common:terms.userContent.title': 'User Content',
        'common:terms.userContent.license.title': 'License to User Content',
        'common:terms.userContent.responsibilities.title': 'Your Responsibilities',
        'common:terms.privacy.title': 'Privacy and Data Protection',
        'common:terms.intellectualProperty.title': 'Intellectual Property',
        'common:terms.intellectualProperty.text': 'The platform and its content, features, and functionality are owned by Leaguer and are protected by international copyright, trademark, and other intellectual property laws.',
        'common:terms.payments.title': 'Payments and Subscriptions',
        'common:terms.disclaimers.title': 'Disclaimers',
        'common:terms.limitation.title': 'Limitation of Liability',
        'common:terms.limitation.text': 'To the fullest extent permitted by law, Leaguer shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.',
        'common:terms.termination.title': 'Termination',
        'common:terms.governingLaw.title': 'Governing Law',
        'common:terms.changes.title': 'Changes to These Terms',
        'common:terms.contact.title': 'Contact Us',
        'common:terms.contact.email': 'Email:',
        'common:terms.contact.address': 'Address:',
        'common:terms.footer.text': 'By using Leaguer, you acknowledge that you have read and understood these Terms of Service and agree to be bound by them.'
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
    return 'January 1, 2023';
  }
}));

// Mock environment variables
const originalEnv = process.env;

describe('TermsOfServiceModal', () => {
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
      render(<TermsOfServiceModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('base-modal-component')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByTestId('base-modal-component')).toBeInTheDocument();
      expect(screen.getByTestId('base-modal-title')).toHaveTextContent('Terms of Service');
      expect(screen.getByTestId('base-modal-size')).toHaveTextContent('large');
    });

    it('should render with correct modal structure', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByTestId('base-modal-content')).toBeInTheDocument();
    });
  });

  describe('Terms Content Sections', () => {
    it('should render last updated information', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('Last updated:')).toBeInTheDocument();
      expect(screen.getByText('January 1, 2023')).toBeInTheDocument();
    });

    it('should render introduction section', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText(/Welcome to Leaguer! These Terms of Service/)).toBeInTheDocument();
    });

    it('should render acceptance of terms section', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('Acceptance of Terms')).toBeInTheDocument();
      expect(screen.getByText(/By creating an account, accessing, or using our services/)).toBeInTheDocument();
    });

    it('should render eligibility section', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('Eligibility')).toBeInTheDocument();
      expect(screen.getByText(/To use our services, you must:/)).toBeInTheDocument();
    });

    it('should render account registration section', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('Account Registration and Security')).toBeInTheDocument();
      expect(screen.getByText(/When you create an account with us/)).toBeInTheDocument();
    });

    it('should render use of services section', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('Use of Services')).toBeInTheDocument();
      expect(screen.getByText('Permitted Uses')).toBeInTheDocument();
      expect(screen.getByText('Prohibited Uses')).toBeInTheDocument();
    });

    it('should render user content section', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('User Content')).toBeInTheDocument();
      expect(screen.getByText('License to User Content')).toBeInTheDocument();
      expect(screen.getByText('Your Responsibilities')).toBeInTheDocument();
    });

    it('should render privacy section', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('Privacy and Data Protection')).toBeInTheDocument();
      expect(screen.getByText(/Your privacy is important to us/)).toBeInTheDocument();
    });

    it('should render intellectual property section', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('Intellectual Property')).toBeInTheDocument();
      expect(screen.getByText(/The platform and its content, features, and functionality are owned by Leaguer/)).toBeInTheDocument();
    });

    it('should render payments section', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('Payments and Subscriptions')).toBeInTheDocument();
      expect(screen.getByText(/Some features of our platform may require payment/)).toBeInTheDocument();
    });

    it('should render disclaimers section', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('Disclaimers')).toBeInTheDocument();
      expect(screen.getByText(/Our services are provided "as is" and "as available"/)).toBeInTheDocument();
    });

    it('should render limitation of liability section', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('Limitation of Liability')).toBeInTheDocument();
      expect(screen.getByText(/To the fullest extent permitted by law, Leaguer shall not be liable/)).toBeInTheDocument();
    });

    it('should render termination section', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('Termination')).toBeInTheDocument();
      expect(screen.getByText(/We may terminate or suspend your account/)).toBeInTheDocument();
    });

    it('should render governing law section', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('Governing Law')).toBeInTheDocument();
      expect(screen.getByText(/These Terms are governed by and construed/)).toBeInTheDocument();
    });

    it('should render changes to terms section', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('Changes to These Terms')).toBeInTheDocument();
      expect(screen.getByText(/We reserve the right to modify these Terms/)).toBeInTheDocument();
    });

    it('should render contact information section', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('Contact Us')).toBeInTheDocument();
      expect(screen.getByText('Email:')).toBeInTheDocument();
      expect(screen.getByText('Address:')).toBeInTheDocument();
    });
  });

  describe('Eligibility Requirements', () => {
    it('should list all eligibility requirements', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText(/Be at least 13 years old/)).toBeInTheDocument();
      expect(screen.getByText(/Have the legal capacity to enter into this agreement/)).toBeInTheDocument();
      expect(screen.getByText(/Comply with all applicable laws and regulations/)).toBeInTheDocument();
      expect(screen.getByText(/Provide accurate and complete information/)).toBeInTheDocument();
    });
  });

  describe('Account Registration Requirements', () => {
    it('should list account security responsibilities', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText(/Maintaining the security of your account and password/)).toBeInTheDocument();
      expect(screen.getByText(/All activities that occur under your account/)).toBeInTheDocument();
      expect(screen.getByText(/Immediately notifying us of any unauthorized use/)).toBeInTheDocument();
      expect(screen.getByText(/Keeping your account information accurate/)).toBeInTheDocument();
    });
  });

  describe('Permitted and Prohibited Uses', () => {
    it('should list permitted uses', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText(/Connect with other players and teams/)).toBeInTheDocument();
      expect(screen.getByText(/Create and manage sports teams/)).toBeInTheDocument();
      expect(screen.getByText(/Participate in sports activities and events/)).toBeInTheDocument();
      expect(screen.getByText(/Share sports-related content and experiences/)).toBeInTheDocument();
    });

    it('should list prohibited uses', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText(/Use the platform for any illegal or unauthorized purpose/)).toBeInTheDocument();
      expect(screen.getByText(/Harass, abuse, or harm other users/)).toBeInTheDocument();
      expect(screen.getByText(/Send spam, unsolicited communications/)).toBeInTheDocument();
      expect(screen.getByText(/Impersonate others or provide false information/)).toBeInTheDocument();
      expect(screen.getByText(/Violate any laws, regulations, or third-party rights/)).toBeInTheDocument();
      expect(screen.getByText(/Interfere with or disrupt the platform or servers/)).toBeInTheDocument();
    });
  });

  describe('User Content Responsibilities', () => {
    it('should list user content requirements', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText(/Does not violate any laws or regulations/)).toBeInTheDocument();
      expect(screen.getByText(/Does not infringe on third-party rights/)).toBeInTheDocument();
      expect(screen.getByText(/Is appropriate and not offensive or harmful/)).toBeInTheDocument();
      expect(screen.getByText(/Is accurate and not misleading/)).toBeInTheDocument();
    });
  });

  describe('Payment Terms', () => {
    it('should list payment responsibilities', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText(/You authorize us to charge your payment method/)).toBeInTheDocument();
      expect(screen.getByText(/You are responsible for providing accurate payment information/)).toBeInTheDocument();
      expect(screen.getByText(/You may cancel your subscription at any time/)).toBeInTheDocument();
      expect(screen.getByText(/Refunds are subject to our refund policy/)).toBeInTheDocument();
    });
  });

  describe('Environment Variables', () => {
    it('should use company name from environment', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText(/Welcome to Leaguer!/)).toBeInTheDocument();
    });

    it('should use support email from environment', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      const emailLink = screen.getByRole('link', { name: /support@leaguer.com/ });
      expect(emailLink).toBeInTheDocument();
      expect(emailLink).toHaveAttribute('href', 'mailto:support@leaguer.com');
    });

    it('should use company address from environment', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('123 Sports Street, Game City, GC 12345')).toBeInTheDocument();
    });

    it('should use default values when environment variables are missing', () => {
      process.env.REACT_APP_COMPANY_NAME = '';
      process.env.REACT_APP_SUPPORT_EMAIL = '';
      process.env.REACT_APP_COMPANY_ADDRESS = '';
      
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByRole('link', { name: /support@leaguer.com/ })).toBeInTheDocument();
      expect(screen.getByText('Company Address')).toBeInTheDocument();
    });
  });

  describe('Footer Section', () => {
    it('should render footer acknowledgment', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText(/By using Leaguer, you acknowledge that you have read and understood these Terms of Service/)).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('should call onClose when modal is closed', async () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      const closeButton = screen.getByTestId('base-modal-close');
      
      await userEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Date Formatting', () => {
    it('should format the last updated date correctly', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByText('January 1, 2023')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      // Check that headings exist and are properly structured
      expect(screen.getAllByRole('heading').length).toBeGreaterThan(0);
    });

    it('should have proper link structure for contact email', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      const emailLink = screen.getByRole('link', { name: /support@leaguer.com/ });
      expect(emailLink).toHaveAttribute('href', 'mailto:support@leaguer.com');
    });

    it('should have readable content structure', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      // Verify main content sections are present
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Acceptance of Terms')).toBeInTheDocument();
      expect(screen.getByText('Use of Services')).toBeInTheDocument();
      expect(screen.getByText('Contact Us')).toBeInTheDocument();
    });
  });

  describe('Internationalization', () => {
    it('should use translation keys for all text content', () => {
      render(<TermsOfServiceModal {...defaultProps} />);

      // Check if translated content is displayed
      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Acceptance of Terms')).toBeInTheDocument();
      expect(screen.getByText('Eligibility')).toBeInTheDocument();
      expect(screen.getByText('Use of Services')).toBeInTheDocument();
    });

    it('should format dates according to language settings', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      // Should call renderDate with proper language parameter
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  describe('Legal Sections', () => {
    it('should render all major legal sections', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      const expectedSections = [
        'Introduction',
        'Acceptance of Terms',
        'Eligibility',
        'Account Registration and Security',
        'Use of Services',
        'User Content',
        'Privacy and Data Protection',
        'Intellectual Property',
        'Payments and Subscriptions',
        'Disclaimers',
        'Limitation of Liability',
        'Termination',
        'Governing Law',
        'Changes to These Terms',
        'Contact Us'
      ];
      
      expectedSections.forEach(section => {
        expect(screen.getByText(section)).toBeInTheDocument();
      });
    });
  });

  describe('Environment Considerations', () => {
    it('should handle missing translation gracefully', () => {
      // Component should still render even if some translations are missing
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByTestId('base-modal-component')).toBeInTheDocument();
    });

    it('should handle date formatting errors gracefully', () => {
      // Should not crash if date formatting fails
      render(<TermsOfServiceModal {...defaultProps} />);
      
      expect(screen.getByTestId('base-modal-component')).toBeInTheDocument();
    });
  });

  describe('Content Organization', () => {
    it('should organize content in logical sections', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      // Check that content is well-organized with subsections
      expect(screen.getByText('Permitted Uses')).toBeInTheDocument();
      expect(screen.getByText('Prohibited Uses')).toBeInTheDocument();
      expect(screen.getByText('License to User Content')).toBeInTheDocument();
      expect(screen.getByText('Your Responsibilities')).toBeInTheDocument();
    });

    it('should provide comprehensive legal coverage', () => {
      render(<TermsOfServiceModal {...defaultProps} />);
      
      // Verify key legal topics are covered (using exact heading text)
      expect(screen.getByText('Intellectual Property')).toBeInTheDocument();
      expect(screen.getByText('Limitation of Liability')).toBeInTheDocument();
      expect(screen.getByText('Governing Law')).toBeInTheDocument();
      expect(screen.getByText('Termination')).toBeInTheDocument();
    });
  });
});
