import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders, json } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const googleGeocodingApiKey = Deno.env.get('GOOGLE_GEOCODING_API_KEY') ?? '';

const buildAdminClient = () => createClient(supabaseUrl, supabaseServiceRoleKey);

const appendAddressSegment = (baseValue: unknown, segmentValue: unknown) => {
  const base = String(baseValue || '').trim();
  const segment = String(segmentValue || '').trim();

  if (!segment) {
    return base;
  }

  if (!base) {
    return segment;
  }

  if (base.toLowerCase().includes(segment.toLowerCase())) {
    return base;
  }

  return `${base}, ${segment}`;
};

const normalizeCountryLabel = (value: unknown) => {
  const address = String(value || '').trim();

  if (!address) {
    return '';
  }

  const withIndia = address.replace(/(?:,\s*|\s+)IN$/i, ', India');

  if (/\bIndia$/i.test(withIndia)) {
    return withIndia;
  }

  return `${withIndia}, India`;
};

const normalizePostalCode = (value: unknown) => (
  String(value || '').replace(/\D/g, '').slice(0, 6)
);

const getAuthenticatedUser = async (authHeader: string, apikey: string) => {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey,
      Authorization: authHeader,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      user: null,
      error: { message: payload?.msg || payload?.message || 'Unauthorized.' },
    };
  }

  return { user: payload || null, error: null };
};

const sanitizeCoordinate = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getAddressComponent = (components: Array<{ long_name?: string, types?: string[] }> = [], type: string) => (
  components.find((component) => Array.isArray(component?.types) && component.types.includes(type))
    ?.long_name
    ?.trim()
    || ''
);

