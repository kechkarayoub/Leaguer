/**
 * UserIcon Component Tests
 * 
 * This test suite covers:
 * - Component rendering with various props
 * - SVG attributes and structure
 * - Accessibility features
 * - Styling and size customization
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import UserIcon from './UserIcon';

describe('UserIcon', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<UserIcon />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<UserIcon className="custom-class" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveClass('custom-class');
    });

    it('should render with default size when no size prop provided', () => {
      render(<UserIcon />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('width', '24');
      expect(svg).toHaveAttribute('height', '24');
    });

    it('should render with custom size', () => {
      render(<UserIcon size={32} />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('width', '32');
      expect(svg).toHaveAttribute('height', '32');
    });
  });

  describe('SVG Attributes', () => {
    it('should have correct SVG attributes', () => {
      render(<UserIcon />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    });

    it('should contain the correct SVG structure', () => {
      render(<UserIcon />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg.tagName).toBe('svg');
      
      // Verify the SVG contains the expected path content (user icon)
      expect(svg.innerHTML).toContain('M16 7a4 4 0 11-8 0 4 4 0 018 0z');
      expect(svg.innerHTML).toContain('M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z');
      expect(svg.innerHTML).toContain('stroke-linecap="round"');
      expect(svg.innerHTML).toContain('stroke-linejoin="round"');
      expect(svg.innerHTML).toContain('stroke-width="2"');
    });
  });

  describe('Styling', () => {
    it('should apply both default and custom classes', () => {
      render(<UserIcon className="my-custom-class another-class" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveClass('my-custom-class');
      expect(svg).toHaveClass('another-class');
    });

    it('should handle empty className prop', () => {
      render(<UserIcon className="" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('class', '');
    });
  });

  describe('Size Variations', () => {
    it('should render with small size', () => {
      render(<UserIcon size={16} />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('width', '16');
      expect(svg).toHaveAttribute('height', '16');
    });

    it('should render with large size', () => {
      render(<UserIcon size={48} />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('width', '48');
      expect(svg).toHaveAttribute('height', '48');
    });

    it('should handle zero size', () => {
      render(<UserIcon size={0} />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('width', '0');
      expect(svg).toHaveAttribute('height', '0');
    });
  });

  describe('Icon Structure', () => {
    it('should be an SVG element', () => {
      render(<UserIcon />);
      
      const svg = screen.getByRole('img');
      expect(svg.tagName).toBe('svg');
    });

    it('should have exactly one path element', () => {
      render(<UserIcon />);
      
      const svg = screen.getByRole('img');
      // Verify single path by checking innerHTML structure (user icon has head + body as one path)
      const pathMatches = (svg.innerHTML.match(/<path/g) || []).length;
      expect(pathMatches).toBe(1);
    });
  });

  describe('Component Props', () => {
    it('should handle undefined props gracefully', () => {
      render(<UserIcon className={undefined} size={undefined} />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '24'); // default size
      expect(svg).toHaveAttribute('height', '24'); // default size
      expect(svg).toHaveAttribute('class', ''); // default className
    });
  });

  describe('User Icon Semantics', () => {
    it('should represent a person/user profile icon', () => {
      render(<UserIcon />);
      
      const svg = screen.getByRole('img');
      // The user icon should contain head circle and body/shoulders in one path
      expect(svg.innerHTML).toContain('M16 7a4 4 0 11-8 0'); // Head circle path
      expect(svg.innerHTML).toContain('M12 14a7 7 0 00-7 7h14'); // Body/shoulders path
    });
  });
});
