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

  const {
    bookingId,
    action,
    note,
  } = await req.json().catch(() => ({}));

  const normalizedAction = String(action || '').trim().toLowerCase();
  const customerNote = String(note || '').trim();

  if (!bookingId) {
    return json({ error: 'Missing bookingId.' }, 400);
  }

  if (!['approve', 'revise'].includes(normalizedAction)) {
    return json({ error: 'Invalid estimate action.' }, 400);
  }

  const adminClient = buildAdminClient();
  const nowIso = new Date().toISOString();

  const { data: booking, error: bookingError } = await adminClient
    .from('bookings')
    .select(`
      id,
      user_id,
      technician_id,
      address_id,
      service_id,
      service_problem_id,
      custom_problem,
      severity,
      scheduled_date,
      scheduled_slot_label,
      protection_selected,
      status,
      visit_charge,
      platform_fee,
      protection_fee,
      urgency_surcharge,
      proposed_labour_charge,
      proposed_parts_charge,
      proposed_invoice_total
    `)
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (bookingError) {
    return json({ error: bookingError.message }, 400);
  }

  if (!booking) {
    return json({ error: 'This booking does not belong to your profile.' }, 404);
  }

  if (String(booking.status || '').trim() !== 'estimate_sent') {
    return json({ error: 'There is no pending estimate to review right now.' }, 400);
  }

  if (normalizedAction === 'revise') {
    const { data: revisedBooking, error: reviseError } = await adminClient
      .from('bookings')
      .update({
        status: 'estimate_revision_requested',
        estimate_response_note: customerNote || 'Please revise the estimate and share it again.',
        estimate_rework_requested_at: nowIso,
      })
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .select(`
        id,
        booking_number,
        status,
        estimate_response_note,
        estimate_rework_requested_at,
        estimate_version_no,
        proposed_labour_charge,
        proposed_parts_charge,
        proposed_invoice_total
      `)
      .single();

    if (reviseError) {
      return json({ error: reviseError.message }, 400);
    }

    return json({
      success: true,
      booking: revisedBooking,
      message: 'A revised estimate was requested from the technician.',
    });
  }

  const updatePayload = {
    status: 'estimate_approved',
    estimate_approved_at: nowIso,
    estimate_response_note: customerNote || null,
  };

  const { data: approvedBooking, error: approveError } = await adminClient
    .from('bookings')
    .update(updatePayload)
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .select(`
      id,
      booking_number,
      status,
      proposed_labour_charge,
      proposed_parts_charge,
      proposed_invoice_total,
      estimate_approved_at,
      estimate_response_note
    `)
    .single();

  if (approveError) {
    return json({ error: approveError.message }, 400);
  }

  if (booking.technician_id) {
    await adminClient
      .from('booking_financial_records')
      .upsert({
        record_type: 'completion',
        booking_id: bookingId,
        user_id: booking.user_id,
        technician_id: booking.technician_id,
        address_id: booking.address_id,
        service_id: booking.service_id,
        service_problem_id: booking.service_problem_id,
        custom_problem: booking.custom_problem,
        severity: booking.severity,
        scheduled_date: booking.scheduled_date,
        scheduled_slot_label: booking.scheduled_slot_label,
        protection_selected: Boolean(booking.protection_selected),
        visit_charge: Number(booking.visit_charge || 0),
        status: 'pending',
        final_labour_amount: Number(booking.proposed_labour_charge || 0),
        final_parts_amount: Number(booking.proposed_parts_charge || 0),
        final_visit_charge: Number(booking.visit_charge || 0),
        platform_fee_amount: Number(booking.platform_fee || 0),
        protection_fee_amount: Number(booking.protection_fee || 0),
        urgency_surcharge_amount: Number(booking.urgency_surcharge || 0),
        final_customer_total: Number(booking.proposed_invoice_total || 0),
        payment_requested_at: null,
        payment_completed_at: null,
      }, {
        onConflict: 'booking_id,record_type',
      });
  }

  return json({
    success: true,
    booking: approvedBooking,
    message: 'Estimate approved successfully.',
  });
});
