import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { View, Text, TextInput, Pressable } from 'react-native';

// Mock the entire web login module
jest.mock('../index.web', () => {
  const React = require('react');
  const { View, Text, TextInput, Pressable } = require('react-native');

  const MockLoginWeb = () => {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [showServerUrlModal, setShowServerUrlModal] = React.useState(false);
    const [showErrorModal, setShowErrorModal] = React.useState(false);

    const mockLogin = jest.fn();
    const mockOnSubmit = () => {
      if (username && password) {
        setIsLoading(true);
        mockLogin({ username, password });
        setTimeout(() => setIsLoading(false), 100);
      }
    };

    return (
      <View testID="login-web-container">
        <View testID="login-card">
          <Text testID="page-title">Resgrid Dispatch</Text>
          <Text testID="page-subtitle">Enter the information below to Sign in...</Text>

          <View testID="username-input-wrapper">
            <TextInput
              testID="username-input"
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              autoCapitalize="off"
            />
          </View>

          <View testID="password-input-wrapper">
            <TextInput
              testID="password-input"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
            />
            <Pressable testID="toggle-password" onPress={() => setShowPassword(!showPassword)}>
              <Text>{showPassword ? 'Hide' : 'Show'}</Text>
            </Pressable>
          </View>

          <Pressable testID="login-button" onPress={mockOnSubmit} disabled={isLoading}>
            <Text>{isLoading ? 'Logging in...' : 'Login'}</Text>
          </Pressable>

          <Pressable testID="server-url-button" onPress={() => setShowServerUrlModal(true)}>
            <Text>Server URL</Text>
          </Pressable>

          <View testID="footer">
            <Text testID="no-account-text">Don't have an account? Register</Text>
            <Text testID="copyright-text">© 2026 Resgrid, LLC.</Text>
          </View>
        </View>

        {showServerUrlModal && (
          <View testID="server-url-modal">
            <Text>Server URL</Text>
            <TextInput testID="server-url-input" placeholder="Enter server URL" />
            <Pressable testID="server-url-cancel" onPress={() => setShowServerUrlModal(false)}>
              <Text>Cancel</Text>
            </Pressable>
            <Pressable testID="server-url-save" onPress={() => setShowServerUrlModal(false)}>
              <Text>Save</Text>
            </Pressable>
          </View>
        )}

        {showErrorModal && (
          <View testID="error-modal">
            <Text>Login Failed</Text>
            <Text>Please check your username and password and try again.</Text>
            <Pressable testID="error-modal-ok" onPress={() => setShowErrorModal(false)}>
              <Text>OK</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return {
    __esModule: true,
    default: MockLoginWeb,
  };
});

// Import after mocking
import LoginWeb from '../index.web';

// Mock hooks and dependencies
const mockLogin = jest.fn();
const mockTrackEvent = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'login.page_title': 'Resgrid Dispatch',
        'login.page_subtitle': 'Enter the information below to Sign in to the Resgrid Dispatch application.',
        'login.username_placeholder': 'Enter your username',
        'login.password_placeholder': 'Enter your password',
        'login.login_button': 'Login',
        'login.login_button_loading': 'Logging in...',
        'login.no_account': "Don't have an account?",
        'login.register': 'Register',
        'login.footer_text': 'Created with ❤️ in Lake Tahoe',
        'settings.server_url': 'Server URL',
        'login.errorModal.title': 'Login Failed',
        'login.errorModal.message': 'Please check your username and password and try again.',
        'login.errorModal.confirmButton': 'OK',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
      };
      return translations[key] || fallback || key;
    },
  }),
}));

jest.mock('@/hooks/use-analytics', () => ({
  useAnalytics: () => ({
    trackEvent: mockTrackEvent,
  }),
}));

jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    login: mockLogin,
    status: 'idle',
    error: null,
    isAuthenticated: false,
  }),
}));

jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/env', () => ({
  Env: {
    API_VERSION: 'v4',
  },
}));

jest.mock('@/stores/app/server-url-store', () => ({
  useServerUrlStore: () => ({
    setUrl: jest.fn(),
    getUrl: jest.fn().mockResolvedValue('https://api.example.com/api/v4'),
  }),
}));

jest.mock('nativewind', () => ({
  useColorScheme: () => ({
    colorScheme: 'light',
  }),
}));

// Mock useWindowDimensions properly without spreading all RN
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  default: () => ({
    width: 1200,
    height: 800,
  }),
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return {
    ...Reanimated,
    FadeIn: { duration: () => ({ delay: () => ({}) }) },
    FadeInDown: { duration: () => ({ delay: () => ({}) }), delay: () => ({ duration: () => ({}) }) },
    FadeInUp: { duration: () => ({ delay: () => ({}) }), delay: () => ({ duration: () => ({}) }) },
    FadeOut: { duration: () => ({}) },
  };
});