const buildTrackingLocationLabel = (result: {
  formatted_address?: string,
  address_components?: Array<{ long_name?: string, types?: string[] }>,
}) => {
  const components = Array.isArray(result?.address_components) ? result.address_components : [];
  const route = getAddressComponent(components, 'route');
  const neighborhood = getAddressComponent(components, 'sublocality_level_1')
    || getAddressComponent(components, 'sublocality')
    || getAddressComponent(components, 'neighborhood');
  const locality = getAddressComponent(components, 'locality')
    || getAddressComponent(components, 'administrative_area_level_2');
  const state = getAddressComponent(components, 'administrative_area_level_1');

  const parts = [route, neighborhood, locality, state]
    .filter(Boolean)
    .filter((part, index, values) => values.findIndex((entry) => entry.toLowerCase() === part.toLowerCase()) === index);

  if (parts.length) {
    return parts.join(', ');
  }

  return String(result?.formatted_address || '').trim();
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return json({ error: 'Missing function environment variables.' }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  const requestApikey = req.headers.get('apikey')?.trim() || supabaseAnonKey;

  if (!authHeader) {
    return json({ error: 'Missing authorization header.' }, 401);
  }

  const { user, error: userError } = await getAuthenticatedUser(authHeader, requestApikey);

  if (userError || !user) {
    return json({ error: 'Unauthorized.' }, 401);
  }

  const {
    bookingId,
    customerAddress,
    technicianLat,
    technicianLng,
  } = await req.json().catch(() => ({}));
  const trimmedBookingId = String(bookingId || '').trim();
  const trimmedAddress = String(customerAddress || '').trim();
  const resolvedTechnicianLat = sanitizeCoordinate(technicianLat);
  const resolvedTechnicianLng = sanitizeCoordinate(technicianLng);

  if (!trimmedBookingId) {
    return json({ error: 'Missing bookingId.' }, 400);
  }

  const adminClient = buildAdminClient();
  const { data: booking, error: bookingError } = await adminClient
    .from('bookings')
    .select('id, user_id, technician_id, address_snapshot, pincode')
    .eq('id', trimmedBookingId)
    .maybeSingle();

  if (bookingError) {
    return json({ error: bookingError.message }, 400);
  }

  if (!booking) {
    return json({ error: 'This booking is not available for your profile.' }, 404);
  }

  if (booking.technician_id !== user.id && booking.user_id !== user.id) {
    return json({ error: 'This booking is not available for your profile.' }, 403);
  }

  const { data: trackingRecord, error: trackingError } = await adminClient
    .from('technician_live_tracking')
    .select('customer_address, customer_lat, customer_lng')
    .eq('booking_id', trimmedBookingId)
    .maybeSingle();

  if (trackingError) {
    return json({ error: trackingError.message }, 400);
  }

  if (Number.isFinite(resolvedTechnicianLat) && Number.isFinite(resolvedTechnicianLng)) {
    if (!googleGeocodingApiKey) {
      return json({ error: 'Google geocoding API key is not configured.' }, 500);
    }

    const geocodingUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    geocodingUrl.searchParams.set('latlng', `${resolvedTechnicianLat},${resolvedTechnicianLng}`);
    geocodingUrl.searchParams.set('key', googleGeocodingApiKey);
    geocodingUrl.searchParams.set('language', 'en');
    geocodingUrl.searchParams.set('result_type', 'street_address|route|sublocality|locality');

    const geocodingResponse = await fetch(geocodingUrl.toString());
    const geocodingPayload = await geocodingResponse.json().catch(() => null);

    if (!geocodingResponse.ok) {
      return json({ error: 'Google reverse geocoding request failed.' }, 502);
    }

    const geocodingStatus = String(geocodingPayload?.status || '').trim();

    if (geocodingStatus !== 'OK') {
      return json({
        error: geocodingPayload?.error_message || `Google reverse geocoding status: ${geocodingStatus || 'UNKNOWN_ERROR'}.`,
      }, 400);
    }

    const firstResult = geocodingPayload?.results?.[0] || null;
    const technicianLocation = buildTrackingLocationLabel(firstResult);

    return json({
      success: true,
      technicianLocation,
      technicianLat: resolvedTechnicianLat,
      technicianLng: resolvedTechnicianLng,
    });
  }

  const trackingAddress = String(trackingRecord?.customer_address || '').trim();
  const postalCode = normalizePostalCode(booking?.pincode);
  const baseAddress = String(
    trimmedAddress
    || booking?.address_snapshot
    || trackingAddress,
  ).trim();
  const resolvedAddress = normalizeCountryLabel(
    appendAddressSegment(baseAddress, postalCode),
  );

  if (!resolvedAddress) {
    return json({ error: 'Customer address is missing in live tracking.' }, 400);
  }

  const existingLatitude = sanitizeCoordinate(trackingRecord?.customer_lat);
  const existingLongitude = sanitizeCoordinate(trackingRecord?.customer_lng);

  if (Number.isFinite(existingLatitude) && Number.isFinite(existingLongitude)) {
    return json({
      success: true,
      customerAddress: resolvedAddress,
      customerLat: existingLatitude,
      customerLng: existingLongitude,
    });
  }

  if (!googleGeocodingApiKey) {
    return json({ error: 'Google geocoding API key is not configured.' }, 500);
  }

  const geocodingUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  geocodingUrl.searchParams.set('address', resolvedAddress);
  geocodingUrl.searchParams.set('key', googleGeocodingApiKey);
  geocodingUrl.searchParams.set('region', 'IN');
  geocodingUrl.searchParams.set(
    'components',
    postalCode
      ? `country:IN|postal_code:${postalCode}`
      : 'country:IN',
  );

  const geocodingResponse = await fetch(geocodingUrl.toString());
  const geocodingPayload = await geocodingResponse.json().catch(() => null);

  if (!geocodingResponse.ok) {
    return json({ error: 'Google geocoding request failed.' }, 502);
  }

  const geocodingStatus = String(geocodingPayload?.status || '').trim();

  if (geocodingStatus !== 'OK') {
    return json({
      error: geocodingPayload?.error_message || `Google geocoding status: ${geocodingStatus || 'UNKNOWN_ERROR'}.`,
    }, 400);
  }

  const location = geocodingPayload?.results?.[0]?.geometry?.location || null;
  const latitude = sanitizeCoordinate(location?.lat);
  const longitude = sanitizeCoordinate(location?.lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return json({ error: 'Google geocoding returned invalid coordinates.' }, 400);
  }

  const { error: saveTrackingError } = await adminClient
    .from('technician_live_tracking')
    .update({
      customer_address: resolvedAddress,
      customer_lat: latitude,
      customer_lng: longitude,
      updated_at: new Date().toISOString(),
    })
    .eq('booking_id', trimmedBookingId);

  if (saveTrackingError) {
    return json({ error: saveTrackingError.message }, 400);
  }

  return json({
    success: true,
    customerAddress: resolvedAddress,
    customerLat: latitude,
    customerLng: longitude,
  });
});
