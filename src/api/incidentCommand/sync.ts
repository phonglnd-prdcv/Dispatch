import { createApiEndpoint } from '@/api/common/client';
import { type SyncBundleResult } from '@/models/v4/incidentCommand/incidentCommandBundle';

/**
 * Shift-start aggregate: render-ready board (incl. computed PAR) per active incident + ad-hoc
 * resources + a delta-sync cursor. Used to list all active incident commands.
 */
export const getSyncBundle = async (includeAccountability = true) => {
  const response = await createApiEndpoint('/Sync/Bundle').get<SyncBundleResult>({ includeAccountability });
  return response.data;
};
