import { create } from 'zustand';

import { type ActivityLogEntry } from '@/components/dispatch-console/activity-log-panel';
import { type CallNoteResultData } from '@/models/v4/callNotes/callNoteResultData';
import { type CallExtraDataResultData } from '@/models/v4/calls/callExtraDataResultData';

interface DispatchConsoleState {
  // Selected items
  selectedCallId: string | null;
  selectedUnitId: string | null;
  selectedPersonnelId: string | null;

  // Call filter mode - when active, panels filter to show only call-related data
  isCallFilterActive: boolean;
  selectedCallExtraData: CallExtraDataResultData | null;
  selectedCallNotes: CallNoteResultData[];
  isLoadingCallData: boolean;

  // Map center coordinates for weather
  mapCenterLatitude: number | null;
  mapCenterLongitude: number | null;

  // Activity log
  activityLog: ActivityLogEntry[];
  maxLogEntries: number;

  // PTT state
  isTransmitting: boolean;
  currentChannel: string;

  // Panel visibility (for customization)
  panelVisibility: {
    calls: boolean;
    units: boolean;
    personnel: boolean;
    map: boolean;
    notes: boolean;
    activityLog: boolean;
    ptt: boolean;
  };

  // Actions
  setSelectedCallId: (callId: string | null) => void;
  setSelectedUnitId: (unitId: string | null) => void;
  setSelectedPersonnelId: (personnelId: string | null) => void;
  toggleCallFilter: (callId: string) => void;
  clearCallFilter: () => void;
  setCallExtraData: (data: CallExtraDataResultData | null) => void;
  setCallNotes: (notes: CallNoteResultData[]) => void;
  setIsLoadingCallData: (loading: boolean) => void;
  setMapCenter: (latitude: number | null, longitude: number | null) => void;
  addActivityLogEntry: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  clearActivityLog: () => void;
  setIsTransmitting: (isTransmitting: boolean) => void;
  setCurrentChannel: (channel: string) => void;
  togglePanelVisibility: (panel: keyof DispatchConsoleState['panelVisibility']) => void;
  resetPanelVisibility: () => void;
  getFilteredActivityLog: () => ActivityLogEntry[];
}

const defaultPanelVisibility = {
  calls: true,
  units: true,
  personnel: true,
  map: true,
  notes: true,
  activityLog: true,
  ptt: true,
};

export const useDispatchConsoleStore = create<DispatchConsoleState>((set, get) => ({
  // Initial state
  selectedCallId: null,
  selectedUnitId: null,
  selectedPersonnelId: null,
  isCallFilterActive: false,
  selectedCallExtraData: null,
  selectedCallNotes: [],
  isLoadingCallData: false,
  mapCenterLatitude: null,
  mapCenterLongitude: null,
  activityLog: [],
  maxLogEntries: 100,
  isTransmitting: false,
  currentChannel: 'Main Dispatch',
  panelVisibility: { ...defaultPanelVisibility },

  // Actions
  setSelectedCallId: (callId) => set({ selectedCallId: callId }),
  setSelectedUnitId: (unitId) => set({ selectedUnitId: unitId }),
  setSelectedPersonnelId: (personnelId) => set({ selectedPersonnelId: personnelId }),

  toggleCallFilter: (callId) => {
    const { selectedCallId, isCallFilterActive } = get();
    if (selectedCallId === callId && isCallFilterActive) {
      // Same call selected again - clear the filter
      set({
        selectedCallId: null,
        isCallFilterActive: false,
        selectedCallExtraData: null,
        selectedCallNotes: [],
      });
    } else {
      // Different call or filter not active - activate filter
      set({
        selectedCallId: callId,
        isCallFilterActive: true,
        selectedCallExtraData: null,
        selectedCallNotes: [],
      });
    }
  },

  clearCallFilter: () =>
    set({
      selectedCallId: null,
      isCallFilterActive: false,
      selectedCallExtraData: null,
      selectedCallNotes: [],
    }),

  setCallExtraData: (data) => set({ selectedCallExtraData: data }),
  setCallNotes: (notes) => set({ selectedCallNotes: notes }),
  setIsLoadingCallData: (loading) => set({ isLoadingCallData: loading }),
  setMapCenter: (latitude, longitude) => set({ mapCenterLatitude: latitude, mapCenterLongitude: longitude }),

  addActivityLogEntry: (entry) => {
    const { activityLog, maxLogEntries } = get();
    const newEntry: ActivityLogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    // Add to beginning of array and limit to maxLogEntries
    const updatedLog = [newEntry, ...activityLog].slice(0, maxLogEntries);
    set({ activityLog: updatedLog });
  },

  clearActivityLog: () => set({ activityLog: [] }),

  setIsTransmitting: (isTransmitting) => set({ isTransmitting }),

  setCurrentChannel: (channel) => set({ currentChannel: channel }),

  togglePanelVisibility: (panel) => {
    const { panelVisibility } = get();
    set({
      panelVisibility: {
        ...panelVisibility,
        [panel]: !panelVisibility[panel],
      },
    });
  },

  resetPanelVisibility: () => set({ panelVisibility: { ...defaultPanelVisibility } }),

  getFilteredActivityLog: () => {
    const { activityLog, isCallFilterActive, selectedCallId } = get();
    if (!isCallFilterActive || !selectedCallId) {
      return activityLog;
    }
    // Filter activity log entries to only show those related to the selected call
    return activityLog.filter((entry) => entry.metadata?.callId === selectedCallId || entry.type === 'system');
  },
}));
