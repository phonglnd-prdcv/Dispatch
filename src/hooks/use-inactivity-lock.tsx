import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

import { logger } from '@/lib/logging';
import useLockscreenStore from '@/stores/lockscreen/store';

// Check interval in milliseconds - checking every 30 seconds
const CHECK_INTERVAL_MS = 30000;

/**
 * Hook to track user inactivity and trigger lockscreen
 * This hook monitors app state changes and user activity
 *
 * Performance optimizations:
 * - Uses refs to avoid re-creating intervals on every render
 * - Caches store methods via refs to prevent dependency changes
 * - Single interval that checks inactivity vs multiple timers
 * - Proper cleanup on unmount
 */
export const useInactivityLock = (isAuthenticated: boolean) => {
  const router = useRouter();

  // Get store state and methods - use refs to avoid dependency changes
  const storeRef = useRef(useLockscreenStore.getState());
  const appStateRef = useRef(AppState.currentState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAuthenticatedRef = useRef(isAuthenticated);

  // Keep refs in sync with current values
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Subscribe to store changes to keep storeRef updated
  useEffect(() => {
    const unsubscribe = useLockscreenStore.subscribe((state) => {
      storeRef.current = state;
    });
    return unsubscribe;
  }, []);

  // Clear any existing interval
  const clearInactivityInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Navigate to lockscreen
  const navigateToLockscreen = useCallback(() => {
    try {
      router.replace('/lockscreen' as any);
    } catch (error) {
      logger.error({
        message: 'Failed to navigate to lockscreen',
        context: { error },
      });
    }
  }, [router]);

  // Check if we should lock and perform the lock action
  const checkAndLock = useCallback(() => {
    const store = storeRef.current;

    // Don't check if not authenticated or already locked
    if (!isAuthenticatedRef.current || store.isLocked) {
      return;
    }

    if (store.shouldLock()) {
      logger.info({
        message: 'Inactivity timeout reached, locking screen',
        context: { lockTimeout: store.lockTimeout },
      });
      store.lock();
      navigateToLockscreen();
    }
  }, [navigateToLockscreen]);

  // Start the inactivity checking interval
  const startInactivityInterval = useCallback(() => {
    clearInactivityInterval();

    // Don't start if not authenticated or already locked
    if (!isAuthenticatedRef.current || storeRef.current.isLocked) {
      return;
    }

    // Create a new interval to check inactivity periodically
    intervalRef.current = setInterval(checkAndLock, CHECK_INTERVAL_MS);
  }, [clearInactivityInterval, checkAndLock]);

  // Handle app state changes (native platforms only)
  useEffect(() => {
    // Web doesn't have the same background/foreground lifecycle
    if (Platform.OS === 'web') {
      logger.info({
        message: 'Inactivity lock AppState listener skipped on web platform',
      });

      // Start interval on mount if authenticated (web only needs the interval)
      if (isAuthenticated && !storeRef.current.isLocked) {
        startInactivityInterval();
      }

      return () => {
        clearInactivityInterval();
      };
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const wasInactive = appStateRef.current.match(/inactive|background/);
      const isNowActive = nextAppState === 'active';
      const isGoingInactive = nextAppState.match(/inactive|background/);

      // App is coming to foreground
      if (wasInactive && isNowActive) {
        logger.info({
          message: 'App resumed, checking if lockscreen should be shown',
        });

        const store = storeRef.current;

        // Check if we should lock when app comes back to foreground
        if (isAuthenticatedRef.current && !store.isLocked && store.shouldLock()) {
          logger.info({
            message: 'Locking screen due to inactivity on app resume',
          });
          store.lock();
          navigateToLockscreen();
        } else if (isAuthenticatedRef.current && !store.isLocked) {
          // Update activity time when app becomes active and restart interval
          store.updateActivity();
          startInactivityInterval();
        }
      } else if (isGoingInactive) {
        // App is going to background, clear interval to save resources
        logger.info({
          message: 'App going to background, clearing inactivity interval',
        });
        clearInactivityInterval();
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Start interval on mount if authenticated
    if (isAuthenticated && !storeRef.current.isLocked) {
      startInactivityInterval();
    }

    return () => {
      subscription.remove();
      clearInactivityInterval();
    };
  }, [isAuthenticated, clearInactivityInterval, startInactivityInterval, navigateToLockscreen]);

  // Handler for user activity - call this on user interactions
  const handleActivity = useCallback(() => {
    if (isAuthenticatedRef.current && !storeRef.current.isLocked) {
      storeRef.current.updateActivity();
    }
  }, []);

  return { handleActivity };
};
