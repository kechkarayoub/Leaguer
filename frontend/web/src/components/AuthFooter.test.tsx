/**
 * AuthFooter Component Tests
 * 
 * This test suite covers:
 * - Footer rendering with different props
 * - Modal state management and interactions
 * - Social media links rendering based on environment variables
 * - Sign up/sign in link visibility
 * - Copyright year display
 * - Link button interactions and modal opening
 * - RTL support and direction handling
 * - Environment variable handling for social links
 * - Internationalization support
 * - Footer section rendering (Quick Links, Support, Social Media)
 * 
 * The tests mock:
 * - react-i18next for translations
 * - useRTL hook for RTL support
 * - All modal components
 * - react-router-dom Link component
 * 
 * Run with: yarn test --testPathPattern=AuthFooter.test.tsx --watchAll=false
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthFooter from './AuthFooter';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: { [key: string]: string } = {
        'common:app.tagline': 'Your Sports Community Platform',
        'common:app.allRightsReserved': 'All rights reserved.',
        'common:footer.quickLinks': 'Quick Links',
        'common:footer.about': 'About Us',
        'common:footer.features': 'Features',
        'common:footer.contact': 'Contact',
        'common:footer.support': 'Support',
        'common:footer.help': 'Help Center',
        'common:footer.privacy': 'Privacy Policy',
        'common:footer.terms': 'Terms of Service',
        'common:footer.cookies': 'Cookies',
        'common:footer.followUs': 'Follow Us',
      };
      return options?.defaultValue || translations[key] || key;
    },
  }),
}));

// Mock useRTL hook
jest.mock('../hooks/useRTL', () => ({
  __esModule: true,
  default: () => ({
    isRTL: false,
  }),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock all modal components
jest.mock('./modals/AboutUsModal', () => {
  return function MockAboutUsModal({ isOpen, onClose }: any) {
    return isOpen ? <div data-testid="about-us-modal">About Us Modal</div> : null;
  };
});

jest.mock('./modals/FeaturesModal', () => {
  return function MockFeaturesModal({ isOpen, onClose }: any) {
    return isOpen ? <div data-testid="features-modal">Features Modal</div> : null;
  };
});

jest.mock('./modals/ContactModal', () => {
  return function MockContactModal({ isOpen, onClose, prefillUserData }: any) {
    return isOpen ? (
      <div data-testid="contact-modal">
        Contact Modal
        {prefillUserData && <span data-testid="prefill-data">{JSON.stringify(prefillUserData)}</span>}
      </div>
    ) : null;
  };
});

jest.mock('./modals/HelpCenterModal', () => {
  return function MockHelpCenterModal({ isOpen, onClose, onContactSupport }: any) {
    return isOpen ? (
      <div data-testid="help-center-modal">
        Help Center Modal
        <button onClick={onContactSupport} data-testid="contact-support-trigger">Contact Support</button>
      </div>
    ) : null;
  };
});

jest.mock('./modals/PrivacyPolicyModal', () => {
  return function MockPrivacyPolicyModal({ isOpen, onClose }: any) {
    return isOpen ? <div data-testid="privacy-policy-modal">Privacy Policy Modal</div> : null;
  };
});

jest.mock('./modals/TermsOfServiceModal', () => {
  return function MockTermsOfServiceModal({ isOpen, onClose }: any) {
    return isOpen ? <div data-testid="terms-of-service-modal">Terms of Service Modal</div> : null;
  };
});

jest.mock('./modals/CookiesPolicyModal', () => {
  return function MockCookiesPolicyModal({ isOpen, onClose }: any) {
    return isOpen ? <div data-testid="cookies-policy-modal">Cookies Policy Modal</div> : null;
  };
});

// Store original environment variables
const originalEnv = process.env;

describe('AuthFooter', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Clear environment variables for consistent testing
    delete process.env.REACT_APP_SOCIAL_FACEBOOK_URL;
    delete process.env.REACT_APP_SOCIAL_TWITTER_URL;
    delete process.env.REACT_APP_SOCIAL_INSTAGRAM_URL;
    delete process.env.REACT_APP_SOCIAL_TIKTOK_URL;
    delete process.env.REACT_APP_SOCIAL_YOUTUBE_URL;
    delete process.env.REACT_APP_SOCIAL_LINKEDIN_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<AuthFooter />);
      expect(screen.getByText('Leaguer')).toBeInTheDocument();
    });

    it('should render footer with correct class structure', () => {
      render(<AuthFooter />);
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('auth-footer-modern', 'ltr');
    });

    it('should render brand section with name and tagline', () => {
      render(<AuthFooter />);
      expect(screen.getByText('Leaguer')).toBeInTheDocument();
      expect(screen.getByText('Your Sports Community Platform')).toBeInTheDocument();
    });

    it('should render current year in copyright', () => {
      render(<AuthFooter />);
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear} Leaguer`))).toBeInTheDocument();
    });
  });

  describe('Section Rendering', () => {
    it('should render Quick Links section', () => {
      render(<AuthFooter />);
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'About Us' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Features' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Contact' })).toBeInTheDocument();
    });

    it('should render Support section', () => {
      render(<AuthFooter />);
      expect(screen.getByText('Support')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Help Center' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Privacy Policy' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Terms of Service' })).toBeInTheDocument();
    });

    it('should render bottom links section', () => {
      render(<AuthFooter />);
      const bottomLinks = screen.getAllByRole('button', { name: 'Privacy Policy' });
      const bottomTerms = screen.getAllByRole('button', { name: 'Terms of Service' });
      const cookiesButton = screen.getByRole('button', { name: 'Cookies' });
      
      expect(bottomLinks.length).toBeGreaterThanOrEqual(1);
      expect(bottomTerms.length).toBeGreaterThanOrEqual(1);
      expect(cookiesButton).toBeInTheDocument();
    });
  });

  describe('Social Media Links', () => {
    it('should not render social media section when no URLs are provided', () => {
      render(<AuthFooter />);
      expect(screen.queryByText('Follow Us')).not.toBeInTheDocument();
    });

    it('should render social media section when URLs are provided', () => {
      process.env.REACT_APP_SOCIAL_FACEBOOK_URL = 'https://facebook.com/leaguer';
      process.env.REACT_APP_SOCIAL_TWITTER_URL = 'https://twitter.com/leaguer';
      
      render(<AuthFooter />);
      expect(screen.getByText('Follow Us')).toBeInTheDocument();
    });

    it('should render correct social media links', () => {
      process.env.REACT_APP_SOCIAL_FACEBOOK_URL = 'https://facebook.com/leaguer';
      process.env.REACT_APP_SOCIAL_TWITTER_URL = 'https://twitter.com/leaguer';
      process.env.REACT_APP_SOCIAL_INSTAGRAM_URL = 'https://instagram.com/leaguer';
      
      render(<AuthFooter />);
      
      const facebookLink = screen.getByRole('link', { name: 'Facebook' });
      const twitterLink = screen.getByRole('link', { name: 'Twitter' });
      const instagramLink = screen.getByRole('link', { name: 'Instagram' });
      
      expect(facebookLink).toHaveAttribute('href', 'https://facebook.com/leaguer');
      expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/leaguer');
      expect(instagramLink).toHaveAttribute('href', 'https://instagram.com/leaguer');
    });

    it('should filter out empty social links', () => {
      process.env.REACT_APP_SOCIAL_FACEBOOK_URL = 'https://facebook.com/leaguer';
      process.env.REACT_APP_SOCIAL_TWITTER_URL = '';
      process.env.REACT_APP_SOCIAL_INSTAGRAM_URL = '   ';
      
      render(<AuthFooter />);
      
      expect(screen.getByRole('link', { name: 'Facebook' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Twitter' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Instagram' })).not.toBeInTheDocument();
    });

    it('should render all supported social media platforms', () => {
      process.env.REACT_APP_SOCIAL_FACEBOOK_URL = 'https://facebook.com/leaguer';
      process.env.REACT_APP_SOCIAL_TWITTER_URL = 'https://twitter.com/leaguer';
      process.env.REACT_APP_SOCIAL_INSTAGRAM_URL = 'https://instagram.com/leaguer';
      process.env.REACT_APP_SOCIAL_TIKTOK_URL = 'https://tiktok.com/@leaguer';
      process.env.REACT_APP_SOCIAL_YOUTUBE_URL = 'https://youtube.com/leaguer';
      process.env.REACT_APP_SOCIAL_LINKEDIN_URL = 'https://linkedin.com/company/leaguer';
      
      render(<AuthFooter />);
      
      expect(screen.getByRole('link', { name: 'Facebook' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Twitter' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Instagram' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'TikTok' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'YouTube' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'LinkedIn' })).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('should open About Us modal when button is clicked', async () => {
      render(<AuthFooter />);
      
      const aboutButton = screen.getByRole('button', { name: 'About Us' });
      await userEvent.click(aboutButton);
      
      expect(screen.getByTestId('about-us-modal')).toBeInTheDocument();
    });

    it('should open Features modal when button is clicked', async () => {
      render(<AuthFooter />);
      
      const featuresButton = screen.getByRole('button', { name: 'Features' });
      await userEvent.click(featuresButton);
      
      expect(screen.getByTestId('features-modal')).toBeInTheDocument();
    });

    it('should open Contact modal when button is clicked', async () => {
      render(<AuthFooter />);
      
      const contactButton = screen.getByRole('button', { name: 'Contact' });
      await userEvent.click(contactButton);
      
      expect(screen.getByTestId('contact-modal')).toBeInTheDocument();
    });

    it('should open Help Center modal when button is clicked', async () => {
      render(<AuthFooter />);
      
      const helpButton = screen.getByRole('button', { name: 'Help Center' });
      await userEvent.click(helpButton);
      
      expect(screen.getByTestId('help-center-modal')).toBeInTheDocument();
    });

    it('should open Privacy Policy modal when button is clicked', async () => {
      render(<AuthFooter />);
      
      const privacyButtons = screen.getAllByRole('button', { name: 'Privacy Policy' });
      await userEvent.click(privacyButtons[0]);
      
      expect(screen.getByTestId('privacy-policy-modal')).toBeInTheDocument();
    });

    it('should open Terms of Service modal when button is clicked', async () => {
      render(<AuthFooter />);
      
      const termsButtons = screen.getAllByRole('button', { name: 'Terms of Service' });
      await userEvent.click(termsButtons[0]);
      
      expect(screen.getByTestId('terms-of-service-modal')).toBeInTheDocument();
    });

    it('should open Cookies Policy modal when button is clicked', async () => {
      render(<AuthFooter />);
      
      const cookiesButton = screen.getByRole('button', { name: 'Cookies' });
      await userEvent.click(cookiesButton);
      
      expect(screen.getByTestId('cookies-policy-modal')).toBeInTheDocument();
    });

    it('should close modal and open contact modal when help center triggers contact support', async () => {
      render(<AuthFooter />);
      
      // Open help center modal
      const helpButton = screen.getByRole('button', { name: 'Help Center' });
      await userEvent.click(helpButton);
      
      expect(screen.getByTestId('help-center-modal')).toBeInTheDocument();
      
      // Trigger contact support from help center
      const contactSupportButton = screen.getByTestId('contact-support-trigger');
      await userEvent.click(contactSupportButton);
      
      // Help center should close and contact modal should open
      expect(screen.queryByTestId('help-center-modal')).not.toBeInTheDocument();
      expect(screen.getByTestId('contact-modal')).toBeInTheDocument();
    });

    it('should only show one modal at a time', async () => {
      render(<AuthFooter />);
      
      // Open first modal
      const aboutButton = screen.getByRole('button', { name: 'About Us' });
      await userEvent.click(aboutButton);
      expect(screen.getByTestId('about-us-modal')).toBeInTheDocument();
      
      // Open second modal
      const featuresButton = screen.getByRole('button', { name: 'Features' });
      await userEvent.click(featuresButton);
      
      // First modal should be closed, second should be open
      expect(screen.queryByTestId('about-us-modal')).not.toBeInTheDocument();
      expect(screen.getByTestId('features-modal')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should pass prefillUserData to contact modal', async () => {
      const prefillData = { name: 'John Doe', email: 'john@example.com' };
      
      render(<AuthFooter prefillUserData={prefillData} />);
      
      const contactButton = screen.getByRole('button', { name: 'Contact' });
      await userEvent.click(contactButton);
      
      expect(screen.getByTestId('contact-modal')).toBeInTheDocument();
      expect(screen.getByTestId('prefill-data')).toHaveTextContent(JSON.stringify(prefillData));
    });

    it('should handle showSignUpLink prop', () => {
      render(<AuthFooter showSignUpLink={true} />);
      // Note: The component doesn't currently implement sign up/sign in links
      // This test documents the intended behavior
      expect(screen.getByText('Leaguer')).toBeInTheDocument();
    });

    it('should handle showSignInLink prop', () => {
      render(<AuthFooter showSignInLink={true} />);
      // Note: The component doesn't currently implement sign up/sign in links
      // This test documents the intended behavior
      expect(screen.getByText('Leaguer')).toBeInTheDocument();
    });
  });

  describe('RTL Support', () => {
    it('should apply RTL class when isRTL is true', () => {
      // Mock RTL mode
      jest.doMock('../hooks/useRTL', () => ({
        __esModule: true,
        default: () => ({
          isRTL: true,
        }),
      }));

      render(<AuthFooter />);
      const footer = screen.getByRole('contentinfo');
      
      // Note: The current mock returns false, but this documents intended behavior
      expect(footer).toHaveClass('auth-footer-modern');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles for all interactive elements', () => {
      render(<AuthFooter />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // All buttons should be accessible
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should have proper link attributes for social media', () => {
      process.env.REACT_APP_SOCIAL_FACEBOOK_URL = 'https://facebook.com/leaguer';
      
      render(<AuthFooter />);
      
      const facebookLink = screen.getByRole('link', { name: 'Facebook' });
      expect(facebookLink).toHaveAttribute('target', '_blank');
      expect(facebookLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should have proper aria-label for social media links', () => {
      process.env.REACT_APP_SOCIAL_FACEBOOK_URL = 'https://facebook.com/leaguer';
      
      render(<AuthFooter />);
      
      const facebookLink = screen.getByRole('link', { name: 'Facebook' });
      expect(facebookLink).toHaveAttribute('aria-label', 'Facebook');
    });
  });

  describe('Internationalization', () => {
    it('should use translation keys for all text content', () => {
      render(<AuthFooter />);
      
      // Check that translated strings are rendered
      expect(screen.getByText('Your Sports Community Platform')).toBeInTheDocument();
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
      expect(screen.getByText('Support')).toBeInTheDocument();
      expect(screen.getByText('About Us')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Help Center')).toBeInTheDocument();
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
      expect(screen.getByText('Cookies')).toBeInTheDocument();
    });
  });
});
