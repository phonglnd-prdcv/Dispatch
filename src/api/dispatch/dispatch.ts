import { createApiEndpoint } from '@/api/common/client';
import { type NewCallFormResult } from '@/models/v4/dispatch/newCallFormResult';
import { type GetSetUnitStateResult } from '@/models/v4/dispatch/getSetUnitStateResult';

const getNewCallDataApi = createApiEndpoint('/Dispatch/GetNewCallData');
const getSetUnitStateApi = createApiEndpoint('/Dispatch/GetSetUnitStatusData');

export const getNewCallData = async () => {
  const response = await getNewCallDataApi.get<NewCallFormResult>();
  return response.data;
};

export const getSetUnitState = async (unitId: string) => {
  const response = await getSetUnitStateApi.get<GetSetUnitStateResult>({
    unitId: unitId,
  });
  return response.data;
};

export const getSetUnitStatusData = getSetUnitState;
