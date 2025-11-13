import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getCurrentUsersRights } from '@/api/security/security';
import { logger } from '@/lib/logging';
import { type DepartmentRightsResultData } from '@/models/v4/security/departmentRightsResultData';

import { zustandStorage } from '../../lib/storage';

export interface SecurityState {
  error: string | null;
  getRights: () => Promise<void>;
  rights: DepartmentRightsResultData | null;
}

export const securityStore = create<SecurityState>()(
  persist(
    (set, _get) => ({
      error: null,
      rights: null,
      getRights: async () => {
        // Skip API calls on web platform - network requests are blocked
        if (Platform.OS === 'web') {
          logger.info({
            message: 'Security store getRights: Skipping API call on web platform',
            context: { hasPersistedRights: !!_get().rights },
          });
          return;
        }

        try {
          const response = await getCurrentUsersRights();

          set({
            rights: response.Data,
          });
        } catch (error) {
          logger.error({
            message: 'Failed to get user rights',
            context: { error },
          });
          // If refresh fails, log the error but don't throw
        }
      },
    }),
    {
      name: 'security-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

export const useSecurityStore = () => {
  const store = securityStore();
  return {
    getRights: store.getRights,
    isUserDepartmentAdmin: store.rights?.IsAdmin,
    isUserGroupAdmin: (groupId: number) => store.rights?.Groups?.some((right) => right.GroupId === groupId && right.IsGroupAdmin) ?? false,
    canUserCreateCalls: store.rights?.CanCreateCalls,
    canUserCreateNotes: store.rights?.CanAddNote,
    canUserCreateMessages: store.rights?.CanCreateMessage,
    canUserViewPII: store.rights?.CanViewPII,
    departmentCode: store.rights?.DepartmentCode,
  };
};
