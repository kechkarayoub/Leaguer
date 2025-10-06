/**
 * SettingsScreen Component
 * 
 * App settings and preferences screen with theme and language selection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import useAuth from '../../hooks/useAuth';
import CustomButton from '../../components/form/CustomButton';
import ThemeSelector from '../../components/ThemeSelector';
import LanguagePicker from '../../components/LanguagePicker';
import AppHeader from '../../components/AppHeader';

const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { logout } = useAuth();
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getLanguageDisplayName = () => {
    switch (language) {
      case 'fr':
        return 'Français 🇫🇷';
      case 'ar':
        return 'العربية 🇲🇦';
      default:
        return 'English 🇺🇸';
    }
  };

  return (
    <>
      <AppHeader 
        title={t('settings:title')}
        showBackButton={false}
      />
      
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        {/* Language & Appearance Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings:sections.appearance')}
          </Text>
          
          {/* Language Setting */}
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => setShowLanguagePicker(true)}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('settings:language.title')}
            </Text>
            <View style={styles.languageDisplay}>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                {getLanguageDisplayName()}
              </Text>
              <Text style={[styles.arrow, { color: colors.textSecondary }]}>
                →
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Theme Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <ThemeSelector />
        </View>

        {/* Notifications Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings:sections.notifications')}
          </Text>
          
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('settings:notifications.pushNotifications')}
            </Text>
            <Switch
              value={true}
              onValueChange={(value) => console.log('Push notifications:', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={'#FFFFFF'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('settings:notifications.emailNotifications')}
            </Text>
            <Switch
              value={false}
              onValueChange={(value) => console.log('Email notifications:', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={'#FFFFFF'}
            />
          </View>
        </View>

        {/* Privacy & Security Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings:sections.privacySecurity')}
          </Text>
          
          <TouchableOpacity style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('settings:security.changePassword')}
            </Text>
            <Text style={[styles.arrow, { color: colors.textSecondary }]}>
              →
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('settings:legal.privacyPolicy')}
            </Text>
            <Text style={[styles.arrow, { color: colors.textSecondary }]}>
              →
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('settings:legal.termsOfService')}
            </Text>
            <Text style={[styles.arrow, { color: colors.textSecondary }]}>
              →
            </Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings:sections.about')}
          </Text>
          
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('settings:about.version')}
            </Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              1.0.0
            </Text>
          </View>
          
          <TouchableOpacity style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('settings:about.appInfo')}
            </Text>
            <Text style={[styles.arrow, { color: colors.textSecondary }]}>
              →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <CustomButton
          title={t('settings:actions.signOut')}
          variant="outline"
          onPress={handleLogout}
          fullWidth
          style={styles.logoutButton}
          loadingTitle={t('settings:actions.signOut')}
        />

        {/* Language Picker Modal */}
        <LanguagePicker
          visible={showLanguagePicker}
          onClose={() => setShowLanguagePicker(false)}
        />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingLabel: {
    fontSize: 14,
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
  },
  languageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrow: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 16,
  },
});

export default SettingsScreen;
