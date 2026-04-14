import { type CallVideoFeedsResult } from '@/models/v4/callVideoFeeds/callVideoFeedsResult';
import { type DeleteCallVideoFeedResult } from '@/models/v4/callVideoFeeds/deleteCallVideoFeedResult';
import { type SaveCallVideoFeedResult } from '@/models/v4/callVideoFeeds/saveCallVideoFeedResult';

import { createApiEndpoint } from '../common/client';

const getCallVideoFeedsApi = createApiEndpoint('/CallVideoFeeds/GetCallVideoFeeds');
const saveCallVideoFeedApi = createApiEndpoint('/CallVideoFeeds/SaveCallVideoFeed');
const editCallVideoFeedApi = createApiEndpoint('/CallVideoFeeds/EditCallVideoFeed');
const deleteCallVideoFeedApi = createApiEndpoint('/CallVideoFeeds/DeleteCallVideoFeed');

export interface SaveCallVideoFeedInput {
  CallId: string;
  Name: string;
  Url: string;
  FeedType?: number;
  FeedFormat?: number;
  Description?: string;
  Latitude?: string;
  Longitude?: string;
  SortOrder: number;
}

export interface EditCallVideoFeedInput extends SaveCallVideoFeedInput {
  CallVideoFeedId: string;
  Status: number;
}

export const getCallVideoFeeds = async (callId: string, signal?: AbortSignal) => {
  const response = await getCallVideoFeedsApi.get<CallVideoFeedsResult>({ callId }, signal);
  return response.data;
};

export const saveCallVideoFeed = async (input: SaveCallVideoFeedInput) => {
  const response = await saveCallVideoFeedApi.post<SaveCallVideoFeedResult>(input);
  return response.data;
};

export const editCallVideoFeed = async (input: EditCallVideoFeedInput) => {
  const response = await editCallVideoFeedApi.put<SaveCallVideoFeedResult>(input);
  return response.data;
};

export const deleteCallVideoFeed = async (callVideoFeedId: string) => {
  const response = await deleteCallVideoFeedApi.delete<DeleteCallVideoFeedResult>({ callVideoFeedId });
  return response.data;
};
