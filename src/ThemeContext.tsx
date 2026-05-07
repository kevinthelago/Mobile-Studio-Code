import React, { createContext, useContext, useState } from 'react';
import { THEMES, Theme } from './theme';

interface ThemeContextValue {
  theme: Theme;
  themeName: string;
  setThemeName: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEMES.glass,
  themeName: 'glass',
  setThemeName: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState('glass');
  const theme = THEMES[themeName] ?? THEMES.glass;
  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext).theme;
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
