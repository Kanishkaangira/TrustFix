import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders, json } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

const buildAdminClient = () => createClient(supabaseUrl, supabaseServiceRoleKey);

const createBasicAuthHeader = () => `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`;

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

const getPaymentAmount = (booking: Record<string, unknown>, paymentStage: string) => {
  if (paymentStage === 'final_invoice') {
    return Number(booking.final_invoice_total ?? booking.estimated_total ?? 0);
  }

  return (
    Number(booking.visit_charge ?? 0)
    + Number(booking.platform_fee ?? 0)
    + Number(booking.protection_fee ?? 0)
  );
};

const normalizeText = (value: unknown) => {
  const nextValue = String(value ?? '').trim();
  return nextValue || null;
};

const normalizeUuid = (value: unknown) => normalizeText(value);

const createBookingCheckoutSession = async (
  adminClient: ReturnType<typeof buildAdminClient>,
  userId: string,
  bookingDraft: Record<string, unknown>,
) => {
  const serviceId = normalizeUuid(bookingDraft.service_id);
  const serviceProblemId = normalizeUuid(bookingDraft.service_problem_id);
  const addressId = normalizeUuid(bookingDraft.address_id);
  const severity = normalizeText(bookingDraft.severity);
  const customProblem = normalizeText(bookingDraft.custom_problem);
  const scheduledDate = normalizeText(bookingDraft.scheduled_date);
  const scheduledSlotLabel = normalizeText(bookingDraft.scheduled_slot_label);
  const protectionSelected = Boolean(bookingDraft.protection_selected);

  if (!serviceId) {
    return { data: null, error: { message: 'Service is required.' } };
  }

  if (!severity || !['minor', 'moderate', 'urgent'].includes(severity)) {
    return { data: null, error: { message: 'Severity is required.' } };
  }

  if (!serviceProblemId && !customProblem) {
    return { data: null, error: { message: 'Problem details are required.' } };
  }

  if (severity === 'minor' && (!scheduledDate || !scheduledSlotLabel)) {
    return {
      data: null,
      error: { message: 'Date and time slot are required for minor bookings.' },
    };
  }

  const { data: service, error: serviceError } = await adminClient
    .from('services')
    .select('id')
    .eq('id', serviceId)
    .eq('is_active', true)
    .maybeSingle();

  if (serviceError) {
    return { data: null, error: { message: serviceError.message } };
  }

  if (!service) {
    return { data: null, error: { message: 'Service not found.' } };
  }

  if (addressId) {
    const { data: address, error: addressError } = await adminClient
      .from('addresses')
      .select('id')
      .eq('id', addressId)
      .eq('user_id', userId)
      .maybeSingle();

    if (addressError) {
      return { data: null, error: { message: addressError.message } };
    }

    if (!address) {
      return { data: null, error: { message: 'Address not found.' } };
    }
  }

  if (serviceProblemId) {
    const { data: problem, error: problemError } = await adminClient
      .from('service_problems')
      .select('id, service_id')
      .eq('id', serviceProblemId)
      .eq('is_active', true)
      .maybeSingle();

    if (problemError) {
      return { data: null, error: { message: problemError.message } };
    }

    if (!problem || problem.service_id !== serviceId) {
      return {
        data: null,
        error: { message: 'Selected problem does not belong to this service.' },
      };
    }
  }

  const { data: pricing, error: pricingError } = await adminClient
    .from('booking_severity_pricing')
    .select('severity, visit_charge, platform_fee')
    .eq('severity', severity)
    .maybeSingle();

  if (pricingError) {
    return { data: null, error: { message: pricingError.message } };
  }

  if (!pricing) {
    return { data: null, error: { message: 'Pricing configuration is missing.' } };
  }

  const protectionFee = protectionSelected ? 19 : 0;
  const visitCharge = Number(pricing.visit_charge ?? 0);
  const platformFee = Number(pricing.platform_fee ?? 0);
  const initialAmount = visitCharge + platformFee + protectionFee;

  const { data: session, error: sessionError } = await adminClient
    .from('booking_checkout_sessions')
    .insert({
      user_id: userId,
      address_id: addressId,
      service_id: serviceId,
      service_problem_id: serviceProblemId,
      custom_problem: customProblem,
      severity,
      scheduled_date: severity === 'minor' ? scheduledDate : null,
      scheduled_slot_label: severity === 'minor' ? scheduledSlotLabel : null,
      protection_selected: protectionSelected,
      visit_charge: visitCharge,
      platform_fee: platformFee,
      protection_fee: protectionFee,
      initial_amount: initialAmount,
      status: 'created',
    })
    .select('*')
    .single();

  if (sessionError) {
    return { data: null, error: { message: sessionError.message } };
  }

  return { data: session, error: null };
};

