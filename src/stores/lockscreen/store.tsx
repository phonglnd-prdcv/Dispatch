import { create } from 'zustand';

import { logger } from '@/lib/logging';

export interface LockscreenState {
  isLocked: boolean;
  lockTimeout: number; // in minutes
  lastActivityTime: number | null;

  lock: () => void;
  unlock: () => void;
  updateActivity: () => void;
  setLockTimeout: (minutes: number) => void;
  shouldLock: () => boolean;
}

const useLockscreenStore = create<LockscreenState>()((set, get) => ({
      isLocked: false,
      lockTimeout: 5, // Default 5 minutes
      lastActivityTime: Date.now(),

      lock: () => {
        logger.info({
          message: 'Locking screen',
        });
        set({ isLocked: true });
      },

      unlock: () => {
        logger.info({
          message: 'Unlocking screen',
        });
        set({
          isLocked: false,
          lastActivityTime: Date.now(),
        });
      },

      updateActivity: () => {
        const now = Date.now();
        set({ lastActivityTime: now });
      },

      setLockTimeout: (minutes: number) => {
        logger.info({
          message: 'Setting lock timeout',
          context: { minutes },
        });
        set({ lockTimeout: minutes });
      },

      shouldLock: (): boolean => {
        const { lastActivityTime, lockTimeout, isLocked } = get();

        // If already locked, no need to check
        if (isLocked) return false;

        // If lockTimeout is 0, disable auto-lock
        if (lockTimeout === 0) return false;

        // If no last activity time, don't lock
        if (!lastActivityTime) return false;

        const now = Date.now();
        const inactiveTimeMs = now - lastActivityTime;
        const timeoutMs = lockTimeout * 60 * 1000; // Convert minutes to ms

        return inactiveTimeMs >= timeoutMs;
      },
    }));

export default useLockscreenStore;
