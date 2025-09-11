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
import { LoginCredentials, SocialLoginCredentials } from '../../types/auth.types';
import { SocialAuthResult } from '../../services/SocialAuthService';
import config from '../../config/config';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language } = useLanguage();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, socialLogin, isLoggingIn } = useAuth();
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

        {isLoggingIn && <LoadingSpinner visible overlay />}
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
});

export default LoginScreen;
