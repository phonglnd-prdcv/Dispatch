import { create } from 'zustand';

import { getActiveAlerts, getAlertsNearLocation, getWeatherAlert, getWeatherAlertSettings } from '@/api/weatherAlerts/weatherAlerts';
import { logger } from '@/lib/logging';
import { WeatherAlertSeverity } from '@/models/v4/weatherAlerts/weatherAlertEnums';
import { type WeatherAlertResultData } from '@/models/v4/weatherAlerts/weatherAlertResultData';
import { type WeatherAlertSettingsData } from '@/models/v4/weatherAlerts/weatherAlertSettingsData';

function sortAlerts(a: WeatherAlertResultData, b: WeatherAlertResultData): number {
  if (a.Severity !== b.Severity) return a.Severity - b.Severity;
  return new Date(b.EffectiveUtc).getTime() - new Date(a.EffectiveUtc).getTime();
}

interface WeatherAlertsState {
  alerts: WeatherAlertResultData[];
  isLoading: boolean;
  error: string | null;

  selectedAlert: WeatherAlertResultData | null;
  isLoadingDetail: boolean;

  settings: WeatherAlertSettingsData | null;

  nearbyAlerts: WeatherAlertResultData[];
  isLoadingNearby: boolean;

  lastWeatherAlertTimestamp: number;

  fetchActiveAlerts: () => Promise<void>;
  fetchAlertDetail: (alertId: string) => Promise<void>;
  fetchNearbyAlerts: (lat: number, lng: number, radiusMiles?: number) => Promise<void>;
  fetchSettings: () => Promise<void>;
  handleAlertReceived: (alertId: string) => Promise<void>;
  handleAlertExpired: (alertId: string) => void;
  handleAlertUpdated: (alertId: string) => Promise<void>;
  reset: () => void;
}

export const useWeatherAlertsStore = create<WeatherAlertsState>((set, get) => ({
  alerts: [],
  isLoading: false,
  error: null,
  selectedAlert: null,
  isLoadingDetail: false,
  settings: null,
  nearbyAlerts: [],
  isLoadingNearby: false,
  lastWeatherAlertTimestamp: 0,

  fetchActiveAlerts: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await getActiveAlerts();
      const sorted = (result.Data || []).sort(sortAlerts);
      set({ alerts: sorted, isLoading: false });
    } catch (error) {
      logger.error({ message: 'Failed to fetch active weather alerts', context: { error } });
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch weather alerts',
        isLoading: false,
      });
    }
  },

  fetchAlertDetail: async (alertId: string) => {
    set({ isLoadingDetail: true });
    try {
      const result = await getWeatherAlert(alertId);
      set({ selectedAlert: result.Data, isLoadingDetail: false });
    } catch (error) {
      logger.error({ message: 'Failed to fetch weather alert detail', context: { error, alertId } });
      set({ isLoadingDetail: false });
    }
  },

  fetchNearbyAlerts: async (lat: number, lng: number, radiusMiles: number = 25) => {
    set({ isLoadingNearby: true });
    try {
      const result = await getAlertsNearLocation(lat, lng, radiusMiles);
      const sorted = (result.Data || []).sort(sortAlerts);
      set({ nearbyAlerts: sorted, isLoadingNearby: false });
    } catch (error) {
      logger.error({ message: 'Failed to fetch nearby weather alerts', context: { error } });
      set({ isLoadingNearby: false });
    }
  },

  fetchSettings: async () => {
    try {
      const result = await getWeatherAlertSettings();
      set({ settings: result.Data });
    } catch (error) {
      logger.error({ message: 'Failed to fetch weather alert settings', context: { error } });
    }
  },

  handleAlertReceived: async (alertId: string) => {
    try {
      const result = await getWeatherAlert(alertId);
      if (result.Data) {
        const current = get().alerts;
        const updated = [result.Data, ...current].sort(sortAlerts);
        set({ alerts: updated, lastWeatherAlertTimestamp: Date.now() });
      }
    } catch (error) {
      logger.error({ message: 'Failed to handle received weather alert', context: { error, alertId } });
      // Fall back to full refresh
      await get().fetchActiveAlerts();
    }
  },

  handleAlertExpired: (alertId: string) => {
    const current = get().alerts;
    set({
      alerts: current.filter((a) => a.WeatherAlertId !== alertId),
      lastWeatherAlertTimestamp: Date.now(),
    });
  },

  handleAlertUpdated: async (alertId: string) => {
    try {
      const result = await getWeatherAlert(alertId);
      if (result.Data) {
        const current = get().alerts;
        const idx = current.findIndex((a) => a.WeatherAlertId === alertId);
        let updated: WeatherAlertResultData[];
        if (idx >= 0) {
          updated = [...current];
          updated[idx] = result.Data;
        } else {
          updated = [result.Data, ...current];
        }
        set({ alerts: updated.sort(sortAlerts), lastWeatherAlertTimestamp: Date.now() });

        // Update selected alert if it's the one being viewed
        if (get().selectedAlert?.WeatherAlertId === alertId) {
          set({ selectedAlert: result.Data });
        }
      }
    } catch (error) {
      logger.error({ message: 'Failed to handle updated weather alert', context: { error, alertId } });
      await get().fetchActiveAlerts();
    }
  },

  reset: () => {
    set({
      alerts: [],
      isLoading: false,
      error: null,
      selectedAlert: null,
      isLoadingDetail: false,
      nearbyAlerts: [],
      isLoadingNearby: false,
      lastWeatherAlertTimestamp: 0,
    });
  },
}));
