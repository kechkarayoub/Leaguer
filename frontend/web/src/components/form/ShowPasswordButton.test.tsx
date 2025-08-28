/**
 * ShowPasswordButton Component Tests
 * 
 * This test suite covers:
 * - Component rendering and state management
 * - Toggle functionality between show/hide states
 * - Icon switching based on state
 * - Click event handling and callbacks
 * - Prop handling and custom classes
 * - Accessibility features
 * 
 * Run with: yarn test --testPathPattern=ShowPasswordButton.test.tsx --watchAll=false
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShowPasswordButton from './ShowPasswordButton';

describe('ShowPasswordButton', () => {
  const defaultProps = {
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<ShowPasswordButton {...defaultProps} />);
      
      const button = screen.getByTestId('show-password-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('form-input-button');
    });

    it('should render with custom className', () => {
      render(<ShowPasswordButton {...defaultProps} className="custom-class" />);
      
      const button = screen.getByTestId('show-password-button');
      expect(button).toHaveClass('form-input-button', 'custom-class');
    });

    it('should render eye icon when password is hidden (default state)', () => {
      render(<ShowPasswordButton {...defaultProps} />);
      
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('eye-off-icon')).not.toBeInTheDocument();
    });

    it('should render eye-off icon when password is shown', () => {
      render(<ShowPasswordButton {...defaultProps} value={true} />);
      
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('eye-icon')).not.toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should initialize with value prop', () => {
      render(<ShowPasswordButton {...defaultProps} value={false} />);
      
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('eye-off-icon')).not.toBeInTheDocument();
    });

    it('should initialize with true value prop', () => {
      render(<ShowPasswordButton {...defaultProps} value={true} />);
      
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('eye-icon')).not.toBeInTheDocument();
    });

    it('should toggle internal state on click', async () => {
      render(<ShowPasswordButton {...defaultProps} value={false} />);
      
      const button = screen.getByTestId('show-password-button');
      
      // Initially shows eye icon (password hidden)
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('eye-off-icon')).not.toBeInTheDocument();
      
      // Click to toggle
      await userEvent.click(button);
      
      // Now shows eye-off icon (password shown)
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('eye-icon')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClick with true when clicked from hidden state', async () => {
      render(<ShowPasswordButton {...defaultProps} value={false} />);
      
      const button = screen.getByTestId('show-password-button');
      await userEvent.click(button);
      
      expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
      expect(defaultProps.onClick).toHaveBeenCalledWith(true);
    });

    it('should call onClick with false when clicked from shown state', async () => {
      render(<ShowPasswordButton {...defaultProps} value={true} />);
      
      const button = screen.getByTestId('show-password-button');
      await userEvent.click(button);
      
      expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
      expect(defaultProps.onClick).toHaveBeenCalledWith(false);
    });

    it('should toggle multiple times correctly', async () => {
      render(<ShowPasswordButton {...defaultProps} value={false} />);
      
      const button = screen.getByTestId('show-password-button');
      
      // First click: false -> true
      await userEvent.click(button);
      expect(defaultProps.onClick).toHaveBeenLastCalledWith(true);
      
      // Second click: true -> false
      await userEvent.click(button);
      expect(defaultProps.onClick).toHaveBeenLastCalledWith(false);
      
      // Third click: false -> true
      await userEvent.click(button);
      expect(defaultProps.onClick).toHaveBeenLastCalledWith(true);
      
      expect(defaultProps.onClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    it('should be a button element', () => {
      render(<ShowPasswordButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have button type', () => {
      render(<ShowPasswordButton {...defaultProps} />);
      
      const button = screen.getByTestId('show-password-button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should have proper aria-label for hidden password', () => {
      render(<ShowPasswordButton {...defaultProps} value={false} />);
      
      const button = screen.getByTestId('show-password-button');
      expect(button).toHaveAttribute('aria-label', 'Show password');
    });

    it('should have proper aria-label for shown password', () => {
      render(<ShowPasswordButton {...defaultProps} value={true} />);
      
      const button = screen.getByTestId('show-password-button');
      expect(button).toHaveAttribute('aria-label', 'Hide password');
    });

    it('should be keyboard accessible', async () => {
      render(<ShowPasswordButton {...defaultProps} />);
      
      const button = screen.getByTestId('show-password-button');
      
      // Focus the button
      button.focus();
      expect(button).toHaveFocus();
      
      // Press Enter
      await userEvent.keyboard('{Enter}');
      expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
    });

    it('should be clickable with space key', async () => {
      render(<ShowPasswordButton {...defaultProps} />);
      
      const button = screen.getByTestId('show-password-button');
      button.focus();
      
      // Press Space
      await userEvent.keyboard(' ');
      expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Icon Properties', () => {
    it('should render eye icon with correct test id', () => {
      render(<ShowPasswordButton {...defaultProps} value={false} />);
      
      const eyeIcon = screen.getByTestId('eye-icon');
      expect(eyeIcon).toHaveAttribute('fill', 'none');
      expect(eyeIcon).toHaveAttribute('stroke', 'currentColor');
      expect(eyeIcon).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should render eye-off icon with correct test id', () => {
      render(<ShowPasswordButton {...defaultProps} value={true} />);
      
      const eyeOffIcon = screen.getByTestId('eye-off-icon');
      expect(eyeOffIcon).toHaveAttribute('fill', 'none');
      expect(eyeOffIcon).toHaveAttribute('stroke', 'currentColor');
      expect(eyeOffIcon).toHaveAttribute('viewBox', '0 0 24 24');
    });
  });

  describe('Component Behavior', () => {
    it('should maintain internal state independently of value prop changes', async () => {
      const { rerender } = render(<ShowPasswordButton {...defaultProps} value={false} />);
      
      const button = screen.getByTestId('show-password-button');
      
      // Click to change internal state
      await userEvent.click(button);
      expect(defaultProps.onClick).toHaveBeenCalledWith(true);
      
      // Re-render with same value prop
      rerender(<ShowPasswordButton {...defaultProps} value={false} />);
      
      // Internal state should have changed (showing eye-off icon)
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('eye-icon')).not.toBeInTheDocument();
    });

    it('should reset internal state when value prop changes', () => {
      const { rerender } = render(<ShowPasswordButton {...defaultProps} value={false} />);
      
      // Re-render with different value
      rerender(<ShowPasswordButton {...defaultProps} value={true} />);
      
      // Should show eye-off icon (new value prop)
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('eye-icon')).not.toBeInTheDocument();
    });

    it('should update aria-label when state changes', async () => {
      render(<ShowPasswordButton {...defaultProps} value={false} />);
      
      const button = screen.getByTestId('show-password-button');
      
      // Initially "Show password"
      expect(button).toHaveAttribute('aria-label', 'Show password');
      
      // Click to toggle
      await userEvent.click(button);
      
      // Should now be "Hide password"
      expect(button).toHaveAttribute('aria-label', 'Hide password');
    });
  });
});
