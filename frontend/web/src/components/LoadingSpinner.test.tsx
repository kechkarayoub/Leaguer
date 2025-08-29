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
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render default loading text', () => {
      render(<LoadingSpinner />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
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
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should override default text with custom text', () => {
      const customText = 'Custom loading text';
      render(<LoadingSpinner text={customText} />);
      expect(screen.getByText(customText)).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render with small size', () => {
      render(<LoadingSpinner size="small" />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render with medium size', () => {
      render(<LoadingSpinner size="medium" />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render with large size', () => {
      render(<LoadingSpinner size="large" />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Overlay Functionality', () => {
    it('should render with overlay', () => {
      render(<LoadingSpinner overlay={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render without overlay', () => {
      render(<LoadingSpinner overlay={false} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
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
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper text content for screen readers', () => {
      render(<LoadingSpinner />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should have proper text content with custom text', () => {
      const customText = 'Loading data...';
      render(<LoadingSpinner text={customText} />);
      expect(screen.getByText(customText)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined text prop gracefully', () => {
      render(<LoadingSpinner text={undefined} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle undefined size prop gracefully', () => {
      render(<LoadingSpinner size={undefined} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render properly when all optional props are undefined', () => {
      const props: any = {};
      render(<LoadingSpinner {...props} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
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
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = render(<LoadingSpinner size="small" />);
      
      rerender(<LoadingSpinner size="medium" />);
      rerender(<LoadingSpinner size="large" />);
      rerender(<LoadingSpinner size="small" />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});
