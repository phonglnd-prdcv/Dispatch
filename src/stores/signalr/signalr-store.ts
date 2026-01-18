import { create } from 'zustand';

import { useAuthStore } from '@/lib';
import { Env } from '@/lib/env';
import { logger } from '@/lib/logging';
import { signalRService } from '@/services/signalr.service';

import { useCoreStore } from '../app/core-store';
import { securityStore, useSecurityStore } from '../security/store';

// Event types that can be received from SignalR
export type SignalREventType =
  | 'personnelStatusUpdated'
  | 'personnelStaffingUpdated'
  | 'unitStatusUpdated'
  | 'callsUpdated'
  | 'callAdded'
  | 'callClosed'
  | 'personnelLocationUpdated'
  | 'unitLocationUpdated'
  | 'connected';

interface SignalRState {
  isUpdateHubConnected: boolean;
  lastUpdateMessage: unknown;
  lastUpdateTimestamp: number;
  lastEventType: SignalREventType | null;
  isGeolocationHubConnected: boolean;
  lastGeolocationMessage: unknown;
  lastGeolocationTimestamp: number;
  lastGeolocationEventType: SignalREventType | null;
  error: Error | null;

  // Event timestamps for specific data types
  lastPersonnelUpdateTimestamp: number;
  lastUnitsUpdateTimestamp: number;
  lastCallsUpdateTimestamp: number;

  connectUpdateHub: () => Promise<void>;
  disconnectUpdateHub: () => Promise<void>;
  connectGeolocationHub: () => Promise<void>;
  disconnectGeolocationHub: () => Promise<void>;
}

