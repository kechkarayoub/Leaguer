/**
 * useCamera Hook Tests
 * 
 * Tests for the camera detection and permission hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCamera } from './useCamera';

// Mock MediaDevices API
const mockEnumerateDevices = jest.fn();
const mockGetUserMedia = jest.fn();
const mockStopTrack = jest.fn();

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    enumerateDevices: mockEnumerateDevices,
    getUserMedia: mockGetUserMedia,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
});

describe('useCamera', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful mock implementations
    mockEnumerateDevices.mockResolvedValue([
      {
        kind: 'videoinput',
        deviceId: 'camera1',
        label: 'Front Camera',
        groupId: 'group1',
      },
      {
        kind: 'audioinput',
        deviceId: 'mic1',
        label: 'Microphone',
        groupId: 'group2',
      },
    ]);

    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: mockStopTrack }],
    });
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useCamera());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.hasCamera).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.devices).toEqual([]);
    });
  });

  describe('Camera Detection', () => {
    it('should detect available cameras', async () => {
      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasCamera).toBe(true);
      expect(result.current.devices).toHaveLength(1);
      expect(result.current.devices[0].kind).toBe('videoinput');
      expect(result.current.error).toBe(null);
    });

    it('should handle no cameras available', async () => {
      mockEnumerateDevices.mockResolvedValue([
        {
          kind: 'audioinput',
          deviceId: 'mic1',
          label: 'Microphone',
          groupId: 'group1',
        },
      ]);

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasCamera).toBe(false);
      expect(result.current.devices).toHaveLength(0);
      expect(result.current.error).toBe(null);
    });

    it('should handle multiple cameras', async () => {
      mockEnumerateDevices.mockResolvedValue([
        {
          kind: 'videoinput',
          deviceId: 'camera1',
          label: 'Front Camera',
          groupId: 'group1',
        },
        {
          kind: 'videoinput',
          deviceId: 'camera2',
          label: 'Back Camera',
          groupId: 'group2',
        },
      ]);

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasCamera).toBe(true);
      expect(result.current.devices).toHaveLength(2);
      expect(result.current.devices[0].label).toBe('Front Camera');
      expect(result.current.devices[1].label).toBe('Back Camera');
    });
  });

  describe('Error Handling', () => {
    it('should handle enumerateDevices API error', async () => {
      const errorMessage = 'Media devices not supported';
      mockEnumerateDevices.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasCamera).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.devices).toEqual([]);
    });

    it('should handle unsupported browser', async () => {
      // Mock unsupported browser
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasCamera).toBe(false);
      expect(result.current.error).toBe('Media devices API not supported');
      expect(result.current.devices).toEqual([]);

      // Restore mock
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: {
          enumerateDevices: mockEnumerateDevices,
          getUserMedia: mockGetUserMedia,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        },
      });
    });

    it('should handle non-Error objects in catch', async () => {
      mockEnumerateDevices.mockRejectedValue('String error');

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasCamera).toBe(false);
      expect(result.current.error).toBe('Unknown error');
    });
  });

  describe('Permission Request', () => {
    it('should successfully request camera permission', async () => {
      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let permissionResult;
      await act(async () => {
        permissionResult = await result.current.requestPermission();
      });

      expect(permissionResult).toBe(true);
      expect(mockGetUserMedia).toHaveBeenCalledWith({ video: true });
      expect(mockStopTrack).toHaveBeenCalled();
    });

    it('should handle permission denied', async () => {
      const permissionError = new Error('Permission denied');
      mockGetUserMedia.mockRejectedValue(permissionError);

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let permissionResult;
      await act(async () => {
        permissionResult = await result.current.requestPermission();
      });

      expect(permissionResult).toBe(false);
      expect(result.current.error).toBe('Permission denied');
    });

    it('should handle getUserMedia with non-Error object', async () => {
      mockGetUserMedia.mockRejectedValue('Permission denied string');

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let permissionResult;
      await act(async () => {
        permissionResult = await result.current.requestPermission();
      });

      expect(permissionResult).toBe(false);
      expect(result.current.error).toBe('Permission denied');
    });
  });

  describe('Device Change Events', () => {
    it('should listen for device changes', () => {
      renderHook(() => useCamera());

      expect(navigator.mediaDevices.addEventListener).toHaveBeenCalledWith(
        'devicechange',
        expect.any(Function)
      );
    });

    it('should clean up event listener on unmount', () => {
      const { unmount } = renderHook(() => useCamera());

      unmount();

      expect(navigator.mediaDevices.removeEventListener).toHaveBeenCalledWith(
        'devicechange',
        expect.any(Function)
      );
    });

    it('should handle browsers without event listener support', () => {
      // Mock browser without addEventListener support
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: {
          enumerateDevices: mockEnumerateDevices,
          getUserMedia: mockGetUserMedia,
        },
      });

      const { unmount } = renderHook(() => useCamera());

      // Should not throw error when unmounting
      expect(() => unmount()).not.toThrow();

      // Restore mock
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: {
          enumerateDevices: mockEnumerateDevices,
          getUserMedia: mockGetUserMedia,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        },
      });
    });
  });

  describe('Refresh Devices', () => {
    it('should provide refreshDevices function', async () => {
      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refreshDevices).toBe('function');
    });

    it('should refresh device list when called', async () => {
      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear mock call count
      mockEnumerateDevices.mockClear();

      await act(async () => {
        await result.current.refreshDevices();
      });

      expect(mockEnumerateDevices).toHaveBeenCalledTimes(1);
    });

    it('should handle refresh errors', async () => {
      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Make next call fail
      mockEnumerateDevices.mockRejectedValueOnce(new Error('Refresh failed'));

      await act(async () => {
        await result.current.refreshDevices();
      });

      expect(result.current.error).toBe('Refresh failed');
      expect(result.current.hasCamera).toBe(false);
    });
  });

  describe('Hook Stability', () => {
    it('should maintain function references across re-renders', async () => {
      const { result, rerender } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      rerender();

      expect(typeof result.current.requestPermission).toBe('function');
      expect(typeof result.current.refreshDevices).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty device list', async () => {
      mockEnumerateDevices.mockResolvedValue([]);

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasCamera).toBe(false);
      expect(result.current.devices).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should handle devices with missing properties', async () => {
      mockEnumerateDevices.mockResolvedValue([
        {
          kind: 'videoinput',
          deviceId: '',
          label: '',
          groupId: '',
        },
      ]);

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasCamera).toBe(true);
      expect(result.current.devices).toHaveLength(1);
    });

    it('should filter out non-video devices correctly', async () => {
      mockEnumerateDevices.mockResolvedValue([
        { kind: 'audioinput', deviceId: 'mic1', label: 'Mic', groupId: 'g1' },
        { kind: 'audiooutput', deviceId: 'speaker1', label: 'Speaker', groupId: 'g2' },
        { kind: 'videoinput', deviceId: 'cam1', label: 'Camera', groupId: 'g3' },
        { kind: 'unknown', deviceId: 'unknown1', label: 'Unknown', groupId: 'g4' },
      ]);

      const { result } = renderHook(() => useCamera());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasCamera).toBe(true);
      expect(result.current.devices).toHaveLength(1);
      expect(result.current.devices[0].kind).toBe('videoinput');
      expect(result.current.devices[0].label).toBe('Camera');
    });
  });
});
