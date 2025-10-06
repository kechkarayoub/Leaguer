/**
 * LoginScreen Component
 * 
 * Enhanced    email_or_username: yup
      .string()
      .required(t('auth:validation.emailOrUsernameRequired'))
      .min(3, t('auth:validation.usernameMinLength')),
    password: yup
      .string()
      .min(6, t('auth:validation.passwordMinLength'))
      .required(t('auth:validation.passwordRequired')),gin screen with form validation, language selection, and social auth
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { AuthStackParamList } from '../../navigation/AppNavigation';
import CustomTextInput from '../../components/form/CustomTextInput';
import CustomButton from '../../components/form/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import SocialLoginButton from '../../components/SocialLoginButton';
import AppHeader from '../../components/AppHeader';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import useAuth from '../../hooks/useAuth';
import { LoginCredentials, ResendEmailVerificationCredentials, SocialLoginCredentials } from '../../types/auth.types';
import { SocialAuthResult } from '../../services/SocialAuthService';
import Toast from 'react-native-toast-message';
import config from '../../config/config';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language } = useLanguage();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, socialLogin, isLoggingIn, resendEmailVerification } = useAuth();
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loginSchema = yup.object({
    email_or_username: yup
      .string()
      .required(t('auth:validation.emailOrUsernameRequired'))
      .min(3, t('auth:validation.usernameMinLength')),
    password: yup
      .string()
      .min(6, t('auth:validation.passwordMinLength'))
      .required(t('auth:validation.passwordRequired')),
    rememberMe: yup.boolean().default(false),
  });

  type LoginFormData = yup.InferType<typeof loginSchema>;

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email_or_username: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Convert form data to LoginCredentials format
      const loginData: LoginCredentials = {
        email_or_username: data.email_or_username,
        password: data.password,
        rememberMe: data.rememberMe,
      };
      await login(loginData);
      // Navigation will be handled automatically by the auth state change
    } catch (error: any) {
      console.error('Login error:', error);

      // Handle email verification requirement
      if (error.response?.status === 403 && error.response?.data?.email_verification_required) {
        setEmailVerificationRequired(true);
        setUserId(error.response.data.user_id || '');
        setUserEmail(error.response.data.email || '');
        Toast.show({
          type: 'info',
          text1: t('auth:emailVerification.title'),
          text2: error.response.data.message || t('auth:emailVerification.loginRequiredMessage'),
        });
        return;
      }

      // Handle specific validation errors from the backend
      if (error.response?.status === 409) {
        const errorData = error.response.data;
        if (errorData.field_errors) {
          Object.keys(errorData.field_errors).forEach((field) => {
            setError(field as keyof LoginCredentials, {
              message: errorData.field_errors[field][0],
            });
          });
        }
      }
      else if (error.response?.status === 400) {
        const message = error.response.data.message;
        if (message) {
          ['email_or_username', 'password'].forEach((field) => {
            setError(field as keyof LoginCredentials, {
              message: message,
            });
          });
        }
      }
    }
  };

  const handleSocialLoginSuccess = async (result: SocialAuthResult) => {
    try {
      const socialLoginData: SocialLoginCredentials = {
        email: result.user.email,
        id_token: result.idToken,
        type_third_party: result.provider,
        from_platform: Platform.OS as 'android' | 'ios',
        selected_language: language,
      };
      
      await socialLogin(socialLoginData);
    } catch (error) {
      console.error('Social login failed:', error);
    }
  };

  const handleSocialLoginError = (error: Error) => {
    console.error('Social login error:', error);
  };

  const handleResendVerification = async () => {
    if (!userId) return;

    try {
      setIsResendingVerification(true);
      
      const resendEmailData: ResendEmailVerificationCredentials = {
        user_id: userId,
        selected_language: language,
      };
      
      const response = await resendEmailVerification(resendEmailData);
      const message = response.message || t('auth:emailVerification.resendSuccess');
      const isAlreadyVerified = !!response.already_verified;
      
      if (isAlreadyVerified) {
        // Email was already verified
        setEmailVerificationRequired(false);
        Toast.show({
          type: 'info',
          text1: t('auth:emailVerification.alreadyVerifiedTitle'),
          text2: message,
        });
      } else {
        // Verification email sent successfully
        Toast.show({
          type: 'success',
          text1: t('auth:emailVerification.resendTitle'),
          text2: message,
        });
      }
    } catch (error: any) {
      let errorMessage = t('auth:emailVerification.resendError');
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      // Check if email is already verified
      if (error.response?.status === 401 && error.response?.data?.already_verified) {
        setEmailVerificationRequired(false);
        Toast.show({
          type: 'info',
          text1: t('auth:emailVerification.alreadyVerifiedTitle'),
          text2: errorMessage,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: t('auth:emailVerification.resendTitle'),
          text2: errorMessage,
        });
      }
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleDismissVerificationMessage = () => {
    setEmailVerificationRequired(false);
    setUserId('');
    setUserEmail('');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignUp = () => {
    if (config.features.enableSignup) {
      navigation.navigate('Register');
    }
  };

  return (
    <>
      <AppHeader 
        title={t('auth:login.signIn')}
        showBackButton={false}
      />
      
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                {t('auth:login.signIn')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t('auth:login.signInSubtitle')}
              </Text>
            </View>

            {/* Email Verification Required Message */}
            {emailVerificationRequired && (
              <View style={[styles.verificationMessage, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
                <Text style={[styles.verificationTitle, { color: colors.warning }]}>
                  {t('auth:emailVerification.title')}
                </Text>
                <Text style={[styles.verificationText, { color: colors.text }]}>
                  {t('auth:emailVerification.loginRequiredMessage')}
                </Text>
                {userEmail && (
                  <Text style={[styles.verificationEmail, { color: colors.textSecondary }]}>
                    {userEmail}
                  </Text>
                )}
                <View style={styles.verificationActions}>
                  <CustomButton
                    title={t('auth:emailVerification.resendButton')}
                    onPress={handleResendVerification}
                    loading={isResendingVerification}
                    disabled={isResendingVerification}
                    variant="outline"
                    size="sm"
                    style={styles.resendButton}
                    loadingTitle={t('auth:emailVerification.resending')}
                  />
                  <TouchableOpacity
                    onPress={handleDismissVerificationMessage}
                    style={styles.dismissButton}
                  >
                    <Text style={[styles.dismissText, { color: colors.textSecondary }]}>
                      {t('auth:emailVerification.dismissMessage')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Social Login Buttons */}
            {config.features.enableSocialLogin && (
              <View style={styles.socialLoginSection}>
                {config.features.enableGoogleLogin && (
                  <SocialLoginButton
                    provider="google"
                    onSuccess={handleSocialLoginSuccess}
                    onError={handleSocialLoginError}
                  />
                )}
                
                {config.features.enableFacebookLogin && (
                  <SocialLoginButton
                    provider="facebook"
                    onSuccess={handleSocialLoginSuccess}
                    onError={handleSocialLoginError}
                  />
                )}
                
                {config.features.enableAppleLogin && (
                  <SocialLoginButton
                    provider="apple"
                    onSuccess={handleSocialLoginSuccess}
                    onError={handleSocialLoginError}
                  />
                )}

                <View style={styles.divider}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
                    {t('auth:oauth.or')}
                  </Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                </View>
              </View>
            )}

            {/* Form */}
            <View style={styles.form}>
              <Controller
                control={control}
                name="email_or_username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <CustomTextInput
                    label={t('auth:fields.emailOrUsername')}
                    placeholder={t('auth:placeholders.emailOrUsername')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email_or_username?.message}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="username"
                    required
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <CustomTextInput
                    label={t('auth:fields.password')}
                    placeholder={t('auth:placeholders.password')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Text style={{ color: colors.primary }}>
                          {showPassword ? t('common:form.hide') : t('common:form.show')}
                        </Text>
                      </TouchableOpacity>
                    }
                    required
                  />
                )}
              />

              {/* Remember Me & Forgot Password */}
              <View style={styles.options}>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={[styles.linkText, { color: colors.primary }]}>
                    {t('auth:login.forgotPassword')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <CustomButton
                title={t('auth:login.signInButton')}
                loadingTitle={t('auth:login.loadingSignInButton')}
                onPress={handleSubmit(onSubmit)}
                loading={isLoggingIn}
                disabled={isLoggingIn}
                variant="primary"
                size="md"
                fullWidth
                style={styles.submitButton}
              />
            </View>

            {/* Sign Up Link */}
            {config.features.enableSignup && (
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  {t('auth:login.noAccount')}{' '}
                </Text>
                <TouchableOpacity onPress={handleSignUp}>
                  <Text style={[styles.linkText, { color: colors.primary }]}>
                    {t('auth:login.signUpLink')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {isLoggingIn && <LoadingSpinner text={t('common:progress...')} visible overlay />}
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  socialLoginSection: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    marginHorizontal: 16,
  },
  form: {
    marginBottom: 32,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: '#007AFF', // Ensure visible button
    minHeight: 44,
    textAlign: 'center',
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
  },
  verificationMessage: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  verificationText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  verificationEmail: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  verificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resendButton: {
    flex: 1,
    marginRight: 12,
  },
  dismissButton: {
    padding: 8,
  },
  dismissText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
