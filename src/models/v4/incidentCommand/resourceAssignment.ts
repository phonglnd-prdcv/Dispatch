import { BaseV4Request } from '../baseV4Request';

/** Attaches a resource (unit / person / ad-hoc) to a command structure node. */
export class ResourceAssignment {
  public ResourceAssignmentId: string = '';
  public IncidentCommandId: string = '';
  public DepartmentId: number = 0;
  public CallId: number = 0;
  public CommandStructureNodeId: string = '';
  /** Maps to ResourceAssignmentKind. */
  public ResourceKind: number = 0;
  /** Polymorphic — unit id / user id / ad-hoc guid as a string. */
  public ResourceId: string = '';
  public AssignedByUserId: string = '';
  public AssignedOn: string = '';
  public ReleasedOn: string | null = null;
  public ModifiedOn: string | null = null;
}

/** Read-side picker DTO listing candidate own + mutual-aid resources. */
export class AssignableResource {
  public ResourceKind: number = 0;
  public ResourceId: string = '';
  public Name: string = '';
  public DepartmentId: number = 0;
  public IsMutualAid: boolean = false;
  public Color: string = '';
}

export class ResourceAssignmentResult extends BaseV4Request {
  public Data: ResourceAssignment = new ResourceAssignment();
}

export class MutualAidResourcesResult extends BaseV4Request {
  public Data: AssignableResource[] = [];
}

export interface MoveResourceInput {
  ResourceAssignmentId: string;
  TargetNodeId: string;
}
