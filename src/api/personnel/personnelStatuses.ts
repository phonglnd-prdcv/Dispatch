import { type SavePersonsStatusesResult } from '@/models/v4/personnelStatuses/savePersonsStatusesResult';

import { createApiEndpoint } from '../common/client';

interface SavePersonsStatusesInput {
  UserIds: string[];
  Type: string;
  RespondingTo: string;
  TimestampUtc: string;
  Timestamp: string;
  Note: string;
  Latitude: string;
  Longitude: string;
  Accuracy: string;
  Altitude: string;
  AltitudeAccuracy: string;
  Speed: string;
  Heading: string;
  EventId: string;
}

const savePersonsStatusesApi = createApiEndpoint('/PersonnelStatuses/SavePersonsStatuses');

export const savePersonsStatuses = async (input: SavePersonsStatusesInput) => {
  const response = await savePersonsStatusesApi.post<SavePersonsStatusesResult>(input);
  return response.data;
};
