import { type GetMapDataAndMarkersResult } from '@/models/v4/mapping/getMapDataAndMarkersResult';
import { type GetMapLayersResult } from '@/models/v4/mapping/getMapLayersResult';
import { type PoiResult } from '@/models/v4/mapping/poiResult';
import { type PoisResult } from '@/models/v4/mapping/poisResult';
import { type PoiTypesResult } from '@/models/v4/mapping/poiTypesResult';

import { api, createApiEndpoint } from '../common/client';

const getMayLayersApi = createApiEndpoint('/Mapping/GetMayLayers');
const getMapDataAndMarkersApi = createApiEndpoint('/Mapping/GetMapDataAndMarkers');
const getPoiTypesApi = createApiEndpoint('/Mapping/GetPoiTypes');
const getPoisApi = createApiEndpoint('/Mapping/GetPois');

export const getMapDataAndMarkers = async (signal?: AbortSignal) => {
  const response = await getMapDataAndMarkersApi.get<GetMapDataAndMarkersResult>(undefined, signal);
  return response.data;
};

export const getMayLayers = async (type: number, signal?: AbortSignal) => {
  const response = await getMayLayersApi.get<GetMapLayersResult>(
    {
      type: encodeURIComponent(type),
    },
    signal
  );
  return response.data;
};

export interface GetPoisOptions {
  poiTypeId?: number;
  destinationOnly?: boolean;
}

export const getPoiTypes = async (signal?: AbortSignal) => {
  const response = await getPoiTypesApi.get<PoiTypesResult>(undefined, signal);
  return response.data;
};

export const getPois = async (options: GetPoisOptions = {}, signal?: AbortSignal) => {
  const response = await getPoisApi.get<PoisResult>(
    {
      ...(typeof options.poiTypeId === 'number' ? { poiTypeId: options.poiTypeId } : {}),
      ...(typeof options.destinationOnly === 'boolean' ? { destinationOnly: options.destinationOnly } : {}),
    },
    signal
  );
  return response.data;
};

export const getPoi = async (poiId: number, signal?: AbortSignal) => {
  const response = await api.get<PoiResult>(`/Mapping/GetPoi/${encodeURIComponent(poiId.toString())}`, {
    signal,
  });
  return response.data;
};
