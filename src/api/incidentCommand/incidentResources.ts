import { createApiEndpoint } from '@/api/common/client';
import {
  type AdHocPersonnelListResult,
  type AdHocPersonnelResult,
  type AdHocUnitResult,
  type AdHocUnitsResult,
  type AssignPersonnelToUnitInput,
  type FormUnitInput,
  type IncidentAdHocPersonnel,
  type IncidentAdHocUnit,
} from '@/models/v4/incidentCommand/incidentAdHocResources';
import { type IncidentCommandActionResult } from '@/models/v4/incidentCommand/incidentCommand';

const seg = (value: string | number) => encodeURIComponent(String(value));

export const createAdHocUnit = async (unit: Partial<IncidentAdHocUnit>) => {
  const response = await createApiEndpoint('/IncidentResources/CreateAdHocUnit').post<AdHocUnitResult>({ ...unit });
  return response.data;
};

export const getAdHocUnits = async (callId: string) => {
  const response = await createApiEndpoint(`/IncidentResources/GetAdHocUnits/${seg(callId)}`).get<AdHocUnitsResult>();
  return response.data;
};

export const releaseAdHocUnit = async (incidentAdHocUnitId: string) => {
  const response = await createApiEndpoint(`/IncidentResources/ReleaseAdHocUnit/${seg(incidentAdHocUnitId)}`).post<IncidentCommandActionResult>({});
  return response.data;
};

export const createAdHocPersonnel = async (person: Partial<IncidentAdHocPersonnel>) => {
  const response = await createApiEndpoint('/IncidentResources/CreateAdHocPersonnel').post<AdHocPersonnelResult>({ ...person });
  return response.data;
};

export const getAdHocPersonnel = async (callId: string) => {
  const response = await createApiEndpoint(`/IncidentResources/GetAdHocPersonnel/${seg(callId)}`).get<AdHocPersonnelListResult>();
  return response.data;
};

export const releaseAdHocPersonnel = async (incidentAdHocPersonnelId: string) => {
  const response = await createApiEndpoint(`/IncidentResources/ReleaseAdHocPersonnel/${seg(incidentAdHocPersonnelId)}`).post<IncidentCommandActionResult>({});
  return response.data;
};

export const assignPersonnelToUnit = async (input: AssignPersonnelToUnitInput) => {
  const response = await createApiEndpoint('/IncidentResources/AssignPersonnelToUnit').post<AdHocPersonnelResult>({ ...input });
  return response.data;
};

export const formUnit = async (input: FormUnitInput) => {
  const response = await createApiEndpoint('/IncidentResources/FormUnit').post<AdHocUnitResult>({ ...input });
  return response.data;
};
