import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../lib/supabase';

const STORAGE_KEY = '@trustfix/bookings';
const INITIAL_BOOKINGS = [];

let bookings = INITIAL_BOOKINGS;
let hasHydrated = false;
let hydrationPromise = null;

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(bookings));
};

const formatCurrency = (value) => `\u20B9${Number(value || 0).toLocaleString('en-IN')}`;

const normalizeBookingRecord = (record = {}) => ({
  id: record.id || '',
  bookingNumber: String(record.booking_number || '').trim(),
  serviceName: String(record.service_name_snapshot || '').trim(),
  problemName: String(
    record.problem_name_snapshot || record.custom_problem || 'General service',
  ).trim(),
  status: String(record.status || '').trim(),
  severity: String(record.severity || '').trim(),
  estimatedTotal: Number(record.estimated_total || 0),
  estimatedTotalLabel: formatCurrency(record.estimated_total || 0),
  addressLabel: String(record.address_label_snapshot || '').trim(),
  address: String(record.address_snapshot || '').trim(),
  scheduledDate: record.scheduled_date || null,
  scheduledSlotLabel: String(record.scheduled_slot_label || '').trim(),
  createdAt: record.created_at || null,
});

const normalizeBookings = (nextBookings) => {
  if (!Array.isArray(nextBookings)) {
    return INITIAL_BOOKINGS;
  }

  return nextBookings
    .filter(Boolean)
    .map((item) => normalizeBookingRecord(item))
    .filter((item) => item.id);
};

const persistBookings = async (nextBookings) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextBookings));
  } catch (_) {}
};

const applyBookings = (nextBookings) => {
  bookings = normalizeBookings(nextBookings);
  notify();
  void persistBookings(bookings);
  return bookings;
};

const getAuthenticatedUser = async () => {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { user: null, error };
  }

  return { user: data?.user || null, error: null };
};

const buildBookingPayload = ({
  userId,
  service,
  problem,
  customProblem,
  severity,
  date,
  slot,
  address,
  protectionSelected,
}) => ({
  user_id: userId,
  address_id: address?.id || null,
  service_id: service?.dbId || null,
  service_problem_id: problem?.dbId || null,
  custom_problem: String(customProblem || '').trim() || null,
  severity,
  status: 'requested',
  scheduled_date: severity === 'minor' ? (date?.isoDate || null) : null,
  scheduled_slot_label: severity === 'minor' ? (slot?.label || null) : null,
  protection_selected: !!protectionSelected,
});

export const getBookings = () => bookings;

export const hydrateBookings = async () => {
  if (hasHydrated) {
    return bookings;
  }

  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = AsyncStorage.getItem(STORAGE_KEY)
    .then((storedValue) => {
      if (!storedValue) {
        return bookings;
      }

      const parsed = JSON.parse(storedValue);
      bookings = normalizeBookings(parsed);
      notify();
      return bookings;
    })
    .catch(() => bookings)
    .finally(() => {
      hasHydrated = true;
      hydrationPromise = null;
    });

  return hydrationPromise;
};

export const subscribeToBookings = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const syncBookingsFromRemote = async () => {
  try {
    const { user, error: userError } = await getAuthenticatedUser();

    if (userError) {
      return { data: bookings, error: userError };
    }

    if (!user) {
      applyBookings(INITIAL_BOOKINGS);
      return { data: bookings, error: null };
    }

    const result = await supabase.db.select('bookings', {
      filters: [{ column: 'user_id', op: 'eq', value: user.id }],
      order: [{ column: 'created_at', ascending: false }],
    });

    if (result.error) {
      return { data: bookings, error: result.error };
    }

    const nextBookings = normalizeBookings(Array.isArray(result.data) ? result.data : []);
    applyBookings(nextBookings);

    return { data: nextBookings, error: null };
  } catch (_) {
    return { data: bookings, error: { message: 'Please check your internet connection.' } };
  }
};

export const createBooking = async ({
  service,
  problem,
  customProblem,
  severity,
  date,
  slot,
  address,
  protectionSelected = false,
}) => {
  try {
    const { user, error: userError } = await getAuthenticatedUser();

    if (userError) {
      return { data: null, error: userError };
    }

    if (!user) {
      return { data: null, error: { message: 'Not authenticated.' } };
    }

    if (!service?.dbId) {
      return {
        data: null,
        error: { message: 'Service catalog is still loading. Please try again.' },
      };
    }

    if (!problem?.dbId && !String(customProblem || '').trim()) {
      return {
        data: null,
        error: { message: 'Please choose or describe the service problem.' },
      };
    }

    const result = await supabase.db.insert(
      'bookings',
      buildBookingPayload({
        userId: user.id,
        service,
        problem,
        customProblem,
        severity,
        date,
        slot,
        address,
        protectionSelected,
      }),
      {
        single: true,
      },
    );

    if (result.error) {
      return { data: null, error: result.error };
    }

    const nextBooking = normalizeBookingRecord(result.data);
    applyBookings([nextBooking, ...bookings.filter((item) => item.id !== nextBooking.id)]);

    return { data: nextBooking, error: null };
  } catch (_) {
    return { data: null, error: { message: 'Please check your internet connection.' } };
  }
};

export const cancelBooking = async (bookingId) => {
  try {
    const trimmedBookingId = String(bookingId || '').trim();

    if (!trimmedBookingId) {
      return { data: null, error: { message: 'Booking not found.' } };
    }

    const { user, error: userError } = await getAuthenticatedUser();

    if (userError) {
      return { data: null, error: userError };
    }

    if (!user) {
      return { data: null, error: { message: 'Not authenticated.' } };
    }

    const result = await supabase.db.update(
      'bookings',
      { status: 'cancelled' },
      {
        filters: [
          { column: 'id', op: 'eq', value: trimmedBookingId },
          { column: 'user_id', op: 'eq', value: user.id },
        ],
        single: true,
      },
    );

    if (result.error) {
      return { data: null, error: result.error };
    }

    const nextBooking = normalizeBookingRecord(result.data);
    applyBookings(
      bookings.map((booking) => (
        booking.id === nextBooking.id ? nextBooking : booking
      )),
    );

    return { data: nextBooking, error: null };
  } catch (_) {
    return {
      data: null,
      error: { message: 'Please check your internet connection.' },
    };
  }
};

export const resetBookingStore = async () => {
  bookings = INITIAL_BOOKINGS;
  notify();

  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (_) {}

  return bookings;
};

void hydrateBookings();
