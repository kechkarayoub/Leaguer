/**
 * Theme Selector Component
 * 
 * Allows users to select their preferred theme (light/dark/default)
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '../contexts/ThemeContext';

interface ThemeOption {
  value: Theme;
  label: string;
  description: string;
  icon: string;
}

const ThemeSelector: React.FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme, colors } = useTheme();

  const themeOptions: ThemeOption[] = [
    {
      value: 'light',
      label: t('settings:theme.light'),
      description: t('settings:theme.light_description'),
      icon: '☀️',
    },
    {
      value: 'dark',
      label: t('settings:theme.dark'),
      description: t('settings:theme.dark_description'),
      icon: '🌙',
    },
    {
      value: 'default',
      label: t('settings:theme.default'),
      description: t('settings:theme.default_description'),
      icon: '📱',
    },
  ];

  const handleThemeSelect = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t('settings:theme.title')}
      </Text>
      
      {themeOptions.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.themeOption,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            theme === option.value && {
              backgroundColor: colors.primary + '20',
              borderColor: colors.primary,
            },
          ]}
          onPress={() => handleThemeSelect(option.value)}
        >
          <View style={styles.themeInfo}>
            <Text style={styles.themeIcon}>{option.icon}</Text>
            <View style={styles.themeText}>
              <Text
                style={[
                  styles.themeLabel,
                  {
                    color: theme === option.value ? colors.primary : colors.text,
                  },
                ]}
              >
                {option.label}
              </Text>
              <Text
                style={[
                  styles.themeDescription,
                  {
                    color: theme === option.value ? colors.primary : colors.textSecondary,
                  },
                ]}
              >
                {option.description}
              </Text>
            </View>
          </View>
          {theme === option.value && (
            <View
              style={[
                styles.checkmark,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.checkmarkText, { color: colors.background }]}>
                ✓
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  themeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  themeText: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ThemeSelector;
