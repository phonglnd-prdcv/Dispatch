import { createApiEndpoint } from '@/api/common/client';
import { type IncidentCommandActionResult } from '@/models/v4/incidentCommand/incidentCommand';
import { type IncidentCapabilitiesResult, type IncidentRoleAssignment, type IncidentRoleResult, type IncidentRolesResult } from '@/models/v4/incidentCommand/incidentRole';

const seg = (value: string | number) => encodeURIComponent(String(value));

export const assignRole = async (assignment: Partial<IncidentRoleAssignment>) => {
  const response = await createApiEndpoint('/IncidentRoles/AssignRole').post<IncidentRoleResult>({ ...assignment });
  return response.data;
};

export const removeRole = async (incidentRoleAssignmentId: string) => {
  const response = await createApiEndpoint(`/IncidentRoles/RemoveRole/${seg(incidentRoleAssignmentId)}`).post<IncidentCommandActionResult>({});
  return response.data;
};

export const getRoles = async (callId: string) => {
  const response = await createApiEndpoint(`/IncidentRoles/GetRoles/${seg(callId)}`).get<IncidentRolesResult>();
  return response.data;
};

/** Caller's effective capabilities for the incident (drives the app's view gating). */
export const getMyCapabilities = async (callId: string) => {
  const response = await createApiEndpoint(`/IncidentRoles/GetMyCapabilities/${seg(callId)}`).get<IncidentCapabilitiesResult>();
  return response.data;
};
