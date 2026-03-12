import { colorScheme, useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';

const SELECTED_THEME = 'SELECTED_THEME';
export type ColorSchemeType = 'light' | 'dark' | 'system';

export const useSelectedTheme = () => {
  const { colorScheme: _color, setColorScheme } = useColorScheme();
  const [theme, setThemeState] = useState<ColorSchemeType | undefined>(undefined);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const storedTheme = localStorage.getItem(SELECTED_THEME);
      if (storedTheme) {
        setThemeState(storedTheme as ColorSchemeType);
      }
    }
  }, []);

  const setSelectedTheme = React.useCallback(
    (t: ColorSchemeType) => {
      setColorScheme(t);
      setThemeState(t);
      if (typeof localStorage !== 'undefined') localStorage.setItem(SELECTED_THEME, t);
    },
    [setColorScheme]
  );

  const selectedTheme = (theme ?? 'dark') as ColorSchemeType;
  return { selectedTheme, setSelectedTheme } as const;
};

export const loadSelectedTheme = () => {
  try {
    if (typeof document === 'undefined') {
      // Not in a browser environment (e.g. Electron preload / SSR), skip
      return;
    }
    const storedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem(SELECTED_THEME) : null;
    if (storedTheme) {
      console.log('Loading selected theme:', storedTheme);
      colorScheme.set(storedTheme as ColorSchemeType);
    } else {
      console.log('No custom theme found, defaulting to dark mode');
      colorScheme.set('dark');
    }
    return;
  } catch (error) {
    console.error('Failed to load selected theme:', error);
  }
};