export const useSignalRStore = create<SignalRState>((set, get) => ({
  isUpdateHubConnected: false,
  lastUpdateMessage: null,
  lastUpdateTimestamp: 0,
  lastEventType: null,
  isGeolocationHubConnected: false,
  lastGeolocationMessage: null,
  lastGeolocationTimestamp: 0,
  lastGeolocationEventType: null,
  error: null,

  // Event timestamps for specific data types
  lastPersonnelUpdateTimestamp: 0,
  lastUnitsUpdateTimestamp: 0,
  lastCallsUpdateTimestamp: 0,

  connectUpdateHub: async () => {
    try {
      if (get().isUpdateHubConnected) {
        return;
      }

      set({ isUpdateHubConnected: false, error: null });

      // Get the eventing URL from the core store config
      const coreState = useCoreStore.getState();
      const eventingUrl = coreState.config?.EventingUrl;

      if (!eventingUrl) {
        const errorMessage = 'EventingUrl not available in config. Please ensure config is loaded first.';
        logger.error({
          message: errorMessage,
        });
        set({ error: new Error(errorMessage) });
        return;
      }

      // Connect to the eventing hub
      await signalRService.connectToHubWithEventingUrl({
        name: Env.CHANNEL_HUB_NAME,
        eventingUrl: eventingUrl,
        hubName: Env.CHANNEL_HUB_NAME,
        methods: ['personnelStatusUpdated', 'personnelStaffingUpdated', 'unitStatusUpdated', 'callsUpdated', 'callAdded', 'callClosed', 'onConnected'],
      });

      await signalRService.invoke(Env.CHANNEL_HUB_NAME, 'connect', parseInt(securityStore.getState().rights?.DepartmentId ?? '0'));

      signalRService.on('personnelStatusUpdated', (message) => {
        const now = Date.now();
        logger.info({
          message: 'personnelStatusUpdated',
          context: { message },
        });
        set({
          lastUpdateMessage: JSON.stringify(message),
          lastUpdateTimestamp: now,
          lastEventType: 'personnelStatusUpdated',
          lastPersonnelUpdateTimestamp: now,
        });
      });

      signalRService.on('personnelStaffingUpdated', (message) => {
        const now = Date.now();
        logger.info({
          message: 'personnelStaffingUpdated',
          context: { message },
        });
        set({
          lastUpdateMessage: JSON.stringify(message),
          lastUpdateTimestamp: now,
          lastEventType: 'personnelStaffingUpdated',
          lastPersonnelUpdateTimestamp: now,
        });
      });

      signalRService.on('unitStatusUpdated', (message) => {
        const now = Date.now();
        logger.info({
          message: 'unitStatusUpdated',
          context: { message },
        });
        set({
          lastUpdateMessage: JSON.stringify(message),
          lastUpdateTimestamp: now,
          lastEventType: 'unitStatusUpdated',
          lastUnitsUpdateTimestamp: now,
        });
      });

      signalRService.on('callsUpdated', (message) => {
        const now = Date.now();

        logger.info({
          message: 'callsUpdated',
          context: { message, now },
        });
        set({
          lastUpdateMessage: JSON.stringify(message),
          lastUpdateTimestamp: now,
          lastEventType: 'callsUpdated',
          lastCallsUpdateTimestamp: now,
        });
      });

      signalRService.on('callAdded', (message) => {
        const now = Date.now();
        logger.info({
          message: 'callAdded',
          context: { message },
        });
        set({
          lastUpdateMessage: JSON.stringify(message),
          lastUpdateTimestamp: now,
          lastEventType: 'callAdded',
          lastCallsUpdateTimestamp: now,
        });
      });

      signalRService.on('callClosed', (message) => {
        const now = Date.now();
        logger.info({
          message: 'callClosed',
          context: { message },
        });
        set({
          lastUpdateMessage: JSON.stringify(message),
          lastUpdateTimestamp: now,
          lastEventType: 'callClosed',
          lastCallsUpdateTimestamp: now,
        });
      });

      signalRService.on('onConnected', () => {
        logger.info({
          message: 'Connected to update SignalR hub',
        });
        set({ isUpdateHubConnected: true, lastEventType: 'connected', error: null });
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      logger.error({
        message: 'Failed to connect to SignalR hubs',
        context: { error: err },
      });
      set({ error: err });
    }
  },
  disconnectUpdateHub: async () => {
    try {
      await signalRService.disconnectFromHub(Env.CHANNEL_HUB_NAME);
      set({ isUpdateHubConnected: false, lastUpdateMessage: null });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      logger.error({
        message: 'Failed to disconnect from SignalR hubs',
        context: { error: err },
      });
      set({ error: err });
    }
  },
  connectGeolocationHub: async () => {
    try {
      if (get().isGeolocationHubConnected) {
        return;
      }

      set({ isGeolocationHubConnected: false, error: null });

      // Get the eventing URL from the core store config
      const coreState = useCoreStore.getState();
      const eventingUrl = coreState.config?.EventingUrl;

      if (!eventingUrl) {
        const errorMessage = 'EventingUrl not available in config. Please ensure config is loaded first.';
        logger.error({
          message: errorMessage,
        });
        set({ error: new Error(errorMessage) });
        return;
      }

      // Connect to the geolocation hub
      await signalRService.connectToHubWithEventingUrl({
        name: Env.REALTIME_GEO_HUB_NAME,
        eventingUrl: eventingUrl,
        hubName: Env.REALTIME_GEO_HUB_NAME,
        methods: ['onPersonnelLocationUpdated', 'onUnitLocationUpdated', 'onGeolocationConnect'],
      });

      // Set up message handler
      signalRService.on('onPersonnelLocationUpdated', (message) => {
        set({
          lastGeolocationMessage: JSON.stringify(message),
          lastGeolocationTimestamp: Date.now(),
          lastGeolocationEventType: 'personnelLocationUpdated',
        });
      });

      signalRService.on('onUnitLocationUpdated', (message) => {
        set({
          lastGeolocationMessage: JSON.stringify(message),
          lastGeolocationTimestamp: Date.now(),
          lastGeolocationEventType: 'unitLocationUpdated',
        });
      });

      signalRService.on('onGeolocationConnect', () => {
        logger.info({
          message: 'Connected to geolocation SignalR hub',
        });
        set({ isGeolocationHubConnected: true, lastGeolocationEventType: 'connected', error: null });
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      logger.error({
        message: 'Failed to connect to SignalR hubs',
        context: { error: err },
      });
      set({ error: err });
    }
  },
  disconnectGeolocationHub: async () => {
    try {
      await signalRService.disconnectFromHub(Env.REALTIME_GEO_HUB_NAME);
      set({ isGeolocationHubConnected: false, lastGeolocationMessage: null });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      logger.error({
        message: 'Failed to disconnect from SignalR hubs',
        context: { error: err },
      });
      set({ error: err });
    }
  },
}));
