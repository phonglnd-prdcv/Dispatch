/**
 * Bluetooth Audio Module
 *
 * This module provides platform-agnostic Bluetooth audio device management.
 */

export * from './base.service';
export * from './factory.service';
// export * from './native.service'; // Removed to prevent bundler errors on web
// export * from './web.service'; // Removed to prevent bundler errors on web

// Export a singleton instance for convenience
import { createBluetoothAudioService } from './factory.service';
export const bluetoothAudioService = createBluetoothAudioService();
