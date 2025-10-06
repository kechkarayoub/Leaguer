/**
 * HomeScreen Component
 * 
 * Main home screen of the application
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import useAuth from '../../hooks/useAuth';
import CustomButton from '../../components/form/CustomButton';
import AppHeader from '../../components/AppHeader';

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <AppHeader 
        title={t('home:title')}
        showBackButton={false}
      />
      
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.welcomeCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            {t('home:welcome.title')}
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
            {user?.first_name ? t('home:welcome.greeting', { name: user.first_name }) : t('home:welcome.default')}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t('home:quickActions.title')}
          </Text>
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.actionButtonText}>{t('home:quickActions.action1')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            >
              <Text style={styles.actionButtonText}>{t('home:quickActions.action2')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t('home:accountInfo.title')}
          </Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              {t('home:accountInfo.email')}:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user?.email || t('common:notAvailable')}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              {t('home:accountInfo.username')}:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user?.username || t('common:notAvailable')}
            </Text>
          </View>
        </View>

        <CustomButton
          title={t('auth:logout.button')}
          variant="outline"
          onPress={handleLogout}
          fullWidth
          style={styles.logoutButton}
          loadingTitle={t('auth:logout.button')}
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
  welcomeCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  logoutButton: {
    marginTop: 16,
  },
});

export default HomeScreen;
