import { create } from 'zustand';

import { getPoi, getPois, getPoiTypes } from '@/api/mapping/mapping';
import { logger } from '@/lib/logging';
import { type PoiResultData } from '@/models/v4/mapping/poiResultData';
import { type PoiTypeResultData } from '@/models/v4/mapping/poiTypeResultData';

interface PoisState {
  pois: PoiResultData[];
  destinationPois: PoiResultData[];
  poiTypes: PoiTypeResultData[];
  selectedPoi: PoiResultData | null;
  isLoading: boolean;
  isLoadingDestinationPois: boolean;
  isLoadingTypes: boolean;
  isLoadingDetail: boolean;
  error: string | null;
  detailError: string | null;
  fetchPois: (forceRefresh?: boolean) => Promise<void>;
  fetchDestinationPois: (forceRefresh?: boolean) => Promise<void>;
  fetchPoiTypes: (forceRefresh?: boolean) => Promise<void>;
  fetchPoi: (poiId: number, forceRefresh?: boolean) => Promise<void>;
  getPoiById: (poiId: number) => PoiResultData | undefined;
  resetSelectedPoi: () => void;
}

export const usePoisStore = create<PoisState>((set, get) => ({
  pois: [],
  destinationPois: [],
  poiTypes: [],
  selectedPoi: null,
  isLoading: false,
  isLoadingDestinationPois: false,
  isLoadingTypes: false,
  isLoadingDetail: false,
  error: null,
  detailError: null,

  fetchPois: async (forceRefresh = false) => {
    if (!forceRefresh && get().pois.length > 0) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await getPois();
      set({ pois: response?.Data ?? [], isLoading: false });
    } catch (error) {
      logger.error({
        message: 'Failed to fetch POIs',
        context: { error },
      });
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch POIs',
      });
    }
  },

  fetchDestinationPois: async (forceRefresh = false) => {
    if (!forceRefresh && get().destinationPois.length > 0) {
      return;
    }

    set({ isLoadingDestinationPois: true, error: null });

    try {
      const response = await getPois({ destinationOnly: true });
      set({ destinationPois: response?.Data ?? [], isLoadingDestinationPois: false });
    } catch (error) {
      logger.error({
        message: 'Failed to fetch destination POIs',
        context: { error },
      });
      set({
        isLoadingDestinationPois: false,
        error: error instanceof Error ? error.message : 'Failed to fetch destination POIs',
      });
    }
  },

  fetchPoiTypes: async (forceRefresh = false) => {
    if (!forceRefresh && get().poiTypes.length > 0) {
      return;
    }

    set({ isLoadingTypes: true, error: null });

    try {
      const response = await getPoiTypes();
      set({ poiTypes: response?.Data ?? [], isLoadingTypes: false });
    } catch (error) {
      logger.error({
        message: 'Failed to fetch POI types',
        context: { error },
      });
      set({
        isLoadingTypes: false,
        error: error instanceof Error ? error.message : 'Failed to fetch POI types',
      });
    }
  },

  fetchPoi: async (poiId: number, forceRefresh = false) => {
    const cachedPoi = get().getPoiById(poiId);

    if (cachedPoi) {
      set({ selectedPoi: cachedPoi });
    }

    if (!forceRefresh && get().selectedPoi?.PoiId === poiId && cachedPoi) {
      return;
    }

    set({ isLoadingDetail: true, detailError: null });

    try {
      const response = await getPoi(poiId);
      const nextPoi = response?.Data ?? null;
      const currentPois = get().pois;
      const currentDestinationPois = get().destinationPois;

      set({
        selectedPoi: nextPoi,
        pois: nextPoi ? upsertPoi(currentPois, nextPoi) : currentPois,
        destinationPois: nextPoi?.IsDestination ? upsertPoi(currentDestinationPois, nextPoi) : currentDestinationPois,
        isLoadingDetail: false,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to fetch POI detail',
        context: { error, poiId },
      });
      set({
        isLoadingDetail: false,
        detailError: error instanceof Error ? error.message : 'Failed to fetch POI details',
      });
    }
  },

  getPoiById: (poiId: number) => {
    const { pois, destinationPois, selectedPoi } = get();

    if (selectedPoi?.PoiId === poiId) {
      return selectedPoi;
    }

    return pois.find((poi) => poi.PoiId === poiId) ?? destinationPois.find((poi) => poi.PoiId === poiId);
  },

  resetSelectedPoi: () => set({ selectedPoi: null, detailError: null, isLoadingDetail: false }),
}));

const upsertPoi = (pois: PoiResultData[], poi: PoiResultData) => {
  const index = pois.findIndex((currentPoi) => currentPoi.PoiId === poi.PoiId);

  if (index === -1) {
    return [...pois, poi];
  }

  const nextPois = [...pois];
  nextPois[index] = poi;
  return nextPois;
};
