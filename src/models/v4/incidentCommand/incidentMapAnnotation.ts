import { BaseV4Request } from '../baseV4Request';

/** Real-time tactical-map markup stored as a GeoJSON feature. */
export class IncidentMapAnnotation {
  public IncidentMapAnnotationId: string = '';
  public IncidentCommandId: string = '';
  public DepartmentId: number = 0;
  public CallId: number = 0;
  public AnnotationType: number = 0;
  public GeoJson: string = '';
  public IcsSymbolCode: string = '';
  public Label: string = '';
  public CreatedByUserId: string = '';
  public CreatedOn: string = '';
  public DeletedOn: string | null = null;
  public ModifiedOn: string | null = null;
}

export class IncidentMapAnnotationResult extends BaseV4Request {
  public Data: IncidentMapAnnotation = new IncidentMapAnnotation();
}
