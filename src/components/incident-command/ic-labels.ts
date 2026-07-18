// Display helpers for Incident Command enums. ICS position / structure names are standardized
// domain terminology, so they are kept here as constants rather than i18n keys (chrome around them
// — section titles, buttons — is translated normally).

import {
  CommandLogEntryType,
  CommandNodeType,
  IncidentRoleType,
  IncidentTimerStatus,
  IncidentTimerType,
  ParStatus,
  ResourceAssignmentKind,
  TacticalObjectiveStatus,
  TacticalObjectiveType,
} from '@/models/v4/incidentCommand/incidentCommandEnums';

export const nodeTypeLabel = (value: number): string =>
  ({
    [CommandNodeType.Division]: 'Division',
    [CommandNodeType.Group]: 'Group',
    [CommandNodeType.Branch]: 'Branch',
    [CommandNodeType.Sector]: 'Sector',
    [CommandNodeType.StrikeTeam]: 'Strike Team',
    [CommandNodeType.TaskForce]: 'Task Force',
    [CommandNodeType.Staging]: 'Staging',
    [CommandNodeType.UnifiedCommand]: 'Unified Command',
  })[value] ?? 'Lane';

export const NODE_TYPE_OPTIONS = [
  CommandNodeType.Division,
  CommandNodeType.Group,
  CommandNodeType.Branch,
  CommandNodeType.Sector,
  CommandNodeType.StrikeTeam,
  CommandNodeType.TaskForce,
  CommandNodeType.Staging,
  CommandNodeType.UnifiedCommand,
].map((value) => ({ value, label: nodeTypeLabel(value) }));

const ROLE_LABELS: Record<number, string> = {
  [IncidentRoleType.IncidentCommander]: 'Incident Commander',
  [IncidentRoleType.DeputyIncidentCommander]: 'Deputy Incident Commander',
  [IncidentRoleType.UnifiedCommandMember]: 'Unified Command Member',
  [IncidentRoleType.OperationsSectionChief]: 'Operations Section Chief',
  [IncidentRoleType.PlanningSectionChief]: 'Planning Section Chief',
  [IncidentRoleType.LogisticsSectionChief]: 'Logistics Section Chief',
  [IncidentRoleType.FinanceAdminSectionChief]: 'Finance/Admin Section Chief',
  [IncidentRoleType.SafetyOfficer]: 'Safety Officer',
  [IncidentRoleType.LiaisonOfficer]: 'Liaison Officer',
  [IncidentRoleType.PublicInformationOfficer]: 'Public Information Officer',
  [IncidentRoleType.StagingAreaManager]: 'Staging Area Manager',
  [IncidentRoleType.ResourcesUnitLeader]: 'Resources Unit Leader',
  [IncidentRoleType.SituationUnitLeader]: 'Situation Unit Leader',
  [IncidentRoleType.DocumentationUnitLeader]: 'Documentation Unit Leader',
  [IncidentRoleType.CommunicationsUnitLeader]: 'Communications Unit Leader',
  [IncidentRoleType.DivisionGroupSupervisor]: 'Division/Group Supervisor',
  [IncidentRoleType.BranchDirector]: 'Branch Director',
  [IncidentRoleType.StrikeTeamTaskForceLeader]: 'Strike Team/Task Force Leader',
  [IncidentRoleType.MedicalUnitLeader]: 'Medical Unit Leader',
  [IncidentRoleType.RehabOfficer]: 'Rehab Officer',
  [IncidentRoleType.MedicalBranchDirector]: 'Medical Branch Director',
  [IncidentRoleType.TriageOfficer]: 'Triage Officer',
  [IncidentRoleType.TreatmentOfficer]: 'Treatment Officer',
  [IncidentRoleType.TransportOfficer]: 'Transport Officer',
  [IncidentRoleType.HazMatGroupSupervisor]: 'HazMat Group Supervisor',
  [IncidentRoleType.DeconOfficer]: 'Decon Officer',
  [IncidentRoleType.EntryTeamLeader]: 'Entry Team Leader',
  [IncidentRoleType.SearchGroupSupervisor]: 'Search Group Supervisor',
  [IncidentRoleType.AirOperationsBranchDirector]: 'Air Operations Branch Director',
  [IncidentRoleType.ShelterMassCareCoordinator]: 'Shelter/Mass Care Coordinator',
  [IncidentRoleType.DamageAssessmentLead]: 'Damage Assessment Lead',
};

export const roleTypeLabel = (value: number): string => ROLE_LABELS[value] ?? 'Role';

