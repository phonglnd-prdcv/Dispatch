/* eslint-disable react/no-unstable-nested-components */

import { NovuProvider } from '@novu/react-native';
import Mapbox from '@rnmapbox/maps';
import { isRunningInExpoGo } from 'expo';
import { Redirect, Slot } from 'expo-router';
import { Menu } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationButton } from '@/components/notifications/NotificationButton';
import { NotificationInbox } from '@/components/notifications/NotificationInbox';
import SideMenu from '@/components/sidebar/side-menu';
import { View } from '@/components/ui';
import { Button, ButtonText } from '@/components/ui/button';
import { Drawer, DrawerBackdrop, DrawerBody, DrawerContent, DrawerFooter } from '@/components/ui/drawer/index';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useAppLifecycle } from '@/hooks/use-app-lifecycle';
import { useInactivityLock } from '@/hooks/use-inactivity-lock';
import { useSignalRLifecycle } from '@/hooks/use-signalr-lifecycle';
import { useAuthStore } from '@/lib/auth';
import { Env } from '@/lib/env';
import { logger } from '@/lib/logging';
import { useIsFirstTime } from '@/lib/storage';
import { type GetConfigResultData } from '@/models/v4/configs/getConfigResultData';
import { audioService } from '@/services/audio.service';
import { bluetoothAudioService } from '@/services/bluetooth-audio.service';
import { locationService } from '@/services/location';
import { usePushNotifications } from '@/services/push-notification';
import { useCoreStore } from '@/stores/app/core-store';
import { useCallsStore } from '@/stores/calls/store';
import useLockscreenStore from '@/stores/lockscreen/store';
import { useRolesStore } from '@/stores/roles/store';
import { securityStore } from '@/stores/security/store';

