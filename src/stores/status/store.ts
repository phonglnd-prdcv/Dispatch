import { create } from 'zustand';

import { getCalls } from '@/api/calls/calls';
import { getSetUnitStatusData } from '@/api/dispatch/dispatch';
import { getAllGroups } from '@/api/groups/groups';
import { type DestinationSelectionType } from '@/lib/destination-helpers';
import { saveUnitStatus } from '@/api/units/unitStatuses';
import { logger } from '@/lib/logging';
import { type CallResultData } from '@/models/v4/calls/callResultData';
import { type CustomStatusResultData } from '@/models/v4/customStatuses/customStatusResultData';
import { type GroupResultData } from '@/models/v4/groups/groupsResultData';
import { type PoiResultData } from '@/models/v4/mapping/poiResultData';
import { type StatusesResultData } from '@/models/v4/statuses/statusesResultData';
import { type SaveUnitStatusInput, type SaveUnitStatusRoleInput } from '@/models/v4/unitStatus/saveUnitStatusInput';

import { useCoreStore } from '../app/core-store';
import { useLocationStore } from '../app/location-store';
import { useRolesStore } from '../roles/store';

type StatusStep = 'select-status' | 'select-destination' | 'add-note';
type DestinationType = DestinationSelectionType;

// Status type that can accept both custom statuses and regular statuses
type StatusType = CustomStatusResultData | StatusesResultData;

interface StatusBottomSheetStore {
  isOpen: boolean;
  currentStep: StatusStep;
  selectedCall: CallResultData | null;
  selectedStation: GroupResultData | null;
  selectedPoi: PoiResultData | null;
  selectedDestinationType: DestinationType;
  selectedStatus: StatusType | null;
  cameFromStatusSelection: boolean; // Track whether we came from status selection flow
  note: string;
  availableCalls: CallResultData[];
  availableStations: GroupResultData[];
  availablePois: PoiResultData[];
  isLoading: boolean;
  error: string | null;
  setIsOpen: (isOpen: boolean, status?: StatusType) => void;
  setCurrentStep: (step: StatusStep) => void;
  setSelectedCall: (call: CallResultData | null) => void;
  setSelectedStation: (station: GroupResultData | null) => void;
  setSelectedPoi: (poi: PoiResultData | null) => void;
  setSelectedDestinationType: (type: DestinationType) => void;
  setSelectedStatus: (status: StatusType | null) => void;
  setNote: (note: string) => void;
  fetchDestinationData: (unitId: string) => Promise<void>;
  reset: () => void;
}

export const useStatusBottomSheetStore = create<StatusBottomSheetStore>((set, get) => ({
  isOpen: false,
  currentStep: 'select-destination',
  selectedCall: null,
  selectedStation: null,
  selectedPoi: null,
  selectedDestinationType: 'none',
  selectedStatus: null,
  cameFromStatusSelection: false,
  note: '',
  availableCalls: [],
  availableStations: [],
  availablePois: [],
  isLoading: false,
  error: null,
  setIsOpen: (isOpen, status) => {
    if (isOpen && !status) {
      // If no status is provided, start with status selection
      set({ isOpen, selectedStatus: null, currentStep: 'select-status', cameFromStatusSelection: true });
    } else {
      // If status is provided, start with destination selection
      set({ isOpen, selectedStatus: status || null, currentStep: 'select-destination', cameFromStatusSelection: false });
    }
  },
  setCurrentStep: (step) => set({ currentStep: step }),
  setSelectedCall: (call) => set({ selectedCall: call }),
  setSelectedStation: (station) => set({ selectedStation: station }),
  setSelectedPoi: (poi) => set({ selectedPoi: poi }),
  setSelectedDestinationType: (type) => set({ selectedDestinationType: type }),
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  setNote: (note) => set({ note }),
  fetchDestinationData: async (unitId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getSetUnitStatusData(unitId);
      const destinationData = response?.Data;

      set({
        availableCalls: destinationData?.Calls || [],
        availableStations: destinationData?.Stations || [],
        availablePois: destinationData?.DestinationPois || [],
        isLoading: false,
      });
    } catch (error) {
      try {
        const [callsResponse, groupsResponse] = await Promise.all([getCalls(), getAllGroups()]);

        set({
          availableCalls: callsResponse.Data || [],
          availableStations: groupsResponse.Data || [],
          availablePois: [],
          isLoading: false,
        });
      } catch {
        set({
          error: 'Failed to fetch destination data',
          isLoading: false,
        });
      }
    }
  },
  reset: () =>
    set({
      isOpen: false,
      currentStep: 'select-destination',
      selectedCall: null,
      selectedStation: null,
      selectedPoi: null,
      selectedDestinationType: 'none',
      selectedStatus: null,
      cameFromStatusSelection: false,
      note: '',
      availableCalls: [],
      availableStations: [],
      availablePois: [],
      isLoading: false,
      error: null,
    }),
}));

interface StatusesState {
  isLoading: boolean;
  error: string | null;
  saveUnitStatus: (input: SaveUnitStatusInput) => Promise<void>;
}

export const useStatusesStore = create<StatusesState>((set) => ({
  isLoading: false,
  error: null,
  saveUnitStatus: async (input: SaveUnitStatusInput) => {
    set({ isLoading: true, error: null });
    try {
      const date = new Date();
      input.Timestamp = date.toISOString();
      input.TimestampUtc = date.toUTCString().replace('UTC', 'GMT');

      // Populate GPS coordinates from location store if not already set
      if ((!input.Latitude && !input.Longitude) || (input.Latitude === '' && input.Longitude === '')) {
        const locationState = useLocationStore.getState();

        if (locationState.latitude !== null && locationState.longitude !== null) {
          input.Latitude = locationState.latitude.toString();
          input.Longitude = locationState.longitude.toString();
          input.Accuracy = locationState.accuracy?.toString() || '';
          input.Altitude = locationState.altitude?.toString() || '';
          input.AltitudeAccuracy = ''; // Location store doesn't provide altitude accuracy
          input.Speed = locationState.speed?.toString() || '';
          input.Heading = locationState.heading?.toString() || '';
        } else {
          // Ensure empty strings when no GPS data
          input.Latitude = '';
          input.Longitude = '';
          input.Accuracy = '';
          input.Altitude = '';
          input.AltitudeAccuracy = '';
          input.Speed = '';
          input.Heading = '';
        }
      }

      // Try to save directly
      await saveUnitStatus(input);

      // Set loading to false immediately after successful save
      set({ isLoading: false });

      logger.info({
        message: 'Unit status saved successfully',
        context: { unitId: input.Id, statusType: input.Type },
      });

      // Refresh the active unit status in the background (don't await)
      // This allows the UI to be responsive while the data refreshes
      const activeUnit = useCoreStore.getState().activeUnit;
      if (activeUnit) {
        const refreshPromise = useCoreStore.getState().setActiveUnitWithFetch(activeUnit.UnitId);
        if (refreshPromise && typeof refreshPromise.catch === 'function') {
          refreshPromise.catch((error) => {
            logger.error({
              message: 'Failed to refresh unit data after status save',
              context: { unitId: activeUnit.UnitId, error },
            });
          });
        }
      }
    } catch (error) {
      logger.error({
        message: 'Failed to process unit status update',
        context: { error },
      });
      set({ error: 'Failed to save unit status', isLoading: false });
      throw error; // Re-throw to allow calling code to handle error
    }
  },
}));
