import { BaseV4Request } from '../baseV4Request';

/** Assigns a Resgrid user to a functional incident-command role for a specific incident (Call). */
export class IncidentRoleAssignment {
  public IncidentRoleAssignmentId: string = '';
  public IncidentCommandId: string = '';
  public DepartmentId: number = 0;
  public CallId: number = 0;
  public UserId: string = '';
  /** Maps to IncidentRoleType. */
  public RoleType: number = 0;
  /** Optional command structure node this role is scoped to (e.g. a Division/Group supervisor). */
  public ScopeNodeId: string = '';
  public AssignedByUserId: string = '';
  public AssignedOn: string = '';
  public RemovedOn: string | null = null;
  public ModifiedOn: string | null = null;
}

export class IncidentRoleResult extends BaseV4Request {
  public Data: IncidentRoleAssignment = new IncidentRoleAssignment();
}

export class IncidentRolesResult extends BaseV4Request {
  public Data: IncidentRoleAssignment[] = [];
}

/**
 * The caller's effective capabilities for an incident. NOTE: unlike the other results this wrapper
 * does NOT use a `Data` property — it exposes `Value` (raw flags) and `Capabilities` (granted names).
 */
export class IncidentCapabilitiesResult extends BaseV4Request {
  public Value: number = 0;
  public Capabilities: string[] = [];
}
