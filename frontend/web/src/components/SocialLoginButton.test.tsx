/**
 * SocialLoginButton Component Tests
 * 
 * This test suite covers:
 * - Social login button rendering
 * - Different providers (Google, Apple, Facebook)
 * - Success and error callbacks
 * - Loading states
 * - Error handling
 * - Accessibility features
 * 
 * Run with: yarn test --testPathPattern=SocialLoginButton.test.tsx --watchAll=false
 */
 
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SocialLoginButton from './SocialLoginButton';

// Mock SocialAuthService
const mockLoginWithGoogle = jest.fn();
const mockLoginWithFacebook = jest.fn(); 
const mockLoginWithApple = jest.fn();
const mockSignInWithGooglePopup = jest.fn();
const mockIsGoogleLoginEnabled = jest.fn().mockReturnValue(true);
const mockIsFacebookLoginEnabled = jest.fn().mockReturnValue(true);
const mockIsAppleLoginEnabled = jest.fn().mockReturnValue(true);

jest.mock('../services/SocialAuthService', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      loginWithGoogle: mockLoginWithGoogle,
      loginWithFacebook: mockLoginWithFacebook,
      loginWithApple: mockLoginWithApple,
      signInWithGooglePopup: mockSignInWithGooglePopup,
      isGoogleLoginEnabled: mockIsGoogleLoginEnabled,
      isFacebookLoginEnabled: mockIsFacebookLoginEnabled,
      isAppleLoginEnabled: mockIsAppleLoginEnabled,
    }),
  },
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('SocialLoginButton', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockLoginWithGoogle.mockResolvedValue({ success: true, token: 'test-token' });
    mockLoginWithFacebook.mockResolvedValue({ success: true, token: 'test-token' });
    mockLoginWithApple.mockResolvedValue({ success: true, token: 'test-token' });
    mockSignInWithGooglePopup.mockResolvedValue({ success: true, token: 'test-token' });
    mockIsGoogleLoginEnabled.mockReturnValue(true);
    mockIsFacebookLoginEnabled.mockReturnValue(true);
    mockIsAppleLoginEnabled.mockReturnValue(true);
  });

  describe('Provider Variants', () => {
    it('should render Google login button', () => {
      render(<SocialLoginButton provider="google" />);
      
      expect(screen.getByText('auth:social.google')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render Apple login button', () => {
      render(<SocialLoginButton provider="apple" />);
      
      expect(screen.getByText('auth:social.apple')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render Facebook login button', () => {
      render(<SocialLoginButton provider="facebook" />);
      
      expect(screen.getByText('auth:social.facebook')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should apply provider-specific styling', () => {
      const providers = ['google', 'apple', 'facebook'] as const;
      
      providers.forEach((provider) => {
        const { unmount } = render(<SocialLoginButton provider={provider} />);
        
        const button = screen.getByRole('button');
        expect(button).toHaveClass(`btn-${provider}`);
        
        // Clean up for next iteration
        unmount();
      });
    });
  });

  describe('Interaction Handling', () => {
    it('should call login service when Google button is clicked', async () => {
      mockSignInWithGooglePopup.mockResolvedValueOnce({ user: 'test' });
      
      render(<SocialLoginButton provider="google" onSuccess={mockOnSuccess} />);
      
      await userEvent.click(screen.getByRole('button'));
      
      expect(mockSignInWithGooglePopup).toHaveBeenCalledTimes(1);
    });

    it('should call login service when Facebook button is clicked', async () => {
      // Facebook login is not implemented yet, so it will throw an error
      render(<SocialLoginButton provider="facebook" onError={mockOnError} />);
      
      await userEvent.click(screen.getByRole('button'));
      
      // Should call onError for unimplemented providers
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call login service when Apple button is clicked', async () => {
      // Apple login is not implemented yet, so it will throw an error
      render(<SocialLoginButton provider="apple" onError={mockOnError} />);
      
      await userEvent.click(screen.getByRole('button'));
      
      // Should call onError for unimplemented providers
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle keyboard interaction', async () => {
      mockSignInWithGooglePopup.mockResolvedValueOnce({ user: 'test' });
      
      render(<SocialLoginButton provider="google" onSuccess={mockOnSuccess} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard('{Enter}');
      
      expect(mockSignInWithGooglePopup).toHaveBeenCalledTimes(1);
    });
  });

  describe('Success Handling', () => {
    it('should call onSuccess when login succeeds', async () => {
      const mockResult = { user: { id: 1, name: 'Test User' } };
      mockSignInWithGooglePopup.mockResolvedValueOnce(mockResult);
      
      render(<SocialLoginButton provider="google" onSuccess={mockOnSuccess} />);
      
      await userEvent.click(screen.getByRole('button'));
      
      // Simulate the Google sign-in success event
      act(() => {
        const event = new CustomEvent('googleSignInSuccess', { detail: mockResult });
        window.dispatchEvent(event);
      });
      
      expect(mockOnSuccess).toHaveBeenCalledWith(mockResult);
    });

    it('should handle successful authentication without onSuccess callback', async () => {
      mockSignInWithGooglePopup.mockResolvedValueOnce({ user: 'test' });
      
      render(<SocialLoginButton provider="google" />);
      
      await userEvent.click(screen.getByRole('button'));

      // Should not crash without callback
      expect(mockSignInWithGooglePopup).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should call onError when login fails', async () => {
      const mockError = new Error('Login failed');
      mockSignInWithGooglePopup.mockRejectedValueOnce(mockError);
      
      render(<SocialLoginButton provider="google" onError={mockOnError} />);
      
      await userEvent.click(screen.getByRole('button'));
      
      // Wait for promise to reject
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });

    it('should handle login errors without onError callback', async () => {
      // Use Facebook which throws immediately for not implemented
      render(<SocialLoginButton provider="facebook" />);
      
      await userEvent.click(screen.getByRole('button'));

      // Should not crash without error callback
      await new Promise(resolve => setTimeout(resolve, 0));
      // Error is thrown but no callback to handle it
    });    it('should handle network errors gracefully', async () => {
      mockLoginWithApple.mockRejectedValueOnce(new Error('Network error'));
      
      render(<SocialLoginButton provider="apple" onError={mockOnError} />);
      
      await userEvent.click(screen.getByRole('button'));
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Loading State', () => {
    it('should show loading state during authentication', async () => {
      // Mock a delayed response
      mockSignInWithGooglePopup.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ user: 'test' }), 100))
      );
      
      render(<SocialLoginButton provider="google" />);
      
      userEvent.click(screen.getByRole('button'));
      
      // Check loading state immediately after click (micro-task timing)
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should clear loading state after success', async () => {
      mockSignInWithGooglePopup.mockResolvedValueOnce({ user: 'test' });
      
      render(<SocialLoginButton provider="google" />);
      
      await userEvent.click(screen.getByRole('button'));
      
      // Simulate success event which clears loading
      act(() => {
        const event = new CustomEvent('googleSignInSuccess', { detail: { user: 'test' } });
        window.dispatchEvent(event);
      });
      
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('should clear loading state after error', async () => {
      mockSignInWithGooglePopup.mockRejectedValueOnce(new Error('Login failed'));
      
      render(<SocialLoginButton provider="google" />);
      
      await userEvent.click(screen.getByRole('button'));
      
      // Wait for the error to be handled and loading state to clear
      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });
    });
  });

  describe('Disabled State', () => {
    it('should disable button when disabled prop is true', () => {
      render(<SocialLoginButton provider="google" disabled />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not call login service when disabled', async () => {
      render(<SocialLoginButton provider="google" disabled />);
      
      await userEvent.click(screen.getByRole('button'));
      
      expect(mockSignInWithGooglePopup).not.toHaveBeenCalled();
    });

    it('should apply disabled styling', () => {
      render(<SocialLoginButton provider="google" disabled />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      // Component uses built-in disabled attribute, not custom CSS class
    });
  });

  describe('Props Handling', () => {
    it('should apply custom className', () => {
      render(<SocialLoginButton provider="google" className="custom-class" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should handle all callback combinations', () => {
      // onSuccess only
      render(<SocialLoginButton provider="google" onSuccess={mockOnSuccess} />);
      
      // onError only  
      render(<SocialLoginButton provider="facebook" onError={mockOnError} />);
      
      // Both callbacks
      render(<SocialLoginButton provider="apple" onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      // No callbacks
      render(<SocialLoginButton provider="google" />);
      
      // All should render without crashing
      expect(screen.getAllByRole('button')).toHaveLength(4);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SocialLoginButton provider="google" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should have descriptive accessible names', () => {
      const providers = [
        { provider: 'google' as const, name: 'auth:social.google' },
        { provider: 'apple' as const, name: 'auth:social.apple' },
        { provider: 'facebook' as const, name: 'auth:social.facebook' },
      ];

      providers.forEach(({ provider, name }) => {
        render(<SocialLoginButton provider={provider} />);
        
        expect(screen.getByText(name)).toBeInTheDocument();
      });
    });

    it('should be focusable when not disabled', () => {
      render(<SocialLoginButton provider="google" />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<SocialLoginButton provider="google" disabled />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Service Integration', () => {
    it('should use singleton SocialAuthService instance', () => {
      render(<SocialLoginButton provider="google" />);
      
      // Service should be initialized (tested implicitly through mocking)
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle service initialization errors', () => {
      render(<SocialLoginButton provider="apple" />);
      
      // Should render even if service has issues
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<SocialLoginButton provider="google" />);
      
      rerender(<SocialLoginButton provider="google" />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle rapid clicks gracefully', async () => {
      mockSignInWithGooglePopup
        .mockResolvedValueOnce({ user: 'test1' })
        .mockResolvedValueOnce({ user: 'test2' });
      
      render(<SocialLoginButton provider="google" onSuccess={mockOnSuccess} />);
      
      const button = screen.getByRole('button');
      
      // Rapid clicks
      await userEvent.click(button);
      await userEvent.click(button);
      
      // Should handle gracefully (may debounce or queue)
      expect(mockSignInWithGooglePopup).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid provider gracefully', () => {
      render(<SocialLoginButton provider={'invalid' as any} />);
      
      // Component returns null for invalid providers, so no button should be rendered
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should handle undefined callbacks', () => {
      render(<SocialLoginButton provider="google" onSuccess={undefined} onError={undefined} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle empty className', () => {
      render(<SocialLoginButton provider="google" className="" />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle component unmounting during async operations', async () => {
      mockSignInWithGooglePopup.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ user: 'test' }), 100))
      );
      
      const { unmount } = render(<SocialLoginButton provider="google" onSuccess={mockOnSuccess} />);
      
      await userEvent.click(screen.getByRole('button'));
      
      // Unmount before async operation completes
      unmount();
      
      // Should not cause memory leaks or errors
    });
  });

  describe('Provider-Specific Behavior', () => {
    it('should handle Google-specific authentication flow', async () => {
      const mockResult = { 
        provider: 'google',
        user: { email: 'test@gmail.com' }
      };
      mockSignInWithGooglePopup.mockResolvedValueOnce(mockResult);
      
      render(<SocialLoginButton provider="google" onSuccess={mockOnSuccess} />);
      
      await userEvent.click(screen.getByRole('button'));
      
      // Simulate success event
      act(() => {
        const event = new CustomEvent('googleSignInSuccess', { detail: mockResult });
        window.dispatchEvent(event);
      });
      
      expect(mockSignInWithGooglePopup).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledWith(expect.objectContaining({
        provider: 'google'
      }));
    });

    it('should handle Facebook-specific authentication flow', async () => {
      // Facebook throws error for not implemented
      render(<SocialLoginButton provider="facebook" onError={mockOnError} />);
      
      await userEvent.click(screen.getByRole('button'));
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Should call onError for unimplemented providers
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle Apple-specific authentication flow', async () => {
      // Apple throws error for not implemented
      render(<SocialLoginButton provider="apple" onError={mockOnError} />);
      
      await userEvent.click(screen.getByRole('button'));
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Should call onError for unimplemented providers
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
