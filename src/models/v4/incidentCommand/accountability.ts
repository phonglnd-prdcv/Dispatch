import { BaseV4Request } from '../baseV4Request';

/** Per-person accountability (PAR) status row for an incident. */
export class PersonnelCallCheckInStatus {
  public UserId: string = '';
  public FullName: string = '';
  public LastCheckIn: string | null = null;
  public NeedsCheckIn: boolean = false;
  /** Negative = overdue. */
  public MinutesRemaining: number = 0;
  /** "Green" | "Warning" | "Critical". */
  public Status: string = '';
  public DurationMinutes: number = 0;
  public WarningThresholdMinutes: number = 0;
}

export class CommandAccountabilityResult extends BaseV4Request {
  public Data: PersonnelCallCheckInStatus[] = [];
}

/** Data is the list of user ids newly flagged Critical by the PAR sweep. */
export class EvaluateAccountabilityResult extends BaseV4Request {
  public Data: string[] = [];
}
