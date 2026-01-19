import { create } from 'zustand';

import { Env } from '@/lib/env';
import { logger } from '@/lib/logging';

// Get the default timeout from env, with fallback to 60 minutes
const DEFAULT_INACTIVITY_TIMEOUT_MINUTES = Env.INACTIVITY_TIMEOUT_MINUTES ?? 60;

export interface LockscreenState {
  isLocked: boolean;
  lockTimeout: number; // in minutes
  lastActivityTime: number;
  // Cached timeout in milliseconds for performance
  _cachedTimeoutMs: number;

  lock: () => void;
  unlock: () => void;
  updateActivity: () => void;
  setLockTimeout: (minutes: number) => void;
  shouldLock: () => boolean;
  // Get the timeout in milliseconds (cached for performance)
  getTimeoutMs: () => number;
}

const useLockscreenStore = create<LockscreenState>()((set, get) => ({
      isLocked: false,
      lockTimeout: DEFAULT_INACTIVITY_TIMEOUT_MINUTES,
      lastActivityTime: Date.now(),
      _cachedTimeoutMs: DEFAULT_INACTIVITY_TIMEOUT_MINUTES * 60 * 1000,

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
        set({
          lockTimeout: minutes,
          _cachedTimeoutMs: minutes * 60 * 1000,
        });
      },

      shouldLock: (): boolean => {
        const { lastActivityTime, _cachedTimeoutMs, isLocked, lockTimeout } = get();

        // If already locked, no need to check
        if (isLocked) return false;

        // If lockTimeout is 0, disable auto-lock
        if (lockTimeout === 0) return false;

        const now = Date.now();
        const inactiveTimeMs = now - lastActivityTime;

        return inactiveTimeMs >= _cachedTimeoutMs;
      },

      getTimeoutMs: (): number => {
        return get()._cachedTimeoutMs;
      },
    }));

export default useLockscreenStore;
