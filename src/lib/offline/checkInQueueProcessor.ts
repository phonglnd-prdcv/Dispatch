import { Platform } from 'react-native';

import { performCheckIn } from '@/api/checkIn/checkInTimers';
import { logger } from '@/lib/logging';

import { dequeueCheckIn, getQueuedCheckIns } from './checkInQueue';

// Conditionally require NetInfo only on native platforms
// eslint-disable-next-line @typescript-eslint/no-var-requires
const NetInfo = Platform.OS !== 'web' ? require('@react-native-community/netinfo').default : null;

let isProcessing = false;

async function isConnected(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
  if (NetInfo) {
    try {
      const state = await NetInfo.fetch();
      return !!state.isConnected;
    } catch (error) {
      logger.error({ message: 'NetInfo.fetch() failed, assuming offline', context: { error } });
      return false;
    }
  }
  return true;
}

export async function processCheckInQueue(): Promise<number> {
  if (isProcessing) return 0;

  const connected = await isConnected();
  if (!connected) return 0;

  isProcessing = true;
  let processed = 0;

  try {
    const queue = getQueuedCheckIns();
    for (const item of queue) {
      try {
        await performCheckIn(item.input);
        dequeueCheckIn(item.queuedAt);
        processed++;
      } catch (error) {
        logger.error({
          message: 'Failed to process queued check-in',
          context: { error, input: item.input },
        });
        break;
      }
    }
  } finally {
    isProcessing = false;
  }

  return processed;
}

let cleanup: (() => void) | null = null;

export function startQueueListener(): void {
  if (cleanup) return;

  if (Platform.OS === 'web') {
    // Web/Electron: use browser online/offline events
    const handler = () => {
      if (navigator.onLine) {
        processCheckInQueue().catch(() => {});
      }
    };
    window.addEventListener('online', handler);
    cleanup = () => window.removeEventListener('online', handler);

    // Drain existing backlog if already online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      processCheckInQueue().catch(() => {});
    }
  } else if (NetInfo) {
    // Native: use NetInfo listener
    const unsubscribe = NetInfo.addEventListener((state: { isConnected: boolean }) => {
      if (state.isConnected) {
        processCheckInQueue().catch(() => {});
      }
    });
    cleanup = unsubscribe;

    // Drain existing backlog if already connected
    NetInfo.fetch()
      .then((state: { isConnected: boolean }) => {
        if (state.isConnected) {
          processCheckInQueue().catch(() => {});
        }
      })
      .catch(() => {});
  }
}

export function stopQueueListener(): void {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
}
