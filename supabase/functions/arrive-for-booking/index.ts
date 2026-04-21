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

const generateOtpCode = () => {
  const random = crypto.getRandomValues(new Uint32Array(1))[0];
  return String((random % 9000) + 1000);
};

const getPurposeConfig = (inputPurpose: string) => {
  const purpose = inputPurpose === 'completion_verification'
    ? 'completion_verification'
    : 'arrival_verification';

  if (purpose === 'completion_verification') {
    return {
      purpose,
      activeStatus: 'work_completed',
      existingVerifiedMessage: 'Completion OTP is already verified for this booking.',
      activeOtpMessage: 'Completion OTP is already active for this booking.',
      successMessage: 'Completion OTP generated successfully.',
      regenerateMessage: 'A fresh completion OTP was generated successfully.',
      expiredPrompt: 'fresh completion OTP',
    };
  }

  return {
    purpose,
    activeStatus: 'arrived',
    existingVerifiedMessage: 'Arrival is already verified for this booking.',
    activeOtpMessage: 'Arrival OTP is already active for this booking.',
    successMessage: 'Arrival OTP generated successfully.',
    regenerateMessage: 'A fresh arrival OTP was generated successfully.',
    expiredPrompt: 'fresh arrival OTP',
  };
};

const shouldTreatAsCompletionFlow = (booking: { status?: string | null; payment_status?: string | null }) => {
  const currentStatus = String(booking.status || '').trim();
  const paymentStatus = String(booking.payment_status || '').trim();

  return paymentStatus === 'paid' && [
    'estimate_approved',
    'in_progress',
    'payment_pending',
    'payment_requested',
    'work_completed',
    'completed',
  ].includes(currentStatus);
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
    forceRegenerate = false,
    purpose: requestedPurpose = 'arrival_verification',
  } = await req.json().catch(() => ({}));

  if (!bookingId) {
    return json({ error: 'Missing bookingId.' }, 400);
  }

  const adminClient = buildAdminClient();

  const { data: booking, error: bookingError } = await adminClient
    .from('bookings')
    .select('id, technician_id, status, payment_status, customer_phone_snapshot')
    .eq('id', bookingId)
    .eq('technician_id', user.id)
    .maybeSingle();

  if (bookingError) {
    return json({ error: bookingError.message }, 400);
  }

  if (!booking) {
    return json({ error: 'This booking is not assigned to your profile.' }, 404);
  }

  const purposeConfig = shouldTreatAsCompletionFlow(booking)
    ? getPurposeConfig('completion_verification')
    : getPurposeConfig(String(requestedPurpose || '').trim());

  const currentStatus = String(booking.status || '').trim();

  if (['completed', 'cancelled'].includes(currentStatus)) {
    return json({ error: 'This booking can no longer be updated.' }, 400);
  }

  if (purposeConfig.purpose === 'completion_verification') {
    const allowedCompletionStatuses = [
      'work_completed',
      'payment_requested',
      'payment_pending',
      'in_progress',
      'estimate_approved',
    ];

    if (String(booking.payment_status || '').trim() !== 'paid') {
      return json({ error: 'The customer needs to finish the final payment before completion OTP can be generated.' }, 400);
    }

    if (!allowedCompletionStatuses.includes(currentStatus)) {
      if (currentStatus === 'completed') {
        return json({
          success: true,
          status: currentStatus,
          message: purposeConfig.existingVerifiedMessage,
        });
      }

      return json({ error: 'Finish OTP can only be generated after final payment is completed.' }, 400);
    }
  }

  if (purposeConfig.purpose === 'arrival_verification' && ['otp_verified', 'in_progress', 'work_completed'].includes(currentStatus)) {
    return json({
      success: true,
      status: currentStatus,
      message: purposeConfig.existingVerifiedMessage,
    });
  }

  if (purposeConfig.purpose === 'completion_verification' && currentStatus === 'completed') {
    return json({
      success: true,
      status: currentStatus,
      message: purposeConfig.existingVerifiedMessage,
    });
  }

  const nowIso = new Date().toISOString();

  const { data: existingOtp, error: existingOtpError } = await adminClient
    .from('booking_verification_otps')
    .select('id, otp_code, status, expires_at')
    .eq('booking_id', bookingId)
    .eq('purpose', purposeConfig.purpose)
    .eq('status', 'generated')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingOtpError) {
    return json({ error: existingOtpError.message }, 400);
  }

  if (!forceRegenerate && existingOtp?.expires_at && new Date(existingOtp.expires_at).getTime() > Date.now()) {
    if (purposeConfig.purpose === 'arrival_verification' && currentStatus !== 'arrived') {
      await adminClient
        .from('bookings')
        .update({ status: purposeConfig.activeStatus })
        .eq('id', bookingId)
        .eq('technician_id', user.id);
    }

    return json({
      success: true,
      status: purposeConfig.activeStatus,
      purpose: purposeConfig.purpose,
      otpStatus: 'generated',
      otpCode: existingOtp.otp_code,
      expiresAt: existingOtp.expires_at,
      deliveryChannel: 'customer_app',
      message: purposeConfig.activeOtpMessage,
    });
  }

  await adminClient
    .from('booking_verification_otps')
    .update({
      status: existingOtp ? 'expired' : 'cancelled',
      updated_at: nowIso,
    })
    .eq('booking_id', bookingId)
    .eq('purpose', purposeConfig.purpose)
    .eq('status', 'generated');

  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: insertError } = await adminClient
    .from('booking_verification_otps')
    .insert({
      booking_id: bookingId,
      purpose: purposeConfig.purpose,
      otp_code: otpCode,
      status: 'generated',
      generated_for_phone: booking.customer_phone_snapshot || null,
      generated_by_technician_id: user.id,
      expires_at: expiresAt,
    });

  if (insertError) {
    return json({ error: insertError.message }, 400);
  }

  const { error: updateBookingError } = await adminClient
    .from('bookings')
    .update({ status: purposeConfig.activeStatus })
    .eq('id', bookingId)
    .eq('technician_id', user.id);

  if (updateBookingError) {
    return json({ error: updateBookingError.message }, 400);
  }

  return json({
    success: true,
    status: purposeConfig.activeStatus,
    purpose: purposeConfig.purpose,
    otpStatus: 'generated',
    otpCode,
    expiresAt,
    deliveryChannel: 'customer_app',
    message: forceRegenerate
      ? purposeConfig.regenerateMessage
      : purposeConfig.successMessage,
  });
});
