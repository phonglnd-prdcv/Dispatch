import { BaseV4Request } from '../baseV4Request';
import { type PersonnelCallCheckInStatus } from './accountability';
import { type CommandStructureNode } from './commandStructureNode';
import { IncidentCommand } from './incidentCommand';
import { type IncidentMapAnnotation } from './incidentMapAnnotation';
import { type IncidentRoleAssignment } from './incidentRole';
import { type IncidentTimer } from './incidentTimer';
import { type ResourceAssignment } from './resourceAssignment';
import { type TacticalObjective } from './tacticalObjective';

/** The full live command-board snapshot for a call (primary screen payload). */
export class IncidentCommandBoard {
  public Command: IncidentCommand = new IncidentCommand();
  public Nodes: CommandStructureNode[] = [];
  public Assignments: ResourceAssignment[] = [];
  public Objectives: TacticalObjective[] = [];
  public Timers: IncidentTimer[] = [];
  public Annotations: IncidentMapAnnotation[] = [];
  public Accountability: PersonnelCallCheckInStatus[] = [];
  public Roles: IncidentRoleAssignment[] = [];
}

export class IncidentCommandBoardResult extends BaseV4Request {
  public Data: IncidentCommandBoard | null = null;
}
