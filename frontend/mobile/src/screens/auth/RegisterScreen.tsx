/**
 * RegisterScreen Component
 * 
 * Enhanced user registration screen with complete form validation and social auth
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
import { RegisterCredentials, SocialLoginCredentials } from '../../types/auth.types';
import { SocialAuthResult } from '../../services/SocialAuthService';
import config from '../../config/config';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language } = useLanguage();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, socialLogin, isRegistering } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerSchema = yup.object({
    firstName: yup
      .string()
      .required(t('auth:validation.firstNameRequired'))
      .matches(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, t('auth:validation.firstNameLettersOnly')),
    lastName: yup
      .string()
      .required(t('auth:validation.lastNameRequired'))
      .matches(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, t('auth:validation.lastNameLettersOnly')),
    username: yup
      .string()
      .required(t('auth:validation.usernameRequired'))
      .min(3, t('auth:validation.usernameMinLength')),
    email: yup
      .string()
      .email(t('auth:validation.emailInvalid'))
      .required(t('auth:validation.emailRequired')),
    password: yup
      .string()
      .min(6, t('auth:validation.passwordMinLength'))
      .required(t('auth:validation.passwordRequired')),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], t('auth:validation.passwordsMatch'))
      .required(t('auth:validation.confirmPasswordRequired')),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterCredentials>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterCredentials) => {
    try {
      await register(data);
      navigation.navigate('Login');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.response?.status === 409) {
        const errorData = error.response.data;
        if (errorData.field_errors) {
          Object.keys(errorData.field_errors).forEach((field) => {
            setError(field as keyof RegisterCredentials, {
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
      console.error('Social registration failed:', error);
    }
  };

  const handleSocialLoginError = (error: Error) => {
    console.error('Social registration error:', error);
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  return (
    <>
      <AppHeader 
        title={t('auth:register.title')}
        showBackButton={true}
        onBackPress={handleSignIn}
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
                {t('auth:register.title')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t('auth:register.subtitle')}
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
              <View style={styles.nameRow}>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <CustomTextInput
                      label={t('auth:fields.firstName')}
                      placeholder={t('auth:placeholders.firstName')}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.firstName?.message}
                      containerStyle={styles.halfWidth}
                      autoCapitalize="words"
                      textContentType="givenName"
                      required
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <CustomTextInput
                      label={t('auth:fields.lastName')}
                      placeholder={t('auth:placeholders.lastName')}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.lastName?.message}
                      containerStyle={styles.halfWidth}
                      autoCapitalize="words"
                      textContentType="familyName"
                      required
                    />
                  )}
                />
              </View>

              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <CustomTextInput
                    label={t('auth:fields.username')}
                    placeholder={t('auth:placeholders.username')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.username?.message}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="username"
                    required
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <CustomTextInput
                    label={t('auth:fields.email')}
                    placeholder={t('auth:placeholders.email')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
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
                    textContentType="newPassword"
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

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <CustomTextInput
                    label={t('auth:fields.confirmPassword')}
                    placeholder={t('auth:placeholders.confirmPassword')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.confirmPassword?.message}
                    secureTextEntry={!showConfirmPassword}
                    textContentType="newPassword"
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Text style={{ color: colors.primary }}>
                          {showConfirmPassword ? t('common:form.hide') : t('common:form.show')}
                        </Text>
                      </TouchableOpacity>
                    }
                    required
                  />
                )}
              />

              {/* Create Account Button */}
              <CustomButton
                title={t('auth:register.createAccountButton')}
                onPress={handleSubmit(onSubmit)}
                loading={isRegistering}
                disabled={isRegistering}
                variant="primary"
                size="md"
                fullWidth
                style={styles.submitButton}
              />
            </View>

            {/* Sign In Link */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                {t('auth:register.haveAccount')}{' '}
              </Text>
              <TouchableOpacity onPress={handleSignIn}>
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  {t('auth:login.signInButton')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {isRegistering && <LoadingSpinner visible overlay />}
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
  form: {
    marginBottom: 32,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  socialLoginSection: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: '#007AFF', // Ensure visible button
    minHeight: 44,
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

export default RegisterScreen;
