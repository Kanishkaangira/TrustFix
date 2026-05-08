import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../lib/supabase';

const STORAGE_KEY = '@trustfix/addresses';
const INITIAL_ADDRESSES = [];

let addresses = INITIAL_ADDRESSES;
let hasHydrated = false;
let hydrationPromise = null;

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(addresses));
};

const buildDisplayAddress = (record = {}) => (
  String(record.display_address || '').trim() || [
    record.address_line_1,
    record.address_line_2,
    record.city,
    record.state,
    record.postal_code,
    record.country_code,
  ]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ')
);

const normalizeAddressRecord = (record = {}) => ({
  id: record.id || '',
  userId: record.user_id || '',
  label: String(record.label || '').trim(),
  address: buildDisplayAddress(record),
  isDefault: !!record.is_default,
  addressLine1: String(record.address_line_1 || '').trim(),
  addressLine2: String(record.address_line_2 || '').trim(),
  city: String(record.city || '').trim(),
  state: String(record.state || '').trim(),
  postalCode: String(record.postal_code || '').trim(),
  countryCode: String(record.country_code || 'IN').trim() || 'IN',
});

const normalizeAddresses = (nextAddresses) => {
  if (!Array.isArray(nextAddresses)) {
    return INITIAL_ADDRESSES;
  }

  const cleaned = nextAddresses
    .filter(Boolean)
    .map((item) => normalizeAddressRecord(item))
    .filter((item) => item.id && item.label && item.address);

  const defaultIndex = cleaned.findIndex((item) => item.isDefault);

  return cleaned.map((item, index) => ({
    ...item,
    isDefault: defaultIndex >= 0 ? index === defaultIndex : index === 0,
  }));
};

const persistAddresses = async (nextAddresses) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextAddresses));
  } catch (_) {}
};

const applyAddresses = (nextAddresses) => {
  addresses = normalizeAddresses(nextAddresses);
  notify();
  persistAddresses(addresses);
  return addresses;
};

const getAuthenticatedUser = async () => {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { user: null, error };
  }

  return { user: data?.user || null, error: null };
};

const parseAddressSegment = (value = '') => {
  const segment = String(value || '').trim();
  const postalMatch = segment.match(/(\d{6})/);
  const postalCode = postalMatch?.[1] || '';
  const withoutPostal = postalCode
    ? segment.replace(postalCode, '').replace(/\s+/g, ' ').trim()
    : segment;

  return {
    state: withoutPostal.replace(/,$/, '').trim(),
    postalCode,
  };
};

