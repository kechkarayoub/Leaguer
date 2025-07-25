/**
 * ContactModal Component
 * 
 * Modal displaying contact form and information for the Leaguer platform
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import leaguerLogo from '../../logo.png';
import UnauthenticatedApiService from '../../services/UnauthenticatedApiService';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  
  // Ref for success message
  const successMessageRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('common:validation.required', { field: t('common:contact.form.name', { defaultValue: 'Name' }) });
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('common:validation.required', { field: t('common:contact.form.email', { defaultValue: 'Email' }) });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('common:validation.email', { defaultValue: 'Please enter a valid email address' });
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = t('common:validation.required', { field: t('common:contact.form.subject', { defaultValue: 'Subject' }) });
    }
    
    if (!formData.message.trim()) {
      newErrors.message = t('common:validation.required', { field: t('common:contact.form.message', { defaultValue: 'Message' }) });
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t('common:contact.form.messageMinLength', { defaultValue: 'Message must be at least 10 characters long' });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const apiService = UnauthenticatedApiService.getInstance();
      const result = await apiService.sendContactMessage(formData);

      if (result.success) {
        // Show success message
        setShowSuccess(true);
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        
        // Scroll to success message after a short delay to ensure it's rendered
        setTimeout(() => {
          if (successMessageRef.current) {
            successMessageRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          }
        }, 100);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      } else {
        // Handle validation errors from backend
        if (result.errors) {
          setErrors(result.errors);
        } else {
          console.error('Error submitting form:', result.message);
          // You could show a general error message to the user here
        }
      }
      
    } catch (error) {
      console.error('Error submitting form:', error);
      // You could show a network error message to the user here
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal closes
  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
    setErrors({});
    setShowSuccess(false);
    setIsSubmitting(false);
    onClose();
  };

  // Get support email from environment variables
  const supportEmail = process.env.REACT_APP_SUPPORT_EMAIL || 'support@leaguer.com';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('common:footer.contact', { defaultValue: 'Contact Us' })}
      size="large"
    >
      <div className="contact-modal-content">
        {/* Hero Section */}
        <div className="modal-section">
          <div className="modal-hero">
            <div className="modal-hero-logo">
              <img 
                src={leaguerLogo} 
                alt="Leaguer Logo" 
                className="modal-hero-logo-img"
              />
            </div>
            <h3 className="modal-hero-title">
              {t('common:contact.title', { defaultValue: 'Get in Touch' })}
            </h3>
            <p className="modal-hero-subtitle">
              {t('common:contact.subtitle', { 
                defaultValue: 'Have questions or need support? We\'re here to help! Send us a message and we\'ll get back to you as soon as possible.' 
              })}
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:contact.info.title', { defaultValue: 'Contact Information' })}
          </h4>
          
          <div className="contact-info-grid">
            <div className="contact-info-item">
              <div className="contact-info-icon">
                <svg viewBox="0 0 24 24" className="contact-info-svg">
                  <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h5 className="contact-info-title">
                  {t('common:contact.info.email', { defaultValue: 'Email Support' })}
                </h5>
                <p className="contact-info-text">
                  <a href={`mailto:${supportEmail}`} className="contact-info-link">
                    {supportEmail}
                  </a>
                </p>
                <p className="contact-info-desc">
                  {t('common:contact.info.emailDesc', { defaultValue: 'Get help with your account, billing, or technical issues' })}
                </p>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-info-icon">
                <svg viewBox="0 0 24 24" className="contact-info-svg">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h5 className="contact-info-title">
                  {t('common:contact.info.responseTime', { defaultValue: 'Response Time' })}
                </h5>
                <p className="contact-info-text">
                  {t('common:contact.info.responseTimeValue', { defaultValue: 'Within 24 hours' })}
                </p>
                <p className="contact-info-desc">
                  {t('common:contact.info.responseTimeDesc', { defaultValue: 'We respond to all inquiries within one business day' })}
                </p>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-info-icon">
                <svg viewBox="0 0 24 24" className="contact-info-svg">
                  <path d="M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A1.5,1.5 0 0,0 13.5,19.5C13.5,19.11 13.35,18.76 13.11,18.5C12.88,18.23 12.73,17.88 12.73,17.5A1.5,1.5 0 0,1 14.23,16H16A5,5 0 0,0 21,11C21,6.58 16.97,3 12,3Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h5 className="contact-info-title">
                  {t('common:contact.info.support', { defaultValue: 'Support Available' })}
                </h5>
                <p className="contact-info-text">
                  {t('common:contact.info.supportTime', { defaultValue: 'Monday - Friday, 9AM - 6PM EST' })}
                </p>
                <p className="contact-info-desc">
                  {t('common:contact.info.supportDesc', { defaultValue: 'Our support team is here to help during business hours' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:contact.form.title', { defaultValue: 'Send us a Message' })}
          </h4>
          
          {showSuccess && (
            <div className="contact-success-message" ref={successMessageRef}>
              <div className="contact-success-icon">
                <svg viewBox="0 0 24 24" className="contact-success-svg">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.41,10.09L6,11.5L11,16.5Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h5 className="contact-success-title">
                  {t('common:contact.form.successTitle', { defaultValue: 'Message Sent Successfully!' })}
                </h5>
                <p className="contact-success-text">
                  {t('common:contact.form.successMessage', { 
                    defaultValue: 'Thank you for contacting us. We\'ll get back to you within 24 hours.' 
                  })}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="contact-form-row">
              <div className="contact-form-group">
                <label htmlFor="name" className="contact-form-label">
                  {t('common:contact.form.name', { defaultValue: 'Full Name' })} *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`contact-form-input ${errors.name ? 'contact-form-input--error' : ''}`}
                  placeholder={t('common:contact.form.namePlaceholder', { defaultValue: 'Enter your full name' })}
                />
                {errors.name && <span className="contact-form-error">{errors.name}</span>}
              </div>

              <div className="contact-form-group">
                <label htmlFor="email" className="contact-form-label">
                  {t('common:contact.form.email', { defaultValue: 'Email Address' })} *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`contact-form-input ${errors.email ? 'contact-form-input--error' : ''}`}
                  placeholder={t('common:contact.form.emailPlaceholder', { defaultValue: 'Enter your email address' })}
                />
                {errors.email && <span className="contact-form-error">{errors.email}</span>}
              </div>
            </div>

            <div className="contact-form-group">
              <label htmlFor="subject" className="contact-form-label">
                {t('common:contact.form.subject', { defaultValue: 'Subject' })} *
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className={`contact-form-select ${errors.subject ? 'contact-form-input--error' : ''}`}
              >
                <option value="">
                  {t('common:contact.form.subjectPlaceholder', { defaultValue: 'Select a subject' })}
                </option>
                <option value="support">
                  {t('common:contact.form.subjectOptions.support', { defaultValue: 'Technical Support' })}
                </option>
                <option value="billing">
                  {t('common:contact.form.subjectOptions.billing', { defaultValue: 'Billing & Account' })}
                </option>
                <option value="feature">
                  {t('common:contact.form.subjectOptions.feature', { defaultValue: 'Feature Request' })}
                </option>
                <option value="partnership">
                  {t('common:contact.form.subjectOptions.partnership', { defaultValue: 'Partnership' })}
                </option>
                <option value="other">
                  {t('common:contact.form.subjectOptions.other', { defaultValue: 'Other' })}
                </option>
              </select>
              {errors.subject && <span className="contact-form-error">{errors.subject}</span>}
            </div>

            <div className="contact-form-group">
              <label htmlFor="message" className="contact-form-label">
                {t('common:contact.form.message', { defaultValue: 'Message' })} *
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleInputChange}
                className={`contact-form-textarea ${errors.message ? 'contact-form-input--error' : ''}`}
                placeholder={t('common:contact.form.messagePlaceholder', { 
                  defaultValue: 'Tell us how we can help you...' 
                })}
              />
              {errors.message && <span className="contact-form-error">{errors.message}</span>}
            </div>

            <div className="contact-form-actions">
              <button
                type="submit"
                disabled={isSubmitting}
                className="contact-form-submit"
              >
                {isSubmitting ? (
                  <>
                    <svg className="contact-form-spinner" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                        <animate attributeName="stroke-dashoffset" dur="2s" values="31.416;0" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                    {t('common:contact.form.sending', { defaultValue: 'Sending...' })}
                  </>
                ) : (
                  t('common:contact.form.send', { defaultValue: 'Send Message' })
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </BaseModal>
  );
};

export default ContactModal;
