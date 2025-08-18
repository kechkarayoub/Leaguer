/**
 * useCamera Hook
 * 
 * Hook for detecting camera availability and managing camera permissions
 */

import { useState, useEffect } from 'react';

export interface CameraInfo {
  hasCamera: boolean;
  isLoading: boolean;
  error: string | null;
  devices: MediaDeviceInfo[];
}

export const useCamera = () => {
  const [cameraInfo, setCameraInfo] = useState<CameraInfo>({
    hasCamera: false,
    isLoading: true,
    error: null,
    devices: [],
  });

  const checkCameraAvailability = async () => {
    try {
      setCameraInfo(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if mediaDevices API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('Media devices API not supported');
      }

      // Get all media devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      setCameraInfo({
        hasCamera: videoDevices.length > 0,
        isLoading: false,
        error: null,
        devices: videoDevices,
      });
    } catch (error) {
      console.error('Error checking camera availability:', error);
      setCameraInfo({
        hasCamera: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        devices: [],
      });
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Stop the stream immediately as we just wanted to check permission
      stream.getTracks().forEach(track => track.stop());
      
      // Recheck availability after permission granted
      await checkCameraAvailability();
      
      return true;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setCameraInfo(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Permission denied',
      }));
      return false;
    }
  };

  useEffect(() => {
    checkCameraAvailability();

    // Listen for device changes (camera connected/disconnected)
    const handleDeviceChange = () => {
      checkCameraAvailability();
    };

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, []);

  return {
    ...cameraInfo,
    requestPermission: requestCameraPermission,
    refreshDevices: checkCameraAvailability,
  };
};
