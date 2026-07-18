import { type BaseV4Request } from '@/models/v4/baseV4Request';
import { type ActiveWeatherAlertsResult } from '@/models/v4/weatherAlerts/activeWeatherAlertsResult';
import { type WeatherAlertResult } from '@/models/v4/weatherAlerts/weatherAlertResult';
import { type WeatherAlertSettingsData } from '@/models/v4/weatherAlerts/weatherAlertSettingsData';
import { type WeatherAlertSettingsResult } from '@/models/v4/weatherAlerts/weatherAlertSettingsResult';
import { type WeatherAlertSourcesResult } from '@/models/v4/weatherAlerts/weatherAlertSourcesResult';
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

// --- Configuration / management --------------------------------------------

const saveSettingsApi = createApiEndpoint('/WeatherAlerts/SaveSettings');
const sourcesApi = createApiEndpoint('/WeatherAlerts/GetSources');
const saveSourceApi = createApiEndpoint('/WeatherAlerts/SaveSource');
const saveZoneApi = createApiEndpoint('/WeatherAlerts/SaveZone');

export interface SaveWeatherAlertSourceInput {
  WeatherAlertSourceId?: string;
  Name: string;
  SourceType: number;
  AreaFilter: string;
  ApiKey: string;
  CustomEndpoint: string;
  PollIntervalMinutes: number;
  Active: boolean;
}

export interface SaveWeatherAlertZoneInput {
  WeatherAlertZoneId?: string;
  Name: string;
  ZoneCode: string;
  CenterGeoLocation: string;
  RadiusMiles: number;
  IsActive: boolean;
  IsPrimary: boolean;
}

export const saveWeatherAlertSettings = async (input: WeatherAlertSettingsData) => {
  const response = await saveSettingsApi.post<WeatherAlertSettingsResult>({ ...input });
  return response.data;
};

export const getWeatherAlertSources = async (signal?: AbortSignal) => {
  const response = await sourcesApi.get<WeatherAlertSourcesResult>(undefined, signal);
  return response.data;
};

export const saveWeatherAlertSource = async (input: SaveWeatherAlertSourceInput) => {
  const response = await saveSourceApi.post<WeatherAlertSourcesResult>({ ...input });
  return response.data;
};

export const deleteWeatherAlertSource = async (sourceId: string) => {
  const response = await createApiEndpoint(`/WeatherAlerts/DeleteSource/${encodeURIComponent(sourceId)}`).delete<BaseV4Request>();
  return response.data;
};

export const saveWeatherAlertZone = async (input: SaveWeatherAlertZoneInput) => {
  const response = await saveZoneApi.post<WeatherAlertZonesResult>({ ...input });
  return response.data;
};

export const deleteWeatherAlertZone = async (zoneId: string) => {
  const response = await createApiEndpoint(`/WeatherAlerts/DeleteZone/${encodeURIComponent(zoneId)}`).delete<BaseV4Request>();
  return response.data;
};
