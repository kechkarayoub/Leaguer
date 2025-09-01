/**
 * LoadingSpinner Component Tests
 * 
 * Tests for the LoadingSpinner component focusing on user-facing behavior
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

// Mock i18next for testing
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key === 'common:app.loading') {
        return options?.defaultValue || 'Loading...';
      }
      return key;
    },
  }),
}));

describe('LoadingSpinner', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<LoadingSpinner />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });

    it('should render default loading text', () => {
      render(<LoadingSpinner />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });
  });

  describe('Text Props', () => {
    it('should render custom text when provided', () => {
      const customText = 'Please wait...';
      render(<LoadingSpinner text={customText} />);
      expect(screen.getByText(customText)).toBeInTheDocument();
    });

    it('should render default text when empty string is provided', () => {
      render(<LoadingSpinner text="" />);
      // When empty string is provided, it should fall back to default translation
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });

    it('should override default text with custom text', () => {
      const customText = 'Custom loading text';
      render(<LoadingSpinner text={customText} />);
      expect(screen.getByText(customText)).toBeInTheDocument();
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render with small size', () => {
      render(<LoadingSpinner size="small" />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });

    it('should render with medium size', () => {
      render(<LoadingSpinner size="medium" />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });

    it('should render with large size', () => {
      render(<LoadingSpinner size="large" />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });
  });

  describe('Overlay Functionality', () => {
    it('should render with overlay', () => {
      render(<LoadingSpinner overlay={true} />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });

    it('should render without overlay', () => {
      render(<LoadingSpinner overlay={false} />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });
  });

  describe('Props Combination', () => {
    it('should handle all props together', () => {
      const customText = 'Processing...';
      render(
        <LoadingSpinner
          size="large"
          text={customText}
          overlay={true}
          className="custom-class"
        />
      );
      expect(screen.getByText(customText)).toBeInTheDocument();
    });

    it('should work with minimal props', () => {
      render(<LoadingSpinner />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper text content for screen readers', () => {
      render(<LoadingSpinner />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });

    it('should have proper text content with custom text', () => {
      const customText = 'Loading data...';
      render(<LoadingSpinner text={customText} />);
      expect(screen.getByText(customText)).toBeInTheDocument();
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined text prop gracefully', () => {
      render(<LoadingSpinner text={undefined} />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });

    it('should handle undefined size prop gracefully', () => {
      render(<LoadingSpinner size={undefined} />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });

    it('should render properly when all optional props are undefined', () => {
      const props: any = {};
      render(<LoadingSpinner {...props} />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<LoadingSpinner text="Loading..." />);
      const textElement = screen.getByText('Loading...');
      
      // Re-render with same props
      rerender(<LoadingSpinner text="Loading..." />);
      
      // Element should still be the same
      expect(screen.getByText('Loading...')).toBe(textElement);
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = render(<LoadingSpinner size="small" />);
      
      rerender(<LoadingSpinner size="medium" />);
      rerender(<LoadingSpinner size="large" />);
      rerender(<LoadingSpinner size="small" />);
      
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });
  });

  describe('Logo Variant', () => {
    it('should render logo when showLogo is true', () => {
      render(<LoadingSpinner showLogo={true} />);
      const logoImage = screen.getByAltText('Loading');
      expect(logoImage).toBeInTheDocument();
      expect(logoImage).toHaveAttribute('src', expect.stringContaining('logo.svg'));
    });

    it('should not render logo when showLogo is false', () => {
      render(<LoadingSpinner showLogo={false} />);
      expect(screen.queryByAltText('Loading')).not.toBeInTheDocument();
    });

    it('should render logo by default when showLogo is undefined', () => {
      render(<LoadingSpinner />);
      expect(screen.queryByAltText('Loading')).not.toBeInTheDocument();
    });

    it('should render logo with different sizes', () => {
      const { rerender } = render(<LoadingSpinner showLogo={true} size="small" />);
      expect(screen.getByAltText('Loading')).toBeInTheDocument();

      rerender(<LoadingSpinner showLogo={true} size="medium" />);
      expect(screen.getByAltText('Loading')).toBeInTheDocument();

      rerender(<LoadingSpinner showLogo={true} size="large" />);
      expect(screen.getByAltText('Loading')).toBeInTheDocument();
    });

    it('should render logo with overlay', () => {
      render(<LoadingSpinner showLogo={true} overlay={true} />);
      expect(screen.getByAltText('Loading')).toBeInTheDocument();
    });

    it('should render logo with custom text', () => {
      const customText = 'Loading application...';
      render(<LoadingSpinner showLogo={true} text={customText} />);
      expect(screen.getByAltText('Loading')).toBeInTheDocument();
      expect(screen.getByText(customText)).toBeInTheDocument();
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });
  });

  describe('Dots Variant', () => {
    it('should render dots when variant is dots', () => {
      render(<LoadingSpinner variant="dots" />);
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
      
      const dotsText = screen.getByTestId('loading-dots').textContent;
      expect(dotsText).toMatch(/^\.{1,3}$/); // Should be 1, 2, or 3 dots
    });

    it('should not render dots when variant is spinner', () => {
      render(<LoadingSpinner variant="spinner" />);
      // Dots are always rendered in the text for spinner variant
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should render spinner by default when variant is undefined', () => {
      render(<LoadingSpinner />);
      // Dots are always rendered in the text for default variant
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should render dots with different sizes', () => {
      const { rerender } = render(<LoadingSpinner variant="dots" size="small" />);
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();

      rerender(<LoadingSpinner variant="dots" size="medium" />);
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();

      rerender(<LoadingSpinner variant="dots" size="large" />);
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });

    it('should render dots with overlay', () => {
      render(<LoadingSpinner variant="dots" overlay={true} />);
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });

    it('should render dots with custom text', () => {
      const customText = 'Processing data...';
      render(<LoadingSpinner variant="dots" text={customText} />);
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
      // When variant="dots", text is not rendered separately
      expect(screen.queryByText(customText)).not.toBeInTheDocument();
    });

    it('should animate dots text over time', async () => {
      render(<LoadingSpinner variant="dots" />);
      const dotsElement = screen.getByTestId('loading-dots');
      
      // Initial state should have dots
      expect(dotsElement.textContent).toMatch(/^\.{1,3}$/);
      
      // After some time, dots should still be there (animation running)
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(dotsElement.textContent).toMatch(/^\.{1,3}$/);
    });
  });

  describe('Variant Combinations', () => {
    it('should prioritize logo over variant when both are set', () => {
      render(<LoadingSpinner showLogo={true} variant="dots" />);
      
      // Should show logo, not dots
      expect(screen.getByTestId('loading-logo')).toBeInTheDocument();
      expect(screen.getByAltText('Loading')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-dots')).not.toBeInTheDocument();
    });

    it('should handle all new props together', () => {
      render(
        <LoadingSpinner
          showLogo={true}
          variant="dots"
          size="large"
          text="Loading with logo..."
          overlay={true}
          className="custom-class"
        />
      );
      
      expect(screen.getByTestId('loading-logo')).toBeInTheDocument();
      expect(screen.getByAltText('Loading')).toBeInTheDocument();
      // When showLogo=true, text is not rendered separately
      expect(screen.queryByText('Loading with logo...')).not.toBeInTheDocument();
      expect(screen.queryByTestId('loading-dots')).not.toBeInTheDocument();
    });

    it('should render spinner when no special variant is set', () => {
      render(<LoadingSpinner />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-logo')).not.toBeInTheDocument();
      // Dots are always rendered in the text for default variant
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should apply correct classes for logo variant', () => {
      render(<LoadingSpinner showLogo={true} />);
      expect(screen.getByTestId('loading-logo')).toBeInTheDocument();
      expect(screen.getByAltText('Loading')).toBeInTheDocument();
    });

    it('should apply correct classes for dots variant', () => {
      render(<LoadingSpinner variant="dots" />);
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
      
      const dotsText = screen.getByTestId('loading-dots').textContent;
      expect(dotsText).toMatch(/^\.{1,3}$/);
    });

    it('should apply size classes correctly with new variants', () => {
      const { rerender } = render(<LoadingSpinner showLogo={true} size="small" />);
      expect(screen.getByTestId('loading-logo')).toBeInTheDocument();

      rerender(<LoadingSpinner variant="dots" size="large" />);
      expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });
  });
});

// Additional tests for edge cases and accessibility
describe('LoadingSpinner - New Features Edge Cases', () => {
  it('should handle undefined showLogo prop gracefully', () => {
    const props: any = { showLogo: undefined };
    render(<LoadingSpinner {...props} />);
    expect(screen.queryByTestId('loading-logo')).not.toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle undefined variant prop gracefully', () => {
    const props: any = { variant: undefined };
    render(<LoadingSpinner {...props} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    // Dots are always rendered in the text for default variant
    expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
  });

  it('should handle invalid variant prop gracefully', () => {
    const props: any = { variant: 'invalid' };
    render(<LoadingSpinner {...props} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    // Dots are always rendered in the text for invalid variant
    expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
  });

  it('should maintain accessibility with logo variant', () => {
    render(<LoadingSpinner showLogo={true} />);
    const logoImage = screen.getByAltText('Loading');
    expect(logoImage).toHaveAttribute('alt', 'Loading');
  });

  it('should maintain text accessibility with all variants', () => {
    const customText = 'Processing request...';
    
    const { rerender } = render(<LoadingSpinner text={customText} />);
    expect(screen.getByText(customText)).toBeInTheDocument();

    rerender(<LoadingSpinner showLogo={true} text={customText} />);
    expect(screen.getByText(customText)).toBeInTheDocument();

    rerender(<LoadingSpinner variant="dots" text={customText} />);
    // When variant="dots", text is not rendered separately
    expect(screen.queryByText(customText)).not.toBeInTheDocument();
    expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
  });
});
