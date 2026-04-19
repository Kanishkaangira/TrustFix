const DEFAULT_PRICING = {
  visitCharge: 0,
  platformFee: 0,
  urgencySurcharge: 0,
};

export const SEVERITY_PRICING = {
  minor: {
    visitCharge: 70,
    platformFee: 30,
  },
  moderate: {
    visitCharge: 100,
    platformFee: 50,
  },
  urgent: {
    visitCharge: 150,
    platformFee: 100,
  },
};

export const getSeverityPricing = ({
  severity = 'minor',
  pricingMatrix = null,
} = {}) => {
  const severityKey = String(severity || 'minor').trim();
  const resolvedPricing = (
    pricingMatrix
    && typeof pricingMatrix === 'object'
    && pricingMatrix[severityKey]
  ) || SEVERITY_PRICING[severityKey] || SEVERITY_PRICING.minor;

  return {
    ...DEFAULT_PRICING,
    visitCharge: resolvedPricing.visitCharge,
    platformFee: resolvedPricing.platformFee,
    urgencySurcharge: 0,
  };
};