const splitAddressInput = (addressText = '') => {
  const parts = String(addressText || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const addressLine1 = parts[0] || String(addressText || '').trim();
  const lastSegment = parts.length >= 2 ? parts[parts.length - 1] : '';
  const secondLastSegment = parts.length >= 3 ? parts[parts.length - 2] : '';
  const parsedTail = parseAddressSegment(lastSegment);
  const middleParts = parts.slice(1, Math.max(parts.length - 2, 1));

  return {
    addressLine1,
    addressLine2: middleParts.join(', ') || null,
    city: secondLastSegment || (parts.length === 2 ? parts[1] : 'Unknown City'),
    state: parsedTail.state || 'Unknown State',
    postalCode: parsedTail.postalCode || '000000',
  };
};

const normalizePostalCode = (value = '') => (
  String(value || '').replace(/\D/g, '').slice(0, 6)
);

const buildAddressPayload = (newAddress, userId) => {
  const addressLine1 = String(newAddress.addressLine1 || '').trim();
  const addressLine2 = String(newAddress.addressLine2 || '').trim();
  const city = String(newAddress.city || '').trim();
  const state = String(newAddress.state || '').trim();
  const postalCode = normalizePostalCode(newAddress.postalCode);

  if (addressLine1 && city && state && postalCode) {
    return {
      user_id: userId,
      label: String(newAddress.label || '').trim(),
      address_line_1: addressLine1,
      address_line_2: addressLine2 || null,
      city,
      state,
      postal_code: postalCode,
      country_code: 'IN',
      is_default: !!newAddress.isDefault,
    };
  }

  const parsedAddress = splitAddressInput(newAddress.address);

  return {
    user_id: userId,
    label: String(newAddress.label || '').trim(),
    address_line_1: parsedAddress.addressLine1,
    address_line_2: parsedAddress.addressLine2,
    city: parsedAddress.city,
    state: parsedAddress.state,
    postal_code: parsedAddress.postalCode,
    country_code: 'IN',
    is_default: !!newAddress.isDefault,
  };
};

export const getAddresses = () => addresses;

export const getDefaultAddress = () => (
  addresses.find((item) => item.isDefault) || addresses[0] || null
);

export const hydrateAddresses = async () => {
  if (hasHydrated) {
    return addresses;
  }

  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = AsyncStorage.getItem(STORAGE_KEY)
    .then((storedValue) => {
      if (!storedValue) {
        return addresses;
      }

      const parsed = JSON.parse(storedValue);
      addresses = normalizeAddresses(parsed);
      notify();
      return addresses;
    })
    .catch(() => addresses)
    .finally(() => {
      hasHydrated = true;
      hydrationPromise = null;
    });

  return hydrationPromise;
};

export const subscribeToAddresses = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const syncAddressesFromRemote = async () => {
  try {
    const { user, error: userError } = await getAuthenticatedUser();

    if (userError) {
      return { data: addresses, error: userError };
    }

    if (!user) {
      applyAddresses(INITIAL_ADDRESSES);
      return { data: addresses, error: null };
    }

    const result = await supabase.db.select('addresses', {
      filters: [{ column: 'user_id', op: 'eq', value: user.id }],
      order: [
        { column: 'is_default', ascending: false },
        { column: 'created_at', ascending: false },
      ],
    });

    if (result.error) {
      return { data: addresses, error: result.error };
    }

    const nextAddresses = normalizeAddresses(Array.isArray(result.data) ? result.data : []);
    applyAddresses(nextAddresses);

    return { data: nextAddresses, error: null };
  } catch (_) {
    return { data: addresses, error: { message: 'Please check your internet connection.' } };
  }
};

export const addAddress = async (newAddress) => {
  try {
    const { user, error: userError } = await getAuthenticatedUser();

    if (userError) {
      return { data: null, error: userError };
    }

    if (!user) {
      return { data: null, error: { message: 'Not authenticated.' } };
    }

    const result = await supabase.db.insert(
      'addresses',
      buildAddressPayload(newAddress, user.id),
      { single: true },
    );

    if (result.error) {
      return { data: null, error: result.error };
    }

    await syncAddressesFromRemote();
    return { data: normalizeAddressRecord(result.data), error: null };
  } catch (_) {
    return { data: null, error: { message: 'Please check your internet connection.' } };
  }
};

export const removeAddress = async (addressId) => {
  try {
    const addressToDelete = addresses.find((item) => item.id === addressId) || null;
    const nextDefaultAddress = addressToDelete?.isDefault
      ? addresses.find((item) => item.id !== addressId) || null
      : null;

    const deleteResult = await supabase.db.remove('addresses', {
      filters: [{ column: 'id', op: 'eq', value: addressId }],
    });

    if (deleteResult.error) {
      return { data: null, error: deleteResult.error };
    }

    if (nextDefaultAddress?.id) {
      const defaultResult = await supabase.db.update(
        'addresses',
        { is_default: true },
        {
          filters: [{ column: 'id', op: 'eq', value: nextDefaultAddress.id }],
          single: true,
        },
      );

      if (defaultResult.error) {
        await syncAddressesFromRemote();
        return {
          data: null,
          error: { message: 'Address deleted, but we could not set the next default address.' },
        };
      }
    }

    await syncAddressesFromRemote();
    return { data: true, error: null };
  } catch (_) {
    return { data: null, error: { message: 'Please check your internet connection.' } };
  }
};

export const setDefaultAddress = async (addressId) => {
  try {
    const result = await supabase.db.update(
      'addresses',
      { is_default: true },
      {
        filters: [{ column: 'id', op: 'eq', value: addressId }],
        single: true,
      },
    );

    if (result.error) {
      return { data: null, error: result.error };
    }

    await syncAddressesFromRemote();
    return { data: normalizeAddressRecord(result.data), error: null };
  } catch (_) {
    return { data: null, error: { message: 'Please check your internet connection.' } };
  }
};

export const resetAddressStore = async () => {
  addresses = INITIAL_ADDRESSES;
  notify();

  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (_) {}

  return addresses;
};

hydrateAddresses();
