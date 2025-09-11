/**
 * Enhanced Language Context for React Native
 * 
 * Provides language management with persistent storage and app restart functionality
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { I18nManager, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNRestart from 'react-native-restart';
import { useTranslation } from 'react-i18next';

export type Language = 'en' | 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  isRTL: boolean;
  restartApp: () => void;
  isChangingLanguage: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'i18nextLng';

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>('en');
  const [isRTL, setIsRTL] = useState(false);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  useEffect(() => {
    // Initialize language from storage or i18n
    const initializeLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
        const currentLanguage = (storedLanguage || i18n.language || 'en') as Language;
        
        setLanguageState(currentLanguage);
        setIsRTL(currentLanguage === 'ar');
        
        if (i18n.language !== currentLanguage) {
          await i18n.changeLanguage(currentLanguage);
        }

        // Apply RTL layout if needed
        if (currentLanguage === 'ar' && !I18nManager.isRTL) {
          I18nManager.forceRTL(true);
        } else if (currentLanguage !== 'ar' && I18nManager.isRTL) {
          I18nManager.forceRTL(false);
        }
      } catch (error) {
        console.error('Error initializing language:', error);
      }
    };

    initializeLanguage();
  }, [i18n]);

  const restartApp = () => {
    console.log('Restarting app for language change...');
    RNRestart.restart();
  };

  const setLanguage = async (newLanguage: Language) => {
    if (newLanguage === language) {
      return;
    }

    try {
      setIsChangingLanguage(true);
      const needsRTLChange = (newLanguage === 'ar') !== isRTL;
      
      // Update i18n
      await i18n.changeLanguage(newLanguage);
      
      // Store in AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEY, newLanguage);
      
      // Update state
      setLanguageState(newLanguage);
      setIsRTL(newLanguage === 'ar');
      
      // Handle RTL layout change
      if (needsRTLChange) {
        const isRTLLayout = newLanguage === 'ar';
        I18nManager.forceRTL(isRTLLayout);
        
        // Always restart app when changing to/from RTL
        Alert.alert(
          i18n.t('language:changeLanguage'),
          i18n.t('language:restartNote'),
          [
            {
              text: i18n.t('common:app.ok'),
              onPress: restartApp,
            }
          ],
          { cancelable: false }
        );
      } else {
        // For non-RTL changes, still restart to ensure all components update
        // setTimeout(() => {
        //   restartApp();
        // }, 500);
      }
    } catch (error) {
      console.error('Error setting language:', error);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    isRTL,
    restartApp,
    isChangingLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
