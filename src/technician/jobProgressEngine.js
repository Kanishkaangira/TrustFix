import { supabase } from '../lib/supabase';

export const markTechnicianEnRoute = async (bookingId) => {
  return supabase.functions.invoke('mark-technician-en-route', {
    body: { bookingId },
  });
};

export const markTechnicianArrived = async (bookingId, options = {}) => {
  return supabase.functions.invoke('arrive-for-booking', {
    body: {
      bookingId,
      forceRegenerate: options.forceRegenerate === true,
      purpose: options.purpose || 'arrival_verification',
    },
  });
};

export const verifyTechnicianArrivalOtp = async ({ bookingId, otpCode, purpose = 'arrival_verification' }) => {
  return supabase.functions.invoke('verify-booking-arrival-otp', {
    body: {
      bookingId,
      otpCode,
      purpose,
    },
  });
};

export const sendTechnicianEstimate = async ({
  bookingId,
  labourCharge,
  partsCharge,
  note,
}) => {
  return supabase.functions.invoke('send-booking-estimate', {
    body: {
      bookingId,
      labourCharge,
      partsCharge,
      note,
    },
  });
};

export const generateTechnicianCompletionOtp = async (bookingId, options = {}) => {
  return markTechnicianArrived(bookingId, {
    ...options,
    purpose: 'completion_verification',
  });
};

export const verifyTechnicianCompletionOtp = async ({ bookingId, otpCode }) => {
  return supabase.functions.invoke('verify-booking-completion-otp', {
    body: {
      bookingId,
      otpCode,
    },
  });
};
