import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
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
    render(<Lockscreen />);

    expect(screen.getByText('lockscreen.title')).toBeTruthy();
    expect(screen.getByText('lockscreen.message')).toBeTruthy();
    expect(screen.getByText('lockscreen.unlock_button')).toBeTruthy();
  });

  it('should render password input field', () => {
    render(<Lockscreen />);

    expect(screen.getByPlaceholderText('lockscreen.password_placeholder')).toBeTruthy();
  });

  it('should toggle password visibility', () => {
    render(<Lockscreen />);

    const passwordInput = screen.getByPlaceholderText('lockscreen.password_placeholder');
    expect(passwordInput.props.secureTextEntry).toBe(true);

    // Find and click the eye icon button
    const eyeButton = screen.getByTestId('password-toggle');
    fireEvent.press(eyeButton);

    expect(passwordInput.props.secureTextEntry).toBe(false);
  });

  it('should handle unlock submission', async () => {
    render(<Lockscreen />);

    const passwordInput = screen.getByPlaceholderText('lockscreen.password_placeholder');
    const unlockButton = screen.getByText('lockscreen.unlock_button');

    fireEvent.changeText(passwordInput, 'testpassword');
    fireEvent.press(unlockButton);

    await waitFor(() => {
      expect(mockUnlock).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(app)');
    });
  });

  it('should show error for empty password', async () => {
    render(<Lockscreen />);

    const unlockButton = screen.getByText('lockscreen.unlock_button');
    fireEvent.press(unlockButton);

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeTruthy();
    });
  });

  it('should handle logout', async () => {
    render(<Lockscreen />);

    const logoutLink = screen.getByText('lockscreen.not_you');
    fireEvent.press(logoutLink);

    await waitFor(() => {
      expect(mockUnlock).toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('should display loading state while unlocking', async () => {
    render(<Lockscreen />);

    const passwordInput = screen.getByPlaceholderText('lockscreen.password_placeholder');
    const unlockButton = screen.getByText('lockscreen.unlock_button');

    fireEvent.changeText(passwordInput, 'testpassword');
    fireEvent.press(unlockButton);

    expect(screen.getByText('lockscreen.unlocking')).toBeTruthy();
  });
});
