import axios from 'axios';

import { logger } from '@/lib/logging';
import { getBaseApiUrl } from '@/lib/storage/app';

import type { SsoConfig } from '../lib/auth/types';

export async function fetchSsoConfigForUser(username: string, departmentId?: number): Promise<SsoConfig | null> {
  try {
    const baseUrl = getBaseApiUrl();
    const params: Record<string, string | number> = { username };
    if (departmentId) {
      params.departmentId = departmentId;
    }

    const response = await axios.get(`${baseUrl}/connect/sso-config-for-user`, { params });

    logger.info({
      message: 'SSO: Fetched SSO config for user',
      context: { username, ssoEnabled: response.data?.Data?.ssoEnabled },
    });

    return response.data?.Data ?? null;
  } catch (error) {
    logger.error({
      message: 'SSO: Failed to fetch SSO config for user',
      context: { error, username },
    });
    return null;
  }
}