const getPaymentBreakdown = (
  booking: Record<string, unknown>,
  paymentStage: string,
  completionReport: Record<string, unknown> | null,
) => {
  if (paymentStage === 'final_invoice') {
    return {
      platformFeeAmount: Number(booking.platform_fee ?? 0),
      visitFeeAmount: Number(completionReport?.final_visit_charge ?? booking.final_visit_charge ?? booking.visit_charge ?? 0),
      labourAmount: Number(completionReport?.final_labour_amount ?? booking.final_labour_charge ?? 0),
      partsAmount: Number(completionReport?.final_parts_amount ?? booking.final_parts_charge ?? 0),
      protectionFeeAmount: Number(booking.protection_fee ?? 0),
      urgencySurchargeAmount: Number(booking.urgency_surcharge ?? 0),
      commissionBaseAmount: Number(completionReport?.commissionable_total ?? 0),
      technicianSettlementAmount: Number(completionReport?.technician_payout_amount ?? 0),
      invoiceVersionNo: Number(completionReport?.version_no ?? 1),
    };
  }

  return {
    platformFeeAmount: Number(booking.platform_fee ?? 0),
    visitFeeAmount: Number(booking.visit_charge ?? 0),
    labourAmount: 0,
    partsAmount: 0,
    protectionFeeAmount: Number(booking.protection_fee ?? 0),
    urgencySurchargeAmount: Number(booking.urgency_surcharge ?? 0),
    commissionBaseAmount: 0,
    technicianSettlementAmount: 0,
    invoiceVersionNo: null,
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !razorpayKeyId || !razorpayKeySecret) {
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
    bookingId,
    bookingDraft,
    paymentStage = 'booking_fee',
  } = await req.json().catch(() => ({}));

  if (!['booking_fee', 'final_invoice'].includes(paymentStage)) {
    return json({ error: 'Invalid paymentStage.' }, 400);
  }

  let bookingRecord: Record<string, unknown> | null = null;
  let bookingError: { message: string } | null = null;
  let technicianId: string | null = null;
  let completionReport: Record<string, unknown> | null = null;
  let checkoutSession: Record<string, unknown> | null = null;

  if (paymentStage === 'booking_fee') {
    const checkoutSessionResult = await createBookingCheckoutSession(
      adminClient,
      user.id,
      bookingDraft ?? {},
    );

    if (checkoutSessionResult.error || !checkoutSessionResult.data) {
      return json({
        error: checkoutSessionResult.error?.message || 'Could not prepare the booking checkout.',
      }, 400);
    }

    checkoutSession = checkoutSessionResult.data;
    bookingRecord = null;
  } else {
    if (!bookingId) {
      return json({ error: 'BookingId is required for final invoice payment.' }, 400);
    }

    const bookingResult = await adminClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .maybeSingle();

    bookingRecord = bookingResult.data;
    bookingError = bookingResult.error ? { message: bookingResult.error.message } : null;

    if (bookingError) {
      return json({ error: bookingError.message }, 400);
    }

    if (!bookingRecord) {
      return json({ error: 'Booking not found.' }, 404);
    }
  }

  if (paymentStage === 'final_invoice') {
    const { data: completionReportData } = await adminClient
      .from('booking_completion_reports')
      .select('*')
      .eq('booking_id', bookingRecord.id)
      .maybeSingle();

    completionReport = completionReportData ?? null;
    technicianId = completionReportData?.technician_id ?? null;
  }

  const amount = paymentStage === 'booking_fee'
    ? Number(checkoutSession?.initial_amount ?? 0)
    : getPaymentAmount(bookingRecord as Record<string, unknown>, paymentStage);
  const breakdown = paymentStage === 'booking_fee'
    ? {
        platformFeeAmount: Number(checkoutSession?.platform_fee ?? 0),
        visitFeeAmount: Number(checkoutSession?.visit_charge ?? 0),
        labourAmount: 0,
        partsAmount: 0,
        protectionFeeAmount: Number(checkoutSession?.protection_fee ?? 0),
        urgencySurchargeAmount: 0,
        commissionBaseAmount: 0,
        technicianSettlementAmount: 0,
        invoiceVersionNo: null,
      }
    : getPaymentBreakdown(bookingRecord as Record<string, unknown>, paymentStage, completionReport);

  if (!amount || amount <= 0) {
    return json({ error: 'No payable amount found for this booking.' }, 400);
  }

  const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: createBasicAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: paymentStage === 'booking_fee'
        ? `${paymentStage}-${String(checkoutSession?.id ?? '').slice(0, 8)}`
        : `${paymentStage}-${bookingRecord?.booking_number ?? bookingRecord?.id}`,
      notes: {
        booking_id: bookingRecord?.id ? String(bookingRecord.id) : '',
        booking_number: String(bookingRecord?.booking_number ?? ''),
        payment_stage: paymentStage,
        checkout_session_id: String(checkoutSession?.id ?? ''),
      },
    }),
  });

  const razorpayPayload = await razorpayResponse.json().catch(() => null);

  if (!razorpayResponse.ok || !razorpayPayload?.id) {
    return json({
      error: razorpayPayload?.error?.description || 'Unable to create Razorpay order.',
    }, 400);
  }

  const { data: paymentOrder, error: paymentOrderError } = await adminClient
    .from('payment_orders')
    .insert({
      booking_id: bookingRecord?.id ?? null,
      user_id: user.id,
      technician_id: technicianId,
      provider: 'razorpay',
      payment_stage: paymentStage,
      status: 'order_created',
      collection_mode: 'online',
      currency: 'INR',
      amount,
      platform_fee_amount: breakdown.platformFeeAmount,
      visit_fee_amount: breakdown.visitFeeAmount,
      labour_amount: breakdown.labourAmount,
      parts_amount: breakdown.partsAmount,
      protection_fee_amount: breakdown.protectionFeeAmount,
      urgency_surcharge_amount: breakdown.urgencySurchargeAmount,
      commission_base_amount: breakdown.commissionBaseAmount,
      technician_settlement_amount: breakdown.technicianSettlementAmount,
      invoice_version_no: breakdown.invoiceVersionNo,
      receipt: paymentStage === 'booking_fee'
        ? `${paymentStage}-${String(checkoutSession?.id ?? '').slice(0, 8)}`
        : `${paymentStage}-${bookingRecord?.booking_number ?? bookingRecord?.id}`,
      provider_order_id: razorpayPayload.id,
      notes: {
        booking_number: bookingRecord?.booking_number ?? null,
        payment_stage: paymentStage,
        checkout_session_id: checkoutSession?.id ?? null,
        visit_charge: breakdown.visitFeeAmount,
        platform_fee: breakdown.platformFeeAmount,
        labour_amount: breakdown.labourAmount,
        parts_amount: breakdown.partsAmount,
        protection_fee: breakdown.protectionFeeAmount,
      },
    })
    .select('*')
    .single();

  if (paymentOrderError) {
    return json({ error: paymentOrderError.message }, 400);
  }

  if (paymentStage === 'booking_fee') {
    await adminClient
      .from('booking_checkout_sessions')
      .update({
        status: 'order_created',
      })
      .eq('id', checkoutSession?.id);
  } else {
    await adminClient
      .from('bookings')
      .update({
        payment_status: 'payment_requested',
        payment_requested_at: new Date().toISOString(),
        payment_gateway: 'razorpay',
        gateway_order_id: razorpayPayload.id,
      })
      .eq('id', bookingRecord?.id);
  }

  return json({
    paymentOrder,
    razorpay: {
      key: razorpayKeyId,
      orderId: razorpayPayload.id,
      amount: razorpayPayload.amount,
      currency: razorpayPayload.currency,
    },
  });
});
