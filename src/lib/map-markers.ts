import { MAP_ICONS } from '@/constants/map-icons';
import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';

import { MapMarkerEntityType } from './destination-helpers';

type MapIconKey = keyof typeof MAP_ICONS;

const normalizeMarkerToken = (token?: string | null) => token?.trim().toLowerCase().replace(/[\s-]+/g, '') ?? '';

export const resolveMapMarkerIconKey = (pin: Pick<MapMakerInfoData, 'ImagePath' | 'Type'>): MapIconKey => {
  const normalizedToken = normalizeMarkerToken(pin.ImagePath);

  if (normalizedToken && MAP_ICONS[normalizedToken]) {
    return normalizedToken as MapIconKey;
  }

  switch (pin.Type) {
    case MapMarkerEntityType.Unit:
      return 'truck';
    case MapMarkerEntityType.Station:
      return 'station';
    case MapMarkerEntityType.Personnel:
      return 'person';
    case MapMarkerEntityType.Poi:
      return 'flag';
    case MapMarkerEntityType.Call:
    default:
      return 'call';
  }
};

export const hasValidMapCoordinates = (pin: Pick<MapMakerInfoData, 'Latitude' | 'Longitude'>) => {
  return Number.isFinite(pin.Latitude) && Number.isFinite(pin.Longitude) && !(pin.Latitude === 0 && pin.Longitude === 0);
};

export const getMapMarkerColor = (pin: Pick<MapMakerInfoData, 'Color' | 'Type'>) => {
  if (pin.Color) {
    return pin.Color;
  }

  switch (pin.Type) {
    case MapMarkerEntityType.Poi:
      return '#dc2626';
    case MapMarkerEntityType.Station:
      return '#2563eb';
    case MapMarkerEntityType.Unit:
      return '#16a34a';
    case MapMarkerEntityType.Personnel:
      return '#7c3aed';
    case MapMarkerEntityType.Call:
    default:
      return '#f97316';
  }
};

export const getMapPinSummary = (pin: Pick<MapMakerInfoData, 'Address' | 'Note' | 'PoiTypeName' | 'InfoWindowContent'>) => {
  return pin.Address || pin.Note || pin.PoiTypeName || pin.InfoWindowContent || '';
};
