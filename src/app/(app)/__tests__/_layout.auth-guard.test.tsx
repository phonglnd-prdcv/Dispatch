import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import TabLayout from '../_layout';
import { useAuthStore } from '@/lib/auth';
import { Env } from '@/lib/env';
import useLockscreenStore from '@/stores/lockscreen/store';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  Redirect: ({ href }: { href: string }) => <>{`Redirect to ${href}`}</>,
  Slot: () => <>Slot Content</>,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/lib/auth', () => ({
  useAuthStore: jest.fn(),
  useAuth: jest.fn(() => ({
    status: 'signedIn',
    isAuthenticated: true,
  })),
}));

jest.mock('@/lib/env', () => ({
  Env: {
    MAINTENANCE_MODE: false,
    MAPBOX_PUBKEY: 'test-key',
  },
}));

jest.mock('@/stores/lockscreen/store');

jest.mock('@/lib/storage', () => ({
  useIsFirstTime: jest.fn(() => [false, jest.fn()]),
}));

jest.mock('@/hooks/use-inactivity-lock', () => ({
  useInactivityLock: jest.fn(),
}));

jest.mock('@/hooks/use-app-lifecycle', () => ({
  useAppLifecycle: jest.fn(() => ({
    isActive: true,
    appState: 'active',
  })),
}));

jest.mock('@/hooks/use-signalr-lifecycle', () => ({
  useSignalRLifecycle: jest.fn(),
}));

jest.mock('@/services/push-notification', () => ({
  usePushNotifications: jest.fn(),
}));

describe('TabLayout - Auth Guard Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to maintenance page when maintenance mode is enabled', () => {
    (Env as any).MAINTENANCE_MODE = true;
    (useAuthStore as jest.Mock).mockReturnValue({
      status: 'signedIn',
      userId: 'test-user',
    });
    (useLockscreenStore as unknown as jest.Mock).mockReturnValue({
      isLocked: false,
    });

    render(<TabLayout />);

    expect(screen.getByText('Redirect to /maintenance')).toBeTruthy();
  });

  it('should redirect to lockscreen when screen is locked', () => {
    (Env as any).MAINTENANCE_MODE = false;
    (useAuthStore as jest.Mock).mockReturnValue({
      status: 'signedIn',
      userId: 'test-user',
    });
    (useLockscreenStore as unknown as jest.Mock).mockReturnValue({
      isLocked: true,
    });

    render(<TabLayout />);

    expect(screen.getByText('Redirect to /lockscreen')).toBeTruthy();
  });

  it('should redirect to onboarding for first time users', () => {
    (Env as any).MAINTENANCE_MODE = false;
    const { useIsFirstTime } = require('@/lib/storage');
    useIsFirstTime.mockReturnValue([true, jest.fn()]);

    (useAuthStore as jest.Mock).mockReturnValue({
      status: 'signedOut',
      userId: null,
    });
    (useLockscreenStore as unknown as jest.Mock).mockReturnValue({
      isLocked: false,
    });

    render(<TabLayout />);

    expect(screen.getByText('Redirect to /onboarding')).toBeTruthy();
  });

  it('should redirect to login when user is signed out', () => {
    (Env as any).MAINTENANCE_MODE = false;
    const { useIsFirstTime } = require('@/lib/storage');
    useIsFirstTime.mockReturnValue([false, jest.fn()]);

    (useAuthStore as jest.Mock).mockReturnValue({
      status: 'signedOut',
      userId: null,
    });
    (useLockscreenStore as unknown as jest.Mock).mockReturnValue({
      isLocked: false,
    });

    render(<TabLayout />);

    expect(screen.getByText('Redirect to /login')).toBeTruthy();
  });

  it('should render app content when user is authenticated and not locked', () => {
    (Env as any).MAINTENANCE_MODE = false;
    const { useIsFirstTime } = require('@/lib/storage');
    useIsFirstTime.mockReturnValue([false, jest.fn()]);

    (useAuthStore as jest.Mock).mockReturnValue({
      status: 'signedIn',
      userId: 'test-user',
    });
    (useLockscreenStore as unknown as jest.Mock).mockReturnValue({
      isLocked: false,
    });

    render(<TabLayout />);

    expect(screen.getByText('Slot Content')).toBeTruthy();
  });

  it('should prioritize maintenance mode over other conditions', () => {
    (Env as any).MAINTENANCE_MODE = true;
    const { useIsFirstTime } = require('@/lib/storage');
    useIsFirstTime.mockReturnValue([false, jest.fn()]);

    (useAuthStore as jest.Mock).mockReturnValue({
      status: 'signedIn',
      userId: 'test-user',
    });
    (useLockscreenStore as unknown as jest.Mock).mockReturnValue({
      isLocked: true,
    });

    render(<TabLayout />);

    // Should redirect to maintenance even if locked
    expect(screen.getByText('Redirect to /maintenance')).toBeTruthy();
  });
});
