import AsyncStorage from '@react-native-async-storage/async-storage';

import { formatDisplayPhone } from '../lib/phone';
import { supabase } from '../lib/supabase';
import { technicianProfile as seedProfile } from './mockData';

const PROFILE_STORAGE_KEY = '@trustfix/technician-profile';
const ADDRESS_STORAGE_KEY = '@trustfix/technician-addresses';

export const INITIAL_TECHNICIAN_PROFILE = {
  name: seedProfile.name,
  phone: seedProfile.phone,
  email: 'ramesh.kumar@trustfix.pro',
  plan: `${seedProfile.plan} Plan`,
  planMeta: 'Renews May 1 - INR 599/month',
  city: 'Delhi',
  pincode: '110034',
  serviceArea: seedProfile.serviceArea,
  rating: seedProfile.rating,
  jobsDone: seedProfile.jobsDone,
  completionRate: seedProfile.completionRate,
  onPlatform: seedProfile.onPlatform,
  isAvailable: false,
};

export const INITIAL_TECHNICIAN_ADDRESSES = [
  {
    id: 'tech-address-1',
    label: 'Primary Hub',
    addressLine1: 'Shop 12, Sector 9 Market',
    city: 'Delhi',
    state: 'Delhi',
    postalCode: '110034',
    address: 'Shop 12, Sector 9 Market, Delhi, Delhi, 110034, IN',
    isDefault: true,
  },
  {
    id: 'tech-address-2',
    label: 'Service Van Base',
    addressLine1: 'Block B, Pitampura Workshop',
    city: 'Delhi',
    state: 'Delhi',
    postalCode: '110034',
    address: 'Block B, Pitampura Workshop, Delhi, Delhi, 110034, IN',
    isDefault: false,
  },
];

let technicianProfile = INITIAL_TECHNICIAN_PROFILE;
let technicianAddresses = INITIAL_TECHNICIAN_ADDRESSES;
let hasHydrated = false;
let hydrationPromise = null;

const profileListeners = new Set();
const addressListeners = new Set();

const notifyProfile = () => {
  profileListeners.forEach(listener => listener(technicianProfile));
};

const notifyAddresses = () => {
  addressListeners.forEach(listener => listener(technicianAddresses));
};

const normalizeProfile = (nextProfile) => {
  const candidate = nextProfile && typeof nextProfile === 'object'
    ? nextProfile
    : INITIAL_TECHNICIAN_PROFILE;

  return {
    name: String(candidate.name || '').trim() || INITIAL_TECHNICIAN_PROFILE.name,
    phone: String(candidate.phone || '').trim() || INITIAL_TECHNICIAN_PROFILE.phone,
    email: String(candidate.email || '').trim(),
    plan: String(candidate.plan || '').trim() || INITIAL_TECHNICIAN_PROFILE.plan,
    planMeta: String(candidate.planMeta || '').trim() || INITIAL_TECHNICIAN_PROFILE.planMeta,
    city: String(candidate.city || '').trim() || INITIAL_TECHNICIAN_PROFILE.city,
    pincode: String(candidate.pincode || '').replace(/\D/g, '').slice(0, 6) || INITIAL_TECHNICIAN_PROFILE.pincode,
    serviceArea: String(candidate.serviceArea || '').trim() || INITIAL_TECHNICIAN_PROFILE.serviceArea,
    rating: String(candidate.rating || '').trim() || INITIAL_TECHNICIAN_PROFILE.rating,
    jobsDone: String(candidate.jobsDone || '').trim() || INITIAL_TECHNICIAN_PROFILE.jobsDone,
    completionRate: String(candidate.completionRate || '').trim() || INITIAL_TECHNICIAN_PROFILE.completionRate,
    onPlatform: String(candidate.onPlatform || '').trim() || INITIAL_TECHNICIAN_PROFILE.onPlatform,
    isAvailable: Boolean(candidate.isAvailable),
  };
};

const getAuthenticatedUser = async () => {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { user: null, error };
  }

  return { user: data?.user || null, error: null };
};

