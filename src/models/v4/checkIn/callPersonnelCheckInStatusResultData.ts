/** Per-personnel accountability (PAR) status for a call's check-in timers. */
export class CallPersonnelCheckInStatusResultData {
  public UserId: string = '';
  public FullName: string = '';
  public LastCheckIn: string | null = null;
  public NeedsCheckIn: boolean = false;
  /** Positive = time still available; negative = number of minutes overdue. */
  public MinutesRemaining: number = 0;
  /** "Green" | "Warning" | "Critical". */
  public Status: string = '';
}
