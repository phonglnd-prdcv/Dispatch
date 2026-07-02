import { BaseV4Request } from '../baseV4Request';
import { type CallPersonnelCheckInStatusResultData } from './callPersonnelCheckInStatusResultData';

export class CallPersonnelCheckInStatusResult extends BaseV4Request {
  public Data: CallPersonnelCheckInStatusResultData[] = [];
}
