import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import Lockscreen from '../lockscreen';
import { useAuth } from '@/lib/auth';
import useLockscreenStore from '@/stores/lockscreen/store';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/stores/lockscreen/store');

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <NavigationContainer>{children}</NavigationContainer>;
};

describe('Lockscreen', () => {
  const mockReplace = jest.fn();
  const mockUnlock = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });

    (useAuth as jest.Mock).mockReturnValue({
      logout: mockLogout,
      status: 'signedIn',
      isAuthenticated: true,
    });

    (useLockscreenStore as unknown as jest.Mock).mockReturnValue({
      unlock: mockUnlock,
    });
  });

  it('should render lockscreen correctly', () => {
    render(
      <TestWrapper>
        <Lockscreen />
      </TestWrapper>
    );

    expect(screen.getByText('lockscreen.title')).toBeTruthy();
    expect(screen.getByText('lockscreen.message')).toBeTruthy();
    expect(screen.getByText('lockscreen.unlock_button')).toBeTruthy();
  });

  it('should render password input field', () => {
    render(
      <TestWrapper>
        <Lockscreen />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('lockscreen.password_placeholder')).toBeTruthy();
  });

  it('should render welcome back message when authenticated', () => {
    render(
      <TestWrapper>
        <Lockscreen />
      </TestWrapper>
    );

    expect(screen.getByText('lockscreen.welcome_back')).toBeTruthy();
  });

  it('should display logout link', () => {
    render(
      <TestWrapper>
        <Lockscreen />
      </TestWrapper>
    );

    expect(screen.getByText('lockscreen.not_you')).toBeTruthy();
  });
});
