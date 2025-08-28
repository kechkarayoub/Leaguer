/**
 * CropModal Component Tests
 * 
 * This test suite covers:
 * - Component rendering and conditional display
 * - User interactions (clicking buttons, crop changes)
 * - Image loading and crop initialization
 * - Crop confirmation and file generation
 * - Error handling scenarios
 * - Accessibility features
 * - Component state management
 * 
 * The tests mock:
 * - react-i18next for translations
 * - react-image-crop for the cropping functionality
 * - Canvas API for image processing
 * - DOM APIs (createPortal, devicePixelRatio)
 * 
 * Run with: yarn test --testPathPattern=CropModal.test.tsx --watchAll=false
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CropModal from './CropModal';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'common:form.crop_photo': 'Crop Photo',
        'common:app.cancel': 'Cancel',
        'common:form.confirm': 'Confirm',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock react-image-crop
jest.mock('react-image-crop', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, onChange, onComplete, crop }: any) => (
      <div data-testid="react-crop">
        {children}
        <button
          data-testid="crop-change"
          onClick={() => {
            const newCrop = { unit: 'px', width: 150, height: 150, x: 25, y: 25 };
            onChange(newCrop);
            onComplete(newCrop);
          }}
        >
          Change Crop
        </button>
      </div>
    ),
  };
});

// Mock createPortal to render in the same container
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (children: React.ReactNode) => children,
}));

// Mock canvas and image methods
const mockToBlob = jest.fn();
const mockGetContext = jest.fn();
const mockDrawImage = jest.fn();

beforeEach(() => {
  // Reset mocks
  mockToBlob.mockClear();
  mockGetContext.mockClear();
  mockDrawImage.mockClear();

  // Mock HTMLCanvasElement
  HTMLCanvasElement.prototype.getContext = mockGetContext.mockReturnValue({
    drawImage: mockDrawImage,
    setTransform: jest.fn(),
    imageSmoothingQuality: 'high',
  });
  HTMLCanvasElement.prototype.toBlob = mockToBlob;

  // Mock Image load event
  Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
    get: function() { return 800; },
    configurable: true,
  });
  Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
    get: function() { return 600; },
    configurable: true,
  });
  Object.defineProperty(HTMLImageElement.prototype, 'width', {
    get: function() { return 400; },
    configurable: true,
  });
  Object.defineProperty(HTMLImageElement.prototype, 'height', {
    get: function() { return 300; },
    configurable: true,
  });

  // Mock window.devicePixelRatio
  Object.defineProperty(window, 'devicePixelRatio', {
    value: 1,
    configurable: true,
  });
});

describe('CropModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    imageSrc: 'data:image/jpeg;base64,test-image-data',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('Should render the modal when isOpen is true', () => {
      render(<CropModal {...defaultProps} />);
      
      expect(screen.getByText('Crop Photo')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByAltText('Crop')).toBeInTheDocument();
    });

    it('Should not render when isOpen is false', () => {
      render(<CropModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Crop Photo')).not.toBeInTheDocument();
    });

    it('Should render custom title when provided', () => {
      render(<CropModal {...defaultProps} title="Custom Crop Title" />);
      
      expect(screen.getByText('Custom Crop Title')).toBeInTheDocument();
      expect(screen.queryByText('Crop Photo')).not.toBeInTheDocument();
    });

    it('Should render the image with correct src', () => {
      render(<CropModal {...defaultProps} />);
      
      const image = screen.getByAltText('Crop');
      expect(image).toHaveAttribute('src', defaultProps.imageSrc);
    });

    it('Should render ReactCrop component', () => {
      render(<CropModal {...defaultProps} />);
      
      expect(screen.getByTestId('react-crop')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('Should call onClose when cancel button is clicked', async () => {
      render(<CropModal {...defaultProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('Should call onClose when close (X) button is clicked', async () => {
      render(<CropModal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await userEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('Should call onClose when clicking on overlay', () => {
      render(<CropModal {...defaultProps} />);
      
      const overlay = screen.getByTestId('crop-modal-overlay');
      fireEvent.click(overlay);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('Should not call onClose when clicking inside modal content', () => {
      render(<CropModal {...defaultProps} />);
      
      const modalContent = screen.getByTestId('crop-modal-content');
      fireEvent.click(modalContent);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('Should update crop when crop changes', async () => {
      render(<CropModal {...defaultProps} />);
      
      const cropChangeButton = screen.getByTestId('crop-change');
      await userEvent.click(cropChangeButton);
      
      // Verify that the crop state was updated (we can't directly test state,
      // but we can verify the component doesn't crash and handles the change)
      expect(screen.getByTestId('react-crop')).toBeInTheDocument();
    });
  });

  describe('Image Loading', () => {
    it('Should handle image load event', () => {
      render(<CropModal {...defaultProps} />);
      
      const image = screen.getByAltText('Crop');
      
      // Simulate image load event
      fireEvent.load(image);
      
      // Verify the component handles the load event without errors
      expect(image).toBeInTheDocument();
    });

    it('Should set initial crop on image load', () => {
      render(<CropModal {...defaultProps} />);
      
      const image = screen.getByAltText('Crop');
      
      // Mock the image dimensions
      Object.defineProperty(image, 'width', { value: 400, configurable: true });
      Object.defineProperty(image, 'height', { value: 300, configurable: true });
      
      fireEvent.load(image);
      
      // The component should handle the load without throwing errors
      expect(image).toBeInTheDocument();
    });
  });

  describe('Crop Confirmation', () => {
    it('Should handle confirm crop with valid crop data', async () => {
      // Mock successful blob creation
      mockToBlob.mockImplementation((callback) => {
        const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
        callback(mockBlob);
      });

      render(<CropModal {...defaultProps} />);
      
      // Load the image first
      const image = screen.getByAltText('Crop');
      fireEvent.load(image);
      
      // Update crop
      const cropChangeButton = screen.getByTestId('crop-change');
      await userEvent.click(cropChangeButton);
      
      // Confirm crop
      const confirmButton = screen.getByText('Confirm');
      await userEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
      });
      
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('Should handle crop confirmation when canvas context is not available', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock getContext to return null
      mockGetContext.mockReturnValue(null);
      
      render(<CropModal {...defaultProps} />);
      
      const image = screen.getByAltText('Crop');
      fireEvent.load(image);
      
      const confirmButton = screen.getByText('Confirm');
      await userEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error cropping image:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('Should handle crop confirmation when toBlob fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock toBlob to call callback with null
      mockToBlob.mockImplementation((callback) => {
        callback(null);
      });
      
      render(<CropModal {...defaultProps} />);
      
      const image = screen.getByAltText('Crop');
      fireEvent.load(image);
      
      const confirmButton = screen.getByText('Confirm');
      await userEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error cropping image:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('Should handle missing canvas ref', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<CropModal {...defaultProps} />);
      
      // Try to confirm without proper setup
      const confirmButton = screen.getByText('Confirm');
      await userEvent.click(confirmButton);
      
      // Should not crash the component
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('Should have proper button roles', () => {
      render(<CropModal {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // Close, Crop-change (mock), Cancel, Confirm
    });

    it('Should have proper image alt text', () => {
      render(<CropModal {...defaultProps} />);
      
      expect(screen.getByAltText('Crop')).toBeInTheDocument();
    });

    it('Should support keyboard navigation', async () => {
      render(<CropModal {...defaultProps} />);
      
      // Tab through buttons - focus starts with the first focusable element
      await userEvent.tab();
      const firstButton = screen.getByLabelText('close');
      expect(firstButton).toHaveFocus();
      
      await userEvent.tab();
      await userEvent.tab();
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toHaveFocus();
      
      await userEvent.tab();
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveFocus();
    });
  });

  describe('Component State Management', () => {
    it('Should reset crop state when closing modal', async () => {
      render(<CropModal {...defaultProps} />);
      
      // Change crop
      const cropChangeButton = screen.getByTestId('crop-change');
      await userEvent.click(cropChangeButton);
      
      // Close modal
      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });
});
