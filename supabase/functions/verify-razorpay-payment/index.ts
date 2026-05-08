import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders, json } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';
const OTP_TABLE = 'verification_otps';

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

const roundCurrency = (value: unknown) => (
  Math.round(Number(value ?? 0) * 100) / 100
);

const normalizePlanCode = (value: unknown) => {
  const planCode = String(value ?? '').trim();
  return planCode || null;
};

const getCommissionScope = (value: unknown) => {
  const scope = String(value ?? '').trim();
  return scope === 'labour_only' ? 'labour_only' : 'labour_parts';
};

const getTechnicianCommissionConfig = async (
  adminClient: ReturnType<typeof buildAdminClient>,
  technicianId: string | null,
) => {
  const defaults = {
    planCodeSnapshot: null,
    commissionPercentSnapshot: 0,
    commissionScopeSnapshot: 'labour_parts',
    visitFeeCommissionableSnapshot: false,
  };

  if (!technicianId) {
    return defaults;
  }

  const { data: technicianProfile, error: technicianProfileError } = await adminClient
    .from('technician_profiles')
    .select('subscription_plan_code')
    .eq('id', technicianId)
    .maybeSingle();

  if (technicianProfileError) {
    return defaults;
  }

  const planCode = normalizePlanCode(technicianProfile?.subscription_plan_code);

  if (!planCode) {
    return defaults;
  }

  const { data: subscriptionPlan, error: subscriptionPlanError } = await adminClient
    .from('subscription_plans')
    .select('code, commission_percent, commission_scope, visit_fee_commissionable')
    .eq('code', planCode)
    .maybeSingle();

  if (subscriptionPlanError || !subscriptionPlan) {
    return {
      ...defaults,
      planCodeSnapshot: planCode,
    };
  }

  return {
    planCodeSnapshot: normalizePlanCode(subscriptionPlan.code),
    commissionPercentSnapshot: roundCurrency(subscriptionPlan.commission_percent ?? 0),
    commissionScopeSnapshot: getCommissionScope(subscriptionPlan.commission_scope),
    visitFeeCommissionableSnapshot: Boolean(subscriptionPlan.visit_fee_commissionable),
  };
};

