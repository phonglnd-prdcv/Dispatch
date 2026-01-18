/*
 * This file should not be modified; use `env.js` in the project root to add your client environment variables.
 * If you import `Env` from `@env`, this is the file that will be loaded.
 * You can only access the client environment variables here.
 * NOTE: We use js file so we can load the client env types
 *
 * For web platform running in Docker, environment variables are injected at runtime
 * via window.__ENV__ (see scripts/docker-entrypoint.sh)
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Get the runtime environment for web platform from window.__ENV__
 * This allows Docker containers to inject environment variables at startup
 * @returns {object | null} The web runtime environment or null if not available
 */
const getWebRuntimeEnv = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.__ENV__) {
    return window.__ENV__;
  }
  return null;
};

/**
 * Get the base environment from Expo constants
 * @returns {object} The base environment from Expo
 */
const getExpoEnv = () => {
  return Constants.expoConfig?.extra ?? {};
};

/**
 * Merge environments with web runtime taking precedence
 * This allows Docker-injected values to override build-time values
 */
const mergeEnvironments = () => {
  const expoEnv = getExpoEnv();
  const webRuntimeEnv = getWebRuntimeEnv();

  // If we're on web and have runtime env, merge with runtime taking precedence
  if (webRuntimeEnv) {
    return {
      ...expoEnv,
      ...webRuntimeEnv,
      // Ensure IS_MOBILE_APP is false on web
      IS_MOBILE_APP: false,
    };
  }

  return expoEnv;
};

/**
 *  @type {typeof import('../../env.js').ClientEnv}
 */
//@ts-ignore // Don't worry about TypeScript here; we know we're passing the correct environment variables to `extra` in `app.config.ts`.
export const Env = mergeEnvironments();
