import { create } from 'zustand';

import { savePersonsStaffings } from '@/api/personnel/personnelStaffing';
import { savePersonsStatuses } from '@/api/personnel/personnelStatuses';
import { type CallResultData } from '@/models/v4/calls/callResultData';
import { type GroupResultData } from '@/models/v4/groups/groupsResultData';
import { type PersonnelInfoResultData } from '@/models/v4/personnel/personnelInfoResultData';
import { type StatusesResultData } from '@/models/v4/statuses/statusesResultData';

export type PersonnelActionTab = 'status' | 'staffing';
export type DestinationType = 'none' | 'call' | 'station';

interface PersonnelActionsState {
  // Panel visibility
  isActionsOpen: boolean;

  // Selected personnel
  selectedPersonnel: PersonnelInfoResultData | null;

  // Current tab
  activeTab: PersonnelActionTab;

  // Status action state
  selectedStatus: StatusesResultData | null;
  statusDestinationType: DestinationType;
  statusSelectedCall: CallResultData | null;
  statusSelectedStation: GroupResultData | null;
  statusNote: string;
  isSubmittingStatus: boolean;

  // Staffing action state
  selectedStaffing: StatusesResultData | null;
  staffingNote: string;
  isSubmittingStaffing: boolean;

  // Available options
  availableStatuses: StatusesResultData[];
  availableStaffings: StatusesResultData[];
  availableCalls: CallResultData[];
  availableStations: GroupResultData[];
  isLoadingOptions: boolean;

  // Error handling
  statusError: string | null;
  staffingError: string | null;

  // Actions
  openActions: (personnel: PersonnelInfoResultData) => void;
  closeActions: () => void;
  setActiveTab: (tab: PersonnelActionTab) => void;

  // Status actions
  setSelectedStatus: (status: StatusesResultData | null) => void;
  setStatusDestinationType: (type: DestinationType) => void;
  setStatusSelectedCall: (call: CallResultData | null) => void;
  setStatusSelectedStation: (station: GroupResultData | null) => void;
  setStatusNote: (note: string) => void;
  submitStatus: () => Promise<boolean>;
  resetStatusForm: () => void;

  // Staffing actions
  setSelectedStaffing: (staffing: StatusesResultData | null) => void;
  setStaffingNote: (note: string) => void;
  submitStaffing: () => Promise<boolean>;
  resetStaffingForm: () => void;

  // Data loading
  setAvailableStatuses: (statuses: StatusesResultData[]) => void;
  setAvailableStaffings: (staffings: StatusesResultData[]) => void;
  setAvailableCalls: (calls: CallResultData[]) => void;
  setAvailableStations: (stations: GroupResultData[]) => void;
  setIsLoadingOptions: (loading: boolean) => void;

  // Reset everything
  reset: () => void;
}

const initialState = {
  isActionsOpen: false,
  selectedPersonnel: null,
  activeTab: 'status' as PersonnelActionTab,
  selectedStatus: null,
  statusDestinationType: 'none' as DestinationType,
  statusSelectedCall: null,
  statusSelectedStation: null,
  statusNote: '',
  isSubmittingStatus: false,
  selectedStaffing: null,
  staffingNote: '',
  isSubmittingStaffing: false,
  availableStatuses: [],
  availableStaffings: [],
  availableCalls: [],
  availableStations: [],
  isLoadingOptions: false,
  statusError: null,
  staffingError: null,
};

