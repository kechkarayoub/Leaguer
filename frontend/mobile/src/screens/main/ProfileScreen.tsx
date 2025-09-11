/**
 * ProfileScreen Component
 * 
 * User profile management screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import useAuth from '../../hooks/useAuth';
import AppHeader from '../../components/AppHeader';

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();

  return (
    <>
      <AppHeader 
        title={t('profile:title')}
        showBackButton={false}
      />
      
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('profile:information.title')}
          </Text>
          
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('profile:fields.firstName')}
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {user?.first_name || t('common:notProvided')}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('profile:fields.lastName')}
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {user?.last_name || t('common:notProvided')}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('profile:fields.username')}
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {user?.username || t('common:notProvided')}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('profile:fields.email')}
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {user?.email || t('common:notProvided')}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('profile:fields.phoneNumber')}
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {user?.user_phone_number || t('common:notProvided')}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('profile:accountStatus.title')}
          </Text>
          
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('profile:accountStatus.emailVerified')}
            </Text>
            <Text style={[
              styles.value,
              { color: user?.isEmailVerified ? colors.success : colors.warning }
            ]}>
              {user?.isEmailVerified ? t('profile:accountStatus.verified') : t('profile:accountStatus.notVerified')}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('profile:accountStatus.memberSince')}
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : t('common:unknown')}
            </Text>
          </View>
        </View>
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
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
});

export default ProfileScreen;
