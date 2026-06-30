import React from 'react';
import { Platform } from 'react-native';
import { useMMKVBoolean } from 'react-native-mmkv';

import { MODERN_NOTIFICATION_SOUNDS_ENABLED, pushNotificationService } from '@/services/push-notification';

import { storage } from '../storage';

/**
 * Hook for managing the "modern notification sounds" preference (Android only).
 *
 * The preference is stored in MMKV alongside the other app settings and defaults
 * to enabled (on), so push notifications use the new modern sound set out of the
 * box. When disabled, the Android notification channels are recreated to use the
 * classic/legacy sounds instead. Android notification channels are immutable once
 * created, so toggling the preference deletes and recreates the channels.
 *
 * This setting has no effect on web or iOS (iOS sounds are chosen by the push
 * payload, not by a channel).
 */
export const useModernNotificationSounds = () => {
  const [enabled, _setEnabled] = useMMKVBoolean(MODERN_NOTIFICATION_SOUNDS_ENABLED, storage);

  const setModernNotificationSoundsEnabled = React.useCallback(
    async (value: boolean) => {
      // Only applicable on Android, where notification sounds are bound to channels.
      if (Platform.OS !== 'android') {
        return;
      }

      try {
        // Persist first so the channel rebuild reads the new value.
        _setEnabled(value);
        await pushNotificationService.refreshNotificationChannels();
      } catch (error) {
        console.error('Failed to update modern notification sounds state:', error);
      }
    },
    [_setEnabled]
  );

  // Defaults to true (modern sounds on) when the user has not saved a preference yet.
  const isModernNotificationSoundsEnabled = enabled ?? true;

  return { isModernNotificationSoundsEnabled, setModernNotificationSoundsEnabled } as const;
};
