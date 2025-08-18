/**
 * CropModal Component
 * 
 * Modal for cropping images from file upload or camera
 */

import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import './CropModal.css';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File) => void;
  imageSrc: string;
  title?: string;
}

const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  imageSrc,
  title,
}) => {
  const { t } = useTranslation();
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [crop, setCrop] = useState<Crop>({
    unit: 'px',
    width: 200,
    height: 200,
    x: 50,
    y: 50,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>({
    unit: 'px',
    width: 200,
    height: 200,
    x: 50,
    y: 50,
  });

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const minDimension = Math.min(width, height);
    const squareSize = Math.floor(minDimension * 0.8); // 80% of the smaller dimension
    const x = Math.floor((width - squareSize) / 2);
    const y = Math.floor((height - squareSize) / 2);
    
    const newCrop = {
      unit: 'px' as const,
      width: squareSize,
      height: squareSize,
      x,
      y,
    };
    
    setCrop(newCrop);
    setCompletedCrop(newCrop);
  }, []);

  const getCroppedImg = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): Promise<File> => {
      const canvas = canvasRef.current;
      if (!canvas || !crop.width || !crop.height) {
        throw new Error('Canvas or crop not available');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const pixelRatio = window.devicePixelRatio;
      canvas.width = crop.width * pixelRatio * scaleX;
      canvas.height = crop.height * pixelRatio * scaleY;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'));
              return;
            }
            const file = new File([blob], 'cropped-image.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(file);
          },
          'image/jpeg',
          0.95
        );
      });
    },
    []
  );

  const confirmCrop = useCallback(async () => {
    if (imageRef.current && completedCrop.width && completedCrop.height) {
      try {
        const croppedImageFile = await getCroppedImg(imageRef.current, completedCrop);
        onConfirm(croppedImageFile);
        onClose();
      } catch (error) {
        console.error('Error cropping image:', error);
      }
    }
  }, [completedCrop, getCroppedImg, onConfirm, onClose]);

  const handleClose = () => {
    const defaultCrop = {
      unit: 'px' as const,
      width: 200,
      height: 200,
      x: 50,
      y: 50,
    };
    setCrop(defaultCrop);
    setCompletedCrop(defaultCrop);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="crop-modal-overlay" onClick={handleClose}>
      <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crop-modal__header">
          <h3 className="crop-modal__title">
            {title || t('common:form.crop_photo')}
          </h3>
          <button
            className="crop-modal__close"
            onClick={handleClose}
            type="button"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="crop-modal__content">
          <div className="cropping-container">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              className="crop-container"
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop"
                onLoad={onImageLoad}
                className="crop-image"
              />
            </ReactCrop>
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="crop-modal__actions">
          <button
            className="btn btn--secondary"
            onClick={handleClose}
            type="button"
          >
            {t('common:app.cancel')}
          </button>
          <button
            className="btn btn--primary"
            onClick={confirmCrop}
            type="button"
          >
            {t('common:form.confirm')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CropModal;