export const usePersonnelActionsStore = create<PersonnelActionsState>((set, get) => ({
  ...initialState,

  openActions: (personnel) => {
    set({
      isActionsOpen: true,
      selectedPersonnel: personnel,
      activeTab: 'status',
      // Reset form states when opening for new personnel
      selectedStatus: null,
      statusDestinationType: 'none',
      statusSelectedCall: null,
      statusSelectedStation: null,
      statusNote: '',
      selectedStaffing: null,
      staffingNote: '',
      statusError: null,
      staffingError: null,
    });
  },

  closeActions: () => {
    set({
      isActionsOpen: false,
      selectedPersonnel: null,
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  // Status actions
  setSelectedStatus: (status) => set({ selectedStatus: status, statusError: null }),

  setStatusDestinationType: (type) => {
    const updates: Partial<PersonnelActionsState> = { statusDestinationType: type };
    // Clear previous selections when changing type
    if (type === 'none') {
      updates.statusSelectedCall = null;
      updates.statusSelectedStation = null;
    } else if (type === 'call') {
      updates.statusSelectedStation = null;
    } else if (type === 'station') {
      updates.statusSelectedCall = null;
    }
    set(updates);
  },

  setStatusSelectedCall: (call) =>
    set({
      statusSelectedCall: call,
      statusDestinationType: 'call',
      statusSelectedStation: null,
    }),

  setStatusSelectedStation: (station) =>
    set({
      statusSelectedStation: station,
      statusDestinationType: 'station',
      statusSelectedCall: null,
    }),

  setStatusNote: (note) => set({ statusNote: note }),

  submitStatus: async () => {
    const { selectedPersonnel, selectedStatus, statusDestinationType, statusSelectedCall, statusSelectedStation, statusNote } = get();

    if (!selectedPersonnel || !selectedStatus) {
      set({ statusError: 'Please select a status' });
      return false;
    }

    set({ isSubmittingStatus: true, statusError: null });

    try {
      const date = new Date();
      let respondingTo = '';

      if (statusDestinationType === 'call' && statusSelectedCall) {
        respondingTo = statusSelectedCall.CallId;
      } else if (statusDestinationType === 'station' && statusSelectedStation) {
        respondingTo = statusSelectedStation.GroupId;
      }

      await savePersonsStatuses({
        UserIds: [selectedPersonnel.UserId],
        Type: selectedStatus.Id.toString(),
        RespondingTo: respondingTo,
        TimestampUtc: date.toUTCString().replace('UTC', 'GMT'),
        Timestamp: date.toISOString(),
        Note: statusNote,
        Latitude: '',
        Longitude: '',
        Accuracy: '',
        Altitude: '',
        AltitudeAccuracy: '',
        Speed: '',
        Heading: '',
        EventId: '',
      });

      // Reset the status form after successful submission
      set({
        isSubmittingStatus: false,
        selectedStatus: null,
        statusDestinationType: 'none',
        statusSelectedCall: null,
        statusSelectedStation: null,
        statusNote: '',
      });

      return true;
    } catch (error) {
      set({
        isSubmittingStatus: false,
        statusError: error instanceof Error ? error.message : 'Failed to update status',
      });
      return false;
    }
  },

  resetStatusForm: () =>
    set({
      selectedStatus: null,
      statusDestinationType: 'none',
      statusSelectedCall: null,
      statusSelectedStation: null,
      statusNote: '',
      statusError: null,
    }),

  // Staffing actions
  setSelectedStaffing: (staffing) => set({ selectedStaffing: staffing, staffingError: null }),

  setStaffingNote: (note) => set({ staffingNote: note }),

  submitStaffing: async () => {
    const { selectedPersonnel, selectedStaffing, staffingNote } = get();

    if (!selectedPersonnel || !selectedStaffing) {
      set({ staffingError: 'Please select a staffing level' });
      return false;
    }

    set({ isSubmittingStaffing: true, staffingError: null });

    try {
      const date = new Date();

      await savePersonsStaffings({
        UserIds: [selectedPersonnel.UserId],
        Type: selectedStaffing.Id.toString(),
        TimestampUtc: date.toUTCString().replace('UTC', 'GMT'),
        Timestamp: date.toISOString(),
        Note: staffingNote,
        EventId: '',
      });

      // Reset the staffing form after successful submission
      set({
        isSubmittingStaffing: false,
        selectedStaffing: null,
        staffingNote: '',
      });

      return true;
    } catch (error) {
      set({
        isSubmittingStaffing: false,
        staffingError: error instanceof Error ? error.message : 'Failed to update staffing',
      });
      return false;
    }
  },

  resetStaffingForm: () =>
    set({
      selectedStaffing: null,
      staffingNote: '',
      staffingError: null,
    }),

  // Data loading
  setAvailableStatuses: (statuses) => set({ availableStatuses: statuses }),
  setAvailableStaffings: (staffings) => set({ availableStaffings: staffings }),
  setAvailableCalls: (calls) => set({ availableCalls: calls }),
  setAvailableStations: (stations) => set({ availableStations: stations }),
  setIsLoadingOptions: (loading) => set({ isLoadingOptions: loading }),

  // Reset everything
  reset: () => set(initialState),
}));
