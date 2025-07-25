/**
 * ResetPasswordPage Component
 * 
 * Allows users to reset their password using a token from email
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import AuthenticatedApiService from '../../services/AuthenticatedApiService';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}
// Create service instances
const apiService = AuthenticatedApiService.getInstance();

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  // Create validation schema with translations
  const resetPasswordSchema: yup.ObjectSchema<ResetPasswordFormData> = yup.object({
    password: yup
      .string()
      .min(8, t('common:validation.min', { field: t('common:form.password.label'), min: 8 }))
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        t('common:validation.passwordComplexity')
      )
      .required(t('common:validation.required', { field: t('common:form.password.label') })),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], t('common:validation.passwordMatch'))
      .required(t('common:validation.required', { field: t('common:form.password.confirm') })),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Validate token on component mount
    if (!uid || !token) {
      setTokenValid(false);
      return;
    }

    // You could make an API call to validate the token here
    // For now, we'll assume it's valid if both uid and token are present
    setTokenValid(true);
  }, [uid, token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!uid || !token) {
      toast.error(t('auth:resetPassword.invalidToken'));
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.post('/accounts/reset-password/', {
        uid,
        token,
        new_password: data.password,
      });
      setPasswordReset(true);
      toast.success(t('auth:resetPassword.success'));
    } catch (error: any) {
      console.error('Reset password error:', error);
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error?.response?.status === 400) {
        toast.error(t('auth:resetPassword.invalidToken'));
      } else {
        toast.error(t('common:errors.generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while validating token
  if (tokenValid === null) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="loading-spinner"></div>
            <h1>{t('common:app.loading')}</h1>
          </div>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="error-icon">
              <svg style={{ width: '48px', height: '48px', color: '#f44336' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
              </svg>
            </div>
            <h1>{t('auth:resetPassword.invalidTokenTitle')}</h1>
            <p>{t('auth:resetPassword.invalidTokenMessage')}</p>
          </div>

          <div className="auth-body">
            <div className="text-center">
              <Link to="/auth/forgot-password" className="btn btn-primary btn-lg me-3">
                {t('auth:resetPassword.requestNewToken')}
              </Link>
              <Link to="/auth/login" className="btn btn-secondary btn-lg">
                {t('auth:resetPassword.backToLogin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success message after password reset
  if (passwordReset) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="success-icon">
              <svg style={{ width: '48px', height: '48px', color: '#4CAF50' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17l-3.17-3.17-1.42 1.42L9 18.75l9-9-1.42-1.42z"/>
              </svg>
            </div>
            <h1>{t('auth:resetPassword.successTitle')}</h1>
            <p>{t('auth:resetPassword.successMessage')}</p>
          </div>

          <div className="auth-body">
            <div className="text-center">
              <Link to="/auth/login" className="btn btn-primary btn-lg">
                {t('auth:resetPassword.loginNow')}
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
          <h1>{t('auth:resetPassword.title')}</h1>
          <p>{t('auth:resetPassword.subtitle')}</p>
        </div>

        <div className="auth-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* New Password field */}
            <div className="form-group">
              <label className="form-label required" htmlFor="password">
                {t('common:form.password.new')}
              </label>
              <div className="form-input-group">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`form-control ${errors.password ? 'error' : ''}`}
                  placeholder={t('common:form.password.placeholder')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="form-input-button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg style={{width: '20px', height: '20px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg style={{width: '20px', height: '20px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="form-error">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Confirm Password field */}
            <div className="form-group">
              <label className="form-label required" htmlFor="confirmPassword">
                {t('common:form.password.confirm')}
              </label>
              <div className="form-input-group">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder={t('common:form.password.confirmPlaceholder')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="form-input-button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg style={{width: '20px', height: '20px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg style={{width: '20px', height: '20px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="form-error">
                  {errors.confirmPassword.message}
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
                  {t('common:app.updating')}
                </>
              ) : (
                t('auth:resetPassword.button')
              )}
            </button>
          </form>
        </div>

        {/* Auth navigation links */}
        <div className="auth-footer">
          <p className="mb-0">
            <Link to="/auth/login" className="text-primary">
              {t('auth:resetPassword.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
