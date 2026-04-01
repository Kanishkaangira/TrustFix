import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  getThemeMode,
  hydrateThemeMode,
  subscribeToThemeMode,
  THEME_MODES,
  updateThemeMode,
} from '../state/themeStore';

const ThemeContext = createContext({
  mode: THEME_MODES.LIGHT,
  isDark: false,
  setMode: () => {},
});

export function AppThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => getThemeMode());

  useEffect(() => subscribeToThemeMode(setModeState), []);

  useEffect(() => {
    void hydrateThemeMode();
  }, []);

  const value = useMemo(() => ({
    mode,
    isDark: mode === THEME_MODES.DARK,
    setMode: updateThemeMode,
  }), [mode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);
