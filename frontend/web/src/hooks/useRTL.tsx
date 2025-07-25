/**
 * useRTL Hook
 * 
 * Manages RTL (Right-to-Left) layout support for Arabic language
 * Automatically sets document direction based on current language
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface UseRTLReturn {
  isRTL: boolean;
  setDirection: (isRTL: boolean) => void;
}

const useRTL = (): UseRTLReturn => {
  const { i18n } = useTranslation();
  
  // Determine if current language is RTL
  const isRTL = i18n.language === 'ar';
  
  // Function to set document direction
  const setDirection = (rtl: boolean) => {
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', i18n.language);
    
    // Add body class for additional styling if needed
    if (rtl) {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }
  };
  
  // Set direction when language changes
  useEffect(() => {
    setDirection(isRTL);
  }, [isRTL]);
  
  // Set initial direction on mount
  useEffect(() => {
    setDirection(isRTL);
  }, []);
  
  return {
    isRTL,
    setDirection,
  };
};

export default useRTL;
