import { create } from 'zustand';

import { getCheckInHistory, getTimersForCall, getTimerStatuses, getTimerStatusesForCalls, performCheckIn, type PerformCheckInInput, toggleCallTimers } from '@/api/checkIn/checkInTimers';
import { type CheckInRecordResultData } from '@/models/v4/checkIn/checkInRecordResultData';
import { type CheckInTimerStatusResultData } from '@/models/v4/checkIn/checkInTimerStatusResultData';
import { type ResolvedCheckInTimerResultData } from '@/models/v4/checkIn/resolvedCheckInTimerResultData';

const STATUS_SEVERITY: Record<string, number> = {
  Critical: 0,
  Overdue: 1,
  Red: 1,
  Warning: 2,
  Yellow: 2,
  Ok: 3,
  Green: 3,
};

function sortByStatusSeverity(a: CheckInTimerStatusResultData, b: CheckInTimerStatusResultData): number {
  return (STATUS_SEVERITY[a.Status] ?? 3) - (STATUS_SEVERITY[b.Status] ?? 3);
}

interface CheckInState {
  timerStatuses: CheckInTimerStatusResultData[];
  resolvedTimers: ResolvedCheckInTimerResultData[];
  checkInHistory: CheckInRecordResultData[];

  isLoadingStatuses: boolean;
  statusError: string | null;
  isLoadingHistory: boolean;
  isCheckingIn: boolean;
  checkInError: string | null;

  _pollingInterval: ReturnType<typeof setInterval> | null;
  _pollingCallIds: number[];

  fetchTimerStatuses: (callId: number) => Promise<void>;
  fetchTimerStatusesForCalls: (callIds: number[]) => Promise<void>;
  fetchResolvedTimers: (callId: number) => Promise<void>;
  fetchCheckInHistory: (callId: number) => Promise<void>;
  performCheckIn: (input: PerformCheckInInput) => Promise<boolean>;
  toggleTimers: (callId: number, enabled: boolean) => Promise<boolean>;
  startPolling: (callId: number, intervalMs?: number) => void;
  startPollingForCalls: (callIds: number[], intervalMs?: number) => void;
  stopPolling: () => void;
  reset: () => void;
}

export const useCheckInStore = create<CheckInState>((set, get) => ({
  timerStatuses: [],
  resolvedTimers: [],
  checkInHistory: [],
  isLoadingStatuses: false,
  statusError: null,
  isLoadingHistory: false,
  isCheckingIn: false,
  checkInError: null,
  _pollingInterval: null,
  _pollingCallIds: [],

  fetchTimerStatuses: async (callId: number) => {
    set({ isLoadingStatuses: true, statusError: null });
    try {
      const result = await getTimerStatuses(callId);
      const sorted = (result.Data || []).sort(sortByStatusSeverity);
      set({ timerStatuses: sorted, isLoadingStatuses: false });
    } catch (error) {
      set({
        statusError: error instanceof Error ? error.message : 'Failed to fetch timer statuses',
        isLoadingStatuses: false,
      });
    }
  },

  fetchTimerStatusesForCalls: async (callIds: number[]) => {
    if (callIds.length === 0) {
      set({ timerStatuses: [], isLoadingStatuses: false });
      return;
    }
    set({ isLoadingStatuses: true, statusError: null });
    try {
      const result = await getTimerStatusesForCalls(callIds);
      const sorted = (result.Data || []).sort(sortByStatusSeverity);
      set({ timerStatuses: sorted, isLoadingStatuses: false });
    } catch (error) {
      set({
        statusError: error instanceof Error ? error.message : 'Failed to fetch timer statuses',
        isLoadingStatuses: false,
      });
    }
  },

  fetchResolvedTimers: async (callId: number) => {
    try {
      const result = await getTimersForCall(callId);
      set({ resolvedTimers: result.Data || [] });
    } catch {
      // silent fail — resolved timers are supplementary
    }
  },

  fetchCheckInHistory: async (callId: number) => {
    set({ isLoadingHistory: true });
    try {
      const result = await getCheckInHistory(callId);
      set({ checkInHistory: result.Data || [], isLoadingHistory: false });
    } catch {
      set({ checkInHistory: [], isLoadingHistory: false });
    }
  },

  performCheckIn: async (input: PerformCheckInInput) => {
    set({ isCheckingIn: true, checkInError: null });
    try {
      await performCheckIn(input);
      // Refresh statuses after successful check-in
      const pollingCallIds = get()._pollingCallIds;
      if (pollingCallIds.length > 0) {
        await get().fetchTimerStatusesForCalls(pollingCallIds);
      } else {
        await get().fetchTimerStatuses(input.CallId);
      }
      set({ isCheckingIn: false });
      return true;
    } catch (error) {
      set({
        checkInError: error instanceof Error ? error.message : 'Failed to perform check-in',
        isCheckingIn: false,
      });
      return false;
    }
  },

  toggleTimers: async (callId: number, enabled: boolean) => {
    try {
      await toggleCallTimers(callId, enabled);
      await get().fetchTimerStatuses(callId);
      return true;
    } catch {
      return false;
    }
  },

  startPolling: (callId: number, intervalMs: number = 30000) => {
    const existing = get()._pollingInterval;
    if (existing) {
      clearInterval(existing);
    }
    set({ _pollingCallIds: [callId] });
    const interval = setInterval(() => {
      get().fetchTimerStatuses(callId);
    }, intervalMs);
    set({ _pollingInterval: interval });
  },

  startPollingForCalls: (callIds: number[], intervalMs: number = 30000) => {
    const existing = get()._pollingInterval;
    if (existing) {
      clearInterval(existing);
    }
    set({ _pollingCallIds: callIds });
    if (callIds.length === 0) return;
    const interval = setInterval(() => {
      get().fetchTimerStatusesForCalls(callIds);
    }, intervalMs);
    set({ _pollingInterval: interval });
  },

  stopPolling: () => {
    const interval = get()._pollingInterval;
    if (interval) {
      clearInterval(interval);
      set({ _pollingInterval: null, _pollingCallIds: [] });
    }
  },

  reset: () => {
    const interval = get()._pollingInterval;
    if (interval) {
      clearInterval(interval);
    }
    set({
      timerStatuses: [],
      resolvedTimers: [],
      checkInHistory: [],
      isLoadingStatuses: false,
      statusError: null,
      isLoadingHistory: false,
      isCheckingIn: false,
      checkInError: null,
      _pollingInterval: null,
      _pollingCallIds: [],
    });
  },
}));
