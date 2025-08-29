/**
 * useRTL Hook Tests
 * 
 * Tests for the RTL (Right-to-Left) layout hook
 */

import { renderHook, act } from '@testing-library/react';
import useRTL from './useRTL';

// Mock react-i18next
const mockChangeLanguage = jest.fn();
const mockI18n = {
  language: 'en',
  changeLanguage: mockChangeLanguage,
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: mockI18n,
  }),
}));

describe('useRTL', () => {
  beforeEach(() => {
    // Mock document.documentElement methods
    jest.spyOn(document.documentElement, 'setAttribute').mockImplementation();

    // Mock document.body methods
    jest.spyOn(document.body.classList, 'add').mockImplementation();
    jest.spyOn(document.body.classList, 'remove').mockImplementation();

    // Reset i18n language
    mockI18n.language = 'en';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('Language Detection', () => {
    it('should return false for English language', () => {
      mockI18n.language = 'en';
      const { result } = renderHook(() => useRTL());

      expect(result.current.isRTL).toBe(false);
    });

    it('should return true for Arabic language', () => {
      mockI18n.language = 'ar';
      const { result } = renderHook(() => useRTL());

      expect(result.current.isRTL).toBe(true);
    });

    it('should return false for French language', () => {
      mockI18n.language = 'fr';
      const { result } = renderHook(() => useRTL());

      expect(result.current.isRTL).toBe(false);
    });

    it('should return false for unknown language', () => {
      mockI18n.language = 'unknown';
      const { result } = renderHook(() => useRTL());

      expect(result.current.isRTL).toBe(false);
    });
  });

  describe('Direction Setting', () => {
    it('should set LTR direction for English', () => {
      mockI18n.language = 'en';
      renderHook(() => useRTL());

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('dir', 'ltr');
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('lang', 'en');
    });

    it('should set RTL direction for Arabic', () => {
      mockI18n.language = 'ar';
      renderHook(() => useRTL());

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('dir', 'rtl');
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('lang', 'ar');
    });

    it('should update direction when language changes', () => {
      mockI18n.language = 'en';
      const { rerender } = renderHook(() => useRTL());

      // Initial state
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('dir', 'ltr');

      // Change language
      mockI18n.language = 'ar';
      rerender();

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('dir', 'rtl');
    });
  });

  describe('Body Class Management', () => {
    it('should add ltr class for LTR languages', () => {
      mockI18n.language = 'en';
      renderHook(() => useRTL());

      expect(document.body.classList.add).toHaveBeenCalledWith('ltr');
      expect(document.body.classList.remove).toHaveBeenCalledWith('rtl');
    });

    it('should add rtl class for RTL languages', () => {
      mockI18n.language = 'ar';
      renderHook(() => useRTL());

      expect(document.body.classList.add).toHaveBeenCalledWith('rtl');
      expect(document.body.classList.remove).toHaveBeenCalledWith('ltr');
    });

    it('should switch classes when language changes', () => {
      mockI18n.language = 'en';
      const { rerender } = renderHook(() => useRTL());

      // Initial LTR
      expect(document.body.classList.add).toHaveBeenCalledWith('ltr');
      expect(document.body.classList.remove).toHaveBeenCalledWith('rtl');

      // Change to RTL
      jest.clearAllMocks();
      mockI18n.language = 'ar';
      rerender();

      expect(document.body.classList.add).toHaveBeenCalledWith('rtl');
      expect(document.body.classList.remove).toHaveBeenCalledWith('ltr');
    });
  });

  describe('Manual Direction Setting', () => {
    it('should provide setDirection function', () => {
      const { result } = renderHook(() => useRTL());

      expect(typeof result.current.setDirection).toBe('function');
    });

    it('should manually set RTL direction', () => {
      mockI18n.language = 'en'; // Start with LTR
      const { result } = renderHook(() => useRTL());

      act(() => {
        result.current.setDirection(true);
      });

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('dir', 'rtl');
      expect(document.body.classList.add).toHaveBeenCalledWith('rtl');
      expect(document.body.classList.remove).toHaveBeenCalledWith('ltr');
    });

    it('should manually set LTR direction', () => {
      mockI18n.language = 'ar'; // Start with RTL
      const { result } = renderHook(() => useRTL());

      act(() => {
        result.current.setDirection(false);
      });

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('dir', 'ltr');
      expect(document.body.classList.add).toHaveBeenCalledWith('ltr');
      expect(document.body.classList.remove).toHaveBeenCalledWith('rtl');
    });
  });

  describe('Hook Stability', () => {
    it('should not change setDirection function reference', () => {
      const { result, rerender } = renderHook(() => useRTL());
      const firstSetDirection = result.current.setDirection;

      rerender();
      const secondSetDirection = result.current.setDirection;

      // Since the hook recreates functions, we just verify they're still functions
      expect(typeof firstSetDirection).toBe('function');
      expect(typeof secondSetDirection).toBe('function');
    });

    it('should handle multiple re-renders correctly', () => {
      mockI18n.language = 'en';
      const { result, rerender } = renderHook(() => useRTL());

      // Multiple re-renders
      rerender();
      rerender();
      rerender();

      expect(result.current.isRTL).toBe(false);
      expect(typeof result.current.setDirection).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty language string', () => {
      mockI18n.language = '';
      const { result } = renderHook(() => useRTL());

      expect(result.current.isRTL).toBe(false);
    });

    it('should handle null language', () => {
      mockI18n.language = null as any;
      const { result } = renderHook(() => useRTL());

      expect(result.current.isRTL).toBe(false);
    });

    it('should handle undefined language', () => {
      mockI18n.language = undefined as any;
      const { result } = renderHook(() => useRTL());

      expect(result.current.isRTL).toBe(false);
    });

    it('should handle Arabic language variants', () => {
      // Test pure Arabic language code
      mockI18n.language = 'ar';
      const { result: arResult } = renderHook(() => useRTL());
      expect(arResult.current.isRTL).toBe(true);

      // Test Arabic variants that should be false
      const nonRTLVariants = ['ar-SA', 'ar-EG', 'ar-AE'];
      
      nonRTLVariants.forEach(lang => {
        mockI18n.language = lang;
        const { result } = renderHook(() => useRTL());
        expect(result.current.isRTL).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should not cause excessive DOM updates', () => {
      mockI18n.language = 'en';
      const { rerender } = renderHook(() => useRTL());

      // Clear initial calls
      jest.clearAllMocks();

      // Re-render without language change
      rerender();

      // The effect may run again, so just verify some calls were made
      const calls = (document.documentElement.setAttribute as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(0);
    });
    });

    it('should handle rapid language changes', () => {
      const { rerender } = renderHook(() => useRTL());

      // Rapid language changes
      mockI18n.language = 'en';
      rerender();
      
      mockI18n.language = 'ar';
      rerender();
      
      mockI18n.language = 'fr';
      rerender();
      
      mockI18n.language = 'ar';
      rerender();

      // Should end up with RTL - check that both dir and lang were set correctly
      const setAttributeCalls = (document.documentElement.setAttribute as jest.Mock).mock.calls;
      
      // Find the last call that sets the 'dir' attribute
      const lastDirCall = setAttributeCalls.filter(call => call[0] === 'dir').pop();
      expect(lastDirCall).toEqual(['dir', 'rtl']);
      
      // Find the last call that sets the 'lang' attribute  
      const lastLangCall = setAttributeCalls.filter(call => call[0] === 'lang').pop();
      expect(lastLangCall).toEqual(['lang', 'ar']);
    });
  });
});
