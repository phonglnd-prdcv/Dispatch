import { NativeModules, Platform } from 'react-native';

import { logger } from '@/lib/logging';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

interface CheckInActivityParams {
  callId: number;
  callName: string;
  callNumber: string;
  nextDueMinutes: number;
  overdueCount: number;
  warningCount: number;
}

interface CheckInActivityUpdate {
  nextDueMinutes: number;
  overdueCount: number;
  warningCount: number;
}

/**
 * Start a Live Activity (iOS) or foreground notification (Android)
 * for check-in timer visibility on lock screen.
 * No-op on Web and Electron.
 */
export async function startCheckInActivity(params: CheckInActivityParams): Promise<void> {
  if (!isNative) return;

  try {
    if (Platform.OS === 'ios') {
      const mod = NativeModules.CheckInLiveActivityModule;
      if (mod?.startActivity) {
        await mod.startActivity(params);
      }
    } else if (Platform.OS === 'android') {
      const mod = NativeModules.CheckInNotificationModule;
      if (mod?.startNotification) {
        await mod.startNotification(params);
      }
    }
  } catch (error) {
    logger.error({
      message: 'Failed to start check-in live activity',
      context: { error, platform: Platform.OS },
    });
  }
}

/**
 * Update the running Live Activity / foreground notification with latest timer data.
 * No-op on Web and Electron.
 */
export async function updateCheckInActivity(update: CheckInActivityUpdate): Promise<void> {
  if (!isNative) return;

  try {
    if (Platform.OS === 'ios') {
      const mod = NativeModules.CheckInLiveActivityModule;
      if (mod?.updateActivity) {
        await mod.updateActivity(update);
      }
    } else if (Platform.OS === 'android') {
      const mod = NativeModules.CheckInNotificationModule;
      if (mod?.updateNotification) {
        await mod.updateNotification(update);
      }
    }
  } catch (error) {
    logger.error({
      message: 'Failed to update check-in live activity',
      context: { error, platform: Platform.OS },
    });
  }
}

/**
 * End the Live Activity / foreground notification.
 * No-op on Web and Electron.
 */
export async function endCheckInActivity(): Promise<void> {
  if (!isNative) return;

  try {
    if (Platform.OS === 'ios') {
      const mod = NativeModules.CheckInLiveActivityModule;
      if (mod?.endActivity) {
        await mod.endActivity();
      }
    } else if (Platform.OS === 'android') {
      const mod = NativeModules.CheckInNotificationModule;
      if (mod?.stopNotification) {
        await mod.stopNotification();
      }
    }
  } catch (error) {
    logger.error({
      message: 'Failed to end check-in live activity',
      context: { error, platform: Platform.OS },
    });
  }
}
