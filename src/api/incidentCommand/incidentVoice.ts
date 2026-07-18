import { createApiEndpoint } from '@/api/common/client';
import { type IncidentCommandActionResult } from '@/models/v4/incidentCommand/incidentCommand';
import { type CreateIncidentChannelInput, type IncidentVoiceChannelResult, type IncidentVoiceChannelsResult } from '@/models/v4/incidentCommand/incidentVoiceChannel';

const seg = (value: string | number) => encodeURIComponent(String(value));

export const createIncidentChannel = async (input: CreateIncidentChannelInput) => {
  const response = await createApiEndpoint('/IncidentVoice/CreateIncidentChannel').post<IncidentVoiceChannelResult>({ ...input });
  return response.data;
};

export const getChannelsForCall = async (callId: string) => {
  const response = await createApiEndpoint(`/IncidentVoice/GetChannelsForCall/${seg(callId)}`).get<IncidentVoiceChannelsResult>();
  return response.data;
};

export const closeIncidentChannels = async (callId: string) => {
  const response = await createApiEndpoint(`/IncidentVoice/CloseIncidentChannels/${seg(callId)}`).post<IncidentCommandActionResult>({});
  return response.data;
};
