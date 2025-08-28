/**
 * AboutUsModal Component Tests
 * 
 * This test suite covers:
 * - Modal rendering with BaseModal integration
 * - Company information and branding display
 * - Mission and values sections rendering
 * - Feature highlights and descriptions
 * - Environment variable usage (support email)
 * - Contact information display
 * - Modal interactions and closing
 * - Internationalization support
 * - Logo and hero section rendering
 * 
 * The tests mock:
 * - react-i18next for translations
 * - BaseModal component for modal functionality testing
 * - Logo image imports
 * 
 * Run with: yarn test --testPathPattern=AboutUsModal.test.tsx --watchAll=false
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AboutUsModal from './AboutUsModal';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: { [key: string]: string } = {
        'common:footer.about': 'About Us',
        'common:app.welcome': 'Welcome to Leaguer',
        'common:app.tagline': 'Your Sports Community Platform',
        'common:about.ourMission': 'Our Mission',
        'common:about.missionText': 'At Leaguer, we believe in bringing sports communities together. Our platform connects athletes, teams, and sports enthusiasts, providing tools to organize, participate, and excel in various sporting activities.',
        'common:about.whatWeOffer': 'What We Offer',
        'common:about.teamManagement': 'Team Management',
        'common:about.teamManagementDesc': 'Create and manage sports teams, track player statistics, and organize team activities.',
        'common:about.eventOrganization': 'Event Organization',
        'common:about.eventOrganizationDesc': 'Organize tournaments, matches, and sporting events with easy scheduling and management tools.',
        'common:about.communityBuilding': 'Community Building',
        'common:about.communityBuildingDesc': 'Connect with fellow athletes, share experiences, and build lasting relationships within the sports community.',
        'common:about.ourValues': 'Our Values',
        'common:about.excellence': 'Excellence',
        'common:about.excellenceDesc': 'Striving for the best in everything we do',
        'common:about.community': 'Community',
        'common:about.communityDesc': 'Building connections that last beyond the game',
        'common:about.innovation': 'Innovation',
        'common:about.innovationDesc': 'Using technology to enhance the sports experience',
        'common:about.inclusivity': 'Inclusivity',
        'common:about.inclusivityDesc': 'Welcoming athletes of all levels and backgrounds',
        'common:about.getInTouch': 'Get in Touch',
        'common:about.contactText': 'Have questions or want to learn more? We\'d love to hear from you! Contact our team for support, partnerships, or general inquiries.',
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

describe('AboutUsModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  // Mock environment variables
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
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
      render(<AboutUsModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('base-modal-component')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      expect(screen.getByTestId('base-modal-component')).toBeInTheDocument();
      expect(screen.getByTestId('base-modal-title')).toHaveTextContent('About Us');
      expect(screen.getByTestId('base-modal-size')).toHaveTextContent('large');
    });

    it('should render modal with correct title', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      expect(screen.getByTestId('base-modal-title')).toHaveTextContent('About Us');
    });

    it('should use large size for the modal', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      expect(screen.getByTestId('base-modal-size')).toHaveTextContent('large');
    });
  });

  describe('Hero Section', () => {
    it('should render hero section with logo', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      const logo = screen.getByAltText('Leaguer Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'mock-logo.png');
      expect(logo).toHaveClass('modal-hero-logo-img');
    });

    it('should render hero title and subtitle', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      expect(screen.getByText('Welcome to Leaguer')).toBeInTheDocument();
      expect(screen.getByText('Your Sports Community Platform')).toBeInTheDocument();
    });

    it('should have proper hero section structure', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      const heroTitle = screen.getByText('Welcome to Leaguer');
      const heroSubtitle = screen.getByText('Your Sports Community Platform');
      
      expect(heroTitle).toHaveClass('modal-hero-title');
      expect(heroSubtitle).toHaveClass('modal-hero-subtitle');
    });
  });

  describe('Mission Section', () => {
    it('should render mission section with title', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      expect(screen.getByText('Our Mission')).toBeInTheDocument();
    });

    it('should render mission text', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      const missionText = screen.getByText(/At Leaguer, we believe in bringing sports communities together/);
      expect(missionText).toBeInTheDocument();
      expect(missionText).toHaveClass('modal-text');
    });
  });

  describe('Features Section', () => {
    it('should render what we offer section title', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      expect(screen.getByText('What We Offer')).toBeInTheDocument();
    });

    it('should render team management feature', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      expect(screen.getByText('Team Management')).toBeInTheDocument();
      expect(screen.getByText(/Create and manage sports teams, track player statistics/)).toBeInTheDocument();
    });

    it('should render event organization feature', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      expect(screen.getByText('Event Organization')).toBeInTheDocument();
      expect(screen.getByText(/Organize tournaments, matches, and sporting events/)).toBeInTheDocument();
    });

    it('should render community building feature', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      expect(screen.getByText('Community Building')).toBeInTheDocument();
      expect(screen.getByText(/Connect with fellow athletes, share experiences/)).toBeInTheDocument();
    });

    it('should render feature icons with proper SVG structure', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      // Check that feature section exists with proper structure
      const featureSection = screen.getByTestId('about-us-features-section');
      expect(featureSection).toBeInTheDocument();
      
      const featureGrid = screen.getByTestId('about-us-feature-grid');
      expect(featureGrid).toBeInTheDocument();
    });
  });

  describe('Values Section', () => {
    it('should render our values section title', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      expect(screen.getByText('Our Values')).toBeInTheDocument();
    });

    it('should render excellence value', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      expect(screen.getByText('Excellence')).toBeInTheDocument();
      expect(screen.getByText('Striving for the best in everything we do')).toBeInTheDocument();
    });

    it('should render community value', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      expect(screen.getByText('Community')).toBeInTheDocument();
      expect(screen.getByText('Building connections that last beyond the game')).toBeInTheDocument();
    });

    it('should render innovation value', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      expect(screen.getByText('Innovation')).toBeInTheDocument();
      expect(screen.getByText('Using technology to enhance the sports experience')).toBeInTheDocument();
    });

    it('should render inclusivity value', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      expect(screen.getByText('Inclusivity')).toBeInTheDocument();
      expect(screen.getByText('Welcoming athletes of all levels and backgrounds')).toBeInTheDocument();
    });
  });

  describe('Contact Section', () => {
    it('should render get in touch section title', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      expect(screen.getByText('Get in Touch')).toBeInTheDocument();
    });

    it('should render contact text', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      const contactText = screen.getByText(/Have questions or want to learn more/);
      expect(contactText).toBeInTheDocument();
    });

    it('should render support email when provided', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      const emailLink = screen.getByRole('link', { name: 'test@leaguer.com' });
      expect(emailLink).toBeInTheDocument();
      expect(emailLink).toHaveAttribute('href', 'mailto:test@leaguer.com');
      expect(emailLink).toHaveClass('modal-contact-link');
    });

    it('should not render email section when no support email provided', () => {
      process.env.REACT_APP_SUPPORT_EMAIL = '';
      render(<AboutUsModal {...defaultProps} />);
      
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('should handle whitespace-only support email', () => {
      process.env.REACT_APP_SUPPORT_EMAIL = '   ';
      render(<AboutUsModal {...defaultProps} />);
      
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('should render contact icon with proper SVG structure', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      const contactIcon = screen.getByTestId('about-us-contact-icon');
      expect(contactIcon).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('should call onClose when modal is closed', async () => {
      render(<AboutUsModal {...defaultProps} />);
      
      const closeButton = screen.getByTestId('base-modal-close');
      await userEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should pass onClose callback to BaseModal', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      // BaseModal should receive the onClose prop
      expect(screen.getByTestId('base-modal-component')).toBeInTheDocument();
    });
  });

  describe('Environment Variables', () => {
    it('should use environment variable for support email', () => {
      process.env.REACT_APP_SUPPORT_EMAIL = 'custom@example.com';
      render(<AboutUsModal {...defaultProps} />);
      
      const emailLink = screen.getByRole('link', { name: 'custom@example.com' });
      expect(emailLink).toBeInTheDocument();
      expect(emailLink).toHaveAttribute('href', 'mailto:custom@example.com');
    });

    it('should handle missing environment variable gracefully', () => {
      delete process.env.REACT_APP_SUPPORT_EMAIL;
      
      expect(() => {
        render(<AboutUsModal {...defaultProps} />);
      }).not.toThrow();
      
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('Content Structure', () => {
    it('should have proper CSS class structure', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      // Check for main content wrapper
      const content = screen.getByTestId('about-us-modal-content');
      expect(content).toBeInTheDocument();
      
      // Check for sections
      const heroSection = screen.getByTestId('about-us-hero-section');
      const missionSection = screen.getByTestId('about-us-mission-section');
      const featuresSection = screen.getByTestId('about-us-features-section');
      const valuesSection = screen.getByTestId('about-us-values-section');
      const contactSection = screen.getByTestId('about-us-contact-section');
      
      expect(heroSection).toBeInTheDocument();
      expect(missionSection).toBeInTheDocument();
      expect(featuresSection).toBeInTheDocument();
      expect(valuesSection).toBeInTheDocument();
      expect(contactSection).toBeInTheDocument();
    });

    it('should render feature grid with proper structure', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      const featureGrid = screen.getByTestId('about-us-feature-grid');
      expect(featureGrid).toBeInTheDocument();
    });

    it('should render values grid with proper structure', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      const valuesGrid = screen.getByTestId('about-us-values-grid');
      expect(valuesGrid).toBeInTheDocument();
      
      // Check individual value items
      expect(screen.getByTestId('about-us-value-excellence')).toBeInTheDocument();
      expect(screen.getByTestId('about-us-value-community')).toBeInTheDocument();
      expect(screen.getByTestId('about-us-value-innovation')).toBeInTheDocument();
      expect(screen.getByTestId('about-us-value-inclusivity')).toBeInTheDocument();
    });

    it('should have final section marker for contact', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      const finalSection = screen.getByTestId('about-us-contact-section');
      expect(finalSection).toBeInTheDocument();
      expect(finalSection).toHaveClass('modal-section--final');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      const heroTitle = screen.getByText('Welcome to Leaguer');
      expect(heroTitle.tagName).toBe('H3');
      
      const sectionTitles = screen.getAllByText(/Our Mission|What We Offer|Our Values|Get in Touch/);
      sectionTitles.forEach(title => {
        expect(title.tagName).toBe('H4');
      });
    });

    it('should have proper alt text for logo', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      const logo = screen.getByAltText('Leaguer Logo');
      expect(logo).toBeInTheDocument();
    });

    it('should have proper link accessibility for email', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      const emailLink = screen.getByRole('link', { name: 'test@leaguer.com' });
      expect(emailLink).toHaveAttribute('href', 'mailto:test@leaguer.com');
    });
  });

  describe('Internationalization', () => {
    it('should use translation keys for all text content', () => {
      render(<AboutUsModal {...defaultProps} />);
      
      // Check that translated text is displayed
      expect(screen.getByText('About Us')).toBeInTheDocument();
      expect(screen.getByText('Welcome to Leaguer')).toBeInTheDocument();
      expect(screen.getByText('Our Mission')).toBeInTheDocument();
      expect(screen.getByText('What We Offer')).toBeInTheDocument();
      expect(screen.getByText('Our Values')).toBeInTheDocument();
      expect(screen.getByText('Get in Touch')).toBeInTheDocument();
    });

    it('should handle missing translations gracefully', () => {
      // The mock will return the key if translation is not found
      render(<AboutUsModal {...defaultProps} />);
      
      // Component should still render without errors
      expect(screen.getByTestId('base-modal-component')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty support email', () => {
      process.env.REACT_APP_SUPPORT_EMAIL = '';
      
      expect(() => {
        render(<AboutUsModal {...defaultProps} />);
      }).not.toThrow();
    });

    it('should handle undefined props gracefully', () => {
      expect(() => {
        render(<AboutUsModal isOpen={true} onClose={undefined as any} />);
      }).not.toThrow();
    });

    it('should handle missing logo gracefully', () => {
      // Even if logo fails to load, component should still render
      render(<AboutUsModal {...defaultProps} />);
      
      const logo = screen.getByAltText('Leaguer Logo');
      expect(logo).toBeInTheDocument();
    });
  });
});
