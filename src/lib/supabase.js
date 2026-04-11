import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://ehmzcpunbwgqqniydoxt.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cwJuG02r9WaERI_R2B0FWQ_69i5RtXX';
const AUTH_BASE_URL = `${SUPABASE_URL}/auth/v1`;
const REST_BASE_URL = `${SUPABASE_URL}/rest/v1`;
const SESSION_STORAGE_KEY = '@trustfix/supabase/session';
const SESSION_REFRESH_BUFFER_SECONDS = 60;

const listeners = new Set();

const createHeaders = (accessToken, extraHeaders = {}) => ({
  apikey: SUPABASE_PUBLISHABLE_KEY,
  'Content-Type': 'application/json',
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  ...extraHeaders,
});

const parseErrorMessage = (payload) => (
  payload?.msg ||
  payload?.message ||
  payload?.error_description ||
  payload?.error ||
  'Something went wrong.'
);

const normalizeSession = (payload) => {
  if (!payload?.access_token) {
    return null;
  }

  return {
    ...payload,
    expires_at: payload.expires_at || (
      payload.expires_in
        ? Math.floor(Date.now() / 1000) + Number(payload.expires_in)
        : null
    ),
  };
};

const readStoredSession = async () => {
  try {
    const storedValue = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch (_) {
    return null;
  }
};

const persistSession = async (session) => {
  try {
    if (!session) {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (_) {}
};

const notifyAuthListeners = (event, session) => {
  listeners.forEach((listener) => {
    listener(event, session);
  });
};

const parseResponseBody = async (response) => {
  const text = await response.text().catch(() => '');

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_) {
    return text;
  }
};

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${AUTH_BASE_URL}${path}`, options);
  const payload = await parseResponseBody(response);

  if (!response.ok) {
    return {
      data: null,
      error: { message: parseErrorMessage(payload), status: response.status },
    };
  }

  return { data: payload, error: null };
};

const isSessionExpiring = (session) => {
  if (!session?.expires_at) {
    return false;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return session.expires_at <= nowInSeconds + SESSION_REFRESH_BUFFER_SECONDS;
};

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        searchParams.append(key, String(entry));
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const encodeFilterValue = (value) => {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }

  return String(value);
};

const createFilterParams = (filters = []) => {
  const nextParams = {};

  filters.forEach((filter) => {
    if (!filter?.column || !filter?.op) {
      return;
    }

    const operator = String(filter.op).trim();
    const column = String(filter.column).trim();

    if (!operator || !column) {
      return;
    }

    if (operator === 'is' && filter.value === null) {
      nextParams[column] = 'is.null';
      return;
    }

    if (operator === 'in' && Array.isArray(filter.value)) {
      nextParams[column] = `in.(${filter.value.map(encodeFilterValue).join(',')})`;
      return;
    }

    nextParams[column] = `${operator}.${encodeFilterValue(filter.value)}`;
  });

  return nextParams;
};

const createOrderValue = (order = []) => {
  if (!Array.isArray(order) || !order.length) {
    return undefined;
  }

  return order
    .filter((item) => item?.column)
    .map((item) => `${item.column}.${item.ascending === false ? 'desc' : 'asc'}`)
    .join(',');
};

let refreshPromise = null;

const refreshSession = async (currentSession) => {
  if (!currentSession?.refresh_token) {
    await persistSession(null);
    return { data: { session: null }, error: { message: 'Session expired.', status: 401 } };
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = requestJson('/token?grant_type=refresh_token', {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify({
      refresh_token: currentSession.refresh_token,
    }),
  })
    .then(async ({ data, error }) => {
      if (error) {
        await persistSession(null);
        notifyAuthListeners('SIGNED_OUT', null);
        return { data: { session: null }, error };
      }

      const nextSession = normalizeSession(data);
      await persistSession(nextSession);
      notifyAuthListeners('TOKEN_REFRESHED', nextSession);

      return {
        data: { session: nextSession },
        error: null,
      };
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

const getValidSession = async () => {
  const session = await readStoredSession();

  if (!session) {
    return { data: { session: null }, error: null };
  }

  if (!isSessionExpiring(session)) {
    return { data: { session }, error: null };
  }

  return refreshSession(session);
};

const restRequest = async (
  table,
  {
    method = 'GET',
    columns = '*',
    filters = [],
    order,
    limit,
    body,
    allowUnauthenticated = false,
    maybeSingle = false,
    single = false,
    onConflict,
    headers = {},
    prefer,
  } = {},
) => {
  const sessionResult = allowUnauthenticated
    ? { data: { session: null }, error: null }
    : await getValidSession();

  if (sessionResult.error) {
    return { data: null, error: sessionResult.error };
  }

  const session = sessionResult.data.session;
  const accessToken = session?.access_token;

  if (!allowUnauthenticated && !accessToken) {
    return {
      data: null,
      error: { message: 'Not authenticated.', status: 401 },
    };
  }

  const params = {
    select: columns,
    ...createFilterParams(filters),
  };

  const orderValue = createOrderValue(order);
  if (orderValue) {
    params.order = orderValue;
  }

  if (limit) {
    params.limit = limit;
  }

  if (onConflict) {
    params.on_conflict = onConflict;
  }

  const requestHeaders = createHeaders(accessToken, headers);
  const preferParts = [];

  if (prefer) {
    preferParts.push(prefer);
  }

  if (method !== 'GET') {
    preferParts.push('return=representation');
  }

  if (single || maybeSingle) {
    requestHeaders.Accept = 'application/vnd.pgrst.object+json';
    if (!params.limit) {
      params.limit = 1;
    }
  }

  if (preferParts.length) {
    requestHeaders.Prefer = preferParts.join(',');
  }

  const response = await fetch(`${REST_BASE_URL}/${table}${buildQueryString(params)}`, {
    method,
    headers: requestHeaders,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    if (maybeSingle && response.status === 406) {
      return { data: null, error: null };
    }

    return {
      data: null,
      error: {
        message: parseErrorMessage(payload),
        status: response.status,
      },
    };
  }

  return { data: payload, error: null };
};

export const supabase = {
  auth: {
    async signInWithOtp({ phone, options = {} }) {
      const { data, error } = await requestJson('/otp', {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({
          phone,
          data: options.data || {},
          create_user: options.shouldCreateUser ?? true,
          channel: options.channel || 'sms',
        }),
      });

      return {
        data: {
          user: null,
          session: null,
          messageId: data?.message_id || null,
        },
        error,
      };
    },

    async verifyOtp({ phone, token, type = 'sms' }) {
      const { data, error } = await requestJson('/verify', {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({
          phone,
          token,
          type,
        }),
      });

      if (error) {
        return {
          data: { user: null, session: null },
          error,
        };
      }

      const session = normalizeSession(data);
      const user = data?.user || session?.user || null;

      if (session) {
        await persistSession(session);
        notifyAuthListeners('SIGNED_IN', session);
      }

      return {
        data: { user, session },
        error: null,
      };
    },

    async getSession() {
      return getValidSession();
    },

    async getUser() {
      const sessionResult = await getValidSession();

      if (sessionResult.error) {
        return { data: { user: null }, error: sessionResult.error };
      }

      const accessToken = sessionResult.data.session?.access_token;

      if (!accessToken) {
        return {
          data: { user: null },
          error: null,
        };
      }

      try {
        const response = await fetch(`${AUTH_BASE_URL}/user`, {
          headers: createHeaders(accessToken),
        });
        const payload = await parseResponseBody(response);

        if (!response.ok) {
          if (response.status === 401 || response.status === 404) {
            await persistSession(null);
            notifyAuthListeners('SIGNED_OUT', null);
          }

          return {
            data: { user: null },
            error: {
              message: parseErrorMessage(payload),
              status: response.status,
            },
          };
        }

        return {
          data: { user: payload?.user || payload || null },
          error: null,
        };
      } catch (_) {
        return {
          data: { user: null },
          error: { message: 'Please check your internet connection.' },
        };
      }

    },

    onAuthStateChange(callback) {
      listeners.add(callback);

      return {
        data: {
          subscription: {
            unsubscribe() {
              listeners.delete(callback);
            },
          },
        },
      };
    },

    async signOut() {
      const sessionResult = await getValidSession();
      const accessToken = sessionResult.data?.session?.access_token;

      if (accessToken) {
        try {
          await fetch(`${AUTH_BASE_URL}/logout`, {
            method: 'POST',
            headers: createHeaders(accessToken),
          });
        } catch (_) {}
      }

      await persistSession(null);
      notifyAuthListeners('SIGNED_OUT', null);

      return { error: null };
    },
  },

  db: {
    async select(table, options = {}) {
      return restRequest(table, {
        method: 'GET',
        ...options,
      });
    },

    async insert(table, payload, options = {}) {
      return restRequest(table, {
        method: 'POST',
        body: payload,
        ...options,
      });
    },

    async upsert(table, payload, options = {}) {
      return restRequest(table, {
        method: 'POST',
        body: payload,
        prefer: 'resolution=merge-duplicates',
        ...options,
      });
    },

    async update(table, payload, options = {}) {
      return restRequest(table, {
        method: 'PATCH',
        body: payload,
        ...options,
      });
    },

    async remove(table, options = {}) {
      return restRequest(table, {
        method: 'DELETE',
        ...options,
      });
    },
  },
};

export {
  SESSION_STORAGE_KEY,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
};
