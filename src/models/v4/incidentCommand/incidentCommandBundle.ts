import { BaseV4Request } from '../baseV4Request';
import { type IncidentAdHocPersonnel, type IncidentAdHocUnit } from './incidentAdHocResources';
import { type IncidentCommandBoard } from './incidentCommandBoard';

/**
 * Shift-start aggregate returned by Sync/Bundle: one fully-rendered board per active incident
 * (including computed accountability/PAR), plus ad-hoc resources and the delta-sync cursor.
 */
export class IncidentCommandBundle {
  public ServerTimestampMs: number = 0;
  public Boards: IncidentCommandBoard[] = [];
  public AdHocUnits: IncidentAdHocUnit[] = [];
  public AdHocPersonnel: IncidentAdHocPersonnel[] = [];
}

export class SyncBundleResult extends BaseV4Request {
  public Data: IncidentCommandBundle = new IncidentCommandBundle();
}
