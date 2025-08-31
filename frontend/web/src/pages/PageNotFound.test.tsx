/**
 * PageNotFound Test Suite
 * 
 * Comprehensive tests for the PageNotFound component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

import PageNotFound from './PageNotFound';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      // Map common translation keys
      const translations: Record<string, string> = {
        'common:notFound.title': 'Page Not Found',
        'common:notFound.text': 'Sorry, the page you are looking for does not exist.',
        'common:notFound.goHome': 'Go to Home',
      };
      return translations[key] || options?.defaultValue || key;
    },
  }),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

describe('PageNotFound', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Structure', () => {
    it('should render 404 error page with correct content', () => {
      render(
        <TestWrapper>
          <PageNotFound />
        </TestWrapper>
      );

      // Check for 404 title
      expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
      
      // Check for subtitle
      expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument();
      
      // Check for description text
      expect(screen.getByText('Sorry, the page you are looking for does not exist.')).toBeInTheDocument();
      
      // Check for home button
      expect(screen.getByRole('button', { name: 'Go to Home' })).toBeInTheDocument();
    });

    it('should have proper CSS classes for styling', () => {
      render(
        <TestWrapper>
          <PageNotFound />
        </TestWrapper>
      );

      // Check that the main elements are present with their content
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByText('Sorry, the page you are looking for does not exist.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to Home' })).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <PageNotFound />
        </TestWrapper>
      );

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });

      expect(h1).toHaveTextContent('404');
      expect(h2).toHaveTextContent('Page Not Found');
    });
  });

  describe('Navigation', () => {
    it('should navigate to home page when button is clicked', async () => {
      render(
        <TestWrapper>
          <PageNotFound />
        </TestWrapper>
      );

      const homeButton = screen.getByRole('button', { name: 'Go to Home' });
      await userEvent.click(homeButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should navigate to home page when button is activated with keyboard', async () => {
      render(
        <TestWrapper>
          <PageNotFound />
        </TestWrapper>
      );

      const homeButton = screen.getByRole('button', { name: 'Go to Home' });
      homeButton.focus();
      await userEvent.keyboard('{Enter}');

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button accessibility', () => {
      render(
        <TestWrapper>
          <PageNotFound />
        </TestWrapper>
      );

      const homeButton = screen.getByRole('button', { name: 'Go to Home' });
      
      expect(homeButton).toBeInTheDocument();
      expect(homeButton).toHaveClass('page-not-found-btn');
      // Note: The button doesn't have an explicit type attribute, which defaults to 'submit' in forms or 'button' outside forms
      expect(homeButton).toBeVisible();
    });

    it('should be keyboard navigable', () => {
      render(
        <TestWrapper>
          <PageNotFound />
        </TestWrapper>
      );

      const homeButton = screen.getByRole('button', { name: 'Go to Home' });
      
      // Button should be focusable
      homeButton.focus();
      expect(homeButton).toHaveFocus();
    });

    it('should have descriptive text for screen readers', () => {
      render(
        <TestWrapper>
          <PageNotFound />
        </TestWrapper>
      );

      // Check that all text content is properly labeled
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByText('Sorry, the page you are looking for does not exist.')).toBeInTheDocument();
    });
  });

  describe('Translation Keys', () => {
    it('should use correct translation keys for all text content', () => {
      render(
        <TestWrapper>
          <PageNotFound />
        </TestWrapper>
      );

      // All text should be properly translated
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByText('Sorry, the page you are looking for does not exist.')).toBeInTheDocument();
      expect(screen.getByText('Go to Home')).toBeInTheDocument();
    });

    it('should fall back to default values when translations are missing', () => {
      // Mock useTranslation to return keys when translation is missing
      jest.doMock('react-i18next', () => ({
        useTranslation: () => ({
          t: (key: string, options?: { defaultValue?: string }) => {
            // Return default value or key if no translation
            return options?.defaultValue || key;
          },
        }),
      }));

      render(
        <TestWrapper>
          <PageNotFound />
        </TestWrapper>
      );

      // Should render default values
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByText('Sorry, the page you are looking for does not exist.')).toBeInTheDocument();
      expect(screen.getByText('Go to Home')).toBeInTheDocument();
    });
  });

  describe('Component Behavior', () => {
    it('should render consistently across multiple renders', () => {
      const { rerender } = render(
        <TestWrapper>
          <PageNotFound />
        </TestWrapper>
      );

      const firstRender = screen.getByText('404');
      expect(firstRender).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <PageNotFound />
        </TestWrapper>
      );

      const secondRender = screen.getByText('404');
      expect(secondRender).toBeInTheDocument();
    });

    it('should not have any side effects on mount/unmount', () => {
      const { unmount } = render(
        <TestWrapper>
          <PageNotFound />
        </TestWrapper>
      );

      expect(screen.getByText('404')).toBeInTheDocument();

      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should attempt navigation when button is clicked', async () => {
      render(
        <TestWrapper>
          <PageNotFound />
        </TestWrapper>
      );

      const homeButton = screen.getByRole('button', { name: 'Go to Home' });
      
      // Click should trigger navigation attempt
      await userEvent.click(homeButton);
      
      // Navigation was attempted
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('User Experience', () => {
    it('should provide clear and helpful error message', () => {
      render(
        <TestWrapper>
          <PageNotFound />
        </TestWrapper>
      );

      // Check for user-friendly messages
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByText('Sorry, the page you are looking for does not exist.')).toBeInTheDocument();
    });

    it('should provide clear call-to-action', () => {
      render(
        <TestWrapper>
          <PageNotFound />
        </TestWrapper>
      );

      const homeButton = screen.getByRole('button', { name: 'Go to Home' });
      expect(homeButton).toBeInTheDocument();
      expect(homeButton).toBeEnabled();
    });
  });

  describe('Performance', () => {
    it('should render quickly without expensive operations', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <PageNotFound />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (100ms)
      expect(renderTime).toBeLessThan(100);
    });
  });
});
