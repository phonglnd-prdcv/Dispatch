/**
 * Web platform polyfill for LiveKit React Native WebRTC
 *
 * This module provides web-compatible implementations for LiveKit's
 * native WebRTC components, allowing the app to run on web platforms.
 */

import { Platform } from 'react-native';

/**
 * Register WebRTC globals for web platform
 * On web, we use the browser's native WebRTC implementation
 */
export function registerWebRTCGlobals() {
  if (Platform.OS === 'web') {
    // Browser already has WebRTC APIs, no need to polyfill
    return;
  }
}

/**
 * Mock RTCView component for web
 * On web, video rendering is handled by HTML5 video elements
 */
export const RTCView =
  Platform.OS === 'web'
    ? (props: any) => null // Web uses standard video elements
    : null; // Will use native implementation

/**
 * Initialize LiveKit for the current platform
 */
export function initializeLiveKit() {
  if (Platform.OS === 'web') {
    registerWebRTCGlobals();
  }
}
