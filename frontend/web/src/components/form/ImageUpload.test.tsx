/**
 * ImageUpload Component Tests
 * 
 * This test suite covers:
 * - Component rendering with and without preview images
 * - File selection via input and drag-and-drop
 * - File validation (size, type)
 * - Camera integration workflow
 * - Crop modal integration
 * - Image preview functionality
 * - Error handling and user feedback
 * - Accessibility features
 * 
 * The tests mock:
 * - react-i18next for translations
 * - CameraModal and CropModal components
 * - useCamera hook for camera availability
 * - FileReader API for image preview
 * 
 * Run with: yarn test --testPathPattern=ImageUpload.test.tsx --watchAll=false
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageUpload from './ImageUpload';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: { [key: string]: string } = {
        'common:form.image_invalid_type': 'Invalid file type',
        'common:form.image_too_large': `File too large (max ${options?.size || 2}MB)`,
        'common:form.change_image': 'Change Image',
        'common:form.take_photo': 'Take Photo',
        'common:form.remove_image': 'Remove Image',
        'common:form.image_upload_text': 'Click to upload or drag and drop',
        'common:form.image_upload_hint': `${options?.types || 'JPEG, PNG'} up to ${options?.size || 2}MB`,
        'common:form.crop_image': 'Crop Image',
        'common:app.or': 'or',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock useCamera hook
const mockUseCamera = {
  hasCamera: true,
};
jest.mock('../../hooks/useCamera', () => ({
  useCamera: () => mockUseCamera,
}));

// Mock FileReader
class MockFileReader {
  result: string | null = null;
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;

  readAsDataURL(file: File) {
    setTimeout(() => {
      this.result = `data:image/jpeg;base64,mock-${file.name}`;
      if (this.onload) {
        this.onload({ target: this } as unknown as ProgressEvent<FileReader>);
      }
    }, 0);
  }
}

global.FileReader = MockFileReader as any;

// Mock CameraModal
jest.mock('./CameraModal', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ isOpen, onClose, onCapture }: any) => {
      if (!isOpen) return null;
      
      return (
        <div data-testid="camera-modal">
          <button
            data-testid="camera-modal-capture"
            onClick={() => {
              const mockFile = new File(['camera'], 'camera.jpg', { type: 'image/jpeg' });
              onCapture(mockFile);
            }}
          >
            Capture
          </button>
          <button data-testid="camera-modal-close" onClick={onClose}>
            Close Camera
          </button>
        </div>
      );
    },
  };
});

// Mock CropModal
jest.mock('./CropModal', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ isOpen, imageSrc, onConfirm, onClose, title }: any) => {
      if (!isOpen) return null;
      
      return (
        <div data-testid="crop-modal">
          <div data-testid="crop-modal-title">{title}</div>
          <div data-testid="crop-modal-image-src">{imageSrc}</div>
          <button
            data-testid="crop-modal-confirm"
            onClick={() => {
              const mockFile = new File(['cropped'], 'cropped.jpg', { type: 'image/jpeg' });
              onConfirm(mockFile);
            }}
          >
            Confirm Crop
          </button>
          <button data-testid="crop-modal-cancel" onClick={onClose}>
            Cancel Crop
          </button>
        </div>
      );
    },
  };
});

// Mock window.alert
global.alert = jest.fn();

describe('ImageUpload', () => {
  const defaultProps = {
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCamera.hasCamera = true;
  });

  describe('Basic Rendering', () => {
    it('should render upload interface without preview', () => {
      render(<ImageUpload {...defaultProps} />);
      
      expect(screen.getByText('Click to upload or drag and drop')).toBeInTheDocument();
      expect(screen.getByText('JPEG, PNG, GIF, WEBP up to 2MB')).toBeInTheDocument();
    });

    it('should render with label when provided', () => {
      render(<ImageUpload {...defaultProps} label="Profile Picture" />);
      
      expect(screen.getByText('Profile Picture')).toBeInTheDocument();
    });

    it('should render camera button when camera is available', () => {
      render(<ImageUpload {...defaultProps} />);
      
      expect(screen.getByText('or')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /take photo/i })).toBeInTheDocument();
    });

    it('should not render camera section when camera is not available', () => {
      mockUseCamera.hasCamera = false;
      render(<ImageUpload {...defaultProps} />);
      
      expect(screen.queryByText('or')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /take photo/i })).not.toBeInTheDocument();
    });

    it('should apply error styling when error is provided', () => {
      render(<ImageUpload {...defaultProps} error="Required field" />);
      
      const container = screen.getByTestId('image-upload-container');
      expect(container).toHaveClass('image-upload--error');
      expect(screen.getByText('Required field')).toBeInTheDocument();
    });
  });

  describe('Image Preview', () => {
    it('should display preview when value is a string URL', () => {
      render(<ImageUpload {...defaultProps} value="https://example.com/image.jpg" />);
      
      expect(screen.getByAltText('Preview')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change image/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /remove image/i })).toBeInTheDocument();
    });

    it('should display preview when value is a File', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      render(<ImageUpload {...defaultProps} value={file} />);
      
      await waitFor(() => {
        expect(screen.getByAltText('Preview')).toBeInTheDocument();
      });
    });

    it('should show camera button in preview when camera is available', () => {
      render(<ImageUpload {...defaultProps} value="test.jpg" />);
      
      expect(screen.getAllByRole('button', { name: /take photo/i })).toHaveLength(1);
    });
  });

  describe('File Selection', () => {
    it('should handle file selection via input', async () => {
      render(<ImageUpload {...defaultProps} />);
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByTestId('crop-modal')).toBeInTheDocument();
      });
    });

    it('should handle crop confirmation', async () => {
      render(<ImageUpload {...defaultProps} />);
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(async () => {
        const confirmButton = screen.getByTestId('crop-modal-confirm');
        await userEvent.click(confirmButton);
      });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(expect.any(File));
    });

    it('should handle crop cancellation', async () => {
      render(<ImageUpload {...defaultProps} />);
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(async () => {
        const cancelButton = screen.getByTestId('crop-modal-cancel');
        await userEvent.click(cancelButton);
      });
      
      expect(defaultProps.onChange).not.toHaveBeenCalled();
      expect(screen.queryByTestId('crop-modal')).not.toBeInTheDocument();
    });
  });

  describe('File Validation', () => {
    it('should reject invalid file types', async () => {
      render(<ImageUpload {...defaultProps} acceptedTypes={['image/jpeg']} />);
      
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(global.alert).toHaveBeenCalledWith('Invalid file type');
      expect(screen.queryByTestId('crop-modal')).not.toBeInTheDocument();
    });

    it('should reject files that are too large', async () => {
      render(<ImageUpload {...defaultProps} maxSize={1} />);
      
      // Create a file larger than 1MB
      const largeContent = new Array(1024 * 1024 + 1).fill('a').join('');
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(global.alert).toHaveBeenCalledWith('File too large (max 1MB)');
      expect(screen.queryByTestId('crop-modal')).not.toBeInTheDocument();
    });

    it('should accept valid files', async () => {
      render(<ImageUpload {...defaultProps} />);
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(global.alert).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByTestId('crop-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Camera Integration', () => {
    it('should open camera modal when camera button is clicked', async () => {
      render(<ImageUpload {...defaultProps} />);
      
      const cameraButton = screen.getByRole('button', { name: /take photo/i });
      await userEvent.click(cameraButton);
      
      expect(screen.getByTestId('camera-modal')).toBeInTheDocument();
    });

    it('should handle camera capture', async () => {
      render(<ImageUpload {...defaultProps} />);
      
      // Open camera modal
      const cameraButton = screen.getByRole('button', { name: /take photo/i });
      await userEvent.click(cameraButton);
      
      // Capture photo
      const captureButton = screen.getByTestId('camera-modal-capture');
      await userEvent.click(captureButton);
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(expect.any(File));
    });

    it('should close camera modal', async () => {
      render(<ImageUpload {...defaultProps} />);
      
      // Open camera modal
      const cameraButton = screen.getByRole('button', { name: /take photo/i });
      await userEvent.click(cameraButton);
      
      // Close camera modal
      const closeButton = screen.getByTestId('camera-modal-close');
      await userEvent.click(closeButton);
      
      expect(screen.queryByTestId('camera-modal')).not.toBeInTheDocument();
    });
  });

  describe('Image Removal', () => {
    it('should remove image when remove button is clicked', async () => {
      render(<ImageUpload {...defaultProps} value="test.jpg" />);
      
      const removeButton = screen.getByRole('button', { name: /remove image/i });
      await userEvent.click(removeButton);
      
      expect(defaultProps.onChange).toHaveBeenCalledWith('');
    });
  });

  describe('Configuration Props', () => {
    it('should use custom maxSize in hint text', () => {
      render(<ImageUpload {...defaultProps} maxSize={10} />);
      
      expect(screen.getByText('JPEG, PNG, GIF, WEBP up to 10MB')).toBeInTheDocument();
    });

    it('should use custom acceptedTypes in hint text', () => {
      render(<ImageUpload {...defaultProps} acceptedTypes={['image/gif', 'image/webp']} />);
      
      expect(screen.getByText('GIF, WEBP up to 2MB')).toBeInTheDocument();
    });

    it('should use custom placeholder', () => {
      render(<ImageUpload {...defaultProps} placeholder="Upload your avatar" />);
      
      expect(screen.getByText('Upload your avatar')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<ImageUpload {...defaultProps} className="custom-upload" />);
      
      const container = screen.getByTestId('image-upload-container');
      expect(container).toHaveClass('custom-upload');
    });
  });

  describe('Accessibility', () => {
    it('should have proper file input attributes', () => {
      render(<ImageUpload {...defaultProps} acceptedTypes={['image/jpeg', 'image/png']} />);
      
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/png');
    });

    it('should have proper button roles', () => {
      render(<ImageUpload {...defaultProps} value="test.jpg" />);
      
      expect(screen.getByRole('button', { name: /change image/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /remove image/i })).toBeInTheDocument();
    });

    it('should show take photo button when camera is available', () => {
      mockUseCamera.hasCamera = true;
      render(<ImageUpload {...defaultProps} value="test.jpg" />);
      
      expect(screen.getByRole('button', { name: /take photo/i })).toBeInTheDocument();
    });
  });
});
