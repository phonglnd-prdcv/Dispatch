import { BaseV4Request } from '../baseV4Request';

import { PoiTypeResultData } from './poiTypeResultData';

export class PoiTypesResult extends BaseV4Request {
  public Data: PoiTypeResultData[] = [];
}
