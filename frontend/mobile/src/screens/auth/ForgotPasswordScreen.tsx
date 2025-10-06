/**
 * ForgotPasswordScreen Component
 * 
 * Enhanced password reset request screen that accepts username or email
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
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../contexts/ThemeContext';
import AuthenticatedApiService from '../../services/AuthenticatedApiService';
import Toast from 'react-native-toast-message';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

interface ForgotPasswordForm {
  email_or_username: string;
}

const buildSchema = (t: (key: string) => string) =>
  yup.object({
    email_or_username: yup
      .string()
      .required(t('auth:validation.emailOrUsernameRequired'))
      .min(3, t('auth:validation.emailOrUsernameMinLength')),
  });

const ForgotPasswordScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const [responseMessage, setResponseMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const apiService = AuthenticatedApiService.getInstance();

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>({
    resolver: yupResolver(buildSchema(t)),
    defaultValues: {
      email_or_username: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsLoading(true);
      
      // Send password reset request to backend (matching web endpoint)
      const response = await apiService.post('/accounts/forgot-password/', {
        email_or_username: data.email_or_username,
        selected_language: i18n.language,
      });

      // Show success state instead of just toast
      setEmailSent(true);
      setResponseMessage(response.data.message);
      
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setResponseMessage('');
      const message = error?.response?.data?.message || t('auth:forgotPassword.errorMessage');
      Toast.show({
        type: 'error',
        text1: t('auth:forgotPassword.errorTitle'),
        text2: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  // Success view when email is sent (matching web behavior)
  if (emailSent) {
    return (
      <>
        <AppHeader 
          title={t('auth:forgotPassword.emailSentTitle')}
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
                  {t('auth:forgotPassword.emailSentTitle')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {t(responseMessage || 'auth:forgotPassword.emailSentMessage', { email: getValues('email_or_username') })}
                </Text>
              </View>

              {/* Instructions */}
              <View style={styles.form}>
                <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                  {t('auth:forgotPassword.checkEmail')}
                </Text>

                {/* Back to Login Button */}
                <CustomButton
                  title={t('auth:forgotPassword.backToLogin')}
                  onPress={handleBackToLogin}
                  variant="primary"
                  size="md"
                  fullWidth
                  style={styles.submitButton}
                  loadingTitle={t('auth:forgotPassword.backToLogin')}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </>
    );
  }

  return (
    <>
      <AppHeader 
        title={t('auth:forgotPassword.title')}
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
                {t('auth:forgotPassword.title')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t('auth:forgotPassword.subtitle')}
              </Text>
            </View>

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

              {/* Submit Button */}
              <CustomButton
                title={t('auth:forgotPassword.sendButton')}
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                disabled={isLoading}
                variant="primary"
                size="md"
                fullWidth
                style={styles.submitButton}
                loadingTitle={t('auth:forgotPassword.loadingSendButton')}
              />
            </View>

            {/* Back to Login Link */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                {t('auth:forgotPassword.rememberPassword')}{' '}
              </Text>
              <TouchableOpacity onPress={handleBackToLogin}>
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  {t('auth:login.signInButton')}
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
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
});

export default ForgotPasswordScreen;
