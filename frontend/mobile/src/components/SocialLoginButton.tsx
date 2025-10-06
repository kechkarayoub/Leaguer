/**
 * SocialLoginButton Component
 * 
 * Reusable button for social media authentication
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useTheme } from '../contexts/ThemeContext';
import SocialAuthService, { SocialAuthResult } from '../services/SocialAuthService';

export type SocialProvider = 'google' | 'facebook' | 'apple';

interface SocialLoginButtonProps {
  provider: SocialProvider;
  onSuccess: (result: SocialAuthResult) => void;
  onError: (error: Error) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: any;
}

const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  onSuccess,
  onError,
  disabled = false,
  fullWidth = true,
  style,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const socialAuthService = SocialAuthService.getInstance();

  const getProviderConfig = () => {
    switch (provider) {
      case 'google':
        return {
          title: t('auth:oauth.signInWithGoogle', { defaultValue: t('auth:oauth.google', { defaultValue: 'Continue with Google' }) }),
          icon: (
            <AntDesign name="google" size={18} color="#FFFFFF" />
          ),
          backgroundColor: '#DB4437', // Google Red
          textColor: '#FFFFFF',
          borderColor: '#C33D32',
          available: socialAuthService.isGoogleSignInAvailable(),
        } as const;
      case 'facebook':
        return {
          title: t('auth:oauth.signInWithFacebook', { defaultValue: t('auth:oauth.facebook', { defaultValue: 'Continue with Facebook' }) }),
          icon: (
            <FontAwesome name="facebook" size={18} color="#FFFFFF" />
          ),
          backgroundColor: '#1877F2',
          textColor: '#FFFFFF',
          borderColor: '#1877F2',
          available: socialAuthService.isFacebookSignInAvailable(),
        } as const;
      case 'apple':
        return {
          title: t('auth:oauth.signInWithApple', { defaultValue: t('auth:oauth.apple', { defaultValue: 'Continue with Apple' }) }),
          icon: (
            <AntDesign name="apple1" size={18} color="#FFFFFF" />
          ),
          backgroundColor: '#000000',
          textColor: '#FFFFFF',
          borderColor: '#000000',
          available: socialAuthService.isAppleSignInAvailable(),
        } as const;
      default:
        return {
          title: t('auth:oauth.continueWith', { defaultValue: 'Continue with' }),
          icon: null,
          backgroundColor: colors.surface,
          textColor: colors.text,
          borderColor: colors.border ?? '#E0E0E0',
          available: false,
        } as const;
    }
  };

  const handlePress = async () => {
    if (disabled || isLoading) return;

    const config = getProviderConfig();
    if (!config.available) {
      onError(new Error(`${provider} login is not available`));
      return;
    }

    setIsLoading(true);

    try {
      let result: SocialAuthResult;

      switch (provider) {
        case 'google':
          result = await socialAuthService.signInWithGoogle();
          break;
        case 'facebook':
          result = await socialAuthService.signInWithFacebook();
          break;
        case 'apple':
          result = await socialAuthService.signInWithApple();
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      onSuccess(result);
    } catch (error) {
      console.error(`${provider} Sign-In Error:`, error);
      onError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const config = getProviderConfig();

  if (!config.available) {
    return null; // Don't render if provider is not available
  }

  const buttonOpacity = (disabled || isLoading) ? 0.6 : 1;

  const contentColorStyles = { color: config.textColor } as const;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: config.backgroundColor,
          borderColor: (config as any).borderColor,
          opacity: buttonOpacity,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={config.textColor}
            style={styles.icon}
          />
        ) : (
          <View style={[styles.icon, styles.iconContainer]}>
            {config.icon}
          </View>
        )}
        
        <Text style={[styles.title, contentColorStyles]}>
          {isLoading ? t('common:app.progress...') : config.title} 
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 12,
  },
  iconContainer: { justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SocialLoginButton;
