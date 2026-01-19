import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { getCallPriorities } from '@/api/calls/callPriorities';
import { getCalls } from '@/api/calls/calls';
import { getCallTypes } from '@/api/calls/callTypes';
import { logger } from '@/lib/logging';
import { isCallActive } from '@/lib/utils';
import { type CallPriorityResultData } from '@/models/v4/callPriorities/callPriorityResultData';
import { type CallResultData } from '@/models/v4/calls/callResultData';
import { type CallTypeResultData } from '@/models/v4/callTypes/callTypeResultData';

// Separate state from actions for better type inference
interface CallsStateData {
  // Data
  calls: CallResultData[];
  callPriorities: CallPriorityResultData[];
  callTypes: CallTypeResultData[];

  // Loading states (separate for each resource)
  isLoadingCalls: boolean;
  isLoadingPriorities: boolean;
  isLoadingTypes: boolean;

  // Legacy loading state for backwards compatibility
  isLoading: boolean;

  // Error states
  error: string | null;
  callsError: string | null;
  prioritiesError: string | null;
  typesError: string | null;

  // Timestamps for tracking freshness (no caching)
  callsLastFetched: number;
  prioritiesLastFetched: number;
  typesLastFetched: number;
}

interface CallsStateActions {
  // Core fetching actions
  fetchCalls: () => Promise<void>;
  fetchCallPriorities: () => Promise<void>;
  fetchCallTypes: (forceRefresh?: boolean) => Promise<void>;

  // Combined init
  init: () => Promise<void>;

  // Computed selectors
  getActiveCalls: () => CallResultData[];
  getCallById: (callId: string) => CallResultData | undefined;
  getPriorityById: (priorityId: number) => CallPriorityResultData | undefined;

  // Reset
  reset: () => void;
}

type CallsState = CallsStateData & CallsStateActions;

const initialState: CallsStateData = {
  calls: [],
  callPriorities: [],
  callTypes: [],
  isLoadingCalls: false,
  isLoadingPriorities: false,
  isLoadingTypes: false,
  isLoading: false,
  error: null,
  callsError: null,
  prioritiesError: null,
  typesError: null,
  callsLastFetched: 0,
  prioritiesLastFetched: 0,
  typesLastFetched: 0,
};

export const useCallsStore = create<CallsState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    fetchCalls: async () => {
      // Set loading state
      set({ isLoadingCalls: true, isLoading: true, callsError: null, error: null });

      try {
        logger.info({
          message: 'Fetching calls from API (no cache)',
        });

        // Always fetch fresh data - no caching
        const response = await getCalls();
        const callsData = response?.Data ?? [];

        logger.info({
          message: 'Calls fetched successfully',
          context: {
            count: callsData.length,
            states: callsData.map((c) => c.State),
            callIds: callsData.map((c) => c.CallId),
          },
        });

        set({
          calls: callsData,
          isLoadingCalls: false,
          isLoading: false,
          callsLastFetched: Date.now(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch calls';
        logger.error({
          message: 'Failed to fetch calls',
          context: { error },
        });
        set({
          callsError: errorMessage,
          error: errorMessage,
          isLoadingCalls: false,
          isLoading: false,
        });
      }
    },

    fetchCallPriorities: async () => {
      set({ isLoadingPriorities: true, prioritiesError: null });

      try {
        const response = await getCallPriorities();
        const prioritiesData = response?.Data ?? [];

        logger.info({
          message: 'Call priorities fetched successfully',
          context: { count: prioritiesData.length },
        });

        set({
          callPriorities: prioritiesData,
          isLoadingPriorities: false,
          prioritiesLastFetched: Date.now(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch call priorities';
        logger.error({
          message: 'Failed to fetch call priorities',
          context: { error },
        });
        set({
          prioritiesError: errorMessage,
          isLoadingPriorities: false,
        });
      }
    },

    fetchCallTypes: async (forceRefresh = false) => {
      // Skip if already have types and not forcing refresh
      const { callTypes } = get();
      if (!forceRefresh && callTypes.length > 0) {
        return;
      }

      set({ isLoadingTypes: true, typesError: null });

      try {
        const response = await getCallTypes();
        const typesData = response?.Data ?? [];

        logger.info({
          message: 'Call types fetched successfully',
          context: { count: typesData.length },
        });

        set({
          callTypes: typesData,
          isLoadingTypes: false,
          typesLastFetched: Date.now(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch call types';
        logger.error({
          message: 'Failed to fetch call types',
          context: { error },
        });
        set({
          typesError: errorMessage,
          isLoadingTypes: false,
        });
      }
    },

    init: async () => {
      set({ isLoading: true, error: null });

      try {
        // Fetch all data in parallel - no caching
        const [callsResponse, prioritiesResponse, typesResponse] = await Promise.all([getCalls(), getCallPriorities(), getCallTypes()]);

        const callsData = callsResponse?.Data ?? [];
        const prioritiesData = prioritiesResponse?.Data ?? [];
        const typesData = typesResponse?.Data ?? [];

        logger.info({
          message: 'Calls store initialized successfully',
          context: {
            callsCount: callsData.length,
            prioritiesCount: prioritiesData.length,
            typesCount: typesData.length,
            callStates: callsData.map((c) => c.State),
          },
        });

        set({
          calls: callsData,
          callPriorities: prioritiesData,
          callTypes: typesData,
          isLoading: false,
          isLoadingCalls: false,
          isLoadingPriorities: false,
          isLoadingTypes: false,
          callsLastFetched: Date.now(),
          prioritiesLastFetched: Date.now(),
          typesLastFetched: Date.now(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize calls store';
        logger.error({
          message: 'Failed to initialize calls store',
          context: { error },
        });
        set({
          error: errorMessage,
          isLoading: false,
          isLoadingCalls: false,
          isLoadingPriorities: false,
          isLoadingTypes: false,
        });
      }
    },

    // Selector to get active calls - filters by state
    getActiveCalls: () => {
      const { calls } = get();
      return calls.filter((call) => isCallActive(call.State));
    },

    // Selector to get call by ID
    getCallById: (callId: string) => {
      const { calls } = get();
      return calls.find((c) => c.CallId === callId);
    },

    // Selector to get priority by ID
    getPriorityById: (priorityId: number) => {
      const { callPriorities } = get();
      return callPriorities.find((p) => p.Id === priorityId);
    },

    // Reset store to initial state
    reset: () => {
      set(initialState);
    },
  }))
);
