import AsyncStorage from '@react-native-async-storage/async-storage';

import { formatDisplayPhone } from '../lib/phone';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = '@trustfix/profile';

export const INITIAL_PROFILE = {
  name: 'TrustFix User',
  phone: '',
  email: '',
  plan: 'No active plan',
  planMeta: 'Choose a plan to unlock extra benefits',
};

let profile = INITIAL_PROFILE;
let hasHydrated = false;
let hydrationPromise = null;

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(profile));
};

const mapProfileRecordToUi = (record = {}) => ({
  name: String(record.full_name || '').trim() || INITIAL_PROFILE.name,
  phone: formatDisplayPhone(record.phone) || INITIAL_PROFILE.phone,
  email: String(record.email || '').trim(),
  plan: INITIAL_PROFILE.plan,
  planMeta: INITIAL_PROFILE.planMeta,
});

const normalizeProfile = (nextProfile) => {
  const candidate = nextProfile && typeof nextProfile === 'object'
    ? nextProfile
    : INITIAL_PROFILE;

  return {
    name: String(candidate.name || '').trim() || INITIAL_PROFILE.name,
    phone: String(candidate.phone || '').trim(),
    email: String(candidate.email || '').trim(),
    plan: String(candidate.plan || '').trim() || INITIAL_PROFILE.plan,
    planMeta: String(candidate.planMeta || '').trim() || INITIAL_PROFILE.planMeta,
  };
};

const persistProfile = async (nextProfile) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
  } catch (_) {}
};

const applyProfile = (nextProfile) => {
  profile = normalizeProfile(nextProfile);
  notify();
  void persistProfile(profile);
  return profile;
};

const getAuthenticatedUser = async () => {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { user: null, error };
  }

  return { user: data?.user || null, error: null };
};

export const hasStoredFullName = (record) => (
  String(record?.full_name || '').trim().length > 0
);

export const fetchOwnProfileRecord = async () => {
  try {
    const { user, error: userError } = await getAuthenticatedUser();

    if (userError) {
      return { data: null, error: userError };
    }

    if (!user) {
      return { data: null, error: null };
    }

    const seedResult = await supabase.db.upsert(
      'profiles',
      {
        id: user.id,
        phone: user.phone || null,
        email: user.email || null,
      },
      {
        onConflict: 'id',
      },
    );

    if (seedResult.error) {
      return { data: null, error: seedResult.error };
    }

    const profileResult = await supabase.db.select('profiles', {
      filters: [{ column: 'id', op: 'eq', value: user.id }],
      maybeSingle: true,
    });

    if (profileResult.error) {
      return { data: null, error: profileResult.error };
    }

    return {
      data: profileResult.data || { id: user.id, phone: user.phone || null },
      error: null,
    };
  } catch (_) {
    return { data: null, error: { message: 'Please check your internet connection.' } };
  }
};

const buildProfilePayload = (nextProfile) => {
  return {
    full_name: String(nextProfile.name || '').trim() || null,
    email: String(nextProfile.email || '').trim() || null,
  };
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

export const syncProfileFromRemote = async () => {
  try {
    const profileResult = await fetchOwnProfileRecord();

    if (profileResult.error) {
      return { data: profile, error: profileResult.error };
    }

    if (!profileResult.data) {
      applyProfile(INITIAL_PROFILE);
      return { data: profile, error: null };
    }

    const nextProfile = normalizeProfile(
      mapProfileRecordToUi(profileResult.data),
    );

    applyProfile(nextProfile);
    return { data: nextProfile, error: null };
  } catch (_) {
    return { data: profile, error: { message: 'Please check your internet connection.' } };
  }
};

export const updateProfile = async (updater) => {
  try {
    const nextProfile = typeof updater === 'function'
      ? updater(profile)
      : { ...profile, ...updater };

    const normalizedProfile = normalizeProfile(nextProfile);
    const previousProfile = profile;

    applyProfile(normalizedProfile);

    const { user, error: userError } = await getAuthenticatedUser();

    if (userError) {
      applyProfile(previousProfile);
      return { data: previousProfile, error: userError };
    }

    if (!user) {
      return { data: normalizedProfile, error: null };
    }

    const payload = buildProfilePayload(normalizedProfile);

    const result = await supabase.db.upsert(
      'profiles',
      {
        id: user.id,
        phone: user.phone || null,
        email: user.email || null,
        ...payload,
      },
      {
        onConflict: 'id',
      },
    );

    if (result.error) {
      applyProfile(previousProfile);
      return { data: previousProfile, error: result.error };
    }

    return syncProfileFromRemote();
  } catch (_) {
    return { data: profile, error: { message: 'Please check your internet connection.' } };
  }
};

export const resetProfileStore = async () => {
  profile = INITIAL_PROFILE;
  notify();

  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (_) {}

  return profile;
};

void hydrateProfile();
