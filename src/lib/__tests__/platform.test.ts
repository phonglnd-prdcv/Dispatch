import { isDesktopNotificationSupported, isElectron, isNativePushSupported } from '@/lib/platform';

// Mock react-native Platform
const mockPlatformOS = jest.fn<string, []>();
jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatformOS();
    },
  },
}));

describe('platform utilities', () => {
  const originalWindow = global.window;

  afterEach(() => {
    // Restore window after each test
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
    jest.restoreAllMocks();
  });

  describe('isElectron', () => {
    it('should return false on iOS', () => {
      mockPlatformOS.mockReturnValue('ios');
      expect(isElectron()).toBe(false);
    });

    it('should return false on Android', () => {
      mockPlatformOS.mockReturnValue('android');
      expect(isElectron()).toBe(false);
    });

    it('should return true on web when window.__ELECTRON__ is set', () => {
      mockPlatformOS.mockReturnValue('web');
      (window as any).__ELECTRON__ = true;
      expect(isElectron()).toBe(true);
      delete (window as any).__ELECTRON__;
    });

    it('should return true on web when userAgent contains Electron', () => {
      mockPlatformOS.mockReturnValue('web');
      const originalNavigator = global.navigator;
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 Electron/28.0.0' },
        writable: true,
        configurable: true,
      });
      expect(isElectron()).toBe(true);
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
    });

    it('should return false on web in a regular browser', () => {
      mockPlatformOS.mockReturnValue('web');
      delete (window as any).__ELECTRON__;
      const originalNavigator = global.navigator;
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 Chrome/120.0.0' },
        writable: true,
        configurable: true,
      });
      expect(isElectron()).toBe(false);
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
    });

    it('should return false when window is undefined', () => {
      mockPlatformOS.mockReturnValue('web');
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(isElectron()).toBe(false);
    });
  });

  describe('isNativePushSupported', () => {
    it('should return true for iOS', () => {
      mockPlatformOS.mockReturnValue('ios');
      expect(isNativePushSupported()).toBe(true);
    });

    it('should return true for Android', () => {
      mockPlatformOS.mockReturnValue('android');
      expect(isNativePushSupported()).toBe(true);
    });

    it('should return false for web', () => {
      mockPlatformOS.mockReturnValue('web');
      expect(isNativePushSupported()).toBe(false);
    });
  });

  describe('isDesktopNotificationSupported', () => {
    it('should return false on native platforms', () => {
      mockPlatformOS.mockReturnValue('ios');
      expect(isDesktopNotificationSupported()).toBe(false);
    });

    it('should return true when running in Electron with Notification API', () => {
      mockPlatformOS.mockReturnValue('web');
      (window as any).__ELECTRON__ = true;
      // Ensure Notification exists in the test environment
      if (typeof Notification === 'undefined') {
        Object.defineProperty(global, 'Notification', {
          value: { permission: 'default', requestPermission: jest.fn() },
          writable: true,
          configurable: true,
        });
      }
      expect(isDesktopNotificationSupported()).toBe(true);
      delete (window as any).__ELECTRON__;
    });

    it('should return false on web when not in Electron', () => {
      mockPlatformOS.mockReturnValue('web');
      delete (window as any).__ELECTRON__;
      const originalNavigator = global.navigator;
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 Chrome/120.0.0' },
        writable: true,
        configurable: true,
      });
      expect(isDesktopNotificationSupported()).toBe(false);
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
    });
  });
});
