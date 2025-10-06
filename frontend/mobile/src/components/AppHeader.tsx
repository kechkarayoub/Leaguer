/**
 * AppHeader Component
 * 
 * Global header with language picker for all screens
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguagePicker from './LanguagePicker';
import LoadingSpinner from './LoadingSpinner';
import { useTranslation } from 'react-i18next';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  showLanguagePicker?: boolean;
  backgroundColor?: string;
  rightComponent?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  showLanguagePicker = true,
  backgroundColor,
  rightComponent,
}) => {
  const { colors } = useTheme();
  const { language, isChangingLanguage } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const insets = useSafeAreaInsets();
    const { t } = useTranslation();

  const getLanguageFlag = () => {
    switch (language) {
      case 'fr':
        return '🇫🇷';
      case 'ar':
        return '🇲🇦';
      default:
        return '🇺🇸';
    }
  };

  const headerBackgroundColor = backgroundColor || colors.background;

  return (
    <View style={[styles.headerContainer, { backgroundColor: headerBackgroundColor, paddingTop: insets.top }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={headerBackgroundColor}
      />
      
      <View style={[styles.header, { backgroundColor: headerBackgroundColor }]}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.surface }]}
              onPress={onBackPress}
            >
              <Text style={[styles.backButtonText, { color: colors.text }]}>
                {language === 'ar' ? '→' : '←'}
              </Text>
            </TouchableOpacity>
          )}
          
          {title && (
            <Text style={[styles.title, { color: colors.text }]}>
              {title}
            </Text>
          )}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightComponent}
          
          {showLanguagePicker && (
            <TouchableOpacity
              style={[styles.languageButton, { backgroundColor: colors.surface }]}
              onPress={() => setShowLanguageModal(true)}
              disabled={isChangingLanguage}
            >
              <Text style={styles.languageFlag}>{getLanguageFlag()}</Text>
              <Text style={[styles.languageText, { color: colors.text }]}>
                {language.toUpperCase()}
              </Text>
              {isChangingLanguage && (
                <View style={styles.loadingIndicator}>
                  <LoadingSpinner visible size="small" text={t('common:progress...')} />
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

        <LanguagePicker
          visible={showLanguageModal}
          onClose={() => setShowLanguageModal(false)}
        />
      </View>
    );
  };
const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
  },
  safeAreaContainer: {
    flex: 0,
  },
  safeAreaTop: {
    flex: 0,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    minHeight: 56, // Ensure minimum height
    backgroundColor: '#FFFFFF', // Ensure white background
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    position: 'relative',
  },
  languageFlag: {
    fontSize: 16,
    marginRight: 6,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
  },
});

export default AppHeader;
