import { type ActiveWeatherAlertsResult } from '@/models/v4/weatherAlerts/activeWeatherAlertsResult';
import { type WeatherAlertResult } from '@/models/v4/weatherAlerts/weatherAlertResult';
import { type WeatherAlertSettingsResult } from '@/models/v4/weatherAlerts/weatherAlertSettingsResult';
import { type WeatherAlertZonesResult } from '@/models/v4/weatherAlerts/weatherAlertZonesResult';

import { createApiEndpoint } from '../common/client';

const activeAlertsApi = createApiEndpoint('/WeatherAlerts/GetActiveAlerts');
// alertDetail uses a path parameter, so we create the endpoint dynamically per call
const getAlertDetailEndpoint = (alertId: string) => createApiEndpoint(`/WeatherAlerts/GetWeatherAlert/${encodeURIComponent(alertId)}`);
const alertsNearLocationApi = createApiEndpoint('/WeatherAlerts/GetAlertsNearLocation');
const alertHistoryApi = createApiEndpoint('/WeatherAlerts/GetAlertHistory');
const settingsApi = createApiEndpoint('/WeatherAlerts/GetSettings');
const zonesApi = createApiEndpoint('/WeatherAlerts/GetZones');

export const getActiveAlerts = async (signal?: AbortSignal) => {
  const response = await activeAlertsApi.get<ActiveWeatherAlertsResult>(undefined, signal);
  return response.data;
};

export const getWeatherAlert = async (alertId: string, signal?: AbortSignal) => {
  const response = await getAlertDetailEndpoint(alertId).get<WeatherAlertResult>(undefined, signal);
  return response.data;
};

export const getAlertsNearLocation = async (lat: number, lng: number, radiusMiles: number = 25, signal?: AbortSignal) => {
  const response = await alertsNearLocationApi.get<ActiveWeatherAlertsResult>({ lat, lng, radiusMiles }, signal);
  return response.data;
};

export const getAlertHistory = async (startDate: string, endDate: string, signal?: AbortSignal) => {
  const response = await alertHistoryApi.get<ActiveWeatherAlertsResult>({ startDate, endDate }, signal);
  return response.data;
};

export const getWeatherAlertSettings = async (signal?: AbortSignal) => {
  const response = await settingsApi.get<WeatherAlertSettingsResult>(undefined, signal);
  return response.data;
};

export const getWeatherAlertZones = async (signal?: AbortSignal) => {
  const response = await zonesApi.get<WeatherAlertZonesResult>(undefined, signal);
  return response.data;
};
