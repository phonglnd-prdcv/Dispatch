import { logger } from '@/lib/logging';
import { isDesktopNotificationSupported, isElectron } from '@/lib/platform';
import { usePushNotificationModalStore } from '@/stores/push-notification/store';

export interface ElectronNotificationPayload {
  title: string;
  body: string;
  eventCode?: string;
  data?: Record<string, unknown>;
}

/**
 * Shape of the `window.electronNotifications` bridge exposed by
 * the Electron preload script via `contextBridge`.
 */
interface ElectronBridge {
  show: (payload: ElectronNotificationPayload) => Promise<boolean>;
  isSupported: () => Promise<boolean>;
  onNotification: (callback: (payload: ElectronNotificationPayload) => void) => void;
}

/**
 * ElectronNotificationService
 *
 * Provides native desktop notification support for the Electron build
 * on macOS, Windows and Linux. Uses the Web Notification API available
 * in the Electron renderer process which maps to native OS notifications.
 *
 * On Electron the app receives real-time events via SignalR – this service
 * complements that by surfacing OS-level notifications so users see them
 * even when the app window is not focused.
 */
class ElectronNotificationService {
  private static instance: ElectronNotificationService;
  private permissionGranted = false;
  private initialized = false;

  private constructor() {
    // Defer initialization so callers can decide when to start
  }

  public static getInstance(): ElectronNotificationService {
    if (!ElectronNotificationService.instance) {
      ElectronNotificationService.instance = new ElectronNotificationService();
    }
    return ElectronNotificationService.instance;
  }

  /**
   * Request notification permission and wire up IPC listeners
   * when running inside Electron. Safe to call on any platform –
   * returns early on non-Electron environments.
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!isElectron()) {
      logger.info({
        message: 'ElectronNotificationService: not running in Electron, skipping initialization',
      });
      return;
    }

    this.initialized = true;

    if (!isDesktopNotificationSupported()) {
      logger.warn({
        message: 'ElectronNotificationService: Notification API not available',
      });
      return;
    }

    await this.requestPermission();

    // Listen for notifications pushed from the Electron main process via IPC
    this.setupIpcListeners();

    logger.info({
      message: 'ElectronNotificationService initialized',
      context: { permissionGranted: this.permissionGranted },
    });
  }

  /**
   * Request permission to show desktop notifications.
   * In Electron the permission is usually auto-granted but we still go
   * through the standard flow for correctness.
   */
  public async requestPermission(): Promise<boolean> {
    if (!isDesktopNotificationSupported()) {
      return false;
    }

    try {
      if (Notification.permission === 'granted') {
        this.permissionGranted = true;
        return true;
      }

      if (Notification.permission === 'denied') {
        logger.warn({
          message: 'Desktop notification permission denied by user',
        });
        return false;
      }

      const result = await Notification.requestPermission();
      this.permissionGranted = result === 'granted';

      logger.info({
        message: 'Desktop notification permission result',
        context: { result },
      });

      return this.permissionGranted;
    } catch (error) {
      logger.error({
        message: 'Failed to request desktop notification permission',
        context: { error },
      });
      return false;
    }
  }

  /**
   * Show a native desktop notification.
   * Prefers the Electron main-process Notification (richer, native OS
   * integration) and falls back to the Web Notification API.
   * Also triggers the in-app notification modal when an eventCode is present.
   */
  public showNotification(payload: ElectronNotificationPayload): void {
    if (!isDesktopNotificationSupported() && !this.hasElectronBridge()) {
      return;
    }

    try {
      // Prefer Electron IPC bridge for true native notifications
      const bridge = this.getElectronBridge();
      if (bridge && typeof bridge.show === 'function') {
        bridge
          .show({
            title: payload.title,
            body: payload.body,
            eventCode: payload.eventCode,
            data: payload.data,
          })
          .catch((error: unknown) => {
            logger.error({
              message: 'Electron IPC notification failed, falling back to Web Notification',
              context: { error },
            });
            this.showWebNotification(payload);
          });
      } else {
        this.showWebNotification(payload);
      }

      // Also trigger the in-app notification modal if we have an eventCode
      if (payload.eventCode) {
        usePushNotificationModalStore.getState().showNotificationModal({
          eventCode: payload.eventCode,
          title: payload.title,
          body: payload.body,
          data: payload.data,
        });
      }

      logger.info({
        message: 'Desktop notification shown',
        context: { title: payload.title, eventCode: payload.eventCode },
      });
    } catch (error) {
      logger.error({
        message: 'Failed to show desktop notification',
        context: { error },
      });
    }
  }

  /**
   * Fallback: show notification using the Web Notification API.
   */
  private showWebNotification(payload: ElectronNotificationPayload): void {
    if (!this.permissionGranted) {
      logger.warn({
        message: 'Cannot show web notification \u2013 permission not granted',
      });
      return;
    }

    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: '/assets/icon.png',
      silent: false,
    });

    notification.onclick = () => {
      window.focus();
    };
  }

  /**
   * Send a test notification to verify the desktop notification pipeline.
   */
  public sendTestNotification(): void {
    this.showNotification({
      title: 'Test Notification',
      body: 'This is a test notification from Resgrid Dispatch',
      data: { type: 'test', timestamp: new Date().toISOString() },
    });
  }

  /**
   * Wire up listeners for messages from the Electron main process.
   * The main process may forward notifications received through its own
   * channels (e.g. native Node push libraries or OS-level events).
   */
  private setupIpcListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const electronBridge = (window as unknown as Record<string, unknown>).electronNotifications as ElectronBridge | undefined;
    if (!electronBridge || typeof electronBridge.onNotification !== 'function') {
      logger.info({
        message: 'ElectronNotificationService: no IPC bridge found, relying on renderer-side notifications only',
      });
      return;
    }

    electronBridge.onNotification((payload: ElectronNotificationPayload) => {
      logger.info({
        message: 'Received notification from Electron main process',
        context: { title: payload.title },
      });
      this.showNotification(payload);
    });

    logger.info({
      message: 'ElectronNotificationService: IPC listeners registered',
    });
  }

  public isPermissionGranted(): boolean {
    return this.permissionGranted;
  }

  public isAvailable(): boolean {
    return this.initialized && (isDesktopNotificationSupported() || this.hasElectronBridge());
  }

  private getElectronBridge(): ElectronBridge | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return ((window as unknown as Record<string, unknown>).electronNotifications as ElectronBridge) || null;
  }

  private hasElectronBridge(): boolean {
    return this.getElectronBridge() !== null;
  }
}

export const electronNotificationService = ElectronNotificationService.getInstance();
