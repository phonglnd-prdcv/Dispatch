import { type UdfDefinitionResult } from '@/models/v4/userDefinedFields/udfDefinitionResult';
import { type UdfFieldValueInput } from '@/models/v4/userDefinedFields/udfFieldValueInput';
import { type UdfFieldValuesResult } from '@/models/v4/userDefinedFields/udfFieldValuesResult';

import { api } from '../common/client';

// EntityType enum: Call=0, Personnel=1, Unit=2, Contact=3
export const getUdfDefinition = async (entityType: number) => {
  const response = await api.get<UdfDefinitionResult>(`/UserDefinedFields/${entityType}`);
  return response.data;
};

export const getUdfValues = async (entityType: number, entityId: string) => {
  const response = await api.get<UdfFieldValuesResult>(`/UserDefinedFields/Values/${entityType}/${encodeURIComponent(entityId)}`);
  return response.data;
};

export interface SaveUdfValuesRequest {
  EntityType: number;
  EntityId: string;
  Values: UdfFieldValueInput[];
}

export const saveUdfValues = async (entityType: number, entityId: string, values: UdfFieldValueInput[]) => {
  const data: SaveUdfValuesRequest = {
    EntityType: entityType,
    EntityId: entityId,
    Values: values,
  };
  const response = await api.post<void>('/UserDefinedFields/Values', data);
  return response.data;
};
