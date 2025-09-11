/**
 * Language Picker Component
 * 
 * Allows users to select their preferred language
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage, Language } from '../contexts/LanguageContext';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

const languageOptions: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇲🇦',
  },
];

interface LanguagePickerProps {
  visible: boolean;
  onClose: () => void;
  showTitle?: boolean;
}

const LanguagePicker: React.FC<LanguagePickerProps> = ({
  visible,
  onClose,
  showTitle = true,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language, setLanguage } = useLanguage();

  const handleLanguageSelect = async (selectedLanguage: Language) => {
    if (selectedLanguage !== language) {
      await setLanguage(selectedLanguage);
    }
    onClose();
  };

  const renderLanguageItem = ({ item }: { item: LanguageOption }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        language === item.code && {
          backgroundColor: colors.primary + '20',
          borderColor: colors.primary,
        },
      ]}
      onPress={() => handleLanguageSelect(item.code)}
    >
      <View style={styles.languageInfo}>
        <Text style={styles.flag}>{item.flag}</Text>
        <View style={styles.languageText}>
          <Text
            style={[
              styles.languageName,
              {
                color: language === item.code ? colors.primary : colors.text,
              },
            ]}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.languageNative,
              {
                color: language === item.code ? colors.primary : colors.textSecondary,
              },
            ]}
          >
            {item.nativeName}
          </Text>
        </View>
      </View>
      {language === item.code && (
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
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {showTitle && (
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('settings:language.selectLanguage')}
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.surface }]}
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={languageOptions}
          keyExtractor={(item) => item.code}
          renderItem={renderLanguageItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />

        {showTitle && (
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {t('settings:language.restartNote')}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  languageNative: {
    fontSize: 14,
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
  footer: {
    padding: 20,
    paddingTop: 0,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LanguagePicker;
