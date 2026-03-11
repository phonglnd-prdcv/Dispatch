// Mock platform utilities before importing the service
const mockIsElectron = jest.fn<boolean, []>();
const mockIsDesktopNotificationSupported = jest.fn<boolean, []>();

jest.mock('@/lib/platform', () => ({
  isElectron: () => mockIsElectron(),
  isDesktopNotificationSupported: () => mockIsDesktopNotificationSupported(),
}));

jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/stores/push-notification/store', () => ({
  usePushNotificationModalStore: {
    getState: jest.fn(() => ({
      showNotificationModal: jest.fn(),
    })),
  },
}));

// We import the class indirectly after mocks are set up
describe('ElectronNotificationService', () => {
  let electronNotificationService: any;
  const mockShowNotificationModal = jest.fn();

  beforeEach(() => {
    jest.resetModules();

    // Reset mocks
    mockIsElectron.mockReturnValue(false);
    mockIsDesktopNotificationSupported.mockReturnValue(false);
    mockShowNotificationModal.mockClear();

    // Re-mock the store for each test
    jest.mock('@/stores/push-notification/store', () => ({
      usePushNotificationModalStore: {
        getState: () => ({
          showNotificationModal: mockShowNotificationModal,
        }),
      },
    }));
  });

  afterEach(() => {
    delete (window as any).electronNotifications;
  });

  const loadService = () => {
    // Need to clear the singleton between tests
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@/services/electron-notification');
    electronNotificationService = mod.electronNotificationService;
    return electronNotificationService;
  };

  describe('initialize', () => {
    it('should skip initialization when not in Electron', async () => {
      mockIsElectron.mockReturnValue(false);
      const service = loadService();
      await service.initialize();
      expect(service.isAvailable()).toBe(false);
    });

    it('should initialize when running in Electron with Notification API', async () => {
      mockIsElectron.mockReturnValue(true);
      mockIsDesktopNotificationSupported.mockReturnValue(true);

      // Mock Notification.permission
      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'granted',
          requestPermission: jest.fn().mockResolvedValue('granted'),
        },
        writable: true,
        configurable: true,
      });

      const service = loadService();
      await service.initialize();
      expect(service.isPermissionGranted()).toBe(true);
    });

    it('should handle denied notification permission', async () => {
      mockIsElectron.mockReturnValue(true);
      mockIsDesktopNotificationSupported.mockReturnValue(true);

      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'denied',
          requestPermission: jest.fn().mockResolvedValue('denied'),
        },
        writable: true,
        configurable: true,
      });

      const service = loadService();
      await service.initialize();
      expect(service.isPermissionGranted()).toBe(false);
    });
  });

  describe('showNotification', () => {
    it('should use Electron IPC bridge when available', async () => {
      mockIsElectron.mockReturnValue(true);
      mockIsDesktopNotificationSupported.mockReturnValue(true);

      const mockShow = jest.fn().mockResolvedValue(true);
      (window as any).electronNotifications = {
        show: mockShow,
        isSupported: jest.fn().mockResolvedValue(true),
        onNotification: jest.fn(),
      };

      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'granted',
          requestPermission: jest.fn().mockResolvedValue('granted'),
        },
        writable: true,
        configurable: true,
      });

      const service = loadService();
      await service.initialize();

      service.showNotification({
        title: 'Test',
        body: 'Test body',
        eventCode: 'C:1234',
      });

      expect(mockShow).toHaveBeenCalledWith({
        title: 'Test',
        body: 'Test body',
        eventCode: 'C:1234',
        data: undefined,
      });
    });

    it('should trigger in-app notification modal when eventCode is present', async () => {
      mockIsElectron.mockReturnValue(true);
      mockIsDesktopNotificationSupported.mockReturnValue(true);

      const mockShow = jest.fn().mockResolvedValue(true);
      (window as any).electronNotifications = {
        show: mockShow,
        isSupported: jest.fn().mockResolvedValue(true),
        onNotification: jest.fn(),
      };

      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'granted',
          requestPermission: jest.fn().mockResolvedValue('granted'),
        },
        writable: true,
        configurable: true,
      });

      const service = loadService();
      await service.initialize();

      service.showNotification({
        title: 'Emergency',
        body: 'Fire at Main St',
        eventCode: 'C:5678',
      });

      // Re-require to get the mockShowNotificationModal
      const { usePushNotificationModalStore } = require('@/stores/push-notification/store');
      const modalFn = usePushNotificationModalStore.getState().showNotificationModal;
      expect(modalFn).toHaveBeenCalledWith({
        eventCode: 'C:5678',
        title: 'Emergency',
        body: 'Fire at Main St',
        data: undefined,
      });
    });
  });

  describe('sendTestNotification', () => {
    it('should call showNotification with test data', async () => {
      mockIsElectron.mockReturnValue(true);
      mockIsDesktopNotificationSupported.mockReturnValue(true);

      const mockShow = jest.fn().mockResolvedValue(true);
      (window as any).electronNotifications = {
        show: mockShow,
        isSupported: jest.fn().mockResolvedValue(true),
        onNotification: jest.fn(),
      };

      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'granted',
          requestPermission: jest.fn().mockResolvedValue('granted'),
        },
        writable: true,
        configurable: true,
      });

      const service = loadService();
      await service.initialize();
      service.sendTestNotification();

      expect(mockShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Notification',
          body: 'This is a test notification from Resgrid Dispatch',
        })
      );
    });
  });
});
