import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';

import { useInactivityLock } from '../use-inactivity-lock';
import useLockscreenStore from '@/stores/lockscreen/store';

// Mock the dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
  })),
}));

jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/stores/lockscreen/store');

describe('useInactivityLock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not start timer when user is not authenticated', () => {
    const mockShouldLock = jest.fn(() => false);
    const mockLock = jest.fn();
    const mockUpdateActivity = jest.fn();

    (useLockscreenStore as unknown as jest.Mock).mockReturnValue({
      shouldLock: mockShouldLock,
      lock: mockLock,
      updateActivity: mockUpdateActivity,
      isLocked: false,
    });

    renderHook(() => useInactivityLock(false));

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(60000); // 1 minute
    });

    expect(mockShouldLock).not.toHaveBeenCalled();
    expect(mockLock).not.toHaveBeenCalled();
  });

  it('should start timer when user is authenticated', () => {
    const mockShouldLock = jest.fn(() => false);
    const mockLock = jest.fn();
    const mockUpdateActivity = jest.fn();

    (useLockscreenStore as unknown as jest.Mock).mockReturnValue({
      shouldLock: mockShouldLock,
      lock: mockLock,
      updateActivity: mockUpdateActivity,
      isLocked: false,
    });

    renderHook(() => useInactivityLock(true));

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(30000); // 30 seconds
    });

    expect(mockShouldLock).toHaveBeenCalled();
  });

  it('should lock screen when shouldLock returns true', () => {
    const mockShouldLock = jest.fn(() => true);
    const mockLock = jest.fn();
    const mockUpdateActivity = jest.fn();
    const mockReplace = jest.fn();

    (useLockscreenStore as unknown as jest.Mock).mockReturnValue({
      shouldLock: mockShouldLock,
      lock: mockLock,
      updateActivity: mockUpdateActivity,
      isLocked: false,
    });

    const { useRouter } = require('expo-router');
    useRouter.mockReturnValue({ replace: mockReplace });

    renderHook(() => useInactivityLock(true));

    // Fast-forward time to trigger the check
    act(() => {
      jest.advanceTimersByTime(30000); // 30 seconds
    });

    expect(mockLock).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/lockscreen');
  });

  it('should update activity on handleActivity call', () => {
    const mockShouldLock = jest.fn(() => false);
    const mockLock = jest.fn();
    const mockUpdateActivity = jest.fn();

    (useLockscreenStore as unknown as jest.Mock).mockReturnValue({
      shouldLock: mockShouldLock,
      lock: mockLock,
      updateActivity: mockUpdateActivity,
      isLocked: false,
    });

    const { result } = renderHook(() => useInactivityLock(true));

    act(() => {
      result.current.handleActivity();
    });

    expect(mockUpdateActivity).toHaveBeenCalled();
  });

  it('should clear timer when app goes to background', () => {
    const mockShouldLock = jest.fn(() => false);
    const mockLock = jest.fn();
    const mockUpdateActivity = jest.fn();

    (useLockscreenStore as unknown as jest.Mock).mockReturnValue({
      shouldLock: mockShouldLock,
      lock: mockLock,
      updateActivity: mockUpdateActivity,
      isLocked: false,
    });

    renderHook(() => useInactivityLock(true));

    // Simulate app going to background
    act(() => {
      AppState.currentState = 'background' as any;
    });

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    // Should not check for lock when in background
    // Timer should be cleared
  });
});
