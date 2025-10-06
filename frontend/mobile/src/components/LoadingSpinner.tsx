/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner for React Native
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  Modal,
} from 'react-native';

import { t } from 'i18next';
import { useTheme } from '../contexts/ThemeContext';

interface LoadingSpinnerProps {
  /** Whether to show the spinner */
  visible?: boolean;
  /** Loading text to display */
  text?: string;
  /** Size of the spinner */
  size?: 'small' | 'large';
  /** Whether to show as overlay */
  overlay?: boolean;
  /** Custom color for the spinner */
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  visible = true,
  text = t('common:loading'),
  size = 'large',
  overlay = false,
  color,
}) => {
  const { colors } = useTheme();
  
  const spinnerColor = color || colors.primary;

  const content = (
    <View style={[
      styles.container,
      overlay && styles.overlay,
      overlay && { backgroundColor: colors.overlay }
    ]}>
      <View style={[
        styles.content,
        overlay && { backgroundColor: colors.card }
      ]}>
        <ActivityIndicator
          size={size}
          color={spinnerColor}
        />
        {text && (
          <Text style={[
            styles.text,
            { color: colors.text }
          ]}>
            {text}
          </Text>
        )}
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
      >
        {content}
      </Modal>
    );
  }

  return visible ? content : null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  content: {
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default LoadingSpinner;
