// Mock for expo-crypto
export const digestStringAsync = jest.fn().mockResolvedValue('mock-hash');

export const CryptoDigestAlgorithm = {
  SHA256: 'SHA-256',
  SHA512: 'SHA-512',
  SHA1: 'SHA-1',
  MD2: 'MD2',
  MD4: 'MD4',
  MD5: 'MD5',
};

export const CryptoEncoding = {
  HEX: 'hex',
  BASE64: 'base64',
};

export const getRandomBytesAsync = jest.fn().mockResolvedValue(new Uint8Array(32));

export const randomUUID = jest.fn().mockReturnValue('mock-uuid-1234');
