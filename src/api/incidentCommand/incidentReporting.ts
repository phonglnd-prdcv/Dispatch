import { createApiEndpoint } from '@/api/common/client';
import { type IncidentAfterActionReportResult, type IncidentReportSummaryResult } from '@/models/v4/incidentCommand/incidentReport';

const seg = (value: string | number) => encodeURIComponent(String(value));

export const getIncidentSummary = async (callId: string) => {
  const response = await createApiEndpoint(`/IncidentReporting/GetIncidentSummary/${seg(callId)}`).get<IncidentReportSummaryResult>();
  return response.data;
};

export const getAfterActionReport = async (callId: string) => {
  const response = await createApiEndpoint(`/IncidentReporting/GetAfterActionReport/${seg(callId)}`).get<IncidentAfterActionReportResult>();
  return response.data;
};
