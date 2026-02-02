/**
 * Web/Electron stub for CallKeep service
 *
 * On web and Electron platforms, background audio is handled natively by the browser.
 * This stub provides a no-op implementation that matches the iOS CallKeep interface
 * to prevent runtime errors when the LiveKit store tries to use CallKeep.
 */

import { logger } from '@/lib/logging';

export const callKeepService = {
  /**
   * Setup CallKeep - no-op on web
   */
  setup: async (): Promise<void> => {
    logger.debug({
      message: 'CallKeep setup is a no-op on web platforms',
    });
  },

  /**
   * Start a call - returns a mock UUID on web
   */
  startCall: async (roomId: string): Promise<string> => {
    logger.debug({
      message: 'CallKeep startCall is a no-op on web platforms',
      context: { roomId },
    });
    return `web-call-${Date.now()}`;
  },

  /**
   * End the current call - no-op on web
   */
  endCall: async (): Promise<void> => {
    logger.debug({
      message: 'CallKeep endCall is a no-op on web platforms',
    });
  },

  /**
   * Check if a call is currently active - always false on web
   */
  isCallActiveNow: (): boolean => {
    return false;
  },

  /**
   * Get the current call UUID - always null on web
   */
  getCurrentCallUUID: (): string | null => {
    return null;
  },

  /**
   * Cleanup resources - no-op on web
   */
  cleanup: (): void => {
    logger.debug({
      message: 'CallKeep cleanup is a no-op on web platforms',
    });
  },

  /**
   * Set the mute state callback - stored but not used on web
   * This callback would be triggered by system audio controls on native platforms
   */
  setMuteStateCallback: (_callback: ((muted: boolean) => void) | null): void => {
    // No-op: web doesn't have system-level mute controls like CallKit
    // Mute state is managed directly through the UI
  },
};
