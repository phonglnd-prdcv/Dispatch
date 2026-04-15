export class CheckInTimerStatusResultData {
  public TargetType: number = 0;
  public TargetTypeName: string = '';
  public TargetEntityId: string = '';
  public TargetName: string = '';
  public UnitId: number = 0;
  public LastCheckIn: string = '';
  public DurationMinutes: number = 0;
  public WarningThresholdMinutes: number = 0;
  public ElapsedMinutes: number = 0;
  public Status: string = '';
  /** Injected client-side when aggregating across calls */
  public CallId: number = 0;
}
