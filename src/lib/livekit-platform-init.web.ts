/**
 * LiveKit initialization for web platform
 *
 * On web, we don't need to register WebRTC globals as the browser
 * already provides native WebRTC implementation.
 */

export function initializeLiveKitForPlatform(): void {
  // No-op for web - browser already has WebRTC
}