export const ROLE_TYPE_OPTIONS = Object.keys(ROLE_LABELS)
  .map((key) => Number(key))
  .map((value) => ({ value, label: ROLE_LABELS[value] }));

export const timerTypeLabel = (value: number): string =>
  ({
    [IncidentTimerType.Scene]: 'Scene',
    [IncidentTimerType.Benchmark]: 'Benchmark',
    [IncidentTimerType.Role]: 'Role',
    [IncidentTimerType.Custom]: 'Custom',
  })[value] ?? 'Timer';

export const timerStatusLabel = (value: number): string =>
  ({
    [IncidentTimerStatus.Running]: 'Running',
    [IncidentTimerStatus.Due]: 'Due',
    [IncidentTimerStatus.Acknowledged]: 'Acknowledged',
    [IncidentTimerStatus.Stopped]: 'Stopped',
  })[value] ?? '';

export const objectiveTypeLabel = (value: number): string =>
  ({
    [TacticalObjectiveType.General]: 'General',
    [TacticalObjectiveType.Benchmark]: 'Benchmark',
    [TacticalObjectiveType.Safety]: 'Safety',
  })[value] ?? 'Objective';

export const OBJECTIVE_TYPE_OPTIONS = [TacticalObjectiveType.General, TacticalObjectiveType.Benchmark, TacticalObjectiveType.Safety].map((value) => ({ value, label: objectiveTypeLabel(value) }));

export const isObjectiveComplete = (status: number): boolean => status === TacticalObjectiveStatus.Complete;

export const resourceKindLabel = (value: number): string =>
  ({
    [ResourceAssignmentKind.RealUnit]: 'Unit',
    [ResourceAssignmentKind.RealPersonnel]: 'Personnel',
    [ResourceAssignmentKind.LinkedDeptUnit]: 'Mutual-Aid Unit',
    [ResourceAssignmentKind.LinkedDeptPersonnel]: 'Mutual-Aid Personnel',
    [ResourceAssignmentKind.AdHocUnit]: 'Ad-Hoc Unit',
    [ResourceAssignmentKind.AdHocPersonnel]: 'Ad-Hoc Personnel',
  })[value] ?? 'Resource';

/** Tailwind text colour class for a PAR status string ("Green" | "Warning" | "Critical"). */
export const accountabilityColorClass = (status: string): string => {
  switch (status) {
    case ParStatus.Critical:
      return 'text-red-600 dark:text-red-400';
    case ParStatus.Warning:
      return 'text-amber-600 dark:text-amber-400';
    default:
      return 'text-green-600 dark:text-green-400';
  }
};

export const logEntryTypeLabel = (value: number): string =>
  ({
    [CommandLogEntryType.CommandEstablished]: 'Command Established',
    [CommandLogEntryType.CommandTransferred]: 'Command Transferred',
    [CommandLogEntryType.NodeAdded]: 'Lane Added',
    [CommandLogEntryType.NodeUpdated]: 'Lane Updated',
    [CommandLogEntryType.NodeRemoved]: 'Lane Removed',
    [CommandLogEntryType.ResourceAssigned]: 'Resource Assigned',
    [CommandLogEntryType.ResourceMoved]: 'Resource Moved',
    [CommandLogEntryType.ResourceReleased]: 'Resource Released',
    [CommandLogEntryType.ObjectiveAdded]: 'Objective Added',
    [CommandLogEntryType.ObjectiveCompleted]: 'Objective Completed',
    [CommandLogEntryType.TimerStarted]: 'Timer Started',
    [CommandLogEntryType.TimerAcknowledged]: 'Timer Acknowledged',
    [CommandLogEntryType.AnnotationAdded]: 'Annotation Added',
    [CommandLogEntryType.AnnotationRemoved]: 'Annotation Removed',
    [CommandLogEntryType.CheckIn]: 'Check-In',
    [CommandLogEntryType.ChannelOpened]: 'Channel Opened',
    [CommandLogEntryType.ChannelClosed]: 'Channel Closed',
    [CommandLogEntryType.RoleAssigned]: 'Role Assigned',
    [CommandLogEntryType.RoleRemoved]: 'Role Removed',
    [CommandLogEntryType.AdHocResourceCreated]: 'Ad-Hoc Resource Created',
    [CommandLogEntryType.Note]: 'Note',
    [CommandLogEntryType.CommandClosed]: 'Command Closed',
    [CommandLogEntryType.ParCritical]: 'PAR Critical',
  })[value] ?? 'Event';