export default function TabLayout() {
  const { t } = useTranslation();
  const { status } = useAuthStore();
  const { isLocked } = useLockscreenStore();
  const [isFirstTime, _setIsFirstTime] = useIsFirstTime();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);

  // Log at component initialization - THIS SHOULD ALWAYS FIRE
  logger.info({
    message: 'TabLayout component rendering - START',
    context: {
      status,
      timestamp: new Date().toISOString(),
    },
  });

  // Track render count to detect infinite loops
  const renderCount = useRef(0);
  renderCount.current += 1;

  if (renderCount.current > 100) {
    logger.error({
      message: 'INFINITE RENDER LOOP DETECTED - More than 100 renders!',
      context: { renderCount: renderCount.current },
    });
    throw new Error('Infinite render loop detected');
  }

  if (renderCount.current % 10 === 0) {
    logger.warn({
      message: 'High render count detected',
      context: { renderCount: renderCount.current },
    });
  }

  // Get store states first (hooks must be at top level)
  const config = useCoreStore((state) => state.config);
  const coreIsInitializing = useCoreStore((state) => state.isInitializing);
  const coreIsInitialized = useCoreStore((state) => state.isInitialized);
  const rights = securityStore((state) => state.rights);
  const userId = useAuthStore((state) => state.userId);

  // Initialize inactivity lock monitoring
  useInactivityLock(status === 'signedIn');

  // Memoize drawer navigation handler for better performance
  const handleNavigate = useCallback(() => {
    setIsOpen(false);
  }, []);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { isActive, appState } = useAppLifecycle();
  const insets = useSafeAreaInsets();

  // Refs to track initialization state
  const hasInitialized = useRef(false);
  const isInitializing = useRef(false);
  const hasHiddenSplash = useRef(false);
  const lastSignedInStatus = useRef<string | null>(null);
  const parentRef = useRef(null);

  // Initialize push notifications
  usePushNotifications();

  // Initialize Mapbox - only on native platforms
  // On web, Mapbox GL JS is loaded separately and doesn't use this initialization
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Mapbox.setAccessToken(Env.MAPBOX_PUBKEY);
      logger.info({
        message: 'Mapbox access token set',
        context: { platform: Platform.OS },
      });
    }
  }, []);

  const initializeApp = useCallback(async () => {
    if (isInitializing.current) {
      logger.info({
        message: 'App initialization already in progress, skipping',
      });
      return;
    }

    if (status !== 'signedIn') {
      logger.info({
        message: 'User not signed in, skipping initialization',
        context: { status },
      });
      return;
    }

    isInitializing.current = true;
    logger.info({
      message: 'Starting app initialization',
      context: {
        hasInitialized: hasInitialized.current,
        platform: Platform.OS,
      },
    });

    try {
      // Set a timeout for initialization to prevent infinite hanging
      const initTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Initialization timeout after 30 seconds')), 30000));

      const initPromise = (async () => {
        await useCoreStore.getState().init();

        logger.info({
          message: 'Core store initialized, initializing calls store',
          context: { platform: Platform.OS },
        });

        await useCallsStore.getState().init();

        logger.info({
          message: 'Calls store initialized, getting security rights',
          context: { platform: Platform.OS },
        });

        await securityStore.getState().getRights();

        hasInitialized.current = true;

        // Skip native-only initialization on web
        if (Platform.OS !== 'web' && !isRunningInExpoGo()) {
          // Initialize Bluetooth service
          await bluetoothAudioService.initialize();
          await audioService.initialize();
        }

        logger.info({
          message: 'App initialization completed successfully',
          context: { platform: Platform.OS },
        });
      })();

      await Promise.race([initPromise, initTimeout]);
    } catch (error) {
      logger.error({
        message: 'Failed to initialize app',
        context: { error, platform: Platform.OS },
      });
      // Reset initialization state on error so it can be retried
      hasInitialized.current = false;
    } finally {
      isInitializing.current = false;
    }
  }, [status]);

  const refreshDataFromBackground = useCallback(async () => {
    if (status !== 'signedIn' || !hasInitialized.current) return;

    // On web platform, skip config refresh as network requests are blocked
    // This prevents an infinite loop when AppState changes trigger refreshes
    if (Platform.OS === 'web') {
      logger.info({
        message: 'Skipping background data refresh on web platform (AppState handling not needed)',
      });
      return;
    }

    logger.info({
      message: 'App resumed from background, refreshing data',
    });

    try {
      // Refresh data
      await Promise.all([useCoreStore.getState().fetchConfig(), useCallsStore.getState().fetchCalls(), useRolesStore.getState().fetchRoles()]);
    } catch (error) {
      logger.error({
        message: 'Failed to refresh data on app resume',
        context: { error },
      });
    }
  }, [status]);

  // Handle SignalR lifecycle management
  useSignalRLifecycle({
    isSignedIn: status === 'signedIn',
    hasInitialized: hasInitialized.current,
  });

  // WEB PLATFORM WORKAROUND: Call initialization directly during render
  // useEffect doesn't reliably fire on web platform due to React Native Web issues
  if (Platform.OS === 'web') {
    const shouldInitialize = status === 'signedIn' && !hasInitialized.current && !isInitializing.current;

    if (shouldInitialize) {
      logger.info({
        message: 'WEB: Triggering initialization during render phase',
        context: {
          status,
          hasInitialized: hasInitialized.current,
          isInitializing: isInitializing.current,
        },
      });
      // Trigger initialization in next tick to avoid setState during render
      Promise.resolve().then(() => {
        initializeApp();
      });
    }
  }

  // Handle app initialization (for native platforms)
  useEffect(() => {
    // Skip on web - handled above in render phase
    if (Platform.OS === 'web') {
      logger.info({
        message: 'Skipping useEffect initialization on web (handled in render)',
      });
      return;
    }

    const shouldInitialize = status === 'signedIn' && !hasInitialized.current && !isInitializing.current;

    logger.info({
      message: 'App initialization effect triggered',
      context: {
        status,
        hasInitialized: hasInitialized.current,
        isInitializing: isInitializing.current,
        shouldInitialize,
        lastStatus: lastSignedInStatus.current,
      },
    });

    if (shouldInitialize) {
      logger.info({
        message: 'Triggering app initialization',
        context: {
          statusChanged: lastSignedInStatus.current !== status,
          lastStatus: lastSignedInStatus.current,
          currentStatus: status,
        },
      });
      initializeApp();
    }

    // Stop location tracking when user signs out
    if (status === 'signedOut' && lastSignedInStatus.current === 'signedIn') {
      logger.info({
        message: 'User signed out, stopping location tracking',
      });

      (async () => {
        try {
          await locationService.stopLocationUpdates();
          logger.info({
            message: 'Location tracking stopped successfully',
            context: { reason: 'user_signed_out' },
          });
          hasInitialized.current = false;
        } catch (error) {
          logger.error({
            message: 'Failed to stop location tracking on sign out',
            context: { error },
          });
        }
      })();
    }

    // Update last known status
    lastSignedInStatus.current = status;
  }, [status, initializeApp]); // Added initializeApp to dependencies

  // Handle app resuming from background - separate from initialization
  useEffect(() => {
    // Only trigger on state change, not on initial render
    if (isActive && appState === 'active' && hasInitialized.current) {
      const timer = setTimeout(() => {
        refreshDataFromBackground();
      }, 500); // Small delay to prevent multiple rapid calls

      return () => clearTimeout(timer);
    }
  }, [isActive, appState, refreshDataFromBackground]);

  // Force drawer open in landscape
  useEffect(() => {
    if (isLandscape) {
      setIsOpen(true);
    }
  }, [isLandscape]);

  // Check for maintenance mode
  if (Env.MAINTENANCE_MODE) {
    logger.info({
      message: 'Maintenance mode enabled, redirecting to maintenance page',
    });
    return <Redirect href={'/maintenance' as any} />;
  }

  // Check if screen is locked
  if (isLocked && status === 'signedIn') {
    logger.info({
      message: 'Screen is locked, redirecting to lockscreen',
    });
    return <Redirect href={'/lockscreen' as any} />;
  }

  if (isFirstTime) {
    logger.info({
      message: 'Is first time navigating to onboarding',
    });

    return <Redirect href={'/onboarding' as any} />;
  } else if (status === 'signedOut' || status === 'idle' || status === 'error') {
    logger.info({
      message: 'User is not signed in, redirecting to login',
      context: { status },
    });

    return <Redirect href={'/login' as any} />;
  }

  // Show loading screen while app is initializing
  if (!coreIsInitialized || coreIsInitializing || !config) {
    logger.info({
      message: 'App still initializing, showing loading screen',
      context: {
        coreIsInitializing,
        coreIsInitialized,
        hasConfig: !!config,
      },
    });

    return (
      <View style={styles.container}>
        <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
          <ActivityIndicator size="large" color="#0066cc" />
          <Text className="mt-4 text-lg text-gray-600 dark:text-gray-400">Loading...</Text>
        </View>
      </View>
    );
  }

  logger.info({
    message: 'Rendering app layout',
    context: {
      status,
      isLocked,
      isFirstTime,
      platform: Platform.OS,
      userId: userId || 'null',
      hasConfig: !!config,
    },
  });

  const content = (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View className="flex-row items-center justify-between bg-primary-600 px-4" style={{ paddingTop: insets.top }}>
        <CreateDrawerMenuButton setIsOpen={setIsOpen} isLandscape={isLandscape} />
        <View className="flex-1 items-center">
          <Text className="text-lg font-semibold text-white">{t('app.title', 'Resgrid Responder')}</Text>
        </View>
        <CreateNotificationButton config={config} setIsNotificationsOpen={setIsNotificationsOpen} userId={userId} departmentCode={rights?.DepartmentCode} />
      </View>

      <View className="flex-1 flex-row" ref={parentRef}>
        {/* Drawer - conditionally rendered as permanent in landscape */}
        {isLandscape ? (
          <View className="w-1/4 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <SideMenu />
          </View>
        ) : (
          <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <DrawerBackdrop onPress={() => setIsOpen(false)} />
            <DrawerContent className="w-4/5 bg-white p-1 dark:bg-gray-900">
              <DrawerBody>
                <SideMenu onNavigate={handleNavigate} />
              </DrawerBody>
              <DrawerFooter>
                <Button onPress={() => setIsOpen(false)} className="w-full bg-primary-600">
                  <ButtonText>Close</ButtonText>
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}

        {/* Main content area */}
        <View className={`flex-1 ${isLandscape ? 'w-3/4' : 'w-full'}`}>
          <Slot />
        </View>
      </View>
    </View>
  );

  // On web, skip Novu integration as it may cause rendering issues
  if (Platform.OS === 'web') {
    logger.info({
      message: 'Rendering app layout for web platform (Novu disabled)',
    });
    return content;
  }

  return (
    <>
      {userId && config && rights?.DepartmentCode ? (
        <NovuProvider subscriberId={`${rights?.DepartmentCode}_User_${userId}`} applicationIdentifier={config.NovuApplicationId} backendUrl={config.NovuBackendApiUrl} socketUrl={config.NovuSocketUrl}>
          {/* NotificationInbox at the root level */}
          <NotificationInbox isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
          {content}
        </NovuProvider>
      ) : (
        content
      )}
    </>
  );
}

