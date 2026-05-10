import { type GetCurrentStatusResult } from '@/models/v4/personnelStatuses/getCurrentStatusResult';
import { type SavePersonsStatusesInput } from '@/models/v4/personnelStatuses/savePersonsStatusesInput';
import { type SavePersonsStatusesResult } from '@/models/v4/personnelStatuses/savePersonsStatusesResult';
import { type SavePersonStatusInput } from '@/models/v4/personnelStatuses/savePersonStatusInput';
import { type SavePersonStatusResult } from '@/models/v4/personnelStatuses/savePersonStatusResult';

import { createApiEndpoint } from '../common/client';

const getCurrentStatusApi = createApiEndpoint('/PersonnelStatuses/GetCurrentStatus');
const savePersonStatusApi = createApiEndpoint('/PersonnelStatuses/SavePersonStatus');
const savePersonsStatusesApi = createApiEndpoint('/PersonnelStatuses/SavePersonsStatuses');

export const getCurrentStatus = async () => {
  const response = await getCurrentStatusApi.get<GetCurrentStatusResult>();
  return response.data;
};

export const savePersonStatus = async (input: SavePersonStatusInput) => {
  const response = await savePersonStatusApi.post<SavePersonStatusResult>(input);
  return response.data;
};

export const savePersonsStatuses = async (input: SavePersonsStatusesInput) => {
  const response = await savePersonsStatusesApi.post<SavePersonsStatusesResult>(input);
  return response.data;
};
