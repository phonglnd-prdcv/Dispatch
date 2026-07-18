import { BaseV4Request } from '../baseV4Request';

/** A scene / benchmark / role timer for an incident. */
export class IncidentTimer {
  public IncidentTimerId: string = '';
  public IncidentCommandId: string = '';
  public DepartmentId: number = 0;
  public CallId: number = 0;
  public TimerType: number = 0;
  public ScopeType: number = 0;
  public ScopeId: string = '';
  public Name: string = '';
  public IntervalSeconds: number = 0;
  public StartedOn: string = '';
  public NextDueOn: string | null = null;
  public Status: number = 0;
  public AcknowledgedOn: string | null = null;
  public ModifiedOn: string | null = null;
}

export class IncidentTimerResult extends BaseV4Request {
  public Data: IncidentTimer = new IncidentTimer();
}
