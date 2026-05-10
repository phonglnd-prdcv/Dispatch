import { type MapMakerInfoData } from '@/models/v4/mapping/getMapDataAndMarkersData';
import { type PoiLayerData } from '@/models/v4/mapping/poiLayerData';

import { MapMarkerEntityType } from './destination-helpers';

export const getPoiMapLayerId = (poiTypeId: number) => `poi-${poiTypeId}`;

export const createDefaultVisiblePoiLayerIds = (poiLayers: PoiLayerData[]) => {
  return new Set(poiLayers.map((poiLayer) => getPoiMapLayerId(poiLayer.PoiTypeId)));
};

export const filterMapPinsByPoiLayers = (pins: MapMakerInfoData[], visiblePoiLayerIds: Set<string>) => {
  return pins.filter((pin) => {
    if (pin.Type !== MapMarkerEntityType.Poi || pin.PoiTypeId == null) {
      return true;
    }

    return visiblePoiLayerIds.has(getPoiMapLayerId(pin.PoiTypeId));
  });
};
