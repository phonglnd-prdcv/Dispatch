jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((specifics: any) => specifics.ios || specifics.default),
    Version: 17,
  },
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn(),
  })),
  useMMKVBoolean: jest.fn(() => [false, jest.fn()]),
}));

jest.mock('@/lib/logging', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { assignResource, establishCommand, getCommandBoard, getTimeline } from '@/api/incidentCommand/incidentCommand';
import { getMyCapabilities } from '@/api/incidentCommand/incidentRoles';
import { IncidentCapabilities } from '@/models/v4/incidentCommand/incidentCommandEnums';

import { useIncidentCommandStore } from '../store';

jest.mock('@/api/incidentCommand/incidentCommand');
jest.mock('@/api/incidentCommand/incidentRoles');
jest.mock('@/api/incidentCommand/incidentResources');
jest.mock('@/api/incidentCommand/incidentReporting');
jest.mock('@/api/incidentCommand/incidentVoice');
jest.mock('@/api/incidentCommand/commands');

const mockGetCommandBoard = getCommandBoard as jest.MockedFunction<typeof getCommandBoard>;
const mockGetMyCapabilities = getMyCapabilities as jest.MockedFunction<typeof getMyCapabilities>;
const mockGetTimeline = getTimeline as jest.MockedFunction<typeof getTimeline>;
const mockEstablishCommand = establishCommand as jest.MockedFunction<typeof establishCommand>;
const mockAssignResource = assignResource as jest.MockedFunction<typeof assignResource>;

const buildBoard = (overrides: Record<string, unknown> = {}) =>
  ({
    Command: { IncidentCommandId: 'ic1', CallId: 42, CurrentCommanderUserId: 'u1', Status: 0, IncidentActionPlan: '', EstablishedOn: '2026-06-30T00:00:00Z' },
    Nodes: [],
    Assignments: [],
    Objectives: [],
    Timers: [],
    Annotations: [],
    Accountability: [],
    Roles: [],
    ...overrides,
  }) as any;

const mockBoardResult = (data: unknown) => ({ Data: data }) as any;
const mockCapabilities = (value: number) => ({ Value: value, Capabilities: [] }) as any;

describe('useIncidentCommandStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useIncidentCommandStore.getState().reset();
    mockGetCommandBoard.mockResolvedValue(mockBoardResult(buildBoard()));
    mockGetMyCapabilities.mockResolvedValue(mockCapabilities(IncidentCapabilities.ViewBoard | IncidentCapabilities.ManageCommand));
    mockGetTimeline.mockResolvedValue({ Data: [{ CommandLogEntryId: 'l1', EntryType: 0, Description: 'Established', OccurredOn: '2026-06-30T00:00:00Z' }] } as any);
  });

  it('loadForCall populates board, capabilities and timeline', async () => {
    await useIncidentCommandStore.getState().loadForCall('42');
    const state = useIncidentCommandStore.getState();

    expect(mockGetCommandBoard).toHaveBeenCalledWith('42');
    expect(state.callId).toBe('42');
    expect(state.board?.Command.IncidentCommandId).toBe('ic1');
    expect(state.timeline).toHaveLength(1);
    expect(state.hasCommand()).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('can() reflects the effective capability bitmask', async () => {
    await useIncidentCommandStore.getState().loadForCall('42');
    const state = useIncidentCommandStore.getState();

    expect(state.can(IncidentCapabilities.ManageCommand)).toBe(true);
    expect(state.can(IncidentCapabilities.AssignResources)).toBe(false);
  });

  it('establish sends the parsed numeric CallId and reloads the board', async () => {
    mockEstablishCommand.mockResolvedValue(mockBoardResult(buildBoard().Command));
    await useIncidentCommandStore.getState().loadForCall('42');
    mockGetCommandBoard.mockClear();

    await useIncidentCommandStore.getState().establish(7);

    expect(mockEstablishCommand).toHaveBeenCalledWith({ CallId: 42, CommandDefinitionId: 7 });
    // reload re-fetches the board after the mutation
    expect(mockGetCommandBoard).toHaveBeenCalledWith('42');
  });

  it('assignResource fills IncidentCommandId and CallId from the loaded board', async () => {
    mockAssignResource.mockResolvedValue({ Data: {} } as any);
    await useIncidentCommandStore.getState().loadForCall('42');

    await useIncidentCommandStore.getState().assignResource('node1', 0, 'unit9');

    expect(mockAssignResource).toHaveBeenCalledWith({
      IncidentCommandId: 'ic1',
      CallId: 42,
      CommandStructureNodeId: 'node1',
      ResourceKind: 0,
      ResourceId: 'unit9',
    });
  });

  it('a failed mutation records the error and rethrows', async () => {
    mockEstablishCommand.mockRejectedValueOnce(new Error('boom'));
    await useIncidentCommandStore.getState().loadForCall('42');

    await expect(useIncidentCommandStore.getState().establish()).rejects.toThrow('boom');
    const state = useIncidentCommandStore.getState();
    expect(state.error).toBe('boom');
    expect(state.isMutating).toBe(false);
  });
});
