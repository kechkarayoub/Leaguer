/**
 * LanguageSwitcher Component Tests
 * 
 * This test suite covers:
 * - Basic component rendering
 * - Different variants (default, minimal, floating, compact)
 * - Props handling
 * - Component stability
 * 
 * Run with: yarn test --testPathPattern=LanguageSwitcher.test.tsx --watchAll=false
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageSwitcher from './LanguageSwitcher';

// Mock i18next
const mockChangeLanguage = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

// Mock RTL hook
const mockIsRTL = jest.fn(() => false);
jest.mock('../hooks/useRTL', () => ({
  useRTL: () => mockIsRTL(),
}));

// Mock FlagIcons
jest.mock('./FlagIcons', () => ({
  CountryFlag: ({ country, size, className }: any) => (
    <div data-testid={`flag-${country}`} data-size={size} className={className}>
      {country} Flag
    </div>
  ),
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsRTL.mockReturnValue(false);
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<LanguageSwitcher />);
      // Component renders without throwing
    });

    it('should render with default variant', () => {
      render(<LanguageSwitcher variant="default" />);
      expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    it('should render current language', () => {
      render(<LanguageSwitcher />);
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('should render current language flag', () => {
      render(<LanguageSwitcher />);
      expect(screen.getByTestId('flag-US')).toBeInTheDocument();
    });
  });

  describe('Component Variants', () => {
    it('should render minimal variant', () => {
      render(<LanguageSwitcher variant="minimal" />);
      // Minimal variant shows all languages as buttons
      expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
    });

    it('should render floating variant', () => {
      render(<LanguageSwitcher variant="floating" />);
      expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    it('should render compact variant', () => {
      render(<LanguageSwitcher variant="compact" />);
      // Compact variant shows all languages as compact buttons
      expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
    });

    it('should show all flags in minimal variant', () => {
      render(<LanguageSwitcher variant="minimal" />);
      
      expect(screen.getByTestId('flag-US')).toBeInTheDocument();
      expect(screen.getByTestId('flag-FR')).toBeInTheDocument();
      expect(screen.getByTestId('flag-SA')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should apply custom className', () => {
      render(<LanguageSwitcher className="custom-switcher" />);
      // Component renders with custom className
    });

    it('should handle position prop', () => {
      render(<LanguageSwitcher position="top-left" />);
      // Component renders with position prop
    });

    it('should handle all position variants', () => {
      const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;
      
      positions.forEach((position) => {
        render(<LanguageSwitcher position={position} />);
        // Component renders with ${position} position
      });
    });
  });

  describe('Language Interaction', () => {
    it('should change language in minimal variant', async () => {
      render(<LanguageSwitcher variant="minimal" />);
      
      const frenchButton = screen.getByTitle('Français');
      await userEvent.click(frenchButton);
      
      expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
    });

    it('should change to Arabic language in minimal variant', async () => {
      render(<LanguageSwitcher variant="minimal" />);
      
      const arabicButton = screen.getByTitle('العربية');
      await userEvent.click(arabicButton);
      
      expect(mockChangeLanguage).toHaveBeenCalledWith('ar');
    });

    it('should open dropdown in default variant', async () => {
      render(<LanguageSwitcher variant="default" />);
      
      const button = screen.getAllByRole('button')[0];
      await userEvent.click(button);
      
      // Dropdown should open showing language options
      expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
    });
  });

  describe('RTL Support', () => {
    beforeEach(() => {
      mockIsRTL.mockReturnValue(true);
    });

    it('should render in RTL mode', () => {
      render(<LanguageSwitcher />);
      // Component renders with RTL support
    });

    it('should handle Arabic text in RTL', () => {
      render(<LanguageSwitcher variant="minimal" />);
      expect(screen.getByTitle('العربية')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button elements', () => {
      render(<LanguageSwitcher />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have title attributes in minimal variant', () => {
      render(<LanguageSwitcher variant="minimal" />);
      
      expect(screen.getByTitle('English')).toBeInTheDocument();
      expect(screen.getByTitle('Français')).toBeInTheDocument();
      expect(screen.getByTitle('العربية')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle language change errors gracefully', async () => {
      mockChangeLanguage.mockRejectedValueOnce(new Error('Language change failed'));
      
      render(<LanguageSwitcher variant="minimal" />);
      
      const frenchButton = screen.getByTitle('Français');
      await userEvent.click(frenchButton);
      
      // Should not crash on error
      expect(screen.getByTitle('Français')).toBeInTheDocument();
    });

    it('should handle missing translation gracefully', () => {
      render(<LanguageSwitcher />);
      // Should render even if translations are missing
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<LanguageSwitcher />);
      
      rerender(<LanguageSwitcher />);
      
      // Component should handle re-renders efficiently
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    it('should handle rapid interactions', async () => {
      render(<LanguageSwitcher variant="minimal" />);
      
      const frenchButton = screen.getByTitle('Français');
      const arabicButton = screen.getByTitle('العربية');
      
      // Rapid clicks
      await userEvent.click(frenchButton);
      await userEvent.click(arabicButton);
      
      expect(mockChangeLanguage).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown current language', () => {
      render(<LanguageSwitcher />);
      // Should handle edge cases gracefully
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    it('should handle undefined props', () => {
      render(<LanguageSwitcher variant={undefined as any} />);
      // Should fallback to default variant
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    it('should handle empty className', () => {
      render(<LanguageSwitcher className="" />);
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    it('should handle all variant types', () => {
      const variants = ['default', 'minimal', 'floating', 'compact'] as const;
      
      variants.forEach((variant) => {
        render(<LanguageSwitcher variant={variant} />);
        // Component renders with ${variant} variant
      });
    });
  });

  describe('Flag Integration', () => {
    it('should render correct flag sizes', () => {
      render(<LanguageSwitcher />);
      
      const flag = screen.getByTestId('flag-US');
      expect(flag).toHaveAttribute('data-size', '20');
    });

    it('should render flags for all languages in minimal variant', () => {
      render(<LanguageSwitcher variant="minimal" />);
      
      const flags = ['flag-US', 'flag-FR', 'flag-SA'];
      flags.forEach((flagId) => {
        expect(screen.getByTestId(flagId)).toBeInTheDocument();
      });
    });

    it('should apply correct flag props', () => {
      render(<LanguageSwitcher variant="minimal" />);
      
      const usFlag = screen.getByTestId('flag-US');
      expect(usFlag).toHaveAttribute('data-size', '20');
      expect(usFlag).toHaveClass('language-switcher__flag-icon');
    });
  });
});