const buildPayoutBreakdown = ({
  visitFeeAmount,
  labourAmount,
  partsAmount,
  commissionPercentSnapshot,
  commissionScopeSnapshot,
  visitFeeCommissionableSnapshot,
}: {
  visitFeeAmount: number,
  labourAmount: number,
  partsAmount: number,
  commissionPercentSnapshot: number,
  commissionScopeSnapshot: string,
  visitFeeCommissionableSnapshot: boolean,
}) => {
  const normalizedVisitFeeAmount = roundCurrency(visitFeeAmount);
  const normalizedLabourAmount = roundCurrency(labourAmount);
  const normalizedPartsAmount = roundCurrency(partsAmount);
  const normalizedCommissionPercent = roundCurrency(commissionPercentSnapshot);
  const normalizedCommissionScope = getCommissionScope(commissionScopeSnapshot);
  const commissionableVisitFeeAmount = visitFeeCommissionableSnapshot
    ? normalizedVisitFeeAmount
    : 0;
  const commissionableLabourAmount = normalizedLabourAmount;
  const commissionablePartsAmount = normalizedCommissionScope === 'labour_only'
    ? 0
    : normalizedPartsAmount;
  const commissionBaseAmount = roundCurrency(
    commissionableVisitFeeAmount
    + commissionableLabourAmount
    + commissionablePartsAmount,
  );
  const commissionAmount = roundCurrency(
    (commissionBaseAmount * normalizedCommissionPercent) / 100,
  );
  const grossAmount = roundCurrency(
    normalizedVisitFeeAmount
    + normalizedLabourAmount
    + normalizedPartsAmount,
  );
  const netAmount = roundCurrency(Math.max(grossAmount - commissionAmount, 0));

  return {
    grossAmount,
    visitFeeAmount: normalizedVisitFeeAmount,
    labourAmount: normalizedLabourAmount,
    partsAmount: normalizedPartsAmount,
    commissionableVisitFeeAmount,
    commissionableLabourAmount,
    commissionablePartsAmount,
    commissionBaseAmount,
    commissionAmount,
    netAmount,
  };
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
    const financialRecordId = String(
      paymentOrder.notes?.financial_record_id
      ?? paymentOrder.notes?.checkout_session_id
      ?? '',
    ).trim();

    if (!financialRecordId) {
      return json({ error: 'Booking financial record not found for this payment.' }, 400);
    }

    const { data: checkoutRecord, error: checkoutRecordError } = await adminClient
      .from('booking_financial_records')
      .select('*')
      .eq('id', financialRecordId)
      .eq('user_id', user.id)
      .eq('record_type', 'checkout')
      .maybeSingle();

    if (checkoutRecordError) {
      return json({ error: checkoutRecordError.message }, 400);
    }

    if (!checkoutRecord) {
      return json({ error: 'Booking financial record not found.' }, 404);
    }

    const { data: insertedBooking, error: bookingInsertError } = await adminClient
      .from('bookings')
      .insert({
        user_id: checkoutRecord.user_id,
        address_id: checkoutRecord.address_id,
        service_id: checkoutRecord.service_id,
        service_problem_id: checkoutRecord.service_problem_id,
        custom_problem: checkoutRecord.custom_problem,
        severity: checkoutRecord.severity,
        status: 'confirmed',
        scheduled_date: checkoutRecord.scheduled_date,
        scheduled_slot_label: checkoutRecord.scheduled_slot_label,
        protection_selected: checkoutRecord.protection_selected,
        visit_charge: checkoutRecord.visit_charge,
        platform_fee: checkoutRecord.platform_fee_amount,
        protection_fee: checkoutRecord.protection_fee_amount,
        estimated_total: checkoutRecord.initial_amount,
      })
      .select('*')
      .single();

    if (bookingInsertError) {
      return json({ error: bookingInsertError.message }, 400);
    }

    createdBooking = insertedBooking;
    bookingId = insertedBooking.id;

    await adminClient
      .from('booking_financial_records')
      .update({
        status: 'paid',
        booking_id: bookingId,
      })
      .eq('id', financialRecordId)
      .eq('record_type', 'checkout');
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
          status: 'work_completed',
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

    if (updatedPaymentOrder.payment_stage === 'final_invoice') {
      const { data: bookingRecord } = await adminClient
        .from('bookings')
        .select('id, technician_id')
        .eq('id', bookingId)
        .maybeSingle();

      const resolvedTechnicianId = updatedPaymentOrder.technician_id ?? bookingRecord?.technician_id ?? null;

        await adminClient
          .from(OTP_TABLE)
        .update({ status: 'expired' })
        .eq('booking_id', bookingId)
        .eq('purpose', 'completion_verification')
        .eq('status', 'generated');

      const { data: completionRecord } = await adminClient
        .from('booking_financial_records')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('record_type', 'completion')
        .maybeSingle();

      await adminClient
        .from('booking_financial_records')
        .update({
          status: 'paid',
          payment_completed_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingId)
        .eq('record_type', 'completion');

      if (resolvedTechnicianId) {
        const payoutCommissionConfig = await getTechnicianCommissionConfig(
          adminClient,
          resolvedTechnicianId,
        );
        const payoutBreakdown = buildPayoutBreakdown({
          visitFeeAmount: Number(
            completionRecord?.final_visit_charge
            ?? updatedPaymentOrder.visit_fee_amount
            ?? 0,
          ),
          labourAmount: Number(
            completionRecord?.final_labour_amount
            ?? updatedPaymentOrder.labour_amount
            ?? 0,
          ),
          partsAmount: Number(
            completionRecord?.final_parts_amount
            ?? updatedPaymentOrder.parts_amount
            ?? 0,
          ),
          commissionPercentSnapshot: payoutCommissionConfig.commissionPercentSnapshot,
          commissionScopeSnapshot: payoutCommissionConfig.commissionScopeSnapshot,
          visitFeeCommissionableSnapshot: payoutCommissionConfig.visitFeeCommissionableSnapshot,
        });

        await adminClient.from('technician_payout_requests').insert({
          technician_id: resolvedTechnicianId,
          booking_id: bookingId,
          payment_order_id: updatedPaymentOrder.id,
          status: 'pending',
          gross_amount: payoutBreakdown.grossAmount,
          visit_fee_amount: payoutBreakdown.visitFeeAmount,
          labour_amount: payoutBreakdown.labourAmount,
          parts_amount: payoutBreakdown.partsAmount,
          plan_code_snapshot: payoutCommissionConfig.planCodeSnapshot,
          commission_percent_snapshot: payoutCommissionConfig.commissionPercentSnapshot,
          commission_scope_snapshot: payoutCommissionConfig.commissionScopeSnapshot,
          visit_fee_commissionable_snapshot: payoutCommissionConfig.visitFeeCommissionableSnapshot,
          commissionable_visit_fee_amount: payoutBreakdown.commissionableVisitFeeAmount,
          commissionable_labour_amount: payoutBreakdown.commissionableLabourAmount,
          commissionable_parts_amount: payoutBreakdown.commissionablePartsAmount,
          commission_base_amount: payoutBreakdown.commissionBaseAmount,
          commission_amount: payoutBreakdown.commissionAmount,
          net_amount: payoutBreakdown.netAmount,
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