const mapTechnicianProfileRecordToUi = ({
  technicianProfile: profileRecord = {},
  subscription = null,
  plan = null,
}) => ({
  name: String(profileRecord.display_name || '').trim() || INITIAL_TECHNICIAN_PROFILE.name,
  phone: formatDisplayPhone(profileRecord.phone) || INITIAL_TECHNICIAN_PROFILE.phone,
  email: String(profileRecord.email || '').trim(),
  plan: plan?.name ? `${plan.name} Plan` : INITIAL_TECHNICIAN_PROFILE.plan,
  planMeta: subscription?.current_period_end
    ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    })}`
    : INITIAL_TECHNICIAN_PROFILE.planMeta,
  city: String(profileRecord.city || '').trim() || INITIAL_TECHNICIAN_PROFILE.city,
  pincode: INITIAL_TECHNICIAN_PROFILE.pincode,
  serviceArea: String(profileRecord.service_area_summary || '').trim() || INITIAL_TECHNICIAN_PROFILE.serviceArea,
  rating: String(profileRecord.rating ?? '').trim() || INITIAL_TECHNICIAN_PROFILE.rating,
  jobsDone: String(profileRecord.completed_jobs_count ?? '').trim() || INITIAL_TECHNICIAN_PROFILE.jobsDone,
  completionRate: INITIAL_TECHNICIAN_PROFILE.completionRate,
  onPlatform: INITIAL_TECHNICIAN_PROFILE.onPlatform,
  isAvailable: Boolean(profileRecord.is_available),
});

const buildAddressLine = ({
  addressLine1,
  city,
  state,
  postalCode,
}) => [addressLine1, city, state, postalCode, 'IN']
  .filter(Boolean)
  .join(', ');

const normalizeAddress = (nextAddress, index = 0) => {
  const candidate = nextAddress && typeof nextAddress === 'object'
    ? nextAddress
    : INITIAL_TECHNICIAN_ADDRESSES[index] || INITIAL_TECHNICIAN_ADDRESSES[0];

  const label = String(candidate.label || '').trim() || `Address ${index + 1}`;
  const addressLine1 = String(candidate.addressLine1 || '').trim();
  const city = String(candidate.city || '').trim();
  const state = String(candidate.state || '').trim();
  const postalCode = String(candidate.postalCode || '').replace(/\D/g, '').slice(0, 6);
  const address = String(candidate.address || '').trim() || buildAddressLine({
    addressLine1,
    city,
    state,
    postalCode,
  });

  return {
    id: String(candidate.id || `tech-address-${Date.now()}-${index}`),
    label,
    addressLine1,
    city,
    state,
    postalCode,
    address,
    isDefault: Boolean(candidate.isDefault),
  };
};

const normalizeAddresses = (nextAddresses) => {
  const candidate = Array.isArray(nextAddresses)
    ? nextAddresses
    : INITIAL_TECHNICIAN_ADDRESSES;

  const normalized = candidate.map((item, index) => normalizeAddress(item, index));
  const defaultIndex = normalized.findIndex(item => item.isDefault);

  if (defaultIndex === -1 && normalized.length) {
    normalized[0] = {
      ...normalized[0],
      isDefault: true,
    };
  }

  return normalized.map((item, index) => ({
    ...item,
    isDefault: defaultIndex === -1 ? index === 0 : index === defaultIndex,
  }));
};

const persistProfile = async () => {
  try {
    await AsyncStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(technicianProfile),
    );
  } catch (_) {}
};

const persistAddresses = async () => {
  try {
    await AsyncStorage.setItem(
      ADDRESS_STORAGE_KEY,
      JSON.stringify(technicianAddresses),
    );
  } catch (_) {}
};

const applyProfile = (nextProfile) => {
  technicianProfile = normalizeProfile(nextProfile);
  notifyProfile();
  persistProfile();
  return technicianProfile;
};

const applyAddresses = (nextAddresses) => {
  technicianAddresses = normalizeAddresses(nextAddresses);
  notifyAddresses();
  persistAddresses();
  return technicianAddresses;
};

export const getTechnicianProfile = () => technicianProfile;

export const subscribeToTechnicianProfile = (listener) => {
  profileListeners.add(listener);
  return () => {
    profileListeners.delete(listener);
  };
};

export const updateTechnicianProfile = async (updater) => {
  try {
    const nextProfile = typeof updater === 'function'
      ? updater(technicianProfile)
      : { ...technicianProfile, ...updater };

    const previousProfile = technicianProfile;
    const normalizedProfile = normalizeProfile(nextProfile);

    applyProfile(normalizedProfile);

    const { user, error: userError } = await getAuthenticatedUser();

    if (userError) {
      applyProfile(previousProfile);
      return { data: previousProfile, error: userError };
    }

    if (!user) {
      return { data: normalizedProfile, error: null };
    }

    const result = await supabase.db.upsert('technician_profiles', {
      id: user.id,
      display_name: normalizedProfile.name,
      phone: user.phone || normalizedProfile.phone || null,
      email: normalizedProfile.email || null,
      city: normalizedProfile.city || null,
      service_area_summary: normalizedProfile.serviceArea || null,
      is_available: normalizedProfile.isAvailable,
    }, {
      onConflict: 'id',
    });

    if (result.error) {
      applyProfile(previousProfile);
      return { data: previousProfile, error: result.error };
    }

    return syncTechnicianProfileFromRemote();
  } catch (_) {
    return { data: technicianProfile, error: { message: 'Please check your internet connection.' } };
  }
};

export const updateTechnicianAvailability = async (nextValue) => {
  return updateTechnicianProfile((prev) => ({
    ...prev,
    isAvailable: Boolean(nextValue),
  }));
};

export const getTechnicianAddresses = () => technicianAddresses;

export const subscribeToTechnicianAddresses = (listener) => {
  addressListeners.add(listener);
  return () => {
    addressListeners.delete(listener);
  };
};

export const addTechnicianAddress = async (nextAddress) => {
  const normalized = normalizeAddress({
    ...nextAddress,
    id: `tech-address-${Date.now()}`,
  });
  const shouldBeDefault = normalized.isDefault || technicianAddresses.length === 0;

  const nextAddresses = shouldBeDefault
    ? [
        { ...normalized, isDefault: true },
        ...technicianAddresses.map(item => ({ ...item, isDefault: false })),
      ]
    : [...technicianAddresses, normalized];

  applyAddresses(nextAddresses);
  return { data: technicianAddresses, error: null };
};

export const removeTechnicianAddress = async (addressId) => {
  const filtered = technicianAddresses.filter(address => address.id !== addressId);
  applyAddresses(filtered);
  return { data: technicianAddresses, error: null };
};

export const setDefaultTechnicianAddress = async (addressId) => {
  const nextAddresses = technicianAddresses.map(address => ({
    ...address,
    isDefault: address.id === addressId,
  }));

  applyAddresses(nextAddresses);
  return { data: technicianAddresses, error: null };
};

export const hydrateTechnicianProfileStore = async () => {
  if (hasHydrated) {
    return {
      profile: technicianProfile,
      addresses: technicianAddresses,
    };
  }

  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = Promise.all([
    AsyncStorage.getItem(PROFILE_STORAGE_KEY),
    AsyncStorage.getItem(ADDRESS_STORAGE_KEY),
  ])
    .then(([storedProfile, storedAddresses]) => {
      if (storedProfile) {
        technicianProfile = normalizeProfile(JSON.parse(storedProfile));
      }

      if (storedAddresses) {
        technicianAddresses = normalizeAddresses(JSON.parse(storedAddresses));
      }

      notifyProfile();
      notifyAddresses();

      return {
        profile: technicianProfile,
        addresses: technicianAddresses,
      };
    })
    .catch(() => ({
      profile: technicianProfile,
      addresses: technicianAddresses,
    }))
    .finally(() => {
      hasHydrated = true;
      hydrationPromise = null;
    });

  return hydrationPromise;
};

export const syncTechnicianProfileFromRemote = async () => {
  try {
    const { user, error: userError } = await getAuthenticatedUser();

    if (userError) {
      return { data: technicianProfile, error: userError };
    }

    if (!user) {
      return { data: technicianProfile, error: null };
    }

    const profileResult = await supabase.db.select('technician_profiles', {
      filters: [{ column: 'id', op: 'eq', value: user.id }],
      maybeSingle: true,
    });

    if (profileResult.error) {
      return { data: technicianProfile, error: profileResult.error };
    }

    const subscriptionResult = await supabase.db.select('technician_subscriptions', {
      filters: [
        { column: 'technician_id', op: 'eq', value: user.id },
        { column: 'status', op: 'eq', value: 'active' },
      ],
      order: [{ column: 'current_period_start', ascending: false }],
      maybeSingle: true,
    });

    if (subscriptionResult.error) {
      return { data: technicianProfile, error: subscriptionResult.error };
    }

    let plan = null;
    const planCode = subscriptionResult.data?.plan_code;

    if (planCode) {
      const planResult = await supabase.db.select('subscription_plans', {
        filters: [{ column: 'code', op: 'eq', value: planCode }],
        maybeSingle: true,
      });

      if (planResult.error) {
        return { data: technicianProfile, error: planResult.error };
      }

      plan = planResult.data || null;
    }

    const nextProfile = normalizeProfile(mapTechnicianProfileRecordToUi({
      technicianProfile: profileResult.data || {},
      subscription: subscriptionResult.data || null,
      plan,
    }));

    applyProfile(nextProfile);
    return { data: nextProfile, error: null };
  } catch (_) {
    return { data: technicianProfile, error: { message: 'Please check your internet connection.' } };
  }
};

export const resetTechnicianProfileStore = async () => {
  technicianProfile = INITIAL_TECHNICIAN_PROFILE;
  technicianAddresses = INITIAL_TECHNICIAN_ADDRESSES;
  notifyProfile();
  notifyAddresses();

  try {
    await AsyncStorage.multiRemove([PROFILE_STORAGE_KEY, ADDRESS_STORAGE_KEY]);
  } catch (_) {}

  return {
    profile: technicianProfile,
    addresses: technicianAddresses,
  };
};

hydrateTechnicianProfileStore();
