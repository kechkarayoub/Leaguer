/**
 * ForgotPasswordPage Component
 * 
 * Allows users to request a password reset email
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import AuthenticatedApiService from '../../services/AuthenticatedApiService';

interface ForgotPasswordFormData {
  email_or_username: string;
}
// Create service instances
const apiService = AuthenticatedApiService.getInstance();

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Create validation schema with translations
  const forgotPasswordSchema: yup.ObjectSchema<ForgotPasswordFormData> = yup.object({
    email_or_username: yup
      .string()
      .required(t('common:validation.required', { field: t('common:form.name.username') + ' / ' + t('common:form.email.label') })),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email_or_username: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    try {
      await apiService.post('/accounts/forgot-password/', data);
      setEmailSent(true);
      toast.success(t('auth:forgotPassword.emailSent'));
    } catch (error: any) {
      console.error('Forgot password error:', error);
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(t('common:errors.generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="success-icon">
              <svg style={{ width: '48px', height: '48px', color: '#4CAF50' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17l-3.17-3.17-1.42 1.42L9 18.75l9-9-1.42-1.42z"/>
              </svg>
            </div>
            <h1>{t('auth:forgotPassword.emailSentTitle')}</h1>
            <p>{t('auth:forgotPassword.emailSentMessage', { email: getValues('email_or_username') })}</p>
          </div>

          <div className="auth-body">
            <div className="text-center">
              <p className="mb-4">
                {t('auth:forgotPassword.checkEmail')}
              </p>
              <Link to="/auth/login" className="btn btn-primary btn-lg">
                {t('auth:forgotPassword.backToLogin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{t('auth:forgotPassword.title')}</h1>
          <p>{t('auth:forgotPassword.subtitle')}</p>
        </div>

        <div className="auth-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Email or Username field */}
            <div className="form-group">
              <label className="form-label required" htmlFor="email_or_username">
                {t('common:form.name.username')} / {t('common:form.email.label')}
              </label>
              <input
                {...register('email_or_username')}
                type="text"
                id="email_or_username"
                className={`form-control ${errors.email_or_username ? 'error' : ''}`}
                placeholder={t('common:form.emailOrUsername.placeholder')}
                autoComplete="username email"
              />
              {errors.email_or_username && (
                <span className="form-error">
                  {errors.email_or_username.message}
                </span>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg btn-full"
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner"></div>
                  {t('common:app.sending')}
                </>
              ) : (
                t('auth:forgotPassword.button')
              )}
            </button>
          </form>
        </div>

        {/* Auth navigation links */}
        <div className="auth-footer">
          <p className="mb-0">
            {t('auth:forgotPassword.rememberPassword')}{' '}
            <Link to="/auth/login" className="text-primary">
              {t('auth:forgotPassword.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
