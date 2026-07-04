/**
 * Store-level integration tests for the Status Bottom Sheet open flow.
 *
 * The component tests in status-bottom-sheet.test.tsx mock useStatusBottomSheetStore wholesale,
 * so they never exercise the real select-status gating logic or the fetchDestinationData ->
 * availableStatuses wiring. These tests use the REAL store (only the dispatch API and the units
 * store that fetchDestinationData touches are mocked) so regressions in the primary open path are
 * caught even when no status is pre-selected.
 */

import { act, renderHook } from '@testing-library/react-native';

import { useStatusBottomSheetStore } from '@/stores/status/store';

jest.mock('@/api/dispatch/dispatch', () => ({
  getSetUnitStatusData: jest.fn(),
}));

jest.mock('@/stores/units/store', () => ({
  useUnitsStore: Object.assign(jest.fn(), { getState: jest.fn() }),
}));

const mockGetSetUnitStatusData = require('@/api/dispatch/dispatch').getSetUnitStatusData as jest.MockedFunction<any>;
const mockUseUnitsStore = require('@/stores/units/store').useUnitsStore as jest.MockedFunction<any> & { getState: jest.Mock };

const SERVER_STATUSES = [
  { Id: 1, Type: 1, StateId: 1, Text: 'Available', BColor: '#28a745', Color: '#fff', Gps: false, Note: 0, Detail: 1 },
  { Id: 2, Type: 2, StateId: 2, Text: 'Responding', BColor: '#ffc107', Color: '#000', Gps: true, Note: 1, Detail: 2 },
];

describe('StatusBottomSheet store open flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // No unit-scoped custom status set, so resolveUnitStatusOptions falls back to the
    // server-provided Statuses list returned by getSetUnitStatusData.
    mockUseUnitsStore.getState.mockReturnValue({
      unitStatuses: [],
      units: [],
      fetchUnits: jest.fn().mockResolvedValue(undefined),
    });

    mockGetSetUnitStatusData.mockResolvedValue({
      Data: {
        Statuses: SERVER_STATUSES,
        Calls: [],
        Stations: [],
        DestinationPois: [],
      },
    });

    useStatusBottomSheetStore.getState().reset();
  });

  it('starts on the select-status step when opened without a pre-selected status', () => {
    const { result } = renderHook(() => useStatusBottomSheetStore());

    act(() => {
      result.current.setIsOpen(true);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.currentStep).toBe('select-status');
    expect(result.current.selectedStatus).toBeNull();
    expect(result.current.cameFromStatusSelection).toBe(true);
  });

  it('populates availableStatuses on open even when no status is pre-selected', async () => {
    const { result } = renderHook(() => useStatusBottomSheetStore());

    // Open with no status -> select-status step (mirrors the component's open path).
    act(() => {
      result.current.setIsOpen(true);
    });
    expect(result.current.availableStatuses).toHaveLength(0);

    // The component fetches destination data on open; drive the same store call.
    await act(async () => {
      await result.current.fetchDestinationData('unit1');
    });

    expect(mockGetSetUnitStatusData).toHaveBeenCalledWith('unit1');
    expect(result.current.availableStatuses).toHaveLength(SERVER_STATUSES.length);
    expect(result.current.availableStatuses.map((s: any) => s.Text)).toEqual(['Available', 'Responding']);
    // Gating logic is unaffected by the fetch — still on select-status with no pre-selection.
    expect(result.current.currentStep).toBe('select-status');
    expect(result.current.selectedStatus).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
