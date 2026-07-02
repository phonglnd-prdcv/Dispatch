import { BaseV4Request } from '../baseV4Request';

/** A department voice channel; when CallId is set it is an on-demand incident channel. */
export class DepartmentVoiceChannel {
  public DepartmentVoiceChannelId: string = '';
  public DepartmentVoiceId: string = '';
  public DepartmentId: number = 0;
  public Name: string = '';
  public SystemConferenceId: string = '';
  public SystemCallflowId: string = '';
  public ConferenceNumber: number = 0;
  public IsDefault: boolean = false;
  public CallId: number | null = null;
  public IsOnDemand: boolean = false;
  public ClosedOn: string | null = null;
}

export class IncidentVoiceChannelResult extends BaseV4Request {
  public Data: DepartmentVoiceChannel = new DepartmentVoiceChannel();
}

export class IncidentVoiceChannelsResult extends BaseV4Request {
  public Data: DepartmentVoiceChannel[] = [];
}

export interface CreateIncidentChannelInput {
  CallId: number;
  Name: string;
}
