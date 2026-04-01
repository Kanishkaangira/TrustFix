import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@trustfix/addresses';

const INITIAL_ADDRESSES = [
  { id: 'home', label: 'Home', address: 'B-12, Sector 62, Noida, UP 201309', isDefault: true },
  { id: 'office', label: 'Office', address: '14th Floor, Cyber Hub, Gurugram, HR 122002', isDefault: false },
  { id: 'moms-place', label: "Mom's Place", address: 'C-4, Lajpat Nagar II, New Delhi 110024', isDefault: false },
];

let addresses = INITIAL_ADDRESSES;
let hasHydrated = false;
let hydrationPromise = null;

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(addresses));
};

const normalizeAddresses = (nextAddresses) => {
  if (!Array.isArray(nextAddresses) || !nextAddresses.length) {
    return INITIAL_ADDRESSES;
  }

  const cleaned = nextAddresses
    .filter(Boolean)
    .map((item, index) => ({
      id: item.id || `address-${Date.now()}-${index}`,
      label: String(item.label || '').trim(),
      address: String(item.address || '').trim(),
      isDefault: !!item.isDefault,
    }))
    .filter((item) => item.label && item.address);

  if (!cleaned.length) {
    return INITIAL_ADDRESSES;
  }

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

export const updateAddresses = (updater) => {
  const nextAddresses = typeof updater === 'function' ? updater(addresses) : updater;
  const normalizedAddresses = normalizeAddresses(nextAddresses);

  if (!Array.isArray(normalizedAddresses)) {
    return addresses;
  }

  addresses = normalizedAddresses;
  notify();
  void persistAddresses(addresses);
  return addresses;
};

void hydrateAddresses();
