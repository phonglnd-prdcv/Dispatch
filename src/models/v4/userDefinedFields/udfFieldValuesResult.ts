import { type UdfFieldValueResultData } from './udfFieldValueResultData';

export class UdfFieldValuesResult {
  public Id: string = '';
  public PageSize: number = 0;
  public Status: number = 0;
  public Data: UdfFieldValueResultData[] = [];
}
