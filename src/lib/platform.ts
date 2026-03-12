import { Platform } from 'react-native';

/**
 * Detect if the app is running inside an Electron shell.
 * Works in both the renderer process (userAgent check) and when
 * the preload script has set `window.__ELECTRON__`.
 */
export const isElectron = (): boolean => {
  if (Platform.OS !== 'web') {
    return false;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  // Check for the flag set by our preload script
  if ((window as unknown as Record<string, unknown>).__ELECTRON__) {
    return true;
  }

  // Fallback: check the user agent string
  if (typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent)) {
    return true;
  }

  return false;
};

/**
 * Returns true when running on a platform where expo-notifications
 * push token APIs are available (iOS and Android devices only).
 */
export const isNativePushSupported = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

/**
 * Returns true when native desktop notifications are available
 * (Electron on Mac, Windows, Linux).
 */
export const isDesktopNotificationSupported = (): boolean => {
  if (!isElectron()) {
    return false;
  }

  return typeof window !== 'undefined' && 'Notification' in window;
};
