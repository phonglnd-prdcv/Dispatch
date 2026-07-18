import { BaseV4Request } from '../baseV4Request';

/** One row of the append-only command (ICS-201) timeline. */
export class CommandLogEntry {
  public CommandLogEntryId: string = '';
  public IncidentCommandId: string = '';
  public DepartmentId: number = 0;
  public CallId: number = 0;
  public EntryType: number = 0;
  public Description: string = '';
  public UserId: string = '';
  public Latitude: string = '';
  public Longitude: string = '';
  public OccurredOn: string = '';
}

export class CommandTimelineResult extends BaseV4Request {
  public Data: CommandLogEntry[] = [];
}
