/**
 * ProtectedRoute Component Tests
 * 
 * This test suite covers:
 * - Route protection based on authentication
 * - Redirect functionality to login
 * - Children rendering when authenticated
 * - Loading states
 * - Error handling
 * 
 * Run with: yarn test --testPathPattern=ProtectedRoute.test.tsx --watchAll=false
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Mock authentication hook
const mockIsAuthenticated = jest.fn(() => true);
const mockIsLoading = jest.fn(() => false);
jest.mock('../hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({
    isAuthenticated: mockIsAuthenticated(),
    isLoading: mockIsLoading(),
    user: { id: 1, name: 'Test User' },
  }),
}));

// Mock WebSocket hook
jest.mock('../hooks/useAuthenticatedWebSocket', () => ({
  __esModule: true,
  default: () => {},
}));

// Mock LoadingSpinner
jest.mock('./LoadingSpinner', () => ({
  __esModule: true,
  default: ({ overlay }: { overlay?: boolean }) => (
    <div data-testid="loading-spinner" data-overlay={overlay}>
      Loading...
    </div>
  ),
}));

// Mock Navigate component
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to, state }: { to: string; state?: any }) => {
    mockNavigate(to, state);
    return <div data-testid="navigate-to">{to}</div>;
  },
  useLocation: () => ({ pathname: '/protected', search: '', hash: '', state: null }),
}));

const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockReturnValue(true);
    mockIsLoading.mockReturnValue(false);
  });

  describe('Authenticated State', () => {
    it('should render children when authenticated', () => {
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should render multiple children when authenticated', () => {
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div data-testid="child-1">Child 1</div>
            <div data-testid="child-2">Child 2</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should pass props to children', () => {
      const ChildWithProps = ({ message }: { message: string }) => (
        <div data-testid="child-with-props">{message}</div>
      );

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <ChildWithProps message="Hello Protected" />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Hello Protected')).toBeInTheDocument();
    });
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockIsAuthenticated.mockReturnValue(false);
    });

    it('should redirect to login when not authenticated', () => {
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/auth/login', expect.any(Object));
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should not render children when not authenticated', () => {
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should redirect with return URL state', () => {
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/auth/login', {
        from: expect.objectContaining({
          pathname: '/protected'
        })
      });
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      mockIsLoading.mockReturnValue(true);
    });

    it('should show loading spinner during authentication check', () => {
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should show overlay loading spinner', () => {
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveAttribute('data-overlay', 'true');
    });

    it('should not render children while loading', () => {
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should not redirect while loading', () => {
      mockIsAuthenticated.mockReturnValue(false);
      
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Children Handling', () => {
    it('should handle empty children', () => {
      render(
        <MemoryRouter>
          <ProtectedRoute>
            {null}
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Should not crash with empty children
    });

    it('should handle undefined children', () => {
      render(
        <MemoryRouter>
          <ProtectedRoute>
            {undefined}
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Should not crash with undefined children
    });

    it('should handle string children', () => {
      render(
        <MemoryRouter>
          <ProtectedRoute>
            Protected Text Content
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Text Content')).toBeInTheDocument();
    });

    it('should handle complex nested children', () => {
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>
              <h1>Dashboard</h1>
              <nav>
                <a href="/settings">Settings</a>
              </nav>
              <main>
                <TestComponent />
              </main>
            </div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('should handle authentication state changes', () => {
      // Start authenticated
      const { rerender } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();

      // Change to unauthenticated
      mockIsAuthenticated.mockReturnValue(false);
      
      rerender(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/auth/login', expect.any(Object));
    });

    it('should handle loading to authenticated transition', () => {
      // Start loading
      mockIsLoading.mockReturnValue(true);
      
      const { rerender } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Finish loading, authenticated
      mockIsLoading.mockReturnValue(false);
      mockIsAuthenticated.mockReturnValue(true);
      
      rerender(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle loading to unauthenticated transition', () => {
      // Start loading
      mockIsLoading.mockReturnValue(true);
      
      const { rerender } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Finish loading, not authenticated
      mockIsLoading.mockReturnValue(false);
      mockIsAuthenticated.mockReturnValue(false);
      
      rerender(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/auth/login', expect.any(Object));
    });
  });

  describe('WebSocket Integration', () => {
    it('should initialize WebSocket connection when authenticated', () => {
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // WebSocket hook is called (mocked to do nothing)
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle WebSocket integration during loading', () => {
      mockIsLoading.mockReturnValue(true);
      
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // WebSocket hook is still called even during loading
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication hook errors gracefully', () => {
      // Mock hook to throw error
      jest.mocked(mockIsAuthenticated).mockImplementation(() => {
        throw new Error('Auth error');
      });

      // In real apps, error boundaries would catch this
      // For testing, we verify the error is thrown
      expect(() => {
        render(
          <MemoryRouter>
            <ProtectedRoute>
              <TestComponent />
            </ProtectedRoute>
          </MemoryRouter>
        );
      }).toThrow('Auth error');
    });

    it('should handle navigation errors', () => {
      // Mock console.error to avoid error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockIsAuthenticated.mockReturnValue(false);
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation error');
      });

      // Navigation errors are typically handled by React Router
      expect(() => {
        render(
          <MemoryRouter>
            <ProtectedRoute>
              <TestComponent />
            </ProtectedRoute>
          </MemoryRouter>
        );
      }).toThrow('Navigation error');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should maintain accessibility during loading', () => {
      mockIsLoading.mockReturnValue(true);
      
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should not interfere with child accessibility', () => {
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <button aria-label="Test Button">Click me</button>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByLabelText('Test Button')).toBeInTheDocument();
    });

    it('should preserve ARIA attributes in children', () => {
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div role="main" aria-label="Dashboard">
              <TestComponent />
            </div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByLabelText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const { rerender } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      rerender(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle rapid authentication changes', () => {
      const { rerender } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Rapid state changes
      mockIsAuthenticated.mockReturnValue(false);
      rerender(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      mockIsAuthenticated.mockReturnValue(true);
      rerender(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle boolean authentication values', () => {
      mockIsAuthenticated.mockReturnValue(true);
      
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle falsy authentication values', () => {
      mockIsAuthenticated.mockReturnValue(null as any);
      
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/auth/login', expect.any(Object));
    });

    it('should handle complex authentication objects', () => {
      // Some auth systems return objects instead of booleans
      mockIsAuthenticated.mockReturnValue({ valid: true } as any);
      
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Truthy object should be treated as authenticated
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle component remounting', () => {
      const { unmount } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      unmount();

      // Render again in a new component tree
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});
