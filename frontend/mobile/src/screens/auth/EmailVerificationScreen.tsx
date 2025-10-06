/**
 * EmailVerificationScreen Component
 * 
 * Handles email verification from deep links with uid and token parameters
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { AuthStackParamList } from '../../navigation/AppNavigation';
import CustomButton from '../../components/form/CustomButton';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../contexts/ThemeContext';
import AuthenticatedApiService from '../../services/AuthenticatedApiService';
import Toast from 'react-native-toast-message';

type EmailVerificationScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'VerifyEmail'>;
type EmailVerificationScreenRouteProp = RouteProp<AuthStackParamList, 'VerifyEmail'>;

interface VerificationResult {
  verified: boolean;
  alreadyVerified: boolean;
  expired: boolean;
  message: string;
  isResent: boolean;
}

const EmailVerificationScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<EmailVerificationScreenNavigationProp>();
  const route = useRoute<EmailVerificationScreenRouteProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isResent, setIsResent] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const apiService = AuthenticatedApiService.getInstance();

  // Get uid and token from route params
  const { uid, token } = route.params || { uid: '', token: '' };

  const verifyEmailToken = useCallback(async () => {
    if (!uid || !token) return;

    try {
      setIsLoading(true);

      const selected_language = i18n.language;
      
      const response = await apiService.get(`/accounts/verify-email/?uid=${uid}&token=${token}&selected_language=${selected_language}`);
      
      if (response.status === 200) {
        const message = response.data.message;
        const isAlreadyVerified = !!response.data.already_verified;
        
        setVerificationResult({
          verified: true,
          alreadyVerified: isAlreadyVerified,
          expired: false,
          message: message,
          isResent: false,
        });

        Toast.show({
          type: 'success',
          text1: t('auth:emailVerification.successTitle'),
          text2: message,
        });
      }
    } catch (error: any) {
      console.error('Email verification error:', error);
      
      let message = t('auth:emailVerification.errorMessage');
      let expired = false;
      let new_verification_email_sent = false;

      if (error?.response?.status === 400) {
        // Status 400 could be expired token or invalid parameters
        if (error?.response?.data?.message) {
          message = error.response.data.message;
          // Only check for expired if we have a message, but don't rely on language
          // The backend returns 400 for both expired and invalid tokens
          // We'll assume expired if it's a 400 with a message (safer UX)
          expired = !!error.response.data.expired;
          new_verification_email_sent = !!error.response.data.new_verification_email_sent;
        } else {
          message = t('auth:emailVerification.invalidToken');
        }
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      }

      setVerificationResult({
        verified: false,
        alreadyVerified: false,
        expired,
        message,
        isResent: new_verification_email_sent,
      });

      let title = new_verification_email_sent ? t('auth:emailVerification.resendTitle') : t('auth:emailVerification.errorTitle');

      Toast.show({
        type: 'error',
        text1: title,
        text2: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [uid, token, t, apiService, i18n.language]);

  useEffect(() => {
    // Verify email token on component mount
    if (!uid || !token) {
      setVerificationResult({
        verified: false,
        alreadyVerified: false,
        expired: false,
        message: t('auth:emailVerification.invalidLink'),
        isResent: false,
      });
      return;
    }

    verifyEmailToken();
  }, [uid, token, verifyEmailToken, t]);

  const handleResendVerification = async () => {
    if (!uid || !token) return;

    try {
      setIsResending(true);
      
      const selected_language = i18n.language;
      // Use the same endpoint with resend_verification_email parameter
      await apiService.get(`/accounts/verify-email/?uid=${uid}&token=${token}&resend_verification_email=true&selected_language=${selected_language}`);
      
      Toast.show({
        type: 'success',
        text1: t('auth:emailVerification.resendTitle'),
        text2: t('auth:emailVerification.resendSuccess'),
      });
    } catch (error: any) {
      console.error('Resend verification error:', error);
      
      let message = t('auth:emailVerification.resendError');
      if (error?.response?.data?.message) {
        message = error.response.data.message;
      }
      if (error?.response?.data?.new_verification_email_sent) {
        setVerificationResult({
            verified: false,
            alreadyVerified: false,
            expired: false,
            message: message,
            isResent: true,
        });
        setIsResent(true);
      }

      Toast.show({
        type: 'error',
        text1: t('auth:emailVerification.resendTitle'),
        text2: message,
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const handleGoToRegister = () => {
    navigation.navigate('Register');
  };

  // Show loading while verifying token
  if (isLoading) {
    return (
      <>
        <AppHeader 
          title={t('auth:emailVerification.title')}
          showBackButton={true}
          onBackPress={handleBackToLogin}
        />
        
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.centerContent}>
            <LoadingSpinner visible />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              {t('auth:emailVerification.verifying')}
            </Text>
          </View>
        </View>
      </>
    );
  }

  // Show is resent message if email was resent
  if (isResent) {
    return (
      <>
        <AppHeader 
          title={t('auth:emailVerification.emailResentTitle')}
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
                <View style={[styles.successIcon, { borderColor: colors.success }]}>
                  <Text style={[styles.successCheckmark, { color: colors.success }]}>✓</Text>
                </View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t('auth:emailVerification.emailResentTitle')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {verificationResult?.message || t('auth:emailVerification.emailResentTitleMessage')}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.form}>

                <CustomButton
                  title={t('auth:emailVerification.backToLogin')}
                  onPress={handleBackToLogin}
                  variant="primary"
                  size="md"
                  fullWidth
                  style={styles.submitButton}
                  loadingTitle={t('auth:emailVerification.backToLogin')}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </>
    );
  }

  // Show error if no verification result or invalid link
  if (!verificationResult || (!uid || !token)) {
    return (
      <>
        <AppHeader 
          title={t('auth:emailVerification.invalidLinkTitle')}
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
                  {t('auth:emailVerification.invalidLinkTitle')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {verificationResult?.message || t('auth:emailVerification.invalidLinkMessage')}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.form}>
                <CustomButton
                  title={t('auth:emailVerification.goToRegister')}
                  onPress={handleGoToRegister}
                  variant="primary"
                  size="md"
                  fullWidth
                  style={styles.actionButton}
                  loadingTitle={t('auth:emailVerification.goToRegister')}
                />

                <CustomButton
                  title={t('auth:emailVerification.backToLogin')}
                  onPress={handleBackToLogin}
                  variant="primary"
                  size="md"
                  fullWidth
                  style={styles.submitButton}
                  loadingTitle={t('auth:emailVerification.backToLogin')}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </>
    );
  }

  // Show success message for verified email
  if (verificationResult.verified) {
    return (
      <>
        <AppHeader 
          title={t('auth:emailVerification.successTitle')}
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
                  {verificationResult.alreadyVerified 
                    ? t('auth:emailVerification.alreadyVerifiedTitle')
                    : t('auth:emailVerification.successTitle')
                  }
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {verificationResult.message}
                </Text>
              </View>

              {/* Login Button */}
              <View style={styles.form}>
                <CustomButton
                  title={t('auth:emailVerification.loginNow')}
                  onPress={handleBackToLogin}
                  variant="primary"
                  size="md"
                  fullWidth
                  style={styles.submitButton}
                  loadingTitle={t('auth:emailVerification.loginNow')}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </>
    );
  }

  // Show error with option to resend verification
  return (
    <>
      <AppHeader 
        title={t('auth:emailVerification.errorTitle')}
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
                {verificationResult.expired 
                  ? t('auth:emailVerification.expiredTitle')
                  : t('auth:emailVerification.errorTitle')
                }
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {verificationResult.message}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.form}>
              <CustomButton
                title={t('auth:emailVerification.resendButton')}
                onPress={handleResendVerification}
                loading={isResending}
                disabled={isResending}
                variant="primary"
                size="md"
                fullWidth
                style={styles.actionButton}
                loadingTitle={t('auth:emailVerification.resending')}
              />

              <CustomButton
                title={t('auth:emailVerification.backToLogin')}
                onPress={handleBackToLogin}
                variant="primary"
                size="md"
                fullWidth
                style={styles.submitButton}
                loadingTitle={t('auth:emailVerification.backToLogin')}
              />
            </View>
          </View>
        </ScrollView>

        {isResending && <LoadingSpinner visible overlay />}
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
    textAlign: 'center',
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
    backgroundColor: '#007AFF',
    minHeight: 44,
    textAlign: 'center',
    borderRadius: 8,
  },
  actionButton: {
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: '#007AFF',
    minHeight: 44,
    textAlign: 'center',
    borderRadius: 8,
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
});

export default EmailVerificationScreen;