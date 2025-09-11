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
          title: t('auth:oauth.signInWithGoogle'),
          icon: '🔍', // Replace with actual Google icon
          backgroundColor: '#4285F4',
          textColor: '#FFFFFF',
          available: socialAuthService.isGoogleSignInAvailable(),
        };
      case 'facebook':
        return {
          title: t('auth:oauth.signInWithFacebook'),
          icon: '📘', // Replace with actual Facebook icon
          backgroundColor: '#1877F2',
          textColor: '#FFFFFF',
          available: socialAuthService.isFacebookSignInAvailable(),
        };
      case 'apple':
        return {
          title: t('auth:oauth.signInWithApple'),
          icon: '🍎', // Replace with actual Apple icon
          backgroundColor: '#000000',
          textColor: '#FFFFFF',
          available: socialAuthService.isAppleSignInAvailable(),
        };
      default:
        return {
          title: 'Unknown Provider',
          icon: '❓',
          backgroundColor: colors.surface,
          textColor: colors.text,
          available: false,
        };
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

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: config.backgroundColor,
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
          <Text style={[styles.icon, { color: config.textColor }]}>
            {config.icon}
          </Text>
        )}
        
        <Text style={[styles.title, { color: config.textColor }]}>
          {isLoading ? t('common:app.loading') : config.title}
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
    fontSize: 18,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SocialLoginButton;
