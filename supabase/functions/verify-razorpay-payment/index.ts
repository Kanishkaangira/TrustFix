import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders, json } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

const buildAdminClient = () => createClient(supabaseUrl, supabaseServiceRoleKey);

const encodeHex = (buffer: ArrayBuffer) => (
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
);

const signRazorpayPayload = async (payload: string) => {
  const secretKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(razorpayKeySecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', secretKey, new TextEncoder().encode(payload));
  return encodeHex(signature);
};

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

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !razorpayKeySecret) {
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

  const {
    paymentOrderId,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  } = await req.json().catch(() => ({}));

  if (!paymentOrderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return json({ error: 'Missing payment verification payload.' }, 400);
  }

  const { data: paymentOrder, error: paymentOrderError } = await adminClient
    .from('payment_orders')
    .select('*')
    .eq('id', paymentOrderId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (paymentOrderError) {
    return json({ error: paymentOrderError.message }, 400);
  }

  if (!paymentOrder) {
    return json({ error: 'Payment order not found.' }, 404);
  }

  const expectedSignature = await signRazorpayPayload(`${razorpayOrderId}|${razorpayPaymentId}`);

  if (expectedSignature !== razorpaySignature) {
    return json({ error: 'Invalid payment signature.' }, 400);
  }

  let bookingId = paymentOrder.booking_id ?? null;
  let createdBooking: Record<string, unknown> | null = null;

  if (paymentOrder.payment_stage === 'booking_fee' && !bookingId) {
    const checkoutSessionId = String(paymentOrder.notes?.checkout_session_id ?? '').trim();

    if (!checkoutSessionId) {
      return json({ error: 'Checkout session not found for this payment.' }, 400);
    }

    const { data: checkoutSession, error: checkoutSessionError } = await adminClient
      .from('booking_checkout_sessions')
      .select('*')
      .eq('id', checkoutSessionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkoutSessionError) {
      return json({ error: checkoutSessionError.message }, 400);
    }

    if (!checkoutSession) {
      return json({ error: 'Checkout session not found.' }, 404);
    }

    const { data: insertedBooking, error: bookingInsertError } = await adminClient
      .from('bookings')
      .insert({
        user_id: checkoutSession.user_id,
        address_id: checkoutSession.address_id,
        service_id: checkoutSession.service_id,
        service_problem_id: checkoutSession.service_problem_id,
        custom_problem: checkoutSession.custom_problem,
        severity: checkoutSession.severity,
        status: 'confirmed',
        scheduled_date: checkoutSession.scheduled_date,
        scheduled_slot_label: checkoutSession.scheduled_slot_label,
        protection_selected: checkoutSession.protection_selected,
        visit_charge: checkoutSession.visit_charge,
        platform_fee: checkoutSession.platform_fee,
        protection_fee: checkoutSession.protection_fee,
        estimated_total: checkoutSession.initial_amount,
      })
      .select('*')
      .single();

    if (bookingInsertError) {
      return json({ error: bookingInsertError.message }, 400);
    }

    createdBooking = insertedBooking;
    bookingId = insertedBooking.id;

    await adminClient
      .from('booking_checkout_sessions')
      .update({ status: 'paid' })
      .eq('id', checkoutSessionId);
  }

  const { data: updatedPaymentOrder, error: updateError } = await adminClient
    .from('payment_orders')
    .update({
      booking_id: bookingId,
      status: 'captured',
      provider_order_id: razorpayOrderId,
      provider_payment_id: razorpayPaymentId,
      provider_signature: razorpaySignature,
      amount_paid: paymentOrder.amount,
    })
    .eq('id', paymentOrder.id)
    .select('*')
    .single();

  if (updateError) {
    return json({ error: updateError.message }, 400);
  }

  if (bookingId) {
    const bookingUpdate = updatedPaymentOrder.payment_stage === 'booking_fee'
      ? {
          payment_status: 'booking_fee_paid',
          gateway_payment_id: razorpayPaymentId,
          payment_gateway: 'razorpay',
          gateway_order_id: razorpayOrderId,
          status: 'confirmed',
        }
      : {
          payment_status: 'paid',
          payment_completed_at: new Date().toISOString(),
          gateway_payment_id: razorpayPaymentId,
          status: 'completed',
        };

    await adminClient
      .from('bookings')
      .update(bookingUpdate)
      .eq('id', bookingId);

    if (updatedPaymentOrder.payment_stage === 'booking_fee') {
      await adminClient.rpc('dispatch_booking_to_available_technicians', {
        p_booking_id: bookingId,
      });
    }

    if (updatedPaymentOrder.payment_stage === 'final_invoice' && updatedPaymentOrder.technician_id) {
      const { data: completionReport } = await adminClient
        .from('booking_completion_reports')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (completionReport) {
        await adminClient.from('technician_payout_requests').insert({
          technician_id: updatedPaymentOrder.technician_id,
          booking_id: bookingId,
          payment_order_id: updatedPaymentOrder.id,
          status: 'pending',
          gross_amount: completionReport.final_customer_total ?? updatedPaymentOrder.amount,
          visit_fee_amount: completionReport.final_visit_charge ?? updatedPaymentOrder.visit_fee_amount ?? 0,
          labour_amount: completionReport.final_labour_amount ?? updatedPaymentOrder.labour_amount ?? 0,
          parts_amount: completionReport.final_parts_amount ?? updatedPaymentOrder.parts_amount ?? 0,
          platform_fee_amount: completionReport.platform_fee_amount ?? updatedPaymentOrder.platform_fee_amount ?? 0,
          commission_base_amount: completionReport.commissionable_total ?? updatedPaymentOrder.commission_base_amount ?? 0,
          commission_amount: completionReport.commission_amount ?? 0,
          net_amount: completionReport.technician_payout_amount ?? 0,
          notes: 'Auto-created after final invoice payment capture.',
        });
      }
    }
  }

  return json({
    paymentOrder: updatedPaymentOrder,
    booking: createdBooking,
    verified: true,
  });
});
