import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders, json } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const ASSIGNMENT_BOOKING_SUMMARY_COLUMNS = `
  id,
  booking_number,
  status,
  payment_status,
  severity,
  service_name_snapshot,
  problem_name_snapshot,
  custom_problem,
  customer_name_snapshot,
  customer_phone_snapshot,
  address_label_snapshot,
  address_snapshot,
  scheduled_date,
  scheduled_slot_label,
  visit_charge,
  platform_fee,
  estimated_total,
  created_at,
  updated_at,
  technician_id
`;

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

  const adminClient = buildAdminClient();

  const { data: technicianProfile, error: technicianError } = await adminClient
    .from('technician_profiles')
    .select('id, status, is_available')
    .eq('id', user.id)
    .maybeSingle();

  if (technicianError) {
    return json({ error: technicianError.message }, 400);
  }

  if (!technicianProfile) {
    return json({
      assignments: [],
      technicianProfile: null,
    });
  }

  if (technicianProfile.status === 'active' && technicianProfile.is_available) {
    await adminClient.rpc('dispatch_open_bookings_to_technician', {
      p_technician_id: user.id,
    });
  }

  const { data: assignmentRows, error: assignmentsError } = await adminClient
    .from('job_assignment')
    .select(`
      id,
      booking_id,
      technician_id,
      status,
      offered_at,
      accepted_at,
      responded_at,
      created_at,
      updated_at,
      bookings (
        ${ASSIGNMENT_BOOKING_SUMMARY_COLUMNS}
      )
    `)
    .eq('technician_id', user.id)
    .in('status', ['notified', 'accepted', 'completed'])
    .order('offered_at', { ascending: false });

  if (assignmentsError) {
    return json({ error: assignmentsError.message }, 400);
  }

  const normalizedAssignments = Array.isArray(assignmentRows)
    ? assignmentRows.map((assignment) => ({
        ...assignment,
        bookings: Array.isArray(assignment.bookings)
          ? assignment.bookings[0] || null
          : assignment.bookings || null,
      }))
    : [];

  const existingBookingIds = new Set(
    normalizedAssignments
      .map((assignment) => assignment.booking_id)
      .filter(Boolean),
  );

  let fallbackAssignments: Record<string, unknown>[] = [];

  if (technicianProfile.status === 'active' && technicianProfile.is_available) {
    const { data: openBookings, error: openBookingsError } = await adminClient
      .from('bookings')
      .select(ASSIGNMENT_BOOKING_SUMMARY_COLUMNS)
      .eq('payment_status', 'booking_fee_paid')
      .is('technician_id', null)
      .order('created_at', { ascending: false });

    if (openBookingsError) {
      return json({ error: openBookingsError.message }, 400);
    }

    fallbackAssignments = (Array.isArray(openBookings) ? openBookings : [])
      .filter((booking) => !['completed', 'cancelled'].includes(String(booking.status || '').trim()))
      .filter((booking) => !existingBookingIds.has(booking.id))
      .map((booking) => ({
        id: `open-booking-${booking.id}`,
        booking_id: booking.id,
        technician_id: user.id,
        status: 'notified',
        offered_at: booking.created_at,
        accepted_at: null,
        responded_at: null,
        created_at: booking.created_at,
        updated_at: booking.updated_at || booking.created_at,
        bookings: booking,
      }));
  }

  return json({
    assignments: [...normalizedAssignments, ...fallbackAssignments],
    technicianProfile,
  });
});

