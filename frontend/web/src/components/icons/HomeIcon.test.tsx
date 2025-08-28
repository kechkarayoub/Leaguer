/**
 * HomeIcon Component Tests
 * 
 * This test suite covers:
 * - Component rendering with various props
 * - SVG attributes and structure
 * - Accessibility features
 * - Styling and size customization
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import HomeIcon from './HomeIcon';

describe('HomeIcon', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<HomeIcon />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<HomeIcon className="custom-class" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveClass('custom-class');
    });

    it('should render with default size when no size prop provided', () => {
      render(<HomeIcon />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('width', '24');
      expect(svg).toHaveAttribute('height', '24');
    });

    it('should render with custom size', () => {
      render(<HomeIcon size={32} />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('width', '32');
      expect(svg).toHaveAttribute('height', '32');
    });
  });

  describe('SVG Attributes', () => {
    it('should have correct SVG attributes', () => {
      render(<HomeIcon />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    });

    it('should contain the correct SVG structure', () => {
      render(<HomeIcon />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg.tagName).toBe('svg');
      
      // Verify the SVG contains the expected path content
      expect(svg.innerHTML).toContain('M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6');
      expect(svg.innerHTML).toContain('stroke-linecap="round"');
      expect(svg.innerHTML).toContain('stroke-linejoin="round"');
      expect(svg.innerHTML).toContain('stroke-width="2"');
    });
  });

  describe('Styling', () => {
    it('should apply both default and custom classes', () => {
      render(<HomeIcon className="my-custom-class another-class" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveClass('my-custom-class');
      expect(svg).toHaveClass('another-class');
    });

    it('should handle empty className prop', () => {
      render(<HomeIcon className="" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('class', '');
    });
  });

  describe('Size Variations', () => {
    it('should render with small size', () => {
      render(<HomeIcon size={16} />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('width', '16');
      expect(svg).toHaveAttribute('height', '16');
    });

    it('should render with large size', () => {
      render(<HomeIcon size={48} />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('width', '48');
      expect(svg).toHaveAttribute('height', '48');
    });

    it('should handle zero size', () => {
      render(<HomeIcon size={0} />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('width', '0');
      expect(svg).toHaveAttribute('height', '0');
    });
  });

  describe('Icon Structure', () => {
    it('should be an SVG element', () => {
      render(<HomeIcon />);
      
      const svg = screen.getByRole('img');
      expect(svg.tagName).toBe('svg');
    });

    it('should have exactly one path element', () => {
      render(<HomeIcon />);
      
      const svg = screen.getByRole('img');
      // Verify single path by checking innerHTML structure
      const pathMatches = (svg.innerHTML.match(/<path/g) || []).length;
      expect(pathMatches).toBe(1);
    });
  });

  describe('Component Props', () => {
    it('should handle undefined props gracefully', () => {
      render(<HomeIcon className={undefined} size={undefined} />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '24'); // default size
      expect(svg).toHaveAttribute('height', '24'); // default size
      expect(svg).toHaveAttribute('class', ''); // default className
    });
  });
});
