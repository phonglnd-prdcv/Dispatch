import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';

import SideMenu from '../side-menu';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

describe('SideMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render without crashing', () => {
    render(<SideMenu />);

    expect(screen.getByTestId('side-menu-scroll-view')).toBeTruthy();
  });

  it('should render all menu items', () => {
    render(<SideMenu />);

    expect(screen.getByTestId('side-menu-item-home')).toBeTruthy();
    expect(screen.getByTestId('side-menu-item-calls')).toBeTruthy();
    expect(screen.getByTestId('side-menu-item-map')).toBeTruthy();
    expect(screen.getByTestId('side-menu-item-units')).toBeTruthy();
    expect(screen.getByTestId('side-menu-item-personnel')).toBeTruthy();
    expect(screen.getByTestId('side-menu-item-notes')).toBeTruthy();
    expect(screen.getByTestId('side-menu-item-contacts')).toBeTruthy();
    expect(screen.getByTestId('side-menu-item-protocols')).toBeTruthy();
    expect(screen.getByTestId('side-menu-item-settings')).toBeTruthy();
  });

  it('should call onNavigate when a menu item is pressed', () => {
    const mockOnNavigate = jest.fn();
    render(<SideMenu onNavigate={mockOnNavigate} />);

    const homeItem = screen.getByTestId('side-menu-item-home');
    fireEvent.press(homeItem);

    expect(mockOnNavigate).toHaveBeenCalledTimes(1);
  });

  it('should navigate to correct route when menu item is pressed', async () => {
    const mockOnNavigate = jest.fn();
    render(<SideMenu onNavigate={mockOnNavigate} />);

    const callsItem = screen.getByTestId('side-menu-item-calls');
    fireEvent.press(callsItem);

    // Run all timers and microtasks
    jest.runAllTimers();

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/(app)/calls');
    });
  });

  it('should work without onNavigate prop', async () => {
    render(<SideMenu />);

    const settingsItem = screen.getByTestId('side-menu-item-settings');
    fireEvent.press(settingsItem);

    // Run all timers and microtasks
    jest.runAllTimers();

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/(app)/settings');
    });
  });

  it('should display menu item labels', () => {
    render(<SideMenu />);

    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Calls')).toBeTruthy();
    expect(screen.getByText('Map')).toBeTruthy();
    expect(screen.getByText('Units')).toBeTruthy();
    expect(screen.getByText('Personnel')).toBeTruthy();
    expect(screen.getByText('Notes')).toBeTruthy();
    expect(screen.getByText('Contacts')).toBeTruthy();
    expect(screen.getByText('Protocols')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();
  });
});