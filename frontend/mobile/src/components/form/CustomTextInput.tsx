/**
 * CustomTextInput Component
 * 
 * A reusable text input component with consistent styling using centralized theme
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { spacing, typography, borderRadius } from '../../styles';

interface CustomTextInputProps extends TextInputProps {
  /** Label text for the input */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Whether the input is required */
  required?: boolean;
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  /** Icon component to display on the right */
  rightIcon?: React.ReactNode;
  /** Function called when right icon is pressed */
  onRightIconPress?: () => void;
  /** Custom container style */
  containerStyle?: any;
  /** Custom input style */
  inputStyle?: any;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  label,
  error,
  required = false,
  size = 'md',
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  ...textInputProps
}) => {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [isFocused, setIsFocused] = useState(false);

  const isRTL = language === 'ar';

  const getInputContainerStyles = () => {
    const sizeStyles = {
      sm: { 
        paddingHorizontal: spacing.md, 
        paddingVertical: spacing.xs, 
        minHeight: 36 
      },
      md: { 
        paddingHorizontal: spacing.base, 
        paddingVertical: spacing.md, 
        minHeight: 44 
      },
      lg: { 
        paddingHorizontal: spacing.lg, 
        paddingVertical: spacing.base, 
        minHeight: 52 
      },
    };

    const borderColor = error ? colors.error : (isFocused ? colors.primary : colors.border);
    
    return StyleSheet.flatten([
      styles.inputContainer,
      sizeStyles[size],
      { 
        borderColor,
        backgroundColor: colors.surface,
        flexDirection: (isRTL ? 'row-reverse' : 'row') as 'row' | 'row-reverse',
      },
      error && { borderWidth: 2 },
    ]);
  };

  const getTextStyles = () => {
    const sizeStyles = {
      sm: { fontSize: typography.fontSize.sm },
      md: { fontSize: typography.fontSize.base },
      lg: { fontSize: typography.fontSize.lg },
    };

    return StyleSheet.flatten([
      styles.input,
      { color: colors.text },
      sizeStyles[size],
      inputStyle,
    ]);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {required && <Text style={[styles.required, { color: colors.error }]}> *</Text>}
        </Text>
      )}
      
      <View style={getInputContainerStyles()}>
        {rightIcon && language === 'ar' && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
        <TextInput
          style={getTextStyles()}
          placeholderTextColor={colors.textDisabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          textAlign={isRTL ? 'right' : 'left'}
          {...textInputProps}
        />
        
        {rightIcon && language !== 'ar' && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  required: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.base,
  },
  input: {
    flex: 1,
    paddingVertical: 0, // Remove default padding to use createInputStyle padding
  },
  rightIconContainer: {
    marginLeft: spacing.xs,
    padding: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs / 2,
    fontWeight: '500',
  },
});

export default CustomTextInput;
