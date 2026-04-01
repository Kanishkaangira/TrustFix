import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@trustfix/profile';

export const INITIAL_PROFILE = {
  name: 'Rahul Sharma',
  phone: '+91 98765 43210',
  email: 'rahul.sharma@gmail.com',
  plan: 'HomeCare Pro',
  planMeta: 'Active \u00B7 Renews Apr 11, 2026',
};

let profile = INITIAL_PROFILE;
let hasHydrated = false;
let hydrationPromise = null;

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(profile));
};

const normalizeProfile = (nextProfile) => {
  const candidate = nextProfile && typeof nextProfile === 'object'
    ? nextProfile
    : INITIAL_PROFILE;

  return {
    name: String(candidate.name || '').trim() || INITIAL_PROFILE.name,
    phone: String(candidate.phone || '').trim() || INITIAL_PROFILE.phone,
    email: String(candidate.email || '').trim() || INITIAL_PROFILE.email,
    plan: String(candidate.plan || '').trim() || INITIAL_PROFILE.plan,
    planMeta: String(candidate.planMeta || '').trim() || INITIAL_PROFILE.planMeta,
  };
};

const persistProfile = async (nextProfile) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
  } catch (_) {}
};

export const getProfile = () => profile;

export const hydrateProfile = async () => {
  if (hasHydrated) {
    return profile;
  }

  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = AsyncStorage.getItem(STORAGE_KEY)
    .then((storedValue) => {
      if (!storedValue) {
        return profile;
      }

      const parsed = JSON.parse(storedValue);
      profile = normalizeProfile(parsed);
      notify();
      return profile;
    })
    .catch(() => profile)
    .finally(() => {
      hasHydrated = true;
      hydrationPromise = null;
    });

  return hydrationPromise;
};

export const subscribeToProfile = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const updateProfile = (updater) => {
  const nextProfile = typeof updater === 'function'
    ? updater(profile)
    : { ...profile, ...updater };

  profile = normalizeProfile(nextProfile);
  notify();
  void persistProfile(profile);
  return profile;
};

void hydrateProfile();
