import { type SavePersonsStaffingsResult } from '@/models/v4/personnelStaffing/savePersonsStaffingsResult';

import { createApiEndpoint } from '../common/client';

interface SavePersonsStaffingsInput {
  UserIds: string[];
  Type: string;
  TimestampUtc: string;
  Timestamp: string;
  Note: string;
  EventId: string;
}

const savePersonsStaffingsApi = createApiEndpoint('/PersonnelStaffing/SavePersonsStaffings');

export const savePersonsStaffings = async (input: SavePersonsStaffingsInput) => {
  const response = await savePersonsStaffingsApi.post<SavePersonsStaffingsResult>(input);
  return response.data;
};
