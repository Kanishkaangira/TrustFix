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

const sanitizeMoney = (value: unknown) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100) / 100;
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
    labourCharge,
    partsCharge,
    note,
  } = await req.json().catch(() => ({}));

  const sanitizedLabour = sanitizeMoney(labourCharge);
  const sanitizedParts = sanitizeMoney(partsCharge);
  const sanitizedNote = String(note || '').trim() || null;

  if (!bookingId) {
    return json({ error: 'Missing bookingId.' }, 400);
  }

  if (sanitizedLabour === null || sanitizedParts === null) {
    return json({ error: 'Labour and parts amounts must be valid positive numbers.' }, 400);
  }

  const adminClient = buildAdminClient();
  const nowIso = new Date().toISOString();

  const { data: booking, error: bookingError } = await adminClient
    .from('bookings')
    .select(`
      id,
      technician_id,
      status,
      payment_status,
      inspection_started_at,
      visit_charge,
      platform_fee,
      protection_fee,
      urgency_surcharge,
      estimate_version_no
    `)
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

  if (['completed', 'cancelled', 'payment_pending'].includes(currentStatus)) {
    return json({ error: 'This booking can no longer be estimated.' }, 400);
  }

  if (!['otp_verified', 'estimate_sent', 'estimate_revision_requested'].includes(currentStatus)) {
    return json({ error: 'You can send the estimate after arrival verification.' }, 400);
  }

  const proposedInvoiceTotal = Math.round((
    Number(booking.visit_charge || 0)
    + Number(booking.platform_fee || 0)
    + Number(booking.protection_fee || 0)
    + Number(booking.urgency_surcharge || 0)
    + sanitizedLabour
    + sanitizedParts
  ) * 100) / 100;

  const nextEstimateVersion = Number(booking.estimate_version_no || 0) + 1;

  const { data: updatedBooking, error: updateError } = await adminClient
    .from('bookings')
    .update({
      proposed_labour_charge: sanitizedLabour,
      proposed_parts_charge: sanitizedParts,
      proposed_invoice_total: proposedInvoiceTotal,
      estimate_note: sanitizedNote,
      estimate_response_note: null,
      estimate_rework_requested_at: null,
      estimate_version_no: nextEstimateVersion,
      estimate_sent_at: nowIso,
      inspection_started_at: booking.inspection_started_at ?? nowIso,
      status: 'estimate_sent',
    })
    .eq('id', bookingId)
    .eq('technician_id', user.id)
    .select(`
      id,
      booking_number,
      status,
      proposed_labour_charge,
      proposed_parts_charge,
      proposed_invoice_total,
      estimate_note,
      estimate_version_no,
      estimate_sent_at,
      estimate_response_note
    `)
    .single();

  if (updateError) {
    return json({ error: updateError.message }, 400);
  }

  return json({
    success: true,
    booking: updatedBooking,
    message: 'Estimate sent to the customer for approval.',
  });
});
