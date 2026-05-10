import { type CallResultData } from '@/models/v4/calls/callResultData';
import { type GroupResultData } from '@/models/v4/groups/groupsResultData';
import { type PoiResultData } from '@/models/v4/mapping/poiResultData';

export enum DestinationEntityType {
  None = 0,
  Station = 1,
  Call = 2,
  Poi = 3,
}

export enum CustomStateDetailType {
  None = 0,
  Stations = 1,
  Calls = 2,
  CallsAndStations = 3,
  Pois = 4,
  CallsAndPois = 5,
  StationsAndPois = 6,
  CallsStationsAndPois = 7,
}

export enum MapMarkerEntityType {
  Call = 0,
  Unit = 1,
  Station = 2,
  Personnel = 3,
  Poi = 4,
}

export type DestinationSelectionType = 'none' | 'call' | 'station' | 'poi';
export type DestinationTab = 'calls' | 'stations' | 'pois';

export interface DestinationCapabilities {
  showCalls: boolean;
  showStations: boolean;
  showPois: boolean;
  supportsDestination: boolean;
}

export const getDestinationCapabilities = (detail?: number | null): DestinationCapabilities => {
  switch (detail) {
    case CustomStateDetailType.Stations:
      return { showCalls: false, showStations: true, showPois: false, supportsDestination: true };
    case CustomStateDetailType.Calls:
      return { showCalls: true, showStations: false, showPois: false, supportsDestination: true };
    case CustomStateDetailType.CallsAndStations:
      return { showCalls: true, showStations: true, showPois: false, supportsDestination: true };
    case CustomStateDetailType.Pois:
      return { showCalls: false, showStations: false, showPois: true, supportsDestination: true };
    case CustomStateDetailType.CallsAndPois:
      return { showCalls: true, showStations: false, showPois: true, supportsDestination: true };
    case CustomStateDetailType.StationsAndPois:
      return { showCalls: false, showStations: true, showPois: true, supportsDestination: true };
    case CustomStateDetailType.CallsStationsAndPois:
      return { showCalls: true, showStations: true, showPois: true, supportsDestination: true };
    default:
      return { showCalls: false, showStations: false, showPois: false, supportsDestination: false };
  }
};

export const getDestinationSelectionTypeValue = (type: DestinationSelectionType): DestinationEntityType | null => {
  switch (type) {
    case 'call':
      return DestinationEntityType.Call;
    case 'station':
      return DestinationEntityType.Station;
    case 'poi':
      return DestinationEntityType.Poi;
    default:
      return null;
  }
};

export const getDestinationSelectionTypeFromValue = (type?: number | null): DestinationSelectionType => {
  switch (type) {
    case DestinationEntityType.Call:
      return 'call';
    case DestinationEntityType.Station:
      return 'station';
    case DestinationEntityType.Poi:
      return 'poi';
    default:
      return 'none';
  }
};

export const getDestinationTypeLabel = (type: DestinationSelectionType): string => {
  switch (type) {
    case 'call':
      return 'call';
    case 'station':
      return 'station';
    case 'poi':
      return 'poi';
    default:
      return 'none';
  }
};

export const isCallDestinationType = (type?: number | null) => type === DestinationEntityType.Call;

export const isStationDestinationType = (type?: number | null) => type === DestinationEntityType.Station;

export const isPoiDestinationType = (type?: number | null) => type === DestinationEntityType.Poi;

export const isCallMarker = (type?: number | null, imagePath?: string | null) => type === MapMarkerEntityType.Call || imagePath?.toLowerCase() === 'call';

export const isPoiMarker = (params: { type?: number | null; poiTypeId?: number | null; layerId?: string | null; imagePath?: string | null; poiImage?: string | null }): boolean => {
  const { type, poiTypeId, layerId, imagePath, poiImage } = params;

  // Condition 1: Explicit POI type (Type === 4)
  if (type === MapMarkerEntityType.Poi) return true;

  // Condition 2: PoiTypeId is a number greater than 0
  if (typeof poiTypeId === 'number' && poiTypeId > 0) return true;

  // Condition 3: LayerId starts with "poi-type-"
  if (layerId && typeof layerId === 'string' && layerId.startsWith('poi-type-')) return true;

  // Condition 4: PoiImage or ImagePath starts with "map-icon-" (case-insensitive)
  const iconField = poiImage || imagePath;
  if (iconField && typeof iconField === 'string' && iconField.toLowerCase().startsWith('map-icon-')) return true;

  return false;
};

export const getEnabledDestinationTabs = (detail?: number | null): DestinationTab[] => {
  const capabilities = getDestinationCapabilities(detail);
  const tabs: DestinationTab[] = [];

  if (capabilities.showCalls) {
    tabs.push('calls');
  }

  if (capabilities.showStations) {
    tabs.push('stations');
  }

  if (capabilities.showPois) {
    tabs.push('pois');
  }

  return tabs;
};

export const getDefaultDestinationTab = (detail?: number | null): DestinationTab => {
  const tabs = getEnabledDestinationTabs(detail);
  return tabs[0] ?? 'calls';
};

export interface DestinationSelectionState {
  selectedDestinationType: DestinationSelectionType;
  selectedCall: CallResultData | null;
  selectedStation: GroupResultData | null;
  selectedPoi: PoiResultData | null;
}

export const getSelectedDestinationId = ({ selectedDestinationType, selectedCall, selectedStation, selectedPoi }: DestinationSelectionState): string => {
  switch (selectedDestinationType) {
    case 'call':
      return selectedCall?.CallId ?? '';
    case 'station':
      return selectedStation?.GroupId ?? '';
    case 'poi':
      return selectedPoi ? selectedPoi.PoiId.toString() : '';
    default:
      return '';
  }
};
