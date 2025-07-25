/**
 import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';

import useAuth, { RegisterCredentials } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/LoadingSpinner';
import SocialLoginButton from '../../components/SocialLoginButton';
import AuthFooter from '../../components/AuthFooter';Page Component
 * 
 * User registration page with form validation
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';

import useAuth, { RegisterCredentials } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/LoadingSpinner';
import SocialLoginButton from '../../components/SocialLoginButton';

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: registerUser, isRegistering } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Create validation schema with translations
  const registerSchema: yup.ObjectSchema<RegisterCredentials> = yup.object({
    firstName: yup.string().required(t('common:validation.required', { field: t('common:form.name.first') })),
    lastName: yup.string().required(t('common:validation.required', { field: t('common:form.name.last') })),
    email: yup
      .string()
      .email(t('common:validation.email'))
      .required(t('common:validation.required', { field: t('common:form.email.label') })),
    password: yup
      .string()
      .min(8, t('common:validation.min', { field: t('common:form.password.label'), min: 8 }))
      .matches(/[A-Z]/, t('common:form.password.requirements'))
      .matches(/[a-z]/, t('common:form.password.requirements'))
      .matches(/[0-9]/, t('common:form.password.requirements'))
      .required(t('common:validation.required', { field: t('common:form.password.label') })),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], t('common:form.password.mismatch'))
      .required(t('common:validation.required', { field: t('common:form.password.confirm') })),
  }) as yup.ObjectSchema<RegisterCredentials>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<RegisterCredentials>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterCredentials) => {
    try {
      await registerUser(data);
      navigate('/dashboard');
    } catch (error: any) {
      // Handle specific validation errors
      if (error?.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        Object.keys(serverErrors).forEach((field) => {
          setError(field as keyof RegisterCredentials, {
            type: 'server',
            message: serverErrors[field],
          });
        });
      }
    }
  };

  const handleSocialLoginSuccess = async (result: any) => {
    try {
      // Convert social login result to registration credentials
      await registerUser({
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        provider: result.provider,
        accessToken: result.accessToken,
      } as any);
      navigate('/dashboard');
    } catch (error) {
      console.error('Social registration failed:', error);
    }
  };

  const handleSocialLoginError = (error: any) => {
    console.error('Social registration error:', error);
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password || '');

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>
            {t('auth:register.title')}
          </h1>
          <p>
            {t('auth:register.subtitle')}
          </p>
        </div>

        <div className="auth-body">
          {/* Social login options */}
          {process.env.REACT_APP_ENABLE_GOOGLE_LOGIN === 'true' && (
            <>
              <div className="social-buttons">
                <SocialLoginButton 
                  provider="google" 
                  onSuccess={handleSocialLoginSuccess}
                  onError={handleSocialLoginError}
                />
              </div>

              <div className="divider">
                {t('auth:oauth.or')}
              </div>
            </>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Name fields */}
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="form-label required" htmlFor="firstName">
                    {t('common:form.name.first')}
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    id="firstName"
                    className={`form-control ${errors.firstName ? 'error' : ''}`}
                    placeholder={t('common:form.name.first')}
                    autoComplete="given-name"
                  />
                  {errors.firstName && (
                    <span className="form-error">
                      {errors.firstName.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="col">
                <div className="form-group">
                  <label className="form-label required" htmlFor="lastName">
                    {t('common:form.name.last')}
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    id="lastName"
                    className={`form-control ${errors.lastName ? 'error' : ''}`}
                    placeholder={t('common:form.name.last')}
                    autoComplete="family-name"
                  />
                  {errors.lastName && (
                    <span className="form-error">
                      {errors.lastName.message}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Email field */}
            <div className="form-group">
              <label className="form-label required" htmlFor="email">
                {t('common:form.email.label')}
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className={`form-control ${errors.email ? 'error' : ''}`}
                placeholder={t('common:form.email.placeholder')}
                autoComplete="email"
              />
              {errors.email && (
                <span className="form-error">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Password field */}
            <div className="form-group">
              <label className="form-label required" htmlFor="password">
                {t('common:form.password.label')}
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {password && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    <div className={`strength-segment ${passwordStrength >= 1 ? 'active weak' : ''}`}></div>
                    <div className={`strength-segment ${passwordStrength >= 2 ? 'active medium' : ''}`}></div>
                    <div className={`strength-segment ${passwordStrength >= 3 ? 'active medium' : ''}`}></div>
                    <div className={`strength-segment ${passwordStrength >= 4 ? 'active strong' : ''}`}></div>
                  </div>
                  <p className="password-strength-text">
                    {passwordStrength <= 2 ? t('auth:register.passwordWeak') : passwordStrength <= 3 ? t('auth:register.passwordMedium') : t('auth:register.passwordStrong')}
                  </p>
                </div>
              )}
              
              {errors.password && (
                <span className="form-error">
                  {errors.password.message}
                </span>
              )}
            </div>

          {/* Confirm password field */}
          <div className="form-group">
            <label className="form-label required" htmlFor="confirmPassword">
              {t('auth:register.confirmPassword')}
            </label>
            <div className="form-input-group">
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                placeholder={t('auth:register.confirmPasswordPlaceholder')}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="form-input-button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            disabled={isRegistering}
            className="btn btn-primary btn-lg btn-full"
          >
            {isRegistering ? (
              <>
                <div className="loading-spinner"></div>
                {t('auth:register.creatingAccount')}
              </>
            ) : (
              t('auth:register.createAccount')
            )}
          </button>
          </form>
        </div>

        {/* Auth navigation links */}
        <div className="auth-footer">
          <p className="mb-0">
            {t('auth:register.haveAccount')}{' '}
            <Link to="/auth/login" className="text-primary">
              {t('auth:register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};


export default RegisterPage;

