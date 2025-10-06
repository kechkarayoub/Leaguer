/**
 * Centralized Style System
 * 
 * Global styles and theme utilities for consistent UI across the app
 */

import { StyleSheet } from 'react-native';

// Color schemes
export const lightColors = {
  // Primary brand colors
  primary: '#007AFF',
  primaryDark: '#0056CC',
  primaryLight: '#4DA6FF',
  
  // Secondary colors
  secondary: '#5856D6',
  secondaryDark: '#3634A3',
  secondaryLight: '#8B89E3',
  
  // Neutral colors
  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
  surface: '#FFFFFF',
  
  // Text colors
  text: '#000000',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textDisabled: '#D1D5DB',
  textInverse: '#FFFFFF',
  
  // UI colors
  border: '#E5E5EA',
  borderLight: '#F2F2F7',
  separator: '#C6C6C8',
  
  // Status colors
  success: '#34C759',
  successLight: '#D1FAE5',
  warning: '#FF9500',
  warningLight: '#FEF3CD',
  error: '#FF3B30',
  errorLight: '#FEE2E2',
  info: '#007AFF',
  infoLight: '#DBEAFE',
  
  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
};

export const darkColors = {
  // Primary brand colors
  primary: '#0A84FF',
  primaryDark: '#0056CC',
  primaryLight: '#64B5F6',
  
  // Secondary colors
  secondary: '#5E5CE6',
  secondaryDark: '#3634A3',
  secondaryLight: '#8B89E3',
  
  // Neutral colors
  background: '#000000',
  backgroundSecondary: '#1C1C1E',
  surface: '#2C2C2E',
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#98989D',
  textTertiary: '#6B7280',
  textDisabled: '#48484A',
  textInverse: '#000000',
  
  // UI colors
  border: '#38383A',
  borderLight: '#2C2C2E',
  separator: '#48484A',
  
  // Status colors
  success: '#30D158',
  successLight: '#1B5E20',
  warning: '#FF9F0A',
  warningLight: '#E65100',
  error: '#FF453A',
  errorLight: '#C62828',
  info: '#64D2FF',
  infoLight: '#0277BD',
  
  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowDark: 'rgba(0, 0, 0, 0.5)',
};

// Typography scale
export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Font weights
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// Border radius scale
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadow styles
export const shadows = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Component styles
export const componentStyles = {
  // Button styles
  button: {
    base: {
      borderRadius: borderRadius.base,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
    },
    sizes: {
      sm: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        minHeight: 36,
      },
      md: {
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.md,
        minHeight: 44,
      },
      lg: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.base,
        minHeight: 52,
      },
    },
    variants: {
      primary: (colors: typeof lightColors) => ({
        backgroundColor: colors.primary,
      }),
      secondary: (colors: typeof lightColors) => ({
        backgroundColor: colors.secondary,
      }),
      outline: (colors: typeof lightColors) => ({
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
      }),
      ghost: (_colors: typeof lightColors) => ({
        backgroundColor: 'transparent',
      }),
      danger: (colors: typeof lightColors) => ({
        backgroundColor: colors.error,
      }),
    },
  },
  
  // Input styles
  input: {
    base: {
      borderRadius: borderRadius.base,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      fontSize: typography.fontSize.base,
      minHeight: 44,
    },
    sizes: {
      sm: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        fontSize: typography.fontSize.sm,
        minHeight: 36,
      },
      md: {
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.md,
        fontSize: typography.fontSize.base,
        minHeight: 44,
      },
      lg: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.base,
        fontSize: typography.fontSize.lg,
        minHeight: 52,
      },
    },
  },
  
  // Card styles
  card: {
    base: {
      borderRadius: borderRadius.md,
      padding: spacing.base,
    },
  },
  
  // Header styles
  header: {
    base: {
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      minHeight: 56,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
  },
};

// Global styles
export const globalStyles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  // Text
  textCenter: {
    textAlign: 'center',
  },
  textBold: {
    fontWeight: typography.fontWeight.bold,
  },
  textSemibold: {
    fontWeight: typography.fontWeight.semibold,
  },
  
  // Spacing
  marginBottom: {
    marginBottom: spacing.base,
  },
  marginTop: {
    marginTop: spacing.base,
  },
  paddingHorizontal: {
    paddingHorizontal: spacing.base,
  },
  paddingVertical: {
    paddingVertical: spacing.base,
  },
  
  // Common button styles
  buttonBase: {
    ...componentStyles.button.base,
    ...componentStyles.button.sizes.md,
  },
  
  // Common input styles
  inputBase: {
    ...componentStyles.input.base,
    ...componentStyles.input.sizes.md,
  },
});

// Helper functions
export const createButtonStyle = (
  variant: keyof typeof componentStyles.button.variants,
  size: keyof typeof componentStyles.button.sizes,
  colors: typeof lightColors,
  customStyle?: any
) => {
  return StyleSheet.flatten([
    componentStyles.button.base,
    componentStyles.button.sizes[size],
    componentStyles.button.variants[variant](colors),
    customStyle,
  ]);
};

export const createInputStyle = (
  size: keyof typeof componentStyles.input.sizes,
  colors: typeof lightColors,
  customStyle?: any
) => {
  return StyleSheet.flatten([
    componentStyles.input.base,
    componentStyles.input.sizes[size],
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      color: colors.text,
    },
    customStyle,
  ]);
};

export const createCardStyle = (colors: typeof lightColors, customStyle?: any) => {
  return StyleSheet.flatten([
    componentStyles.card.base,
    {
      backgroundColor: colors.surface,
      ...shadows.base,
      shadowColor: colors.shadow,
    },
    customStyle,
  ]);
};

export default {
  lightColors,
  darkColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  componentStyles,
  globalStyles,
  createButtonStyle,
  createInputStyle,
  createCardStyle,
};
