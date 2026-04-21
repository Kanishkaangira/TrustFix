import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders, json } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const buildAdminClient = () => createClient(supabaseUrl, supabaseServiceRoleKey);

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

  const { bookingId } = await req.json().catch(() => ({}));

  if (!bookingId) {
    return json({ error: 'Missing bookingId.' }, 400);
  }

  const adminClient = buildAdminClient();

  const { data: booking, error: bookingError } = await adminClient
    .from('bookings')
    .select('id, technician_id, status')
    .eq('id', bookingId)
    .eq('technician_id', user.id)
    .maybeSingle();

  if (bookingError) {
    return json({ error: bookingError.message }, 400);
  }

  if (!booking) {
    return json({ error: 'This booking is not assigned to your profile.' }, 404);
  }

  const currentStatus = String(booking.status || '').trim();

  if (['completed', 'cancelled'].includes(currentStatus)) {
    return json({ error: 'This booking can no longer be updated.' }, 400);
  }

  if (['en_route', 'arrived', 'otp_verified', 'in_progress'].includes(currentStatus)) {
    return json({ success: true, status: currentStatus }, 200);
  }

  const { data: updatedBooking, error: updateError } = await adminClient
    .from('bookings')
    .update({ status: 'en_route' })
    .eq('id', bookingId)
    .eq('technician_id', user.id)
    .select('id, status')
    .single();

  if (updateError) {
    return json({ error: updateError.message }, 400);
  }

  return json({
    success: true,
    status: updatedBooking.status,
  });
});
