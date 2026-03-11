import { type StateStorage } from 'zustand/middleware';

const isLocalStorageAvailable = typeof localStorage !== 'undefined';

// Mock MMKV class for web to satisfy type requirements if needed,
// but we won't export 'storage' as MMKV type to avoid importing the native library if possible.
// However, other files might expect 'storage' to be exported.
// Let's export a dummy object or just 'any'.
export const storage: any = {
  getString: (key: string) => (isLocalStorageAvailable ? localStorage.getItem(key) : null),
  set: (key: string, value: string) => { if (isLocalStorageAvailable) localStorage.setItem(key, value); },
  delete: (key: string) => { if (isLocalStorageAvailable) localStorage.removeItem(key); },
};

export function getItem<T>(key: string): T | null {
  try {
    if (!isLocalStorageAvailable) return null;
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.error('Error reading from localStorage', e);
    return null;
  }
}

export async function setItem<T>(key: string, value: T) {
  try {
    if (!isLocalStorageAvailable) return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing to localStorage', e);
  }
}

export async function removeItem(key: string) {
  try {
    if (!isLocalStorageAvailable) return;
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Error removing from localStorage', e);
  }
}

export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    try {
      if (isLocalStorageAvailable) localStorage.setItem(name, value);
    } catch (e) {
      console.error('Local storage setItem failed', e);
    }
  },
  getItem: (name) => {
    if (!isLocalStorageAvailable) return null;
    return localStorage.getItem(name);
  },
  removeItem: (name) => {
    if (isLocalStorageAvailable) localStorage.removeItem(name);
  },
};

export const useIsFirstTime = () => {
  // On web platform, we never show onboarding, so always return false
  // This ensures onboarding is only displayed on iOS and Android apps
  const setFirstTime = (_value: boolean | undefined) => {
    // No-op on web since we skip onboarding
  };

  return [false, setFirstTime] as const;
};
