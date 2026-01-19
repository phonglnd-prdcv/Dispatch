/**
 * Type declarations for web runtime environment configuration
 * The window.__ENV__ object is injected by the Docker entrypoint script at container startup
 */

interface WebRuntimeEnv {
  BASE_API_URL: string;
  API_VERSION: string;
  RESGRID_API_URL: string;
  CHANNEL_HUB_NAME: string;
  REALTIME_GEO_HUB_NAME: string;
  LOGGING_KEY: string;
  APP_KEY: string;
  MAPBOX_PUBKEY: string;
  SENTRY_DSN: string;
  COUNTLY_APP_KEY: string;
  COUNTLY_SERVER_URL: string;
  MAINTENANCE_MODE: boolean;
  IS_MOBILE_APP: boolean;
}

declare global {
  interface Window {
    __ENV__?: WebRuntimeEnv;
  }
}

export {};
