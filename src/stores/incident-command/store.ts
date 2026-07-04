import { create } from 'zustand';

import { getAllCommands } from '@/api/incidentCommand/commands';
import {
  acknowledgeTimer,
  assignResource,
  closeCommand,
  completeObjective,
  deleteAnnotation,
  deleteNode,
  establishCommand,
  evaluateAccountability,
  getCommandBoard,
  getTimeline,
  moveResource,
  releaseResource,
  saveAnnotation,
  saveNode,
  saveObjective,
  startTimer,
  transferCommand,
  updateActionPlan,
} from '@/api/incidentCommand/incidentCommand';
import { getIncidentSummary } from '@/api/incidentCommand/incidentReporting';
import { createAdHocPersonnel, createAdHocUnit, getAdHocPersonnel, getAdHocUnits, releaseAdHocPersonnel, releaseAdHocUnit } from '@/api/incidentCommand/incidentResources';
import { assignRole, getMyCapabilities, removeRole } from '@/api/incidentCommand/incidentRoles';
import { closeIncidentChannels, createIncidentChannel, getChannelsForCall } from '@/api/incidentCommand/incidentVoice';
import { getSyncBundle } from '@/api/incidentCommand/sync';
import { logger } from '@/lib/logging';
import { type PersonnelCallCheckInStatus } from '@/models/v4/incidentCommand/accountability';
import { type CommandResultData } from '@/models/v4/incidentCommand/commandDefinition';
import { type CommandLogEntry } from '@/models/v4/incidentCommand/commandLog';
import { type CommandStructureNode } from '@/models/v4/incidentCommand/commandStructureNode';
import { type IncidentAdHocPersonnel, type IncidentAdHocUnit } from '@/models/v4/incidentCommand/incidentAdHocResources';
import { type IncidentCommandBoard } from '@/models/v4/incidentCommand/incidentCommandBoard';
import { hasIncidentCapability, type IncidentCapabilities, ParStatus } from '@/models/v4/incidentCommand/incidentCommandEnums';
import { type IncidentMapAnnotation } from '@/models/v4/incidentCommand/incidentMapAnnotation';
import { type IncidentReportSummary } from '@/models/v4/incidentCommand/incidentReport';
import { type IncidentTimer } from '@/models/v4/incidentCommand/incidentTimer';
import { type DepartmentVoiceChannel } from '@/models/v4/incidentCommand/incidentVoiceChannel';
import { type TacticalObjective } from '@/models/v4/incidentCommand/tacticalObjective';

const errorMessage = (error: unknown, fallback: string): string => (error instanceof Error ? error.message : fallback);

interface IncidentCommandState {
  /** The call id whose command board is currently loaded (string, as used throughout the app). */
  callId: string | null;
  board: IncidentCommandBoard | null;
  timeline: CommandLogEntry[];
  /** Caller's effective IncidentCapabilities bitmask for this incident. */
  capabilities: number;
  capabilityNames: string[];
  templates: CommandResultData[];
  adHocUnits: IncidentAdHocUnit[];
  adHocPersonnel: IncidentAdHocPersonnel[];
  voiceChannels: DepartmentVoiceChannel[];
  summary: IncidentReportSummary | null;
  /** All active incident commands (from Sync/Bundle) for the department-wide list. */
  activeBoards: IncidentCommandBoard[];
  isLoadingActive: boolean;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;

  // --- lifecycle / loading
  loadForCall: (callId: string) => Promise<void>;
  reload: () => Promise<void>;
  /** SignalR hook: called when the server reports an incidentCommandUpdated for a call. */
  handleIncidentCommandUpdated: (callId: string) => void;
  reset: () => void;

  // --- derived helpers
  hasCommand: () => boolean;
  can: (capability: IncidentCapabilities) => boolean;

  // --- command lifecycle
  establish: (commandDefinitionId?: number | null) => Promise<void>;
  closeCommand: () => Promise<void>;
  transfer: (toUserId: string, notes: string) => Promise<void>;
  updateActionPlan: (actionPlan: string) => Promise<void>;

