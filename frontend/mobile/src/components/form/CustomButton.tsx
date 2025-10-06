/**
 * CustomButton Component
 * 
 * A reusable button component with consistent styling using centralized theme
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../styles';

interface CustomButtonProps extends TouchableOpacityProps {
  /** Button text */
  title: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the button is loading */
  loading?: boolean;
  /** Icon component to display */
  icon?: React.ReactNode;
  /** Icon position */
  iconPosition?: 'left' | 'right';
  /** Full width button */
  fullWidth?: boolean;
  /** Custom button style */
  buttonStyle?: any;
  /** Custom text style */
  textStyle?: any;

  loadingTitle: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  buttonStyle,
  textStyle,
  disabled,
  loadingTitle,
  ...touchableProps
}) => {
  const { colors } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          minHeight: 36,
        };
      case 'lg':
        return {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.base,
          minHeight: 52,
        };
      default:
        return {
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.md,
          minHeight: 44,
        };
    }
  };

  const getVariantStyles = () => {
    const isDisabled = disabled || loading;
    
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isDisabled ? colors.textDisabled : colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: isDisabled ? colors.textDisabled : colors.secondary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDisabled ? colors.textDisabled : colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          backgroundColor: isDisabled ? colors.textDisabled : colors.error,
        };
      default:
        return {
          backgroundColor: isDisabled ? colors.textDisabled : colors.primary,
        };
    }
  };

  const getButtonStyles = () => {
    const baseStyles = {
      borderRadius: 12, // More rounded
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    };

    const sizeStyles = getSizeStyles();
    const variantStyles = getVariantStyles();

    const additionalStyles: any[] = [];

    // Full width
    if (fullWidth) {
      additionalStyles.push({ width: '100%' });
    }

    // Disabled state
    if (disabled || loading) {
      additionalStyles.push({ 
        opacity: 0.6,
        shadowOpacity: 0, // Remove shadow when disabled
        elevation: 0,
      });
    }

    // Custom styles
    if (buttonStyle) {
      additionalStyles.push(buttonStyle);
    }

    return StyleSheet.flatten([
      baseStyles,
      sizeStyles,
      variantStyles,
      ...additionalStyles,
    ]);
  };

  const getTextStyles = () => {
    const textStyles: any[] = [styles.text,];
    
    // Size text styles
    if (size === 'sm') {
      textStyles.push({ fontSize: 14 });
    } else if (size === 'lg') {
      textStyles.push({ fontSize: 18 });
    } else {
      textStyles.push({ fontSize: 16 });
    }

    // Variant text styles - ensure good contrast
    const isDisabled = disabled || loading;
    
    if (variant === 'primary' || variant === 'secondary' || variant === 'danger') {
      textStyles.push({ color: '#FFFFFF' }); // White text for solid buttons
    } else if (variant === 'outline') {
      textStyles.push({
        color: isDisabled ? colors.textDisabled : colors.primary,
      });
    } else if (variant === 'ghost') {
      textStyles.push({
        color: isDisabled ? colors.textDisabled : colors.text,
      });
    }

    // Custom text styles
    if (textStyle) {
      textStyles.push(textStyle);
    }

    return StyleSheet.flatten(textStyles);
  };

  const getLoadingColor = () => {
    if (variant === 'outline' || variant === 'ghost') {
      return colors.primary;
    }
    return '#FFFFFF';
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={getLoadingColor()}
          />
          <Text style={[getTextStyles(), styles.loadingText]}>
            {loadingTitle}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.content}>
        {icon && iconPosition === 'left' && (
          <View style={styles.iconLeft}>
            {icon}
          </View>
        )}
        
        <Text style={getTextStyles()}>
          {title}
        </Text>
        
        {icon && iconPosition === 'right' && (
          <View style={styles.iconRight}>
            {icon}
          </View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...touchableProps}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    textAlign: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loadingText: {
    marginLeft: spacing.xs,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    textAlign: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
});

export default CustomButton;
