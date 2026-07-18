import { createApiEndpoint } from '@/api/common/client';
import { type CommandAccountabilityResult, type EvaluateAccountabilityResult } from '@/models/v4/incidentCommand/accountability';
import { type CommandLogEntry, type CommandTimelineResult } from '@/models/v4/incidentCommand/commandLog';
import { type CommandNodeResult, type CommandStructureNode } from '@/models/v4/incidentCommand/commandStructureNode';
import {
  type CommandTransferResult,
  type EstablishCommandInput,
  type IncidentCommandActionResult,
  type IncidentCommandResult,
  type TransferCommandInput,
  type UpdateActionPlanInput,
} from '@/models/v4/incidentCommand/incidentCommand';
import { type IncidentCommandBoardResult } from '@/models/v4/incidentCommand/incidentCommandBoard';
import { type IncidentMapAnnotation, type IncidentMapAnnotationResult } from '@/models/v4/incidentCommand/incidentMapAnnotation';
import { type IncidentTimer, type IncidentTimerResult } from '@/models/v4/incidentCommand/incidentTimer';
import { type MoveResourceInput, type ResourceAssignment, type ResourceAssignmentResult } from '@/models/v4/incidentCommand/resourceAssignment';
import { type TacticalObjective, type TacticalObjectiveResult } from '@/models/v4/incidentCommand/tacticalObjective';

const seg = (value: string | number) => encodeURIComponent(String(value));

// --- Command lifecycle -----------------------------------------------------

export const establishCommand = async (input: EstablishCommandInput) => {
  const response = await createApiEndpoint('/IncidentCommand/EstablishCommand').post<IncidentCommandResult>({ ...input });
  return response.data;
};

export const getCommandBoard = async (callId: string) => {
  const response = await createApiEndpoint(`/IncidentCommand/GetCommandBoard/${seg(callId)}`).get<IncidentCommandBoardResult>();
  return response.data;
};

export const transferCommand = async (input: TransferCommandInput) => {
  const response = await createApiEndpoint('/IncidentCommand/TransferCommand').post<CommandTransferResult>({ ...input });
  return response.data;
};

export const closeCommand = async (incidentCommandId: string) => {
  const response = await createApiEndpoint(`/IncidentCommand/CloseCommand/${seg(incidentCommandId)}`).put<IncidentCommandResult>({});
  return response.data;
};

export const updateActionPlan = async (input: UpdateActionPlanInput) => {
  const response = await createApiEndpoint('/IncidentCommand/UpdateActionPlan').put<IncidentCommandResult>({ ...input });
  return response.data;
};

// --- Accountability (PAR) --------------------------------------------------

export const getAccountability = async (callId: string) => {
  const response = await createApiEndpoint(`/IncidentCommand/GetAccountability/${seg(callId)}`).get<CommandAccountabilityResult>();
  return response.data;
};

export const evaluateAccountability = async (callId: string) => {
  const response = await createApiEndpoint(`/IncidentCommand/EvaluateAccountability/${seg(callId)}`).post<EvaluateAccountabilityResult>({});
  return response.data;
};

// --- Command structure (org chart lanes) -----------------------------------

export const saveNode = async (node: Partial<CommandStructureNode>) => {
  const response = await createApiEndpoint('/IncidentCommand/SaveNode').post<CommandNodeResult>({ ...node });
  return response.data;
};

export const deleteNode = async (commandStructureNodeId: string) => {
  const response = await createApiEndpoint(`/IncidentCommand/DeleteNode/${seg(commandStructureNodeId)}`).delete<IncidentCommandActionResult>();
  return response.data;
};

// --- Resource assignments ---------------------------------------------------

export const assignResource = async (assignment: Partial<ResourceAssignment>) => {
  const response = await createApiEndpoint('/IncidentCommand/AssignResource').post<ResourceAssignmentResult>({ ...assignment });
  return response.data;
};

export const moveResource = async (input: MoveResourceInput) => {
  const response = await createApiEndpoint('/IncidentCommand/MoveResource').post<ResourceAssignmentResult>({ ...input });
  return response.data;
};

export const releaseResource = async (resourceAssignmentId: string) => {
  const response = await createApiEndpoint(`/IncidentCommand/ReleaseResource/${seg(resourceAssignmentId)}`).post<IncidentCommandActionResult>({});
  return response.data;
};

// --- Tactical objectives ----------------------------------------------------

export const saveObjective = async (objective: Partial<TacticalObjective>) => {
  const response = await createApiEndpoint('/IncidentCommand/SaveObjective').post<TacticalObjectiveResult>({ ...objective });
  return response.data;
};

export const completeObjective = async (tacticalObjectiveId: string) => {
  const response = await createApiEndpoint(`/IncidentCommand/CompleteObjective/${seg(tacticalObjectiveId)}`).post<TacticalObjectiveResult>({});
  return response.data;
};

// --- Timers -----------------------------------------------------------------

export const startTimer = async (timer: Partial<IncidentTimer>) => {
  const response = await createApiEndpoint('/IncidentCommand/StartTimer').post<IncidentTimerResult>({ ...timer });
  return response.data;
};

export const acknowledgeTimer = async (incidentTimerId: string) => {
  const response = await createApiEndpoint(`/IncidentCommand/AcknowledgeTimer/${seg(incidentTimerId)}`).post<IncidentTimerResult>({});
  return response.data;
};

// --- Map annotations --------------------------------------------------------

export const saveAnnotation = async (annotation: Partial<IncidentMapAnnotation>) => {
  const response = await createApiEndpoint('/IncidentCommand/SaveAnnotation').post<IncidentMapAnnotationResult>({ ...annotation });
  return response.data;
};

export const deleteAnnotation = async (incidentMapAnnotationId: string) => {
  const response = await createApiEndpoint(`/IncidentCommand/DeleteAnnotation/${seg(incidentMapAnnotationId)}`).delete<IncidentCommandActionResult>();
  return response.data;
};

// --- Timeline ---------------------------------------------------------------

export const getTimeline = async (callId: string): Promise<CommandTimelineResult> => {
  const response = await createApiEndpoint(`/IncidentCommand/GetTimeline/${seg(callId)}`).get<CommandTimelineResult>();
  return response.data;
};

export type { CommandLogEntry };
