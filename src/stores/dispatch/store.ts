import { create } from 'zustand';

import { getAllGroups } from '@/api/groups/groups';
import { getAllPersonnelInfos } from '@/api/personnel/personnel';
import { getUnits } from '@/api/units/units';

export interface DispatchSelection {
  everyone: boolean;
  users: string[];
  groups: string[];
  roles: string[];
  units: string[];
}

export interface DispatchItem {
  Id: string;
  Name: string;
}

export interface DispatchData {
  users: DispatchItem[];
  groups: DispatchItem[];
  roles: DispatchItem[];
  units: DispatchItem[];
}

interface DispatchState {
  data: DispatchData;
  selection: DispatchSelection;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  fetchDispatchData: () => Promise<void>;
  setSelection: (selection: DispatchSelection) => void;
  toggleEveryone: () => void;
  toggleUser: (userId: string) => void;
  toggleGroup: (groupId: string) => void;
  toggleRole: (roleId: string) => void;
  toggleUnit: (unitId: string) => void;
  setSearchQuery: (query: string) => void;
  clearSelection: () => void;
  getFilteredData: () => DispatchData;
}

const initialSelection: DispatchSelection = {
  everyone: false,
  users: [],
  groups: [],
  roles: [],
  units: [],
};

export const useDispatchStore = create<DispatchState>((set, get) => ({
  data: {
    users: [],
    groups: [],
    roles: [],
    units: [],
  },
  selection: initialSelection,
  isLoading: false,
  error: null,
  searchQuery: '',

  fetchDispatchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [personnelResult, groupsResult, unitsResult] = await Promise.all([getAllPersonnelInfos(''), getAllGroups(), getUnits()]);

      const users: DispatchItem[] = (personnelResult?.Data ?? []).map((p) => ({
        Id: p.UserId,
        Name: `${p.FirstName} ${p.LastName}`.trim(),
      }));

      const groups: DispatchItem[] = (groupsResult?.Data ?? []).map((g) => ({
        Id: g.GroupId,
        Name: g.Name,
      }));

      const units: DispatchItem[] = (unitsResult?.Data ?? []).map((u) => ({
        Id: u.UnitId,
        Name: u.Name,
      }));

      // Extract unique roles from personnel data
      const roleSet = new Map<string, string>();
      (personnelResult?.Data ?? []).forEach((p) => {
        if (p.Roles) {
          p.Roles.forEach((role) => {
            if (role && !roleSet.has(role)) {
              roleSet.set(role, role);
            }
          });
        }
      });
      const roles: DispatchItem[] = Array.from(roleSet.entries()).map(([name]) => ({
        Id: name,
        Name: name,
      }));

      set({
        data: { users, groups, roles, units },
        isLoading: false,
      });
    } catch (error) {
      console.error('fetchDispatchData failed:', error);
      set({
        error: 'Failed to fetch dispatch data',
        isLoading: false,
      });
    }
  },

  setSelection: (selection: DispatchSelection) => {
    set({ selection });
  },

  toggleEveryone: () => {
    const { selection } = get();
    if (selection.everyone) {
      set({
        selection: {
          ...selection,
          everyone: false,
        },
      });
    } else {
      set({
        selection: {
          everyone: true,
          users: [],
          groups: [],
          roles: [],
          units: [],
        },
      });
    }
  },

  toggleUser: (userId: string) => {
    const { selection } = get();
    const isSelected = selection.users.includes(userId);

    set({
      selection: {
        ...selection,
        everyone: false,
        users: isSelected ? selection.users.filter((id) => id !== userId) : [...selection.users, userId],
      },
    });
  },

  toggleGroup: (groupId: string) => {
    const { selection } = get();
    const isSelected = selection.groups.includes(groupId);

    set({
      selection: {
        ...selection,
        everyone: false,
        groups: isSelected ? selection.groups.filter((id) => id !== groupId) : [...selection.groups, groupId],
      },
    });
  },

  toggleRole: (roleId: string) => {
    const { selection } = get();
    const isSelected = selection.roles.includes(roleId);

    set({
      selection: {
        ...selection,
        everyone: false,
        roles: isSelected ? selection.roles.filter((id) => id !== roleId) : [...selection.roles, roleId],
      },
    });
  },

  toggleUnit: (unitId: string) => {
    const { selection } = get();
    const isSelected = selection.units.includes(unitId);

    set({
      selection: {
        ...selection,
        everyone: false,
        units: isSelected ? selection.units.filter((id) => id !== unitId) : [...selection.units, unitId],
      },
    });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  clearSelection: () => {
    set({ selection: initialSelection });
  },

  getFilteredData: () => {
    const { data, searchQuery } = get();
    if (!searchQuery.trim()) {
      return data;
    }

    const query = searchQuery.toLowerCase();
    return {
      users: data.users.filter((user) => user.Name.toLowerCase().includes(query)),
      groups: data.groups.filter((group) => group.Name.toLowerCase().includes(query)),
      roles: data.roles.filter((role) => role.Name.toLowerCase().includes(query)),
      units: data.units.filter((unit) => unit.Name.toLowerCase().includes(query)),
    };
  },
}));
