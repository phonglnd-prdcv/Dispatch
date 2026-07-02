import { BaseV4Request } from '../baseV4Request';

/** A single live incident-command instance established on one Call. */
export class IncidentCommand {
  public IncidentCommandId: string = '';
  public DepartmentId: number = 0;
  public CallId: number = 0;
  public SourceCommandDefinitionId: number | null = null;
  public EstablishedByUserId: string = '';
  public EstablishedOn: string = '';
  public CurrentCommanderUserId: string = '';
  public CommandPostLatitude: string = '';
  public CommandPostLongitude: string = '';
  public IncidentActionPlan: string = '';
  public IcsLevel: number = 0;
  public Status: number = 0;
  public ClosedOn: string | null = null;
  public ModifiedOn: string | null = null;
}

export class CommandTransfer {
  public CommandTransferId: string = '';
  public IncidentCommandId: string = '';
  public DepartmentId: number = 0;
  public CallId: number = 0;
  public FromUserId: string = '';
  public ToUserId: string = '';
  public TransferredOn: string = '';
  public Notes: string = '';
}

export class IncidentCommandResult extends BaseV4Request {
  public Data: IncidentCommand = new IncidentCommand();
}

export class CommandTransferResult extends BaseV4Request {
  public Data: CommandTransfer = new CommandTransfer();
}

/** Wrapper for delete/release/close style boolean operations. */
export class IncidentCommandActionResult extends BaseV4Request {
  public Data: boolean = false;
}

export interface EstablishCommandInput {
  CallId: number;
  CommandDefinitionId?: number | null;
}

export interface TransferCommandInput {
  IncidentCommandId: string;
  ToUserId: string;
  Notes: string;
}

export interface UpdateActionPlanInput {
  IncidentCommandId: string;
  ActionPlan: string;
}
