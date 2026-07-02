import { create } from 'zustand';

/**
 * Dispatch-dashboard resource-view preferences.
 *
 * These flags let a dispatcher tune the Units/Personnel panels for situational awareness:
 * - `availableOnly` shows only resources whose current status is Available.
 * - `singleList` merges units and personnel into one combined list (see ResourcesPanel) instead of
 *   the separate Units and Personnel panels.
 *
 * The resource panels read these directly so no prop-drilling is needed across the responsive layouts.
 */
interface DashboardViewState {
  availableOnly: boolean;
  singleList: boolean;
  toggleAvailableOnly: () => void;
  toggleSingleList: () => void;
  setAvailableOnly: (value: boolean) => void;
  setSingleList: (value: boolean) => void;
}

export const useDashboardViewStore = create<DashboardViewState>((set) => ({
  availableOnly: false,
  singleList: false,
  toggleAvailableOnly: () => set((state) => ({ availableOnly: !state.availableOnly })),
  toggleSingleList: () => set((state) => ({ singleList: !state.singleList })),
  setAvailableOnly: (value) => set({ availableOnly: value }),
  setSingleList: (value) => set({ singleList: value }),
}));
