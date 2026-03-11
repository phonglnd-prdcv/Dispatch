import { type UdfDefinitionResultData } from './udfDefinitionResultData';

export class UdfDefinitionResult {
  public Id: string = '';
  public PageSize: number = 0;
  public Status: number = 0;
  public Data: UdfDefinitionResultData | null = null;
}
