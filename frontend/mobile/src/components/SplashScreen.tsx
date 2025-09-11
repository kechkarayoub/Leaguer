/**
 * Splash Screen Component
 * 
 * Displays loading screen while app initializes
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface SplashScreenProps {
  isVisible: boolean;
  onAnimationComplete?: () => void;
}

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC<SplashScreenProps> = ({
  isVisible,
  onAnimationComplete,
}) => {
  const { colors } = useTheme();
  const fadeAnim = useMemo(() => new Animated.Value(1), []);
  const scaleAnim = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    if (!isVisible) {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onAnimationComplete?.();
      });
    }
  }, [isVisible, fadeAnim, scaleAnim, onAnimationComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.primary,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
        translucent
      />
      
      {/* Logo/Icon */}
      <View style={styles.logoContainer}>
        <View style={[styles.logo, { backgroundColor: colors.background }]}>
          <Text style={[styles.logoText, { color: colors.primary }]}>L</Text>
        </View>
      </View>

      {/* App Name */}
      <Text style={[styles.appName, { color: colors.background }]}>
        Leaguer
      </Text>

      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        <Animated.View
          style={[
            styles.loadingDot,
            {
              backgroundColor: colors.background,
              opacity: fadeAnim,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.loadingDot,
            {
              backgroundColor: colors.background,
              opacity: fadeAnim,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.loadingDot,
            {
              backgroundColor: colors.background,
              opacity: fadeAnim,
            },
          ]}
        />
      </View>

      {/* Version */}
      <Text style={[styles.version, { color: colors.background }]}>
        v1.0.0
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 60,
    letterSpacing: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  version: {
    position: 'absolute',
    bottom: 60,
    fontSize: 14,
    opacity: 0.8,
  },
});

export default SplashScreen;
