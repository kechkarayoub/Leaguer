/**
 * LoginPage Component
 * 
 * User login page with form validation and authentication
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

import useAuth, { LoginCredentials, SocialLoginCredentials } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/LoadingSpinner';
import SocialLoginButton from '../../components/SocialLoginButton';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, socialLogin, isLoggingIn, isSocialLoggingIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';
  const prefilledEmail = location.state?.email || '';
  const prefilledUsername = location.state?.username || '';


  // Create validation schema with translations
  const loginSchema: yup.ObjectSchema<LoginCredentials> = yup.object({
    email_or_username: yup
      .string()
      .required(t('common:validation.required', { field: t('common:form.username.label') }))
      .min(3, t('common:validation.min', { field: t('common:form.username.label'), min: 3 })),
    password: yup
      .string()
      .min(6, t('common:validation.min', { field: t('common:form.password.label'), min: 6 }))
      .required(t('common:validation.required', { field: t('common:form.password.label') })),
    rememberMe: yup.boolean().optional(),
  }) as yup.ObjectSchema<LoginCredentials>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginCredentials>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email_or_username: prefilledUsername || prefilledEmail,
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginCredentials) => {
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (error: any) {
      // Handle specific validation errors
      if (error?.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        Object.keys(serverErrors).forEach((field) => {
          setError(field as keyof LoginCredentials, {
            type: 'server',
            message: serverErrors[field],
          });
        });
      }
    }
  };

  const handleSocialLoginSuccess = async (result: any) => {
    try {
      // Use the social login endpoint with proper data structure
      const socialLoginData: SocialLoginCredentials = {
        email: result.user.email,
        id_token: result.accessToken, // This is the JWT token from Google
        type_third_party: result.provider as 'google' | 'facebook' | 'apple',
        from_platform: 'web',
        selected_language: i18n.language || 'en',
      };
      
      await socialLogin(socialLoginData);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Social login failed:', error);
    }
  };

  const handleSocialLoginError = (error: any) => {
    console.error('Social login error:', error);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>
            {t('auth:login.title')}
          </h1>
          <p>
            {t('auth:login.subtitle')}
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
            {/* Username or Email field */}
            <div className="form-group">
              <label className="form-label required" htmlFor="email_or_username">
                {t('common:form.username.label')} / {t('common:form.email.label')}
              </label>
              <input
                {...register('email_or_username')}
                type="text"
                id="email_or_username"
                className={`form-control ${errors.email_or_username ? 'error' : ''}`}
                placeholder={t('common:form.emailOrUsername.placeholder')}
                autoComplete="username"
              />
              {errors.email_or_username && (
                <span className="form-error">
                  {errors.email_or_username.message}
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
                  autoComplete="current-password"
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

            {/* Remember me and forgot password */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <label className="form-checkbox">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  className="form-checkbox-input"
                />
                <span className="form-checkbox-label mlr-5">
                  {t('common:app.remember')}
                </span>
              </label>

              <Link to="/auth/forgot-password" className="text-primary">
                {t('auth:forgotPassword.title')}
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoggingIn || isSocialLoggingIn}
              className="btn btn-primary btn-lg btn-full"
            >
              {(isLoggingIn || isSocialLoggingIn) ? (
                <>
                  <div className="loading-spinner"></div>
                  {t('common:app.loading')}
                </>
              ) : (
                t('auth:login.button')
              )}
            </button>
          </form>
        </div>

        {/* Auth navigation links */}
        {process.env.REACT_APP_ENABLE_SIGNUP === 'true' && (
          <div className="auth-footer">
            <p className="mb-0">
              {t('auth:login.noAccount')}{' '}
              <Link to="/auth/register" className="text-primary">
                {t('auth:login.signUp')}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
