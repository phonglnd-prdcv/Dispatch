import { BaseV4Request } from '../baseV4Request';
import { CheckInTimerStatusResultData } from './checkInTimerStatusResultData';

export class CheckInTimerStatusResult extends BaseV4Request {
  public Data: CheckInTimerStatusResultData[] = [];
}
