export const INDIA_COUNTRY_CODE = '+91';
export const PHONE_DIGITS_LENGTH = 10;
export const OTP_LENGTH = 6;

export const getPhoneDigits = (value = '') => (
  String(value || '').replace(/\D/g, '').slice(-PHONE_DIGITS_LENGTH)
);

export const formatPhoneDigits = (digits = '') => {
  const normalizedDigits = getPhoneDigits(digits);

  if (!normalizedDigits) {
    return '';
  }

  if (normalizedDigits.length <= 5) {
    return normalizedDigits;
  }

  return `${normalizedDigits.slice(0, 5)} ${normalizedDigits.slice(5)}`;
};

export const toE164Phone = (value = '') => {
  const digits = getPhoneDigits(value);
  return digits ? `${INDIA_COUNTRY_CODE}${digits}` : '';
};

export const formatDisplayPhone = (value = '') => {
  const digits = getPhoneDigits(value);
  return digits ? `${INDIA_COUNTRY_CODE} ${formatPhoneDigits(digits)}` : '';
};
