// Mock for expo-auth-session
export const ResponseType = {
  Code: 'code',
  Token: 'token',
  IdToken: 'id_token',
};

export const makeRedirectUri = jest.fn().mockReturnValue('test://auth/callback');

export const useAutoDiscovery = jest.fn().mockReturnValue({
  authorizationEndpoint: 'https://example.com/oauth/authorize',
  tokenEndpoint: 'https://example.com/oauth/token',
});

export const useAuthRequest = jest.fn().mockReturnValue([
  null, // request
  null, // response
  jest.fn().mockResolvedValue({ type: 'cancel' }), // promptAsync
]);

export const exchangeCodeAsync = jest.fn().mockResolvedValue({
  idToken: 'mock-id-token',
  accessToken: 'mock-access-token',
});

export const AuthSessionRedirectUriOptions = {};
