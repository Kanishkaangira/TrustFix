import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@trustfix/theme-mode';

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
};

const normalizeThemeMode = (value) => (
  value === THEME_MODES.DARK ? THEME_MODES.DARK : THEME_MODES.LIGHT
);

let themeMode = THEME_MODES.LIGHT;
let hasHydrated = false;
let hydrationPromise = null;

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(themeMode));
};

const persistThemeMode = async (nextThemeMode) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, nextThemeMode);
  } catch (_) {}
};

export const getThemeMode = () => themeMode;

export const hydrateThemeMode = async () => {
  if (hasHydrated) {
    return themeMode;
  }

  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = AsyncStorage.getItem(STORAGE_KEY)
    .then((storedValue) => {
      if (!storedValue) {
        return themeMode;
      }

      themeMode = normalizeThemeMode(storedValue);
      notify();
      return themeMode;
    })
    .catch(() => themeMode)
    .finally(() => {
      hasHydrated = true;
      hydrationPromise = null;
    });

  return hydrationPromise;
};

export const subscribeToThemeMode = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const updateThemeMode = (nextMode) => {
  const normalizedThemeMode = normalizeThemeMode(nextMode);
  themeMode = normalizedThemeMode;
  notify();
  void persistThemeMode(normalizedThemeMode);
  return themeMode;
};

void hydrateThemeMode();
