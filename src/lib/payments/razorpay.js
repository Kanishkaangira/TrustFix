import { supabase } from '../supabase';
import { getPhoneDigits } from '../phone';
import RazorpayCheckout from 'react-native-razorpay';

// Safe to keep on the client: Razorpay key_id is public.
// Never store the key_secret in the app. Order creation/signature verification
// must happen in a trusted backend or Supabase Edge Function.
export const RAZORPAY_KEY_ID = 'rzp_test_SfGaWnanIcXH1n';
export const RAZORPAY_PROVIDER = 'razorpay';

const toAmount = (value) => Number(value || 0);
const toPaise = (value) => Math.round(toAmount(value) * 100);

export const getBookingFeeBreakdown = (booking = {}) => {
  const visitCharge = toAmount(booking.visit_charge ?? booking.visitCharge);
  const platformFee = toAmount(booking.platform_fee ?? booking.platformFee);
  const protectionFee = toAmount(booking.protection_fee ?? booking.protectionFee);
  const bookingFeeTotal = visitCharge + platformFee + protectionFee;

  return {
    visitCharge,
    platformFee,
    protectionFee,
    bookingFeeTotal,
  };
};

export const buildBookingPaymentOrderPayload = ({
  booking,
  userId,
  technicianId = null,
  notes = {},
}) => {
  const { bookingFeeTotal, visitCharge, platformFee, protectionFee } = getBookingFeeBreakdown(booking);
  const bookingId = booking?.id || null;
  const bookingNumber = String(booking?.booking_number || booking?.bookingNumber || '').trim();

  return {
    booking_id: bookingId,
    user_id: userId,
    technician_id: technicianId,
    provider: RAZORPAY_PROVIDER,
    payment_stage: 'booking_fee',
    status: 'created',
    currency: 'INR',
    amount: bookingFeeTotal,
    amount_paid: 0,
    amount_refunded: 0,
    receipt: bookingNumber ? `booking-${bookingNumber}` : null,
    notes: {
      booking_number: bookingNumber || null,
      visit_charge: visitCharge,
      platform_fee: platformFee,
      protection_fee: protectionFee,
      ...notes,
    },
  };
};

export const buildRazorpayCheckoutOptions = ({
  order,
  customer,
  description = 'TrustFix booking payment',
}) => ({
  key: RAZORPAY_KEY_ID,
  amount: toPaise(order?.amount),
  currency: order?.currency || 'INR',
  name: 'TrustFix',
  description,
  order_id: order?.provider_order_id || undefined,
  prefill: {
    name: customer?.fullName || customer?.full_name || '',
    email: customer?.email || '',
    contact: getPhoneDigits(customer?.phone || ''),
  },
  notes: order?.notes || {},
  theme: {
    color: '#FF6B2B',
  },
});

export const openRazorpayCheckout = async ({
  order,
  customer,
  description,
}) => RazorpayCheckout.open(buildRazorpayCheckoutOptions({
  order,
  customer,
  description,
}));

export const createBookingPaymentOrder = async ({
  booking,
  userId,
  technicianId = null,
  notes = {},
}) => {
  const payload = buildBookingPaymentOrderPayload({
    booking,
    userId,
    technicianId,
    notes,
  });

  return supabase.db.insert('payment_orders', payload, {
    single: true,
  });
};

export const initializeBookingFeePayment = async ({
  bookingDraft,
}) => supabase.functions.invoke('create-razorpay-order', {
  body: {
    bookingDraft,
    paymentStage: 'booking_fee',
  },
});

export const initializeFinalInvoicePayment = async ({
  bookingId,
}) => supabase.functions.invoke('create-razorpay-order', {
  body: {
    bookingId,
    paymentStage: 'final_invoice',
  },
});

export const verifyRazorpayPayment = async ({
  paymentOrderId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => supabase.functions.invoke('verify-razorpay-payment', {
  body: {
    paymentOrderId,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  },
});

export const logPaymentEvent = async ({
  paymentOrderId,
  bookingId,
  eventType,
  payload = {},
}) => supabase.db.insert('payment_events', {
  payment_order_id: paymentOrderId,
  booking_id: bookingId || null,
  provider: RAZORPAY_PROVIDER,
  event_type: eventType,
  payload,
}, {
  single: true,
});
