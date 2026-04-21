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

  if (!requestApikey) {
    return json({ error: 'Missing publishable key for auth lookup.' }, 500);
  }

  const adminClient = buildAdminClient();

  const { user, error: userError } = await getAuthenticatedUser(authHeader, requestApikey);

  if (userError || !user) {
    return json({ error: 'Unauthorized.' }, 401);
  }

  const { bookingId } = await req.json().catch(() => ({}));

  if (!bookingId) {
    return json({ error: 'Missing bookingId.' }, 400);
  }

  const { data: technicianProfile, error: technicianError } = await adminClient
    .from('technician_profiles')
    .select('id, status, is_available')
    .eq('id', user.id)
    .maybeSingle();

  if (technicianError) {
    return json({ error: technicianError.message }, 400);
  }

  if (!technicianProfile || technicianProfile.status !== 'active') {
    return json({ error: 'Technician profile is not active yet.' }, 403);
  }

  await adminClient.rpc('dispatch_open_bookings_to_technician', {
    p_technician_id: user.id,
  });

  const { data, error } = await adminClient.rpc('claim_booking_assignment', {
    p_booking_id: bookingId,
    p_technician_id: user.id,
  });

  if (error) {
    return json({ error: error.message }, 400);
  }

  const result = Array.isArray(data) ? data[0] : data;

  return json({
    success: Boolean(result?.success),
    assignmentId: result?.assignment_id ?? null,
    status: result?.assignment_status ?? null,
    message: result?.message ?? null,
  });
});