interface CreateDrawerMenuButtonProps {
  setIsOpen: (isOpen: boolean) => void;
  isLandscape: boolean;
}

const CreateDrawerMenuButton = ({ setIsOpen, isLandscape }: CreateDrawerMenuButtonProps) => {
  if (isLandscape) {
    return <View className="w-8" />; // Spacer to maintain layout balance
  }

  return (
    <Pressable
      className="p-2"
      onPress={() => {
        setIsOpen(true);
      }}
    >
      <Menu size={24} color="white" />
    </Pressable>
  );
};

const CreateNotificationButton = ({
  config,
  setIsNotificationsOpen,
  userId,
  departmentCode,
}: {
  config: GetConfigResultData | null;
  setIsNotificationsOpen: (isOpen: boolean) => void;
  userId: string | null;
  departmentCode: string | undefined;
}) => {
  if (!userId || !config || !config.NovuApplicationId || !config.NovuBackendApiUrl || !config.NovuSocketUrl || !departmentCode) {
    return null;
  }

  return (
    <NovuProvider subscriberId={`${departmentCode}_Dispatch_${userId}`} applicationIdentifier={config.NovuApplicationId} backendUrl={config.NovuBackendApiUrl} socketUrl={config.NovuSocketUrl}>
      <NotificationButton onPress={() => setIsNotificationsOpen(true)} />
    </NovuProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
