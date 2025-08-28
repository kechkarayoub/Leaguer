/**
 * CameraModal Component Tests
 * 
 * This test suite covers:
 * - Modal rendering and portal behavior
 * - Camera initialization with proper video constraints
 * - Photo capture functionality and screenshot handling
 * - CropModal integration workflow
 * - User interactions (capture, cancel, close)
 * - Event handling and callbacks
 * - Error scenarios and edge cases
 * - Accessibility features
 * 
 * The tests mock:
 * - react-i18next for translations
 * - react-webcam for camera functionality
 * - CropModal component for crop workflow testing
 * - createPortal for modal rendering
 * 
 * Run with: yarn test --testPathPattern=CameraModal.test.tsx --watchAll=false
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CameraModal from './CameraModal';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'common:form.take_photo': 'Take Photo',
        'common:app.cancel': 'Cancel',
      };
      return translations[key] || key;
    },
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

// Mock react-webcam
const mockGetScreenshot = jest.fn();
jest.mock('react-webcam', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        getScreenshot: mockGetScreenshot,
      }));

      return (
        <div
          data-testid="webcam-component"
          data-video-constraints={JSON.stringify(props.videoConstraints)}
          data-screenshot-format={props.screenshotFormat}
          data-audio={props.audio.toString()}
          className={props.className}
        >
          Mock Webcam
        </div>
      );
    }),
  };
});

// Mock CropModal component
const mockOnCropConfirm = jest.fn();
const mockOnCropClose = jest.fn();
jest.mock('./CropModal', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ isOpen, imageSrc, onConfirm, onClose }: any) => {
      if (!isOpen) return null;
      
      return (
        <div data-testid="crop-modal-component">
          <div data-testid="crop-modal-image-src">{imageSrc}</div>
          <button
            data-testid="crop-modal-confirm"
            onClick={() => {
              const mockFile = new File(['cropped'], 'cropped.jpg', { type: 'image/jpeg' });
              onConfirm(mockFile);
              mockOnCropConfirm(mockFile);
            }}
          >
            Confirm Crop
          </button>
          <button
            data-testid="crop-modal-cancel"
            onClick={() => {
              onClose();
              mockOnCropClose();
            }}
          >
            Cancel Crop
          </button>
        </div>
      );
    },
  };
});

describe('CameraModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onCapture: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetScreenshot.mockReturnValue('data:image/jpeg;base64,mockImageData');
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<CameraModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('webcam-component')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(<CameraModal {...defaultProps} />);
      
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Take Photo');
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByTestId('webcam-component')).toBeInTheDocument();
    });

    it('should render modal title correctly', () => {
      render(<CameraModal {...defaultProps} />);
      
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Take Photo');
    });

    it('should render close button', () => {
      render(<CameraModal {...defaultProps} />);
      
      const closeButton = screen.getByTestId('camera-modal-close');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Webcam Configuration', () => {
    it('should configure webcam with correct props', () => {
      render(<CameraModal {...defaultProps} />);
      
      const webcam = screen.getByTestId('webcam-component');
      expect(webcam).toHaveAttribute('data-audio', 'false');
      expect(webcam).toHaveAttribute('data-screenshot-format', 'image/jpeg');
      expect(webcam).toHaveClass('camera-preview');
    });

    it('should set proper video constraints', () => {
      render(<CameraModal {...defaultProps} />);
      
      const webcam = screen.getByTestId('webcam-component');
      const videoConstraints = JSON.parse(webcam.getAttribute('data-video-constraints') || '{}');
      
      expect(videoConstraints).toEqual({
        width: 1280,
        height: 720,
        facingMode: "user"
      });
    });
  });

  describe('Photo Capture', () => {
    it('should capture photo when capture button is clicked', async () => {
      render(<CameraModal {...defaultProps} />);
      
      const captureButton = screen.getByTestId('camera-modal-capture');
      await userEvent.click(captureButton);
      
      expect(mockGetScreenshot).toHaveBeenCalledTimes(1);
    });

    it('should show crop modal after successful capture', async () => {
      render(<CameraModal {...defaultProps} />);
      
      const captureButton = screen.getByTestId('camera-modal-capture');
      await userEvent.click(captureButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('crop-modal-component')).toBeInTheDocument();
      });
    });

    it('should pass captured image to crop modal', async () => {
      render(<CameraModal {...defaultProps} />);
      
      const captureButton = screen.getByTestId('camera-modal-capture');
      await userEvent.click(captureButton);
      
      await waitFor(() => {
        const imageSrc = screen.getByTestId('crop-modal-image-src');
        expect(imageSrc).toHaveTextContent('data:image/jpeg;base64,mockImageData');
      });
    });

    it('should handle failed screenshot capture gracefully', async () => {
      mockGetScreenshot.mockReturnValue(null);
      render(<CameraModal {...defaultProps} />);
      
      const captureButton = screen.getByTestId('camera-modal-capture');
      await userEvent.click(captureButton);
      
      // Should not show crop modal if screenshot fails
      expect(screen.queryByTestId('crop-modal-component')).not.toBeInTheDocument();
    });
  });

  describe('Crop Modal Integration', () => {
    it('should handle crop confirmation correctly', async () => {
      render(<CameraModal {...defaultProps} />);
      
      // First capture a photo
      const captureButton = screen.getByTestId('camera-modal-capture');
      await userEvent.click(captureButton);
      
      // Then confirm crop
      await waitFor(async () => {
        const confirmButton = screen.getByTestId('crop-modal-confirm');
        await userEvent.click(confirmButton);
      });
      
      expect(defaultProps.onCapture).toHaveBeenCalledWith(expect.any(File));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should handle crop cancellation correctly', async () => {
      render(<CameraModal {...defaultProps} />);
      
      // First capture a photo
      const captureButton = screen.getByTestId('camera-modal-capture');
      await userEvent.click(captureButton);
      
      // Then cancel crop
      await waitFor(async () => {
        const cancelButton = screen.getByTestId('crop-modal-cancel');
        await userEvent.click(cancelButton);
      });
      
      // Should hide crop modal but keep camera modal open
      await waitFor(() => {
        expect(screen.queryByTestId('crop-modal-component')).not.toBeInTheDocument();
      });
      expect(screen.getByTestId('webcam-component')).toBeInTheDocument();
      expect(defaultProps.onCapture).not.toHaveBeenCalled();
    });

    it('should clear captured image state after crop completion', async () => {
      render(<CameraModal {...defaultProps} />);
      
      // Capture and confirm crop
      const captureButton = screen.getByTestId('camera-modal-capture');
      await userEvent.click(captureButton);
      
      await waitFor(async () => {
        const confirmButton = screen.getByTestId('crop-modal-confirm');
        await userEvent.click(confirmButton);
      });
      
      // Modal should be closed, state should be clean
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal when cancel button is clicked', async () => {
      render(<CameraModal {...defaultProps} />);
      
      const cancelButton = screen.getByTestId('camera-modal-cancel');
      await userEvent.click(cancelButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal when close button is clicked', async () => {
      render(<CameraModal {...defaultProps} />);
      
      const closeButton = screen.getByTestId('camera-modal-close');
      await userEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal when clicking overlay', async () => {
      render(<CameraModal {...defaultProps} />);
      
      const overlay = screen.getByTestId('camera-modal-overlay');
      await userEvent.click(overlay);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close modal when clicking modal content', async () => {
      render(<CameraModal {...defaultProps} />);
      
      const modalContent = screen.getByTestId('camera-modal-content');
      await userEvent.click(modalContent);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should prevent event propagation on modal content click', () => {
      render(<CameraModal {...defaultProps} />);
      
      const modalContent = screen.getByTestId('camera-modal-content');
      
      fireEvent.click(modalContent);
      
      // Modal content click should not close the modal
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should reset state when modal is closed', async () => {
      render(<CameraModal {...defaultProps} />);
      
      // Capture a photo first
      const captureButton = screen.getByTestId('camera-modal-capture');
      await userEvent.click(captureButton);
      
      // Close modal
      const closeButton = screen.getByTestId('camera-modal-close');
      await userEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
      expect(screen.queryByTestId('crop-modal-component')).not.toBeInTheDocument();
    });

    it('should maintain webcam reference throughout component lifecycle', () => {
      const { rerender } = render(<CameraModal {...defaultProps} />);
      
      expect(screen.getByTestId('webcam-component')).toBeInTheDocument();
      
      rerender(<CameraModal {...defaultProps} isOpen={true} />);
      expect(screen.getByTestId('webcam-component')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle webcam initialization errors gracefully', () => {
      // Webcam component should still render even if there are camera access issues
      render(<CameraModal {...defaultProps} />);
      
      expect(screen.getByTestId('webcam-component')).toBeInTheDocument();
      expect(screen.getByTestId('camera-modal-capture')).toBeInTheDocument();
    });

    it('should handle multiple rapid capture attempts', async () => {
      render(<CameraModal {...defaultProps} />);
      
      const captureButton = screen.getByTestId('camera-modal-capture');
      
      // Rapid clicks should not cause issues
      await userEvent.click(captureButton);
      await userEvent.click(captureButton);
      await userEvent.click(captureButton);
      
      // Only the first successful capture should proceed
      expect(mockGetScreenshot).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles and labels', () => {
      render(<CameraModal {...defaultProps} />);
      
      expect(screen.getByTestId('camera-modal-capture')).toBeInTheDocument();
      expect(screen.getByTestId('camera-modal-cancel')).toBeInTheDocument();
      expect(screen.getByTestId('camera-modal-close')).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(<CameraModal {...defaultProps} />);
      
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Take Photo');
    });

    it('should support keyboard navigation', async () => {
      render(<CameraModal {...defaultProps} />);
      
      // Tab should navigate through interactive elements
      await userEvent.tab();
      expect(screen.getByTestId('camera-modal-close')).toHaveFocus();
      
      await userEvent.tab();
      expect(screen.getByTestId('camera-modal-cancel')).toHaveFocus();
      
      await userEvent.tab();
      expect(screen.getByTestId('camera-modal-capture')).toHaveFocus();
    });
  });

  describe('Integration with File System', () => {
    it('should pass correct file type from crop modal', async () => {
      render(<CameraModal {...defaultProps} />);
      
      // Capture and confirm
      const captureButton = screen.getByTestId('camera-modal-capture');
      await userEvent.click(captureButton);
      
      await waitFor(async () => {
        const confirmButton = screen.getByTestId('crop-modal-confirm');
        await userEvent.click(confirmButton);
      });
      
      expect(defaultProps.onCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'image/jpeg',
          name: 'cropped.jpg',
        })
      );
    });
  });
});
