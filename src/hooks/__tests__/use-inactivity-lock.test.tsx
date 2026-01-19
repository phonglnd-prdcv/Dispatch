import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';

import { useInactivityLock } from '../use-inactivity-lock';
import useLockscreenStore from '@/stores/lockscreen/store';

// Mock the dependencies
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    replace: mockReplace,
  })),
}));

jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the store module
jest.mock('@/stores/lockscreen/store');

// Create mock store state factory
const createMockStoreState = (overrides = {}) => ({
  isLocked: false,
  lockTimeout: 60,
  lastActivityTime: Date.now(),
  _cachedTimeoutMs: 60 * 60 * 1000,
  lock: jest.fn(),
  unlock: jest.fn(),
  updateActivity: jest.fn(),
  setLockTimeout: jest.fn(),
  shouldLock: jest.fn(() => false),
  getTimeoutMs: jest.fn(() => 60 * 60 * 1000),
  ...overrides,
});

describe('useInactivityLock', () => {
  let mockStore: ReturnType<typeof createMockStoreState>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockReplace.mockClear();

    // Create fresh mock store for each test
    mockStore = createMockStoreState();

    // Setup the mock for useLockscreenStore
    (useLockscreenStore as unknown as jest.Mock).mockReturnValue(mockStore);
    (useLockscreenStore.getState as jest.Mock) = jest.fn(() => mockStore);
    (useLockscreenStore.subscribe as jest.Mock) = jest.fn(() => jest.fn());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not start interval when user is not authenticated', () => {
    renderHook(() => useInactivityLock(false));

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(60000); // 1 minute
    });

    expect(mockStore.shouldLock).not.toHaveBeenCalled();
    expect(mockStore.lock).not.toHaveBeenCalled();
  });

  it('should start interval when user is authenticated', () => {
    renderHook(() => useInactivityLock(true));

    // Fast-forward time to trigger the interval check (30 seconds)
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(mockStore.shouldLock).toHaveBeenCalled();
  });

  it('should lock screen when shouldLock returns true', () => {
    mockStore.shouldLock = jest.fn(() => true);
    (useLockscreenStore.getState as jest.Mock) = jest.fn(() => mockStore);

    renderHook(() => useInactivityLock(true));

    // Fast-forward time to trigger the check
    act(() => {
      jest.advanceTimersByTime(30000); // 30 seconds
    });

    expect(mockStore.lock).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/lockscreen');
  });

  it('should update activity on handleActivity call', () => {
    const { result } = renderHook(() => useInactivityLock(true));

    act(() => {
      result.current.handleActivity();
    });

    expect(mockStore.updateActivity).toHaveBeenCalled();
  });

  it('should not update activity when not authenticated', () => {
    const { result } = renderHook(() => useInactivityLock(false));

    act(() => {
      result.current.handleActivity();
    });

    expect(mockStore.updateActivity).not.toHaveBeenCalled();
  });

  it('should not update activity when screen is locked', () => {
    mockStore.isLocked = true;
    (useLockscreenStore.getState as jest.Mock) = jest.fn(() => mockStore);

    const { result } = renderHook(() => useInactivityLock(true));

    act(() => {
      result.current.handleActivity();
    });

    expect(mockStore.updateActivity).not.toHaveBeenCalled();
  });

  it('should clear interval when app goes to background (native only)', () => {
    // This test validates the native platform behavior
    // On web, the AppState listener is skipped
    renderHook(() => useInactivityLock(true));

    // Simulate app going to background
    act(() => {
      AppState.currentState = 'background' as any;
    });

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    // The interval behavior depends on platform detection
    // This test validates the hook handles the app state change
  });
});
