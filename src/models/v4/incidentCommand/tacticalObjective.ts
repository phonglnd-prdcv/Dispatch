import { BaseV4Request } from '../baseV4Request';

/** A tactical objective / benchmark tracked for an incident. */
export class TacticalObjective {
  public TacticalObjectiveId: string = '';
  public IncidentCommandId: string = '';
  public DepartmentId: number = 0;
  public CallId: number = 0;
  public Name: string = '';
  public ObjectiveType: number = 0;
  public Status: number = 0;
  public AutoPopulated: boolean = false;
  public CompletedByUserId: string = '';
  public CompletedOn: string | null = null;
  public SortOrder: number = 0;
  public ModifiedOn: string | null = null;
}

export class TacticalObjectiveResult extends BaseV4Request {
  public Data: TacticalObjective = new TacticalObjective();
}
