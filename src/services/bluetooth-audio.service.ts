/**
 * Bluetooth Audio Service
 *
 * This module provides a unified interface for Bluetooth audio device management
 * across different platforms (Native iOS/Android and Web).
 *
 * Usage:
 *   import { bluetoothAudioService } from '@/services/bluetooth-audio.service';
 *
 *   // Initialize the service
 *   await bluetoothAudioService.initialize();
 *
 *   // Start scanning for devices
 *   await bluetoothAudioService.startScanning(10000);
 *
 *   // Connect to a device
 *   await bluetoothAudioService.connectToDevice(deviceId);
 *
 * Platform Support:
 *   - iOS/Android: Full native Bluetooth Low Energy support via react-native-ble-manager
 *   - Web: Web Bluetooth API support for compatible browsers
 *
 * Architecture:
 *   - BluetoothAudioServiceBase: Abstract base class defining the interface
 *   - BluetoothAudioServiceNative: Native implementation for iOS/Android
 *   - BluetoothAudioServiceWeb: Web implementation using Web Bluetooth API
 *   - createBluetoothAudioService(): Factory function for platform detection
 */

import { logger } from '@/lib/logging';

import type { BluetoothAudioServiceBase } from './bluetooth-audio/base.service';
import { createBluetoothAudioService, getAvailableBluetoothImplementations, getBluetoothCapabilityDescription, isBluetoothSupported } from './bluetooth-audio/factory.service';

/**
 * Singleton instance of the Bluetooth Audio Service
 * The appropriate implementation is automatically selected based on the platform
 */
class BluetoothAudioServiceSingleton {
  private static instance: BluetoothAudioServiceBase | null = null;

  /**
   * Get the singleton instance of the Bluetooth Audio Service
   * Creates the instance on first access using the factory pattern
   */
  static getInstance(): BluetoothAudioServiceBase {
    if (!BluetoothAudioServiceSingleton.instance) {
      try {
        BluetoothAudioServiceSingleton.instance = createBluetoothAudioService();
        logger.info({
          message: 'Bluetooth Audio Service singleton created',
          context: {
            platform: BluetoothAudioServiceSingleton.instance.getPlatform(),
            isSupported: BluetoothAudioServiceSingleton.instance.isSupported(),
          },
        });
      } catch (error) {
        logger.error({
          message: 'Failed to create Bluetooth Audio Service instance',
          context: { error },
        });
        throw error;
      }
    }
    return BluetoothAudioServiceSingleton.instance;
  }

  /**
   * Reset the singleton instance (useful for testing or platform changes)
   */
  static resetInstance(): void {
    if (BluetoothAudioServiceSingleton.instance) {
      try {
        BluetoothAudioServiceSingleton.instance.destroy();
      } catch (error) {
        logger.error({
          message: 'Error destroying Bluetooth Audio Service instance',
          context: { error },
        });
      }
      BluetoothAudioServiceSingleton.instance = null;
    }
  }
}

/**
 * Main export: Singleton instance of the Bluetooth Audio Service
 * This automatically selects the appropriate implementation for the current platform
 */
export const bluetoothAudioService = BluetoothAudioServiceSingleton.getInstance();

/**
 * Utility exports for checking platform capabilities
 */
export { createBluetoothAudioService, getAvailableBluetoothImplementations, getBluetoothCapabilityDescription, isBluetoothSupported };

/**
 * Export types for TypeScript consumers
 */
export type { BluetoothAudioServiceBase } from './bluetooth-audio/base.service';
export type { AudioDevice } from './bluetooth-audio/base.service';