  // --- structure (lanes)
  saveNode: (node: Partial<CommandStructureNode>) => Promise<void>;
  deleteNode: (commandStructureNodeId: string) => Promise<void>;
  reorderNode: (nodeId: string, direction: 'up' | 'down') => Promise<void>;
  moveNode: (nodeId: string, parentNodeId: string) => Promise<void>;

  // --- resources
  assignResource: (nodeId: string, resourceKind: number, resourceId: string) => Promise<void>;
  moveResource: (resourceAssignmentId: string, targetNodeId: string) => Promise<void>;
  releaseResource: (resourceAssignmentId: string) => Promise<void>;

  // --- objectives
  saveObjective: (objective: Partial<TacticalObjective>) => Promise<void>;
  completeObjective: (tacticalObjectiveId: string) => Promise<void>;

  // --- timers
  startTimer: (timer: Partial<IncidentTimer>) => Promise<void>;
  acknowledgeTimer: (incidentTimerId: string) => Promise<void>;

  // --- annotations
  saveAnnotation: (annotation: Partial<IncidentMapAnnotation>) => Promise<void>;
  deleteAnnotation: (incidentMapAnnotationId: string) => Promise<void>;

  // --- roles
  assignRole: (userId: string, roleType: number, scopeNodeId?: string) => Promise<void>;
  removeRole: (incidentRoleAssignmentId: string) => Promise<void>;

  // --- accountability
  evaluateAccountability: () => Promise<string[]>;
  accountabilityCounts: () => { green: number; warning: number; critical: number };

  // --- templates
  fetchTemplates: () => Promise<void>;

  // --- ad-hoc resources
  fetchAdHocResources: () => Promise<void>;
  createAdHocUnit: (unit: Partial<IncidentAdHocUnit>) => Promise<void>;
  releaseAdHocUnit: (incidentAdHocUnitId: string) => Promise<void>;
  createAdHocPersonnel: (person: Partial<IncidentAdHocPersonnel>) => Promise<void>;
  releaseAdHocPersonnel: (incidentAdHocPersonnelId: string) => Promise<void>;

  // --- voice channels
  fetchChannels: () => Promise<void>;
  createChannel: (name: string) => Promise<void>;
  closeChannels: () => Promise<void>;

  // --- reporting
  fetchSummary: () => Promise<void>;

  // --- department-wide active commands
  fetchActiveCommands: () => Promise<void>;
}

const initialState = {
  callId: null as string | null,
  board: null as IncidentCommandBoard | null,
  timeline: [] as CommandLogEntry[],
  capabilities: 0,
  capabilityNames: [] as string[],
  templates: [] as CommandResultData[],
  adHocUnits: [] as IncidentAdHocUnit[],
  adHocPersonnel: [] as IncidentAdHocPersonnel[],
  voiceChannels: [] as DepartmentVoiceChannel[],
  summary: null as IncidentReportSummary | null,
  activeBoards: [] as IncidentCommandBoard[],
  isLoadingActive: false,
  isLoading: false,
  isMutating: false,
  error: null as string | null,
};

