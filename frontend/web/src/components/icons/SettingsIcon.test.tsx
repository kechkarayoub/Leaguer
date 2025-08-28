/**
 * SettingsIcon Component Tests
 * 
 * This test suite covers:
 * - Component rendering with various props
 * - SVG attributes and structure
 * - Accessibility features
 * - Styling and size customization
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import SettingsIcon from './SettingsIcon';

describe('SettingsIcon', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<SettingsIcon />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<SettingsIcon className="custom-class" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveClass('custom-class');
    });

    it('should render with default size when no size prop provided', () => {
      render(<SettingsIcon />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('width', '24');
      expect(svg).toHaveAttribute('height', '24');
    });

    it('should render with custom size', () => {
      render(<SettingsIcon size={32} />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('width', '32');
      expect(svg).toHaveAttribute('height', '32');
    });
  });

  describe('SVG Attributes', () => {
    it('should have correct SVG attributes', () => {
      render(<SettingsIcon />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    });

    it('should contain the correct SVG structure', () => {
      render(<SettingsIcon />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg.tagName).toBe('svg');
      
      // Verify the SVG contains the expected path content (gear icon)
      expect(svg.innerHTML).toContain('M10.325 4.317c.426-1.756 2.924-1.756 3.35 0');
      expect(svg.innerHTML).toContain('M15 12a3 3 0 11-6 0 3 3 0 016 0z');
      expect(svg.innerHTML).toContain('stroke-linecap="round"');
      expect(svg.innerHTML).toContain('stroke-linejoin="round"');
      expect(svg.innerHTML).toContain('stroke-width="2"');
    });
  });

  describe('Styling', () => {
    it('should apply both default and custom classes', () => {
      render(<SettingsIcon className="my-custom-class another-class" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveClass('my-custom-class');
      expect(svg).toHaveClass('another-class');
    });

    it('should handle empty className prop', () => {
      render(<SettingsIcon className="" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('class', '');
    });
  });

  describe('Size Variations', () => {
    it('should render with small size', () => {
      render(<SettingsIcon size={16} />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('width', '16');
      expect(svg).toHaveAttribute('height', '16');
    });

    it('should render with large size', () => {
      render(<SettingsIcon size={48} />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('width', '48');
      expect(svg).toHaveAttribute('height', '48');
    });

    it('should handle zero size', () => {
      render(<SettingsIcon size={0} />);
      
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('width', '0');
      expect(svg).toHaveAttribute('height', '0');
    });
  });

  describe('Icon Structure', () => {
    it('should be an SVG element', () => {
      render(<SettingsIcon />);
      
      const svg = screen.getByRole('img');
      expect(svg.tagName).toBe('svg');
    });

    it('should have exactly two path elements', () => {
      render(<SettingsIcon />);
      
      const svg = screen.getByRole('img');
      // Verify two paths by checking innerHTML structure (gear outline + center circle)
      const pathMatches = (svg.innerHTML.match(/<path/g) || []).length;
      expect(pathMatches).toBe(2);
    });
  });

  describe('Component Props', () => {
    it('should handle undefined props gracefully', () => {
      render(<SettingsIcon className={undefined} size={undefined} />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '24'); // default size
      expect(svg).toHaveAttribute('height', '24'); // default size
      expect(svg).toHaveAttribute('class', ''); // default className
    });
  });

  describe('Settings Icon Semantics', () => {
    it('should represent a gear/cog settings icon', () => {
      render(<SettingsIcon />);
      
      const svg = screen.getByRole('img');
      // The settings icon should contain gear outline and center circle
      expect(svg.innerHTML).toContain('M10.325 4.317c.426-1.756'); // Gear outline path
      expect(svg.innerHTML).toContain('M15 12a3 3 0 11-6 0'); // Center circle path
    });
  });
});
