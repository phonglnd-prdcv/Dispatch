/**
 * LiveKit initialization for native platforms (iOS/Android)
 *
 * This module registers WebRTC globals needed for LiveKit to work
 * on React Native platforms.
 */

import { registerGlobals } from '@livekit/react-native';
import { Platform } from 'react-native';

export function initializeLiveKitForPlatform(): void {
  // Only register globals for mobile native platforms (iOS/Android)
  // Web, Windows, and macOS use their native WebRTC implementations
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    registerGlobals();
  }
}
