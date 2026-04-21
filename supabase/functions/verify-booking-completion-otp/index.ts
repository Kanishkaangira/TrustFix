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

  const { bookingId, otpCode } = await req.json().catch(() => ({}));
  const sanitizedOtp = String(otpCode || '').replace(/[^0-9]/g, '').slice(0, 4);

  if (!bookingId) {
    return json({ error: 'Missing bookingId.' }, 400);
  }

  if (sanitizedOtp.length !== 4) {
    return json({ error: 'Enter the 4-digit finish OTP.' }, 400);
  }

  const adminClient = buildAdminClient();
  const nowIso = new Date().toISOString();

  const { data: booking, error: bookingError } = await adminClient
    .from('bookings')
    .select('id, technician_id, status, payment_status')
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
  const paymentStatus = String(booking.payment_status || '').trim();

  if (currentStatus === 'completed') {
    return json({
      success: true,
      status: 'completed',
      message: 'Final handoff verified. Job completed successfully.',
    });
  }

  if (paymentStatus !== 'paid') {
    return json({ error: 'The customer has not completed the final payment yet.' }, 400);
  }

  if (![
    'estimate_approved',
    'in_progress',
    'payment_pending',
    'payment_requested',
    'work_completed',
  ].includes(currentStatus)) {
    return json({ error: 'Finish OTP can only be verified after the final bill is paid.' }, 400);
  }

  await adminClient
    .from('booking_verification_otps')
    .update({
      status: 'expired',
      updated_at: nowIso,
    })
    .eq('booking_id', bookingId)
    .eq('purpose', 'completion_verification')
    .eq('status', 'generated')
    .lte('expires_at', nowIso);

  const { data: otpRecord, error: otpError } = await adminClient
    .from('booking_verification_otps')
    .select('id, otp_code, status, attempt_count, expires_at')
    .eq('booking_id', bookingId)
    .eq('purpose', 'completion_verification')
    .eq('status', 'generated')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (otpError) {
    return json({ error: otpError.message }, 400);
  }

  if (!otpRecord) {
    return json({
      error: 'No active finish OTP was found. Please generate a fresh Finish OTP.',
      code: 'OTP_MISSING',
      canRegenerate: true,
    }, 400);
  }

  if (otpRecord.expires_at && new Date(otpRecord.expires_at).getTime() <= Date.now()) {
    await adminClient
      .from('booking_verification_otps')
      .update({
        status: 'expired',
        updated_at: nowIso,
      })
      .eq('id', otpRecord.id);

    return json({
      error: 'This Finish OTP has expired. Please generate a fresh Finish OTP.',
      code: 'OTP_EXPIRED',
      canRegenerate: true,
    }, 400);
  }

  const nextAttemptCount = Number(otpRecord.attempt_count || 0) + 1;

  if (String(otpRecord.otp_code || '').trim() !== sanitizedOtp) {
    await adminClient
      .from('booking_verification_otps')
      .update({
        attempt_count: nextAttemptCount,
        last_attempt_at: nowIso,
        ...(nextAttemptCount >= 5 ? { status: 'expired', updated_at: nowIso } : {}),
      })
      .eq('id', otpRecord.id);

    return json(
      nextAttemptCount >= 5
        ? {
            error: 'Too many incorrect attempts. Please generate a fresh Finish OTP.',
            code: 'OTP_LOCKED',
            canRegenerate: true,
          }
        : {
            error: 'Incorrect Finish OTP. Please ask the customer for the latest code.',
            code: 'OTP_INCORRECT',
            canRegenerate: false,
          },
      400,
    );
  }

  const { error: verifyUpdateError } = await adminClient
    .from('booking_verification_otps')
    .update({
      status: 'verified',
      attempt_count: nextAttemptCount,
      last_attempt_at: nowIso,
      verified_at: nowIso,
      verified_by_technician_id: user.id,
      updated_at: nowIso,
    })
    .eq('id', otpRecord.id);

  if (verifyUpdateError) {
    return json({ error: verifyUpdateError.message }, 400);
  }

  const { error: bookingUpdateError } = await adminClient
    .from('bookings')
    .update({
      status: 'completed',
      work_completed_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', bookingId)
    .eq('technician_id', user.id);

  if (bookingUpdateError) {
    return json({ error: bookingUpdateError.message }, 400);
  }

  await adminClient
    .from('booking_assignments')
    .update({
      status: 'completed',
      responded_at: nowIso,
      updated_at: nowIso,
    })
    .eq('booking_id', bookingId)
    .eq('technician_id', user.id)
    .eq('status', 'accepted');

  return json({
    success: true,
    status: 'completed',
    message: 'Final handoff verified. Job completed successfully.',
  });
});
