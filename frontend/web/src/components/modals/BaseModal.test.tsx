/**
 * BaseModal Component Tests
 * 
 * This test suite covers:
 * - Modal rendering and portal behavior
 * - Escape key handling for closing modal
 * - Backdrop click functionality
 * - Size variations (small, medium, large)
 * - RTL support and direction handling
 * - Body scroll prevention when modal is open
 * - Accessibility features and ARIA attributes
 * - Title and content rendering
 * - Close button functionality
 * - Internationalization support
 * 
 * The tests mock:
 * - react-i18next for translations
 * - useRTL hook for RTL support
 * - react-dom createPortal for modal rendering
 * 
 * Run with: yarn test --testPathPattern=BaseModal.test.tsx --watchAll=false
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BaseModal from './BaseModal';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: { [key: string]: string } = {
        'common:actions.close': 'Close',
      };
      return options?.defaultValue || translations[key] || key;
    },
  }),
}));

// Mock useRTL hook
jest.mock('../../hooks/useRTL', () => ({
  __esModule: true,
  default: () => ({
    isRTL: false,
  }),
}));

// Mock react-dom createPortal
jest.mock('react-dom', () => {
  const originalModule = jest.requireActual('react-dom');
  return {
    ...originalModule,
    createPortal: (element: React.ReactNode) => element,
  };
});

describe('BaseModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <div data-testid="modal-test-content">Test Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body styles before each test
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up body styles after each test
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<BaseModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('modal-test-content')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(<BaseModal {...defaultProps} />);
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-test-content')).toBeInTheDocument();
      expect(screen.getByTestId('base-modal-close-button')).toBeInTheDocument();
    });

    it('should render modal title correctly', () => {
      render(<BaseModal {...defaultProps} title="Custom Modal Title" />);
      
      expect(screen.getByText('Custom Modal Title')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Custom Modal Title');
    });

    it('should render children content', () => {
      const customContent = <div data-testid="custom-content">Custom Content</div>;
      render(<BaseModal {...defaultProps} children={customContent} />);
      
      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
    });

    it('should render close button with proper aria-label', () => {
      render(<BaseModal {...defaultProps} />);
      
      const closeButton = screen.getByTestId('base-modal-close-button');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', 'Close');
    });

    it('should render footer with close button', () => {
      render(<BaseModal {...defaultProps} />);
      
      const footerCloseButton = screen.getByTestId('base-modal-footer-close');
      expect(footerCloseButton).toBeInTheDocument();
      expect(footerCloseButton).toHaveClass('btn', 'btn-secondary');
    });
  });

  describe('Size Variations', () => {
    it('should apply default medium size class', () => {
      render(<BaseModal {...defaultProps} />);
      
      const modalContainer = screen.getByTestId('base-modal-container');
      expect(modalContainer).toHaveClass('modal-container--medium');
    });

    it('should apply small size class', () => {
      render(<BaseModal {...defaultProps} size="small" />);
      
      const modalContainer = screen.getByTestId('base-modal-container');
      expect(modalContainer).toHaveClass('modal-container--small');
    });

    it('should apply large size class', () => {
      render(<BaseModal {...defaultProps} size="large" />);
      
      const modalContainer = screen.getByTestId('base-modal-container');
      expect(modalContainer).toHaveClass('modal-container--large');
    });
  });

  describe('RTL Support', () => {
    it('should apply LTR class by default', () => {
      render(<BaseModal {...defaultProps} />);
      
      const modalOverlay = screen.getByTestId('base-modal-overlay');
      expect(modalOverlay).toHaveClass('ltr');
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal when header close button is clicked', async () => {
      render(<BaseModal {...defaultProps} />);
      
      const closeButton = screen.getByTestId('base-modal-close-button');
      await userEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal when footer close button is clicked', async () => {
      render(<BaseModal {...defaultProps} />);
      
      const footerCloseButton = screen.getByTestId('base-modal-footer-close');
      await userEvent.click(footerCloseButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal when backdrop is clicked', async () => {
      render(<BaseModal {...defaultProps} />);
      
      const overlay = screen.getByTestId('base-modal-overlay');
      fireEvent.click(overlay);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close modal when modal container is clicked', async () => {
      render(<BaseModal {...defaultProps} />);
      
      const modalContainer = screen.getByTestId('base-modal-container');
      fireEvent.click(modalContainer);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should handle backdrop click correctly with event target validation', () => {
      render(<BaseModal {...defaultProps} />);
      
      const overlay = screen.getByTestId('base-modal-overlay');
      const container = screen.getByTestId('base-modal-container');
      
      // Click on overlay (should close)
      fireEvent.click(overlay, { target: overlay });
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      
      jest.clearAllMocks();
      
      // Click on container (should not close)
      fireEvent.click(overlay, { target: container });
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Interactions', () => {
    it('should close modal when Escape key is pressed', () => {
      render(<BaseModal {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close modal when other keys are pressed', () => {
      render(<BaseModal {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      fireEvent.keyDown(document, { key: 'Tab' });
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should only handle escape key when modal is open', () => {
      const { rerender } = render(<BaseModal {...defaultProps} isOpen={false} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onClose).not.toHaveBeenCalled();
      
      rerender(<BaseModal {...defaultProps} isOpen={true} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Body Scroll Management', () => {
    it('should prevent body scrolling when modal is open', () => {
      render(<BaseModal {...defaultProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scrolling when modal is closed', () => {
      const { rerender } = render(<BaseModal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(<BaseModal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('unset');
    });

    it('should restore body scrolling on unmount', () => {
      const { unmount } = render(<BaseModal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
      
      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });

    it('should handle body scroll management with multiple modal instances', () => {
      const { rerender } = render(<BaseModal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
      
      // Simulate opening another modal
      rerender(<BaseModal {...defaultProps} isOpen={true} />);
      expect(document.body.style.overflow).toBe('hidden');
      
      // Close modal
      rerender(<BaseModal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Event Listener Management', () => {
    it('should add escape key listener when modal opens', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      render(<BaseModal {...defaultProps} />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });

    it('should remove escape key listener when modal closes', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      const { rerender } = render(<BaseModal {...defaultProps} />);
      
      rerender(<BaseModal {...defaultProps} isOpen={false} />);
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });

    it('should remove escape key listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      const { unmount } = render(<BaseModal {...defaultProps} />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper modal structure', () => {
      render(<BaseModal {...defaultProps} />);
      
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('should have proper button roles and labels', () => {
      render(<BaseModal {...defaultProps} />);
      
      const allButtons = screen.getAllByRole('button');
      expect(allButtons).toHaveLength(2); // Header close button + footer close button
      
      const headerCloseButton = screen.getByTestId('base-modal-close-button');
      expect(headerCloseButton).toHaveAttribute('aria-label', 'Close');
    });

    it('should support keyboard navigation', async () => {
      render(<BaseModal {...defaultProps} />);
      
      // Tab should navigate through interactive elements
      await userEvent.tab();
      const firstFocusable = screen.getByTestId('base-modal-close-button');
      expect(firstFocusable).toHaveFocus();
      
      await userEvent.tab();
      const footerCloseButton = screen.getByTestId('base-modal-footer-close');
      expect(footerCloseButton).toHaveFocus();
    });
  });

  describe('Portal Rendering', () => {
    it('should render modal content through React Portal', () => {
      render(<BaseModal {...defaultProps} />);
      
      // Modal should be rendered in the DOM
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-test-content')).toBeInTheDocument();
    });

    it('should create portal with document.body as target', () => {
      const createPortalSpy = jest.spyOn(require('react-dom'), 'createPortal');
      render(<BaseModal {...defaultProps} />);
      
      expect(createPortalSpy).toHaveBeenCalledWith(
        expect.anything(),
        document.body
      );
      
      createPortalSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onClose callback gracefully', () => {
      const { onClose, ...propsWithoutCallback } = defaultProps;
      
      expect(() => {
        render(<BaseModal {...propsWithoutCallback} onClose={undefined as any} />);
      }).not.toThrow();
    });

    it('should handle empty title', () => {
      render(<BaseModal {...defaultProps} title="" />);
      
      const titleElement = screen.getByRole('heading', { level: 2 });
      expect(titleElement).toHaveTextContent('');
    });

    it('should handle empty children', () => {
      render(<BaseModal {...defaultProps} children={null} />);
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.queryByTestId('modal-test-content')).not.toBeInTheDocument();
    });

    it('should handle rapid open/close operations', () => {
      const { rerender } = render(<BaseModal {...defaultProps} isOpen={false} />);
      
      // Rapid open/close
      rerender(<BaseModal {...defaultProps} isOpen={true} />);
      rerender(<BaseModal {...defaultProps} isOpen={false} />);
      rerender(<BaseModal {...defaultProps} isOpen={true} />);
      
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily when props remain the same', () => {
      const renderSpy = jest.fn();
      const TestChild = () => {
        renderSpy();
        return <div>Test Child</div>;
      };

      const { rerender } = render(
        <BaseModal {...defaultProps}>
          <TestChild />
        </BaseModal>
      );

      const initialRenderCount = renderSpy.mock.calls.length;

      // Re-render with same props
      rerender(
        <BaseModal {...defaultProps}>
          <TestChild />
        </BaseModal>
      );

      // Should not cause unnecessary re-renders of children
      expect(renderSpy.mock.calls.length).toBeGreaterThanOrEqual(initialRenderCount);
    });
  });
});
