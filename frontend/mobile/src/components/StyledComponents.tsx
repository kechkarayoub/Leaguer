/**
 * Styled Components
 * 
 * Pre-styled components using the centralized theme system
 */

import React from 'react';
import { View, Text, ViewStyle, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, borderRadius, typography } from '../styles';
import CustomButton from './form/CustomButton';

// Styled Container
interface StyledContainerProps {
  children: React.ReactNode;
  variant?: 'default' | 'card' | 'surface';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const StyledContainer: React.FC<StyledContainerProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  style,
}) => {
  const { colors } = useTheme();

  const getContainerStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {};

    // Variant styles
    switch (variant) {
      case 'card':
        Object.assign(baseStyle, {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.md,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        });
        break;
      case 'surface':
        Object.assign(baseStyle, {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.base,
        });
        break;
      default:
        Object.assign(baseStyle, {
          backgroundColor: colors.background,
        });
    }

    // Padding styles
    switch (padding) {
      case 'sm':
        Object.assign(baseStyle, { padding: spacing.md });
        break;
      case 'lg':
        Object.assign(baseStyle, { padding: spacing.xl });
        break;
      case 'md':
        Object.assign(baseStyle, { padding: spacing.base });
        break;
      case 'none':
        // No padding
        break;
    }

    return baseStyle;
  };

  return (
    <View style={[getContainerStyles(), style]}>
      {children}
    </View>
  );
};

// Styled Text
interface StyledTextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
  color?: 'primary' | 'secondary' | 'text' | 'textSecondary' | 'error' | 'success';
  align?: 'left' | 'center' | 'right';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  style?: TextStyle;
}

export const StyledText: React.FC<StyledTextProps> = ({
  children,
  variant = 'body',
  color = 'text',
  align = 'left',
  weight = 'normal',
  style,
}) => {
  const { colors } = useTheme();

  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      textAlign: align,
    };

    // Variant styles
    switch (variant) {
      case 'h1':
        Object.assign(baseStyle, {
          fontSize: typography.fontSize['3xl'],
          fontWeight: typography.fontWeight.bold,
        });
        break;
      case 'h2':
        Object.assign(baseStyle, {
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.semibold,
        });
        break;
      case 'h3':
        Object.assign(baseStyle, {
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.semibold,
        });
        break;
      case 'caption':
        Object.assign(baseStyle, {
          fontSize: typography.fontSize.sm,
        });
        break;
      case 'label':
        Object.assign(baseStyle, {
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
        });
        break;
      default: // body
        Object.assign(baseStyle, {
          fontSize: typography.fontSize.base,
        });
    }

    // Weight override
    if (weight !== 'normal') {
      baseStyle.fontWeight = weight === 'medium' ? '500' : 
                           weight === 'semibold' ? '600' : 
                           weight === 'bold' ? '700' : 'normal';
    }

    // Color styles
    switch (color) {
      case 'primary':
        baseStyle.color = colors.primary;
        break;
      case 'secondary':
        baseStyle.color = colors.secondary;
        break;
      case 'textSecondary':
        baseStyle.color = colors.textSecondary;
        break;
      case 'error':
        baseStyle.color = colors.error;
        break;
      case 'success':
        baseStyle.color = colors.success;
        break;
      default:
        baseStyle.color = colors.text;
    }

    return baseStyle;
  };

  return (
    <Text style={[getTextStyles(), style]}>
      {children}
    </Text>
  );
};

// Styled Button (wrapper around CustomButton with theme-aware defaults)
interface StyledButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  loadingTitle: string;
}

export const StyledButton: React.FC<StyledButtonProps> = (props) => {
  return <CustomButton {...props} />;
};

// Styled Spacer
interface StyledSpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  horizontal?: boolean;
}

export const StyledSpacer: React.FC<StyledSpacerProps> = ({
  size = 'md',
  horizontal = false,
}) => {
  const getSpacing = () => {
    switch (size) {
      case 'xs': return spacing.xs;
      case 'sm': return spacing.sm;
      case 'lg': return spacing.lg;
      case 'xl': return spacing.xl;
      default: return spacing.base;
    }
  };

  const spacerStyle = horizontal
    ? { width: getSpacing() }
    : { height: getSpacing() };

  return <View style={spacerStyle} />;
};

// Styled Divider
interface StyledDividerProps {
  margin?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const StyledDivider: React.FC<StyledDividerProps> = ({
  margin = 'md',
  style,
}) => {
  const { colors } = useTheme();

  const getMargin = () => {
    switch (margin) {
      case 'sm': return spacing.sm;
      case 'lg': return spacing.lg;
      default: return spacing.base;
    }
  };

  return (
    <View
      style={[
        dividerStyles.divider,
        {
          backgroundColor: colors.border,
          marginVertical: getMargin(),
        },
        style,
      ]}
    />
  );
};

const dividerStyles = StyleSheet.create({
  divider: {
    height: 1,
  },
});

// Export all styled components
export default {
  Container: StyledContainer,
  Text: StyledText,
  Button: StyledButton,
  Spacer: StyledSpacer,
  Divider: StyledDivider,
};
