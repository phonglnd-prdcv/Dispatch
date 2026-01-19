import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AppStateStatus } from 'react-native';

// Mock all dependencies BEFORE any imports that might trigger them
// This prevents the module loading chain from failing

// Mock MMKV first
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({
    getString: jest.fn(() => 'https://api.example.com'),
    getBoolean: jest.fn(),
    getNumber: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock dev plugins
jest.mock('@dev-plugins/react-query', () => ({
  useReactQueryDevTools: jest.fn(),
}));

// Mock the SignalR store with a complete mock
const mockConnectUpdateHub = jest.fn();
const mockDisconnectUpdateHub = jest.fn();
const mockConnectGeolocationHub = jest.fn();
const mockDisconnectGeolocationHub = jest.fn();

const mockSignalRStore = {
  connectUpdateHub: mockConnectUpdateHub,
  disconnectUpdateHub: mockDisconnectUpdateHub,
  connectGeolocationHub: mockConnectGeolocationHub,
  disconnectGeolocationHub: mockDisconnectGeolocationHub,
  isUpdateHubConnected: false,
  isGeolocationHubConnected: false,
};

jest.mock('@/stores/signalr/signalr-store', () => ({
  useSignalRStore: jest.fn(() => mockSignalRStore),
}));

// Now we can safely import the mocked module
import { useSignalRStore } from '@/stores/signalr/signalr-store';

// Create a custom hook to test the SignalR lifecycle logic
function useSignalRLifecycle(isActive: boolean, appState: AppStateStatus, isSignedIn: boolean, hasInitialized: boolean) {
  const signalRStore = useSignalRStore();

  React.useEffect(() => {
    // Handle app going to background
    if (!isActive && (appState === 'background' || appState === 'inactive') && hasInitialized && isSignedIn) {
      signalRStore.disconnectUpdateHub();
      signalRStore.disconnectGeolocationHub();
    }
  }, [isActive, appState, hasInitialized, isSignedIn, signalRStore]);

  React.useEffect(() => {
    // Handle app resuming from background
    if (isActive && appState === 'active' && hasInitialized && isSignedIn) {
      signalRStore.connectUpdateHub();
      signalRStore.connectGeolocationHub();
    }
  }, [isActive, appState, hasInitialized, isSignedIn, signalRStore]);

  return signalRStore;
}

describe('SignalR Lifecycle Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should disconnect SignalR when app goes to background', async () => {
    const { rerender } = renderHook(
      ({ isActive, appState, isSignedIn, hasInitialized }) => useSignalRLifecycle(isActive, appState, isSignedIn, hasInitialized),
      {
        initialProps: {
          isActive: true,
          appState: 'active' as AppStateStatus,
          isSignedIn: true,
          hasInitialized: true,
        },
      }
    );

    // Simulate app going to background
    rerender({
      isActive: false,
      appState: 'background' as AppStateStatus,
      isSignedIn: true,
      hasInitialized: true,
    });

    await waitFor(() => {
      expect(mockDisconnectUpdateHub).toHaveBeenCalled();
      expect(mockDisconnectGeolocationHub).toHaveBeenCalled();
    });
  });

  it('should reconnect SignalR when app becomes active again', async () => {
    const { rerender } = renderHook(
      ({ isActive, appState, isSignedIn, hasInitialized }) => useSignalRLifecycle(isActive, appState, isSignedIn, hasInitialized),
      {
        initialProps: {
          isActive: false,
          appState: 'background' as AppStateStatus,
          isSignedIn: true,
          hasInitialized: true,
        },
      }
    );

    // Simulate app becoming active
    rerender({
      isActive: true,
      appState: 'active' as AppStateStatus,
      isSignedIn: true,
      hasInitialized: true,
    });

    await waitFor(() => {
      expect(mockConnectUpdateHub).toHaveBeenCalled();
      expect(mockConnectGeolocationHub).toHaveBeenCalled();
    });
  });

  it('should not manage SignalR connections when user is not signed in', async () => {
    const { rerender } = renderHook(
      ({ isActive, appState, isSignedIn, hasInitialized }) => useSignalRLifecycle(isActive, appState, isSignedIn, hasInitialized),
      {
        initialProps: {
          isActive: true,
          appState: 'active' as AppStateStatus,
          isSignedIn: false,
          hasInitialized: true,
        },
      }
    );

    // Simulate app going to background
    rerender({
      isActive: false,
      appState: 'background' as AppStateStatus,
      isSignedIn: false,
      hasInitialized: true,
    });

    // Should not call SignalR methods when user is not signed in
    expect(mockDisconnectUpdateHub).not.toHaveBeenCalled();
    expect(mockDisconnectGeolocationHub).not.toHaveBeenCalled();
  });

  it('should not manage SignalR connections when app is not initialized', async () => {
    const { rerender } = renderHook(
      ({ isActive, appState, isSignedIn, hasInitialized }) => useSignalRLifecycle(isActive, appState, isSignedIn, hasInitialized),
      {
        initialProps: {
          isActive: true,
          appState: 'active' as AppStateStatus,
          isSignedIn: true,
          hasInitialized: false,
        },
      }
    );

    // Simulate app going to background
    rerender({
      isActive: false,
      appState: 'background' as AppStateStatus,
      isSignedIn: true,
      hasInitialized: false,
    });

    // Should not call SignalR methods when app is not initialized
    expect(mockDisconnectUpdateHub).not.toHaveBeenCalled();
    expect(mockDisconnectGeolocationHub).not.toHaveBeenCalled();
  });
});
