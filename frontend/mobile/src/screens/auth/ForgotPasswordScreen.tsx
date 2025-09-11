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

const forgotPasswordSchema = yup.object({
  email_or_username: yup
    .string()
    .required('Email or username is required')
    .min(3, 'Email or username must be at least 3 characters'),
});

const ForgotPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const apiService = AuthenticatedApiService.getInstance();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email_or_username: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsLoading(true);
      
      // Send password reset request to backend
      const response = await apiService.post('/accounts/password-reset/', {
        email_or_username: data.email_or_username,
      });

      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: t('auth:forgotPassword.successTitle'),
          text2: t('auth:forgotPassword.successMessage'),
        });
        
        // Navigate back to login after successful request
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
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

export default ForgotPasswordScreen;
