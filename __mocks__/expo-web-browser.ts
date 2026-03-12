// Mock for expo-web-browser
export const maybeCompleteAuthSession = jest.fn().mockReturnValue({ type: 'success' });

export const openBrowserAsync = jest.fn().mockResolvedValue({ type: 'cancel' });

export const openAuthSessionAsync = jest.fn().mockResolvedValue({ type: 'cancel' });

export const dismissBrowser = jest.fn();
