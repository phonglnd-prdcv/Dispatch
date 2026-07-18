import { BaseV4Request } from '../baseV4Request';

/** An ad-hoc unit created on-scene for a non-Resgrid resource (e.g. mutual-aid apparatus). */
export class IncidentAdHocUnit {
  public IncidentAdHocUnitId: string = '';
  public DepartmentId: number = 0;
  public CallId: number = 0;
  public Name: string = '';
  public UnitTypeId: number | null = null;
  public Type: string = '';
  public ExternalAgencyName: string = '';
  public CreatedByUserId: string = '';
  public CreatedOn: string = '';
  public ReleasedOn: string | null = null;
  public ModifiedOn: string | null = null;
}

/** An ad-hoc person created on-scene for accountability of a non-Resgrid responder. */
export class IncidentAdHocPersonnel {
  public IncidentAdHocPersonnelId: string = '';
  public DepartmentId: number = 0;
  public CallId: number = 0;
  public Name: string = '';
  public Role: string = '';
  public ExternalAgencyName: string = '';
  public Contact: string = '';
  /** Maps to ResourceAssignmentKind — the unit this person is riding on, if any. */
  public RidingResourceKind: number = 0;
  public RidingResourceId: string = '';
  public CreatedByUserId: string = '';
  public CreatedOn: string = '';
  public ReleasedOn: string | null = null;
  public ModifiedOn: string | null = null;
}

export class AdHocUnitResult extends BaseV4Request {
  public Data: IncidentAdHocUnit = new IncidentAdHocUnit();
}

export class AdHocUnitsResult extends BaseV4Request {
  public Data: IncidentAdHocUnit[] = [];
}

export class AdHocPersonnelResult extends BaseV4Request {
  public Data: IncidentAdHocPersonnel = new IncidentAdHocPersonnel();
}

export class AdHocPersonnelListResult extends BaseV4Request {
  public Data: IncidentAdHocPersonnel[] = [];
}

export interface AssignPersonnelToUnitInput {
  IncidentAdHocPersonnelId: string;
  RidingResourceKind: number;
  RidingResourceId: string;
}

export interface FormUnitInput {
  CallId: number;
  Name: string;
  Type: string;
  UnitTypeId?: number | null;
  ExternalAgencyName: string;
  AdHocPersonnelIds: string[];
}
