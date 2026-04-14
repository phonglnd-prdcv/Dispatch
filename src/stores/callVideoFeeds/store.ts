import { create } from 'zustand';

import {
  deleteCallVideoFeed,
  editCallVideoFeed,
  getCallVideoFeeds,
  saveCallVideoFeed,
  type EditCallVideoFeedInput,
  type SaveCallVideoFeedInput,
} from '@/api/callVideoFeeds/callVideoFeeds';
import { logger } from '@/lib/logging';
import { type CallVideoFeedResultData } from '@/models/v4/callVideoFeeds/callVideoFeedResultData';

interface CallVideoFeedsState {
  feeds: CallVideoFeedResultData[];
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;

  fetchFeeds: (callId: string) => Promise<void>;
  addFeed: (input: SaveCallVideoFeedInput) => Promise<string | null>;
  updateFeed: (input: EditCallVideoFeedInput) => Promise<boolean>;
  removeFeed: (feedId: string, callId: string) => Promise<boolean>;
  reset: () => void;
}

export const useCallVideoFeedsStore = create<CallVideoFeedsState>((set, get) => ({
  feeds: [],
  isLoading: false,
  error: null,
  isSaving: false,

  fetchFeeds: async (callId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await getCallVideoFeeds(callId);
      const feeds = (result.Data || []).sort((a, b) => a.SortOrder - b.SortOrder);
      set({ feeds, isLoading: false });
    } catch (error) {
      logger.error({ message: 'Failed to fetch video feeds', context: { error, callId } });
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch video feeds',
        isLoading: false,
      });
    }
  },

  addFeed: async (input: SaveCallVideoFeedInput) => {
    set({ isSaving: true });
    try {
      const result = await saveCallVideoFeed(input);
      // Re-fetch to get the full feed data
      await get().fetchFeeds(input.CallId);
      set({ isSaving: false });
      return result.Id || null;
    } catch (error) {
      logger.error({ message: 'Failed to add video feed', context: { error } });
      set({ isSaving: false });
      return null;
    }
  },

  updateFeed: async (input: EditCallVideoFeedInput) => {
    set({ isSaving: true });
    try {
      await editCallVideoFeed(input);
      await get().fetchFeeds(input.CallId);
      set({ isSaving: false });
      return true;
    } catch (error) {
      logger.error({ message: 'Failed to update video feed', context: { error } });
      set({ isSaving: false });
      return false;
    }
  },

  removeFeed: async (feedId: string, callId: string) => {
    // Optimistic removal
    const previousFeeds = get().feeds;
    set({ feeds: previousFeeds.filter((f) => f.CallVideoFeedId !== feedId) });
    try {
      await deleteCallVideoFeed(feedId);
      return true;
    } catch (error) {
      logger.error({ message: 'Failed to delete video feed', context: { error, feedId } });
      // Revert on failure
      set({ feeds: previousFeeds });
      return false;
    }
  },

  reset: () => {
    set({
      feeds: [],
      isLoading: false,
      error: null,
      isSaving: false,
    });
  },
}));
