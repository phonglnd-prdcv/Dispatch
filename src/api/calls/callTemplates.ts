import { type CallQuickTemplatesResult } from '@/models/v4/templates/callQuickTemplatesResult';

import { createCachedApiEndpoint } from '../common/cached-client';

const getAllCallQuickTemplatesApi = createCachedApiEndpoint('/Templates/GetAllCallQuickTemplates', {
  ttl: 60 * 1000 * 60, // Cache for 1 hour
  enabled: true,
});

export const getAllCallQuickTemplates = async () => {
  const response = await getAllCallQuickTemplatesApi.get<CallQuickTemplatesResult>();
  return response.data;
};