export const useIncidentCommandStore = create<IncidentCommandState>((set, get) => {
  /** Run a mutation, then silently reload the board so the UI reflects server truth. */
  const mutate = async (fallback: string, fn: () => Promise<unknown>): Promise<void> => {
    set({ isMutating: true, error: null });
    try {
      await fn();
      await get().reload();
    } catch (error) {
      const message = errorMessage(error, fallback);
      logger.error({ message: `IncidentCommand: ${fallback}`, context: { error } });
      set({ error: message });
      throw error;
    } finally {
      set({ isMutating: false });
    }
  };

  /** Returns the established command or throws — guards mutations that need an active command. */
  const requireCommand = () => {
    const command = get().board?.Command;
    if (!command || !command.IncidentCommandId) {
      throw new Error('No incident command is established for this call');
    }
    return command;
  };

  return {
    ...initialState,

    loadForCall: async (callId: string) => {
      set({ callId, isLoading: true, error: null, board: null, timeline: [] });
      await get().reload();
      set({ isLoading: false });
    },

    reload: async () => {
      const callId = get().callId;
      if (!callId) return;
      try {
        const [boardResult, capabilitiesResult, timelineResult] = await Promise.all([getCommandBoard(callId), getMyCapabilities(callId), getTimeline(callId)]);
        set({
          board: boardResult?.Data ?? null,
          capabilities: capabilitiesResult?.Value ?? 0,
          capabilityNames: capabilitiesResult?.Capabilities ?? [],
          timeline: timelineResult?.Data ?? [],
        });
      } catch (error) {
        logger.error({ message: 'IncidentCommand: failed to load command board', context: { error } });
        set({ error: errorMessage(error, 'Failed to load incident command') });
      }
    },

    handleIncidentCommandUpdated: (callId: string) => {
      if (get().callId && get().callId === callId) {
        void get().reload();
      }
    },

    reset: () => set({ ...initialState }),

    hasCommand: () => {
      const command = get().board?.Command;
      return !!command && !!command.IncidentCommandId;
    },

    can: (capability: IncidentCapabilities) => hasIncidentCapability(get().capabilities, capability),

    establish: async (commandDefinitionId?: number | null) => {
      const callId = get().callId;
      if (!callId) throw new Error('No call selected');
      await mutate('Failed to establish command', () => establishCommand({ CallId: parseInt(callId, 10), CommandDefinitionId: commandDefinitionId ?? null }));
    },

    closeCommand: async () => {
      const command = requireCommand();
      await mutate('Failed to close command', () => closeCommand(command.IncidentCommandId));
    },

    transfer: async (toUserId: string, notes: string) => {
      const command = requireCommand();
      await mutate('Failed to transfer command', () => transferCommand({ IncidentCommandId: command.IncidentCommandId, ToUserId: toUserId, Notes: notes }));
    },

    updateActionPlan: async (actionPlan: string) => {
      const command = requireCommand();
      await mutate('Failed to update action plan', () => updateActionPlan({ IncidentCommandId: command.IncidentCommandId, ActionPlan: actionPlan }));
    },

    saveNode: async (node: Partial<CommandStructureNode>) => {
      const command = requireCommand();
      await mutate('Failed to save lane', () => saveNode({ ...node, IncidentCommandId: command.IncidentCommandId, CallId: command.CallId }));
    },

    deleteNode: async (commandStructureNodeId: string) => {
      await mutate('Failed to remove lane', () => deleteNode(commandStructureNodeId));
    },

    reorderNode: async (nodeId: string, direction: 'up' | 'down') => {
      const command = get().board?.Command;
      const nodes = get().board?.Nodes ?? [];
      const target = nodes.find((n) => n.CommandStructureNodeId === nodeId && !n.DeletedOn);
      if (!command || !target) return;
      const siblings = nodes.filter((n) => !n.DeletedOn && (n.ParentNodeId || '') === (target.ParentNodeId || '')).sort((a, b) => a.SortOrder - b.SortOrder);
      const index = siblings.findIndex((n) => n.CommandStructureNodeId === nodeId);
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= siblings.length) return;
      const other = siblings[swapIndex];
      await mutate('Failed to reorder lane', async () => {
        await saveNode({ ...target, SortOrder: other.SortOrder, IncidentCommandId: command.IncidentCommandId, CallId: command.CallId });
        await saveNode({ ...other, SortOrder: target.SortOrder, IncidentCommandId: command.IncidentCommandId, CallId: command.CallId });
      });
    },

    moveNode: async (nodeId: string, parentNodeId: string) => {
      const command = get().board?.Command;
      const nodes = get().board?.Nodes ?? [];
      const target = nodes.find((n) => n.CommandStructureNodeId === nodeId);
      if (!command || !target) return;

      // Reparenting a node under itself or one of its descendants would create a cycle.
      // Collect the node's subtree and reject any such parent before persisting.
      const descendantIds = new Set<string>([nodeId]);
      const stack = [nodeId];
      while (stack.length > 0) {
        const currentId = stack.pop() as string;
        for (const n of nodes) {
          if (n.DeletedOn) continue;
          if ((n.ParentNodeId || '') === currentId && !descendantIds.has(n.CommandStructureNodeId)) {
            descendantIds.add(n.CommandStructureNodeId);
            stack.push(n.CommandStructureNodeId);
          }
        }
      }
      if (descendantIds.has(parentNodeId)) return;

      await mutate('Failed to move lane', () => saveNode({ ...target, ParentNodeId: parentNodeId, IncidentCommandId: command.IncidentCommandId, CallId: command.CallId }));
    },

    assignResource: async (nodeId: string, resourceKind: number, resourceId: string) => {
      const command = requireCommand();
      await mutate('Failed to assign resource', () =>
        assignResource({
          IncidentCommandId: command.IncidentCommandId,
          CallId: command.CallId,
          CommandStructureNodeId: nodeId,
          ResourceKind: resourceKind,
          ResourceId: resourceId,
        })
      );
    },

    moveResource: async (resourceAssignmentId: string, targetNodeId: string) => {
      await mutate('Failed to move resource', () => moveResource({ ResourceAssignmentId: resourceAssignmentId, TargetNodeId: targetNodeId }));
    },

    releaseResource: async (resourceAssignmentId: string) => {
      await mutate('Failed to release resource', () => releaseResource(resourceAssignmentId));
    },

    saveObjective: async (objective: Partial<TacticalObjective>) => {
      const command = requireCommand();
      await mutate('Failed to save objective', () => saveObjective({ ...objective, IncidentCommandId: command.IncidentCommandId, CallId: command.CallId }));
    },

    completeObjective: async (tacticalObjectiveId: string) => {
      await mutate('Failed to complete objective', () => completeObjective(tacticalObjectiveId));
    },

    startTimer: async (timer: Partial<IncidentTimer>) => {
      const command = requireCommand();
      await mutate('Failed to start timer', () => startTimer({ ...timer, IncidentCommandId: command.IncidentCommandId, CallId: command.CallId }));
    },

    acknowledgeTimer: async (incidentTimerId: string) => {
      await mutate('Failed to acknowledge timer', () => acknowledgeTimer(incidentTimerId));
    },

    saveAnnotation: async (annotation: Partial<IncidentMapAnnotation>) => {
      const command = requireCommand();
      await mutate('Failed to save annotation', () => saveAnnotation({ ...annotation, IncidentCommandId: command.IncidentCommandId, CallId: command.CallId }));
    },

    deleteAnnotation: async (incidentMapAnnotationId: string) => {
      await mutate('Failed to remove annotation', () => deleteAnnotation(incidentMapAnnotationId));
    },

    assignRole: async (userId: string, roleType: number, scopeNodeId?: string) => {
      const command = requireCommand();
      await mutate('Failed to assign role', () => assignRole({ IncidentCommandId: command.IncidentCommandId, CallId: command.CallId, UserId: userId, RoleType: roleType, ScopeNodeId: scopeNodeId ?? '' }));
    },

    removeRole: async (incidentRoleAssignmentId: string) => {
      await mutate('Failed to remove role', () => removeRole(incidentRoleAssignmentId));
    },

    evaluateAccountability: async () => {
      const callId = get().callId;
      if (!callId) return [];
      set({ isMutating: true, error: null });
      try {
        const result = await evaluateAccountability(callId);
        await get().reload();
        return result?.Data ?? [];
      } catch (error) {
        logger.error({ message: 'IncidentCommand: failed to evaluate accountability', context: { error } });
        set({ error: errorMessage(error, 'Failed to evaluate accountability') });
        throw error;
      } finally {
        set({ isMutating: false });
      }
    },

    accountabilityCounts: () => {
      const accountability = get().board?.Accountability ?? [];
      const count = (status: ParStatus) => accountability.filter((p: PersonnelCallCheckInStatus) => p.Status === status).length;
      return { green: count(ParStatus.Green), warning: count(ParStatus.Warning), critical: count(ParStatus.Critical) };
    },

    fetchTemplates: async () => {
      try {
        const result = await getAllCommands();
        set({ templates: result?.Data ?? [] });
      } catch (error) {
        logger.error({ message: 'IncidentCommand: failed to fetch command templates', context: { error } });
      }
    },

    fetchAdHocResources: async () => {
      const callId = get().callId;
      if (!callId) return;
      try {
        const [units, personnel] = await Promise.all([getAdHocUnits(callId), getAdHocPersonnel(callId)]);
        set({ adHocUnits: units?.Data ?? [], adHocPersonnel: personnel?.Data ?? [] });
      } catch (error) {
        logger.error({ message: 'IncidentCommand: failed to fetch ad-hoc resources', context: { error } });
      }
    },

    createAdHocUnit: async (unit: Partial<IncidentAdHocUnit>) => {
      const callId = get().callId;
      if (!callId) throw new Error('No call selected');
      await mutate('Failed to create ad-hoc unit', async () => {
        await createAdHocUnit({ ...unit, CallId: parseInt(callId, 10) });
        await get().fetchAdHocResources();
      });
    },

    releaseAdHocUnit: async (incidentAdHocUnitId: string) => {
      await mutate('Failed to release ad-hoc unit', async () => {
        await releaseAdHocUnit(incidentAdHocUnitId);
        await get().fetchAdHocResources();
      });
    },

    createAdHocPersonnel: async (person: Partial<IncidentAdHocPersonnel>) => {
      const callId = get().callId;
      if (!callId) throw new Error('No call selected');
      await mutate('Failed to create ad-hoc personnel', async () => {
        await createAdHocPersonnel({ ...person, CallId: parseInt(callId, 10) });
        await get().fetchAdHocResources();
      });
    },

    releaseAdHocPersonnel: async (incidentAdHocPersonnelId: string) => {
      await mutate('Failed to release ad-hoc personnel', async () => {
        await releaseAdHocPersonnel(incidentAdHocPersonnelId);
        await get().fetchAdHocResources();
      });
    },

    fetchChannels: async () => {
      const callId = get().callId;
      if (!callId) return;
      try {
        const result = await getChannelsForCall(callId);
        set({ voiceChannels: result?.Data ?? [] });
      } catch (error) {
        logger.error({ message: 'IncidentCommand: failed to fetch incident channels', context: { error } });
      }
    },

    createChannel: async (name: string) => {
      const callId = get().callId;
      if (!callId) throw new Error('No call selected');
      await mutate('Failed to create incident channel', async () => {
        await createIncidentChannel({ CallId: parseInt(callId, 10), Name: name });
        await get().fetchChannels();
      });
    },

    closeChannels: async () => {
      const callId = get().callId;
      if (!callId) throw new Error('No call selected');
      await mutate('Failed to close incident channels', async () => {
        await closeIncidentChannels(callId);
        await get().fetchChannels();
      });
    },

    fetchSummary: async () => {
      const callId = get().callId;
      if (!callId) return;
      try {
        const result = await getIncidentSummary(callId);
        set({ summary: result?.Data ?? null });
      } catch (error) {
        logger.error({ message: 'IncidentCommand: failed to fetch incident summary', context: { error } });
      }
    },

    fetchActiveCommands: async () => {
      set({ isLoadingActive: true });
      try {
        const result = await getSyncBundle(true);
        set({ activeBoards: result?.Data?.Boards ?? [], isLoadingActive: false });
      } catch (error) {
        logger.error({ message: 'IncidentCommand: failed to fetch active commands', context: { error } });
        set({ activeBoards: [], isLoadingActive: false });
      }
    },
  };
});
