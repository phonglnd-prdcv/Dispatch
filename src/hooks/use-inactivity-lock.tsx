import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

import { logger } from '@/lib/logging';
import useLockscreenStore from '@/stores/lockscreen/store';

/**
 * Hook to track user inactivity and trigger lockscreen
 * This hook monitors app state changes and user activity
 */
export const useInactivityLock = (isAuthenticated: boolean) => {
  const router = useRouter();
  const { shouldLock, lock, updateActivity, isLocked } = useLockscreenStore();
  const appState = useRef(AppState.currentState);
  const inactivityTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear any existing timer
  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  }, []);

  // Start or restart the inactivity timer
  const startInactivityTimer = useCallback(() => {
    clearInactivityTimer();

    // Check every 30 seconds if we should lock
    inactivityTimer.current = setInterval(() => {
      if (isAuthenticated && !isLocked && shouldLock()) {
        logger.info({
          message: 'Inactivity timeout reached, locking screen',
        });
        lock();
        router.replace('/lockscreen' as any);
      }
    }, 30000); // Check every 30 seconds
  }, [isAuthenticated, isLocked, shouldLock, lock, router, clearInactivityTimer]);

  // Handle app state changes
  useEffect(() => {
    // Skip AppState listener on web platform
    // Web doesn't have the same background/foreground lifecycle
    if (Platform.OS === 'web') {
      logger.info({
        message: 'Inactivity lock AppState listener skipped on web platform',
      });

      // Still start timer on mount if authenticated (web only needs the timer)
      if (isAuthenticated && !isLocked) {
        startInactivityTimer();
      }

      return () => {
        clearInactivityTimer();
      };
    }

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // App is coming to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        logger.info({
          message: 'App resumed, checking if lockscreen should be shown',
        });

        // Check if we should lock when app comes back to foreground
        if (isAuthenticated && !isLocked && shouldLock()) {
          logger.info({
            message: 'Locking screen due to inactivity on app resume',
          });
          lock();
          router.replace('/lockscreen' as any);
        } else if (isAuthenticated && !isLocked) {
          // Update activity time when app becomes active
          updateActivity();
          startInactivityTimer();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App is going to background, clear timer
        logger.info({
          message: 'App going to background, clearing inactivity timer',
        });
        clearInactivityTimer();
      }

      appState.current = nextAppState;
    });

    // Start timer on mount if authenticated
    if (isAuthenticated && !isLocked) {
      startInactivityTimer();
    }

    return () => {
      subscription.remove();
      clearInactivityTimer();
    };
  }, [isAuthenticated, isLocked, shouldLock, lock, updateActivity, router, startInactivityTimer, clearInactivityTimer]);

  // Update activity on any interaction
  const handleActivity = () => {
    if (isAuthenticated && !isLocked) {
      updateActivity();
    }
  };

  return { handleActivity };
};
