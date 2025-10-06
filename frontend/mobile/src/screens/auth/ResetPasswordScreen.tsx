/**
 * ResetPasswordScreen Component
 * 
 * Allows users to reset their password using a token from email
 */

import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { AuthStackParamList } from '../../navigation/AppNavigation';
import CustomTextInput from '../../components/form/CustomTextInput';
import CustomButton from '../../components/form/CustomButton';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../contexts/ThemeContext';
import AuthenticatedApiService from '../../services/AuthenticatedApiService';
import Toast from 'react-native-toast-message';

type ResetPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

const buildSchema = (t: (key: string) => string) =>
  yup.object({
    password: yup
      .string()
      .min(8, t('auth:validation.passwordMinLength'))
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        t('auth:validation.passwordComplexity')
      )
      .required(t('auth:validation.passwordRequired')),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], t('auth:validation.passwordMatch'))
      .required(t('auth:validation.confirmPasswordRequired')),
  });

const ResetPasswordScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const apiService = AuthenticatedApiService.getInstance();

  // Get uid and token from route params
  const { uid, token } = route.params || {};

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: yupResolver(buildSchema(t)),
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

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!uid || !token) {
      Toast.show({
        type: 'error',
        text1: t('auth:resetPassword.errorTitle'),
        text2: t('auth:resetPassword.invalidToken'),
      });
      return;
    }

    try {
      setIsLoading(true);
      setServerMessage("");
      
      await apiService.post('/accounts/reset-password/', {
        uid,
        token,
        new_password: data.password,
        selected_language: i18n.language,
      });

      setPasswordReset(true);
      Toast.show({
        type: 'success',
        text1: t('auth:resetPassword.successTitle'),
        text2: t('auth:resetPassword.success'),
      });
      
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      let message = t('auth:resetPassword.errorMessage');
      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.response?.status === 400) {
        message = t('auth:resetPassword.invalidToken');
      }
      setServerMessage(message);
      Toast.show({
        type: 'error',
        text1: t('auth:resetPassword.errorTitle'),
        text2: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const handleRequestNewToken = () => {
    navigation.navigate('ForgotPassword');
  };

  // Show loading while validating token
  if (tokenValid === null) {
    return (
      <>
        <AppHeader 
          title={t('auth:resetPassword.title')}
          showBackButton={true}
          onBackPress={handleBackToLogin}
        />
        
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.centerContent}>
            <LoadingSpinner visible />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              {t('common:app.loading')}
            </Text>
          </View>
        </View>
      </>
    );
  }

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <>
        <AppHeader 
          title={t('auth:resetPassword.invalidTokenTitle')}
          showBackButton={true}
          onBackPress={handleBackToLogin}
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
              {/* Error Header */}
              <View style={styles.header}>
                <View style={[styles.errorIcon, { borderColor: colors.error }]}>
                  <Text style={[styles.errorX, { color: colors.error }]}>✕</Text>
                </View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t('auth:resetPassword.invalidTokenTitle')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {t('auth:resetPassword.invalidTokenMessage')}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.form}>
                <CustomButton
                  title={t('auth:resetPassword.requestNewToken')}
                  onPress={handleRequestNewToken}
                  variant="primary"
                  size="md"
                  fullWidth
                  style={styles.actionButton}
                  loadingTitle={t('auth:resetPassword.requestNewToken')}
                />

                <CustomButton
                  title={t('auth:resetPassword.backToLogin')}
                  onPress={handleBackToLogin}
                  variant="secondary"
                  size="md"
                  fullWidth
                  style={styles.submitButton}
                  loadingTitle={t('auth:resetPassword.backToLogin')}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </>
    );
  }

  // Show success message after password reset
  if (passwordReset) {
    return (
      <>
        <AppHeader 
          title={t('auth:resetPassword.successTitle')}
          showBackButton={true}
          onBackPress={handleBackToLogin}
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
              {/* Success Header */}
              <View style={styles.header}>
                <View style={[styles.successIcon, { borderColor: colors.success }]}>
                  <Text style={[styles.successCheckmark, { color: colors.success }]}>✓</Text>
                </View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t('auth:resetPassword.successTitle')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {t('auth:resetPassword.successMessage')}
                </Text>
              </View>

              {/* Login Button */}
              <View style={styles.form}>
                <CustomButton
                  title={t('auth:resetPassword.loginNow')}
                  onPress={handleBackToLogin}
                  variant="primary"
                  size="md"
                  fullWidth
                  style={styles.submitButton}
                  loadingTitle={t('auth:resetPassword.loginNow')}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </>
    );
  }

  // Main reset password form
  return (
    <>
      <AppHeader 
        title={t('auth:resetPassword.title')}
        showBackButton={true}
        onBackPress={handleBackToLogin}
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
                {t('auth:resetPassword.title')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t('auth:resetPassword.subtitle')}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <CustomTextInput
                    label={t('auth:fields.newPassword')}
                    placeholder={t('auth:placeholders.newPassword')}
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

              {!!serverMessage && (
                <View style={[styles.serverMessageBox, { borderColor: colors.error }]}> 
                  <Text style={[styles.serverMessageText, { color: colors.error }]}>
                    {serverMessage}
                  </Text>
                </View>
              )}

              {/* Reset Password Button */}
              <CustomButton
                title={t('auth:resetPassword.button')}
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                disabled={isLoading}
                variant="primary"
                size="md"
                fullWidth
                style={styles.submitButton}
                loadingTitle={t('auth:resetPassword.loadingButton')}
              />
            </View>

            {/* Back to Login Link */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={handleBackToLogin}>
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  {t('auth:resetPassword.backToLogin')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {isLoading && <LoadingSpinner visible overlay />}
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: '#007AFF', // Ensure visible button
    minHeight: 44,
    textAlign: 'center',
    borderRadius: 8,
  },
  actionButton: {
    marginTop: 16,
    marginBottom: 12,
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
  linkText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successCheckmark: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorX: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  serverMessageBox: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.06)', // subtle error background
  },
  serverMessageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default ResetPasswordScreen;