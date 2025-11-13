import useLockscreenStore from '../store';

describe('useLockscreenStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useLockscreenStore.setState({
      isLocked: false,
      lockTimeout: 5,
      lastActivityTime: Date.now(),
    });
  });

  it('should initialize with default values', () => {
    const state = useLockscreenStore.getState();

    expect(state.isLocked).toBe(false);
    expect(state.lockTimeout).toBe(5);
    expect(state.lastActivityTime).toBeDefined();
  });

  it('should lock the screen', () => {
    const { lock } = useLockscreenStore.getState();

    lock();

    const state = useLockscreenStore.getState();
    expect(state.isLocked).toBe(true);
  });

  it('should unlock the screen', () => {
    const { lock, unlock } = useLockscreenStore.getState();

    lock();
    expect(useLockscreenStore.getState().isLocked).toBe(true);

    unlock();
    expect(useLockscreenStore.getState().isLocked).toBe(false);
  });

  it('should update last activity time when unlocking', () => {
    const { unlock } = useLockscreenStore.getState();
    const timeBefore = Date.now();

    unlock();

    const state = useLockscreenStore.getState();
    expect(state.lastActivityTime).toBeGreaterThanOrEqual(timeBefore);
  });

  it('should update activity time', () => {
    const { updateActivity } = useLockscreenStore.getState();
    const timeBefore = Date.now();

    updateActivity();

    const state = useLockscreenStore.getState();
    expect(state.lastActivityTime).toBeGreaterThanOrEqual(timeBefore);
  });

  it('should set lock timeout', () => {
    const { setLockTimeout } = useLockscreenStore.getState();

    setLockTimeout(10);

    const state = useLockscreenStore.getState();
    expect(state.lockTimeout).toBe(10);
  });

  it('should return false for shouldLock when already locked', () => {
    const { lock, shouldLock } = useLockscreenStore.getState();

    lock();

    expect(shouldLock()).toBe(false);
  });

  it('should return false for shouldLock when lockTimeout is 0', () => {
    const { setLockTimeout, shouldLock } = useLockscreenStore.getState();

    setLockTimeout(0);

    expect(shouldLock()).toBe(false);
  });

  it('should return true for shouldLock when timeout exceeded', () => {
    const { setLockTimeout, shouldLock } = useLockscreenStore.getState();

    // Set timeout to 1 minute
    setLockTimeout(1);

    // Set last activity to 2 minutes ago
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    useLockscreenStore.setState({ lastActivityTime: twoMinutesAgo });

    expect(shouldLock()).toBe(true);
  });

  it('should return false for shouldLock when timeout not exceeded', () => {
    const { setLockTimeout, shouldLock, updateActivity } = useLockscreenStore.getState();

    // Set timeout to 5 minutes
    setLockTimeout(5);

    // Update activity to now
    updateActivity();

    expect(shouldLock()).toBe(false);
  });

  it('should return false for shouldLock when no lastActivityTime', () => {
    const { shouldLock } = useLockscreenStore.getState();

    useLockscreenStore.setState({ lastActivityTime: null });

    expect(shouldLock()).toBe(false);
  });
});
