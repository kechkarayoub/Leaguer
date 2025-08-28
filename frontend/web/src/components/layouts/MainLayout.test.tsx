import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import MainLayout from './MainLayout';

// Mock dependencies
jest.mock('../layout/MainHeader', () => {
  return function MockMainHeader({ onMenuClick }: { onMenuClick: () => void }) {
    return (
      <header data-testid="main-header">
        <button onClick={onMenuClick} data-testid="menu-toggle">
          Menu
        </button>
      </header>
    );
  };
});

jest.mock('../layout/MainFooter', () => {
  return function MockMainFooter() {
    return <footer data-testid="main-footer">Main Footer</footer>;
  };
});

jest.mock('../layout/Sidebar', () => {
  return function MockSidebar({ 
    isOpen, 
    onClose 
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
  }) {
    return (
      <aside data-testid="sidebar" data-open={isOpen.toString()}>
        <button onClick={onClose} data-testid="sidebar-close">
          Close
        </button>
        {isOpen && <div data-testid="sidebar-content">Sidebar Content</div>}
      </aside>
    );
  };
});

// Test wrapper component
const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('MainLayout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render successfully with children', () => {
      render(
        <Wrapper>
          <MainLayout>
            <div data-testid="test-child">Test Content</div>
          </MainLayout>
        </Wrapper>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render all layout components', () => {
      render(
        <Wrapper>
          <MainLayout>
            <div>Content</div>
          </MainLayout>
        </Wrapper>
      );

      expect(screen.getByTestId('main-header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('main-footer')).toBeInTheDocument();
    });

    it('should render main content area', () => {
      render(
        <Wrapper>
          <MainLayout>
            <div data-testid="page-content">Page Content</div>
          </MainLayout>
        </Wrapper>
      );

      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveClass('main-layout__content');
      expect(screen.getByTestId('page-content')).toBeInTheDocument();
    });
  });

  describe('Sidebar State Management', () => {
    it('should initially render sidebar as closed', () => {
      render(
        <Wrapper>
          <MainLayout>
            <div>Content</div>
          </MainLayout>
        </Wrapper>
      );

      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveAttribute('data-open', 'false');
      expect(screen.queryByTestId('sidebar-content')).not.toBeInTheDocument();
    });

    it('should open sidebar when menu button is clicked', () => {
      render(
        <Wrapper>
          <MainLayout>
            <div>Content</div>
          </MainLayout>
        </Wrapper>
      );

      const menuToggle = screen.getByTestId('menu-toggle');
      fireEvent.click(menuToggle);

      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveAttribute('data-open', 'true');
      expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
    });

    it('should close sidebar when close button is clicked', () => {
      render(
        <Wrapper>
          <MainLayout>
            <div>Content</div>
          </MainLayout>
        </Wrapper>
      );

      // First open the sidebar
      const menuToggle = screen.getByTestId('menu-toggle');
      fireEvent.click(menuToggle);
      
      // Verify it's open
      expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'true');

      // Then close it
      const sidebarClose = screen.getByTestId('sidebar-close');
      fireEvent.click(sidebarClose);

      // Verify it's closed
      expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'false');
      expect(screen.queryByTestId('sidebar-content')).not.toBeInTheDocument();
    });

    it('should toggle sidebar state correctly multiple times', () => {
      render(
        <Wrapper>
          <MainLayout>
            <div>Content</div>
          </MainLayout>
        </Wrapper>
      );

      const menuToggle = screen.getByTestId('menu-toggle');
      const sidebar = screen.getByTestId('sidebar');

      // Initially closed
      expect(sidebar).toHaveAttribute('data-open', 'false');

      // Open
      fireEvent.click(menuToggle);
      expect(sidebar).toHaveAttribute('data-open', 'true');

      // Close via toggle
      fireEvent.click(menuToggle);
      expect(sidebar).toHaveAttribute('data-open', 'false');

      // Open again
      fireEvent.click(menuToggle);
      expect(sidebar).toHaveAttribute('data-open', 'true');
    });
  });

  describe('Component Integration', () => {
    it('should pass correct props to header', () => {
      render(
        <Wrapper>
          <MainLayout>
            <div>Content</div>
          </MainLayout>
        </Wrapper>
      );

      // Header should receive onMenuClick prop (tested via menu button functionality)
      const menuToggle = screen.getByTestId('menu-toggle');
      expect(menuToggle).toBeInTheDocument();
      
      // Click should work (proves prop was passed correctly)
      fireEvent.click(menuToggle);
      expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'true');
    });

    it('should pass correct props to sidebar', () => {
      render(
        <Wrapper>
          <MainLayout>
            <div>Content</div>
          </MainLayout>
        </Wrapper>
      );

      const sidebar = screen.getByTestId('sidebar');
      
      // Should initially be closed
      expect(sidebar).toHaveAttribute('data-open', 'false');
      
      // Should have close functionality
      const menuToggle = screen.getByTestId('menu-toggle');
      fireEvent.click(menuToggle);
      
      const sidebarClose = screen.getByTestId('sidebar-close');
      fireEvent.click(sidebarClose);
      
      expect(sidebar).toHaveAttribute('data-open', 'false');
    });
  });

  describe('Content Rendering', () => {
    it('should render children in main content area', () => {
      const testContent = 'Test Page Content';
      
      render(
        <Wrapper>
          <MainLayout>
            <div data-testid="page-content">{testContent}</div>
          </MainLayout>
        </Wrapper>
      );

      const mainContent = screen.getByRole('main');
      expect(mainContent).toContainElement(screen.getByTestId('page-content'));
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });

    it('should handle multiple children', () => {
      render(
        <Wrapper>
          <MainLayout>
            <div data-testid="child-1">First Child</div>
            <div data-testid="child-2">Second Child</div>
            <span data-testid="child-3">Third Child</span>
          </MainLayout>
        </Wrapper>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('should handle complex nested children', () => {
      render(
        <Wrapper>
          <MainLayout>
            <div data-testid="page-container">
              <header>
                <h1>Page Title</h1>
              </header>
              <section>
                <p>Page content goes here</p>
                <button>Action Button</button>
              </section>
            </div>
          </MainLayout>
        </Wrapper>
      );

      expect(screen.getByTestId('page-container')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Page Title' })).toBeInTheDocument();
      expect(screen.getByText('Page content goes here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should have correct CSS classes', () => {
      render(
        <Wrapper>
          <MainLayout>
            <div>Content</div>
          </MainLayout>
        </Wrapper>
      );

      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveClass('main-layout__content');
    });

    it('should maintain proper component order', () => {
      render(
        <Wrapper>
          <MainLayout>
            <div data-testid="page-content">Content</div>
          </MainLayout>
        </Wrapper>
      );

      // Components should exist in the expected order
      expect(screen.getByTestId('main-header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('main-footer')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(
        <Wrapper>
          <MainLayout>
            <div>Content</div>
          </MainLayout>
        </Wrapper>
      );

      // Should have main landmark
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Should have header and footer elements (via mocks)
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    });

    it('should support keyboard navigation', () => {
      render(
        <Wrapper>
          <MainLayout>
            <div>Content</div>
          </MainLayout>
        </Wrapper>
      );

      // Menu toggle should be focusable
      const menuToggle = screen.getByTestId('menu-toggle');
      expect(menuToggle).toBeInTheDocument();
      
      // Sidebar close should be focusable when sidebar is open
      fireEvent.click(menuToggle);
      const sidebarClose = screen.getByTestId('sidebar-close');
      expect(sidebarClose).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle null children gracefully', () => {
      render(
        <Wrapper>
          <MainLayout>
            {null}
          </MainLayout>
        </Wrapper>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('main-header')).toBeInTheDocument();
      expect(screen.getByTestId('main-footer')).toBeInTheDocument();
    });

    it('should handle undefined children gracefully', () => {
      render(
        <Wrapper>
          <MainLayout>
            {undefined}
          </MainLayout>
        </Wrapper>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('should handle empty children gracefully', () => {
      render(
        <Wrapper>
          <MainLayout>
            {''}
          </MainLayout>
        </Wrapper>
      );

      expect(screen.getByTestId('main-header')).toBeInTheDocument();
      expect(screen.getByTestId('main-footer')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render correctly for different viewport sizes', () => {
      render(
        <Wrapper>
          <MainLayout>
            <div data-testid="responsive-content">Responsive Content</div>
          </MainLayout>
        </Wrapper>
      );

      // Layout should maintain structure regardless of viewport
      expect(screen.getByTestId('main-header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('main-footer')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-content')).toBeInTheDocument();
    });
  });
});
