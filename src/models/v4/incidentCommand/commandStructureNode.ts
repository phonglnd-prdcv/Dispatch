import { BaseV4Request } from '../baseV4Request';

/** One lane / span-of-control box on the command board's org chart. */
export class CommandStructureNode {
  public CommandStructureNodeId: string = '';
  public IncidentCommandId: string = '';
  public DepartmentId: number = 0;
  public CallId: number = 0;
  public NodeType: number = 0;
  public Name: string = '';
  /** Null = top-level lane; otherwise the parent lane in the org chart. */
  public ParentNodeId: string = '';
  public SupervisorUserId: string = '';
  public SupervisorUnitId: number | null = null;
  public SortOrder: number = 0;
  public SourceRoleId: number | null = null;
  public DeletedOn: string | null = null;
  public ModifiedOn: string | null = null;
}

export class CommandNodeResult extends BaseV4Request {
  public Data: CommandStructureNode = new CommandStructureNode();
}
