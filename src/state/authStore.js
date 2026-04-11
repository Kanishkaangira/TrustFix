import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@trustfix/auth';

export const INITIAL_AUTH_STATE = {
  hasCompletedOnboarding: false,
  isAuthenticated: false,
  pendingPhone: '',
  userPhone: '',
};

let authState = INITIAL_AUTH_STATE;
let hasHydrated = false;
let hydrationPromise = null;

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(authState));
};

const normalizeAuthState = (nextState) => {
  const candidate = nextState && typeof nextState === 'object'
    ? nextState
    : INITIAL_AUTH_STATE;

  return {
    hasCompletedOnboarding: !!candidate.hasCompletedOnboarding,
    isAuthenticated: !!candidate.isAuthenticated,
    pendingPhone: String(candidate.pendingPhone || '').trim(),
    userPhone: String(candidate.userPhone || '').trim(),
  };
};

const persistAuthState = async (nextState) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch (_) {}
};

export const getAuthState = () => authState;

export const hydrateAuthState = async () => {
  if (hasHydrated) {
    return authState;
  }

  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = AsyncStorage.getItem(STORAGE_KEY)
    .then((storedValue) => {
      if (!storedValue) {
        return authState;
      }

      const parsed = JSON.parse(storedValue);
      authState = normalizeAuthState(parsed);
      notify();
      return authState;
    })
    .catch(() => authState)
    .finally(() => {
      hasHydrated = true;
      hydrationPromise = null;
    });

  return hydrationPromise;
};

export const subscribeToAuthState = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const updateAuthState = (updater) => {
  const nextState = typeof updater === 'function'
    ? updater(authState)
    : { ...authState, ...updater };

  authState = normalizeAuthState(nextState);
  notify();
  persistAuthState(authState).catch(() => {});
  return authState;
};

export const markOnboardingComplete = () => updateAuthState({
  hasCompletedOnboarding: true,
});

export const setPendingPhone = (phone) => updateAuthState((prev) => ({
  ...prev,
  hasCompletedOnboarding: true,
  pendingPhone: String(phone || '').trim(),
}));

export const completePhoneAuth = (phone) => updateAuthState({
  hasCompletedOnboarding: true,
  isAuthenticated: true,
  pendingPhone: '',
  userPhone: String(phone || '').trim(),
});

export const clearAuthenticatedState = () => updateAuthState((prev) => ({
  ...prev,
  isAuthenticated: false,
  pendingPhone: '',
  userPhone: '',
}));

export const signOut = () => updateAuthState((prev) => ({
  ...prev,
  isAuthenticated: false,
  pendingPhone: '',
  userPhone: '',
}));

hydrateAuthState().catch(() => {});
