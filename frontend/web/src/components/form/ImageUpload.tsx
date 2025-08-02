/**
 * ImageUpload Component
 * 
 * Reusable image upload component with preview and drag-and-drop
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import './ImageUpload.css';

interface ImageUploadProps {
  value?: string | File;
  onChange: (file: File | null) => void;
  label?: string;
  error?: string;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  placeholder?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label,
  error,
  maxSize = 2, // 2MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  placeholder,
  className = '',
}) => {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (value) {
      if (value instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(value);
      } else if (typeof value === 'string') {
        setPreview(value);
      }
    } else {
      setPreview(null);
    }
  }, [value]);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return t('common:form.image_invalid_type');
    }
    if (file.size > maxSize * 1024 * 1024) {
      return t('common:form.image_too_large', { size: maxSize });
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      alert(validationError);
      return;
    }

    onChange(file);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`image-upload ${className} ${error ? 'image-upload--error' : ''}`}>
      {label && (
        <label className="image-upload__label">
          {label}
        </label>
      )}

      <div className="image-upload__container">
        {preview ? (
          <div className="image-upload__preview">
            <img src={preview} alt="Preview" className="image-upload__preview-img" />
            <div className="image-upload__overlay">
              <button
                type="button"
                onClick={openFileDialog}
                className="image-upload__change-btn"
              >
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('common:form.change_image')}
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="image-upload__remove-btn"
              >
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('common:form.remove_image')}
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`image-upload__dropzone ${isDragging ? 'image-upload__dropzone--dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFileDialog}
          >
            <svg className="image-upload__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="image-upload__text">
              <p className="image-upload__primary-text">
                {placeholder || t('common:form.image_upload_text')}
              </p>
              <p className="image-upload__secondary-text">
                {t('common:form.image_upload_hint', { 
                  types: acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', '),
                  size: maxSize 
                })}
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="image-upload__input"
      />

      {error && <div className="image-upload__error">{error}</div>}
    </div>
  );
};

export default ImageUpload;
