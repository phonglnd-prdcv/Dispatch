import axios from 'axios';

import { logger } from '@/lib/logging';
import { getBaseApiUrl } from '@/lib/storage/app';

import type { SsoConfig } from '../lib/auth/types';

export async function fetchSsoConfigForUser(username: string, departmentId?: number): Promise<SsoConfig | null> {
  const requestId = `sso-${Date.now().toString(36)}`;
  try {
    const baseUrl = getBaseApiUrl();
    const params: Record<string, string | number> = { username };
    if (departmentId) {
      params.departmentId = departmentId;
    }

    const response = await axios.get(`${baseUrl}/connect/sso-config-for-user`, { params });

    logger.info({
      message: 'SSO: Fetched SSO config for user',
      context: { requestId, ssoEnabled: response.data?.Data?.ssoEnabled ?? false, outcome: 'success' },
    });

    return response.data?.Data ?? null;
  } catch (error) {
    logger.error({
      message: 'SSO: Failed to fetch SSO config for user',
      context: { requestId, outcome: 'failure', error },
    });
    throw error instanceof Error ? error : new Error('Failed to fetch SSO config');
  }
}
