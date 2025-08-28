/**
 * CameraModal Component
 * 
 * Modal for capturing photos using device camera with auto-crop workflow
 */

import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Webcam from 'react-webcam';
import CropModal from './CropModal';

import './CameraModal.css';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const { t } = useTranslation();
  const webcamRef = useRef<Webcam>(null);
  
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [showCropModal, setShowCropModal] = useState(false);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user"
  };

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setShowCropModal(true); // Auto-crop after photo capture
    }
  }, []);

  const handleCropComplete = (croppedFile: File) => {
    onCapture(croppedFile);
    setShowCropModal(false);
    setCapturedImage('');
    onClose();
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setCapturedImage('');
  };

  const handleClose = () => {
    setCapturedImage('');
    setShowCropModal(false);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="camera-modal-overlay" onClick={handleClose} data-testid="camera-modal-overlay">
        <div className="camera-modal" onClick={(e) => e.stopPropagation()} data-testid="camera-modal-content">
          <div className="camera-modal__header">
            <h3 className="camera-modal__title">
              {t('common:form.take_photo')}
            </h3>
            <button
              className="camera-modal__close"
              onClick={handleClose}
              type="button"
              aria-label="close"
              data-testid="camera-modal-close"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="camera-modal__content">
            <div className="camera-container" data-testid="camera-container">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="camera-preview"
                data-testid="webcam-component"
              />
            </div>
          </div>

          <div className="camera-modal__actions">
            <button
              className="btn btn--secondary"
              onClick={handleClose}
              type="button"
              data-testid="camera-modal-cancel"
            >
              {t('common:app.cancel')}
            </button>
            <button
              className="btn btn--primary camera-capture-btn"
              onClick={capturePhoto}
              type="button"
              data-testid="camera-modal-capture"
            >
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t('common:form.take_photo')}
            </button>
          </div>
        </div>
      </div>

      {/* Show CropModal when image is captured */}
      {showCropModal && (
        <CropModal
          isOpen={showCropModal}
          imageSrc={capturedImage}
          onConfirm={handleCropComplete}
          onClose={handleCropCancel}
        />
      )}
    </>
  );

  return createPortal(modalContent, document.body);
};

export default CameraModal;