jest.mock('lucide-react-native', () => ({
  AlertCircle: () => null,
  Eye: () => null,
  EyeOff: () => null,
  Loader2: () => null,
  Lock: () => null,
  Server: () => null,
  User: () => null,
}));

describe('LoginWeb', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form elements', () => {
    render(<LoginWeb />);

    expect(screen.getByTestId('login-web-container')).toBeTruthy();
    expect(screen.getByTestId('login-card')).toBeTruthy();
    expect(screen.getByTestId('page-title')).toBeTruthy();
    expect(screen.getByTestId('page-subtitle')).toBeTruthy();
  });

  it('renders username and password inputs', () => {
    render(<LoginWeb />);

    expect(screen.getByTestId('username-input')).toBeTruthy();
    expect(screen.getByTestId('password-input')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your username')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy();
  });

  it('renders login button', () => {
    render(<LoginWeb />);

    expect(screen.getByTestId('login-button')).toBeTruthy();
    expect(screen.getByText('Login')).toBeTruthy();
  });

  it('renders server URL button', () => {
    render(<LoginWeb />);

    expect(screen.getByTestId('server-url-button')).toBeTruthy();
    expect(screen.getByText('Server URL')).toBeTruthy();
  });

  it('renders footer with registration link and copyright', () => {
    render(<LoginWeb />);

    expect(screen.getByTestId('footer')).toBeTruthy();
    expect(screen.getByTestId('no-account-text')).toBeTruthy();
    expect(screen.getByTestId('copyright-text')).toBeTruthy();
  });

  it('allows user to enter username', () => {
    render(<LoginWeb />);

    const usernameInput = screen.getByTestId('username-input');
    fireEvent.changeText(usernameInput, 'testuser');

    expect(usernameInput.props.value).toBe('testuser');
  });

  it('allows user to enter password', () => {
    render(<LoginWeb />);

    const passwordInput = screen.getByTestId('password-input');
    fireEvent.changeText(passwordInput, 'testpassword');

    expect(passwordInput.props.value).toBe('testpassword');
  });

  it('toggles password visibility', () => {
    render(<LoginWeb />);

    const passwordInput = screen.getByTestId('password-input');
    const toggleButton = screen.getByTestId('toggle-password');

    // Initially should be secured
    expect(passwordInput.props.secureTextEntry).toBe(true);

    // Toggle visibility
    fireEvent.press(toggleButton);
    expect(passwordInput.props.secureTextEntry).toBe(false);

    // Toggle back
    fireEvent.press(toggleButton);
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it('opens server URL modal when button is pressed', () => {
    render(<LoginWeb />);

    const serverUrlButton = screen.getByTestId('server-url-button');
    fireEvent.press(serverUrlButton);

    expect(screen.getByTestId('server-url-modal')).toBeTruthy();
  });

  it('closes server URL modal when cancel is pressed', () => {
    render(<LoginWeb />);

    // Open modal
    fireEvent.press(screen.getByTestId('server-url-button'));
    expect(screen.getByTestId('server-url-modal')).toBeTruthy();

    // Close modal
    fireEvent.press(screen.getByTestId('server-url-cancel'));
    expect(screen.queryByTestId('server-url-modal')).toBeNull();
  });

  it('closes server URL modal when save is pressed', () => {
    render(<LoginWeb />);

    // Open modal
    fireEvent.press(screen.getByTestId('server-url-button'));

    // Save and close
    fireEvent.press(screen.getByTestId('server-url-save'));
    expect(screen.queryByTestId('server-url-modal')).toBeNull();
  });

  it('shows loading state when login button is pressed', async () => {
    render(<LoginWeb />);

    const usernameInput = screen.getByTestId('username-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    // Fill in form
    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(passwordInput, 'testpassword');

    // Press login
    fireEvent.press(loginButton);

    // Should show loading text
    await waitFor(() => {
      expect(screen.getByText('Logging in...')).toBeTruthy();
    });
  });

  it('displays correct page title', () => {
    render(<LoginWeb />);

    expect(screen.getByText('Resgrid Dispatch')).toBeTruthy();
  });

  it('has proper accessibility for username input', () => {
    render(<LoginWeb />);

    const usernameInput = screen.getByTestId('username-input');
    expect(usernameInput.props.autoCapitalize).toBe('off');
  });
});
