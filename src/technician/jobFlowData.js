const FALLBACK_JOB_ID = 'job-ac';

const JOB_FLOW_RECORDS = {
  'job-ac': {
    id: 'job-ac',
    bookingNumber: 'TF-240041',
    service: 'AC Repair',
    serviceIcon: 'snowflake',
    serviceTone: 'amber',
    issue: 'No cooling / gas refill',
    issueSummary: 'Indoor unit is not cooling and customer suspects low gas pressure.',
    bookingType: 'Moderate',
    bookingStatus: 'Accepted',
    bookingStatusTone: 'emerald',
    severityLabel: 'Moderate',
    severityTone: 'amber',
    scheduledSlot: 'Today, 2:00 PM - 4:00 PM',
    reportedAt: 'Booked 58 min ago',
    customer: {
      name: 'Priya Sharma',
      initials: 'PS',
      phoneMasked: '+91 98765 3***',
      phoneUnlocked: '+91 98765 43210',
      note: 'Call on arrival. Lift access is available.',
    },
    location: {
      area: 'Karol Bagh, New Delhi',
      address: 'B-42, Karol Bagh, New Delhi - 110005',
      landmark: 'Near Liberty Cinema',
      distance: '2.3 km',
      eta: '8 min',
    },
    issueDetails: [
      '1.5 ton split AC, around 5 years old',
      'Cooling dropped since yesterday evening',
      'Customer requested same-day repair if estimate is approved',
    ],
    paymentModel: {
      mode: 'Online only',
      note: 'Customer gets one final online invoice after technician inspection and approval.',
    },
    fees: {
      visitCharge: 100,
      platformFee: 49,
    },
    planSnapshot: {
      name: 'Pro',
      commissionRate: 14,
      commissionRuleLabel: '14% commission on labour + parts only',
    },
    estimate: {
      diagnosis: 'Cooling is low due to gas pressure drop and dirty indoor filters.',
      labourCharge: 650,
      parts: [
        {
          id: 'gas-refill',
          name: 'R-32 gas refill',
          qty: 1,
          unitPrice: 480,
        },
      ],
      approvalStatus: 'pending',
      sentAt: '2:42 PM',
      approvedAt: null,
    },
    workboard: {
      checklist: [
        { id: 'inspect', label: 'Inspect indoor and outdoor unit', complete: true },
        { id: 'diagnose', label: 'Confirm fault and explain diagnosis', complete: true },
        { id: 'service', label: 'Complete repair or refill work', complete: false },
        { id: 'test', label: 'Run cooling performance test', complete: false },
      ],
      beforePhotos: 2,
      workPhotos: 1,
      afterPhotos: 0,
    },
  },
  'job-electric': {
    id: 'job-electric',
    bookingNumber: 'TF-240052',
    service: 'Electrical',
    serviceIcon: 'flash',
    serviceTone: 'sky',
    issue: 'Wiring issue',
    issueSummary: 'Switchboard trips frequently and one room has no power.',
    bookingType: 'Normal',
    bookingStatus: 'En Route',
    bookingStatusTone: 'amber',
    severityLabel: 'Normal',
    severityTone: 'sky',
    scheduledSlot: 'Today, 5:00 PM - 6:30 PM',
    reportedAt: 'Booked 20 min ago',
    customer: {
      name: 'Aman Verma',
      initials: 'AV',
      phoneMasked: '+91 98110 7***',
      phoneUnlocked: '+91 98110 76543',
      note: 'Please ring the bell once. Security gate needs flat number 401.',
    },
    location: {
      area: 'Rohini, Delhi',
      address: 'Flat 401, Sector 13, Rohini, Delhi - 110085',
      landmark: 'Near Japanese Park gate 2',
      distance: '3.4 km',
      eta: '14 min',
    },
    issueDetails: [
      'Main board tripped twice this week',
      'Bedroom sockets are not receiving power',
      'Customer wants wiring checked before replacement',
    ],
    paymentModel: {
      mode: 'Online only',
      note: 'Final estimate is approved by the customer before any repair amount is charged.',
    },
    fees: {
      visitCharge: 79,
      platformFee: 49,
    },
    planSnapshot: {
      name: 'Pro',
      commissionRate: 14,
      commissionRuleLabel: '14% commission on labour + parts only',
    },
    estimate: {
      diagnosis: 'Likely loose neutral connection near the bedroom switchboard.',
      labourCharge: 380,
      parts: [
        {
          id: 'wire-kit',
          name: 'Connector and insulation kit',
          qty: 1,
          unitPrice: 160,
        },
      ],
      approvalStatus: 'pending',
      sentAt: '5:08 PM',
      approvedAt: null,
    },
    workboard: {
      checklist: [
        { id: 'inspect', label: 'Inspect board and live points', complete: true },
        { id: 'diagnose', label: 'Trace neutral issue', complete: false },
        { id: 'repair', label: 'Repair and secure wiring', complete: false },
        { id: 'test', label: 'Power-on verification', complete: false },
      ],
      beforePhotos: 1,
      workPhotos: 0,
      afterPhotos: 0,
    },
  },
  'job-plumbing': {
    id: 'job-plumbing',
    bookingNumber: 'TF-240067',
    service: 'Plumbing',
    serviceIcon: 'pipe-leak',
    serviceTone: 'rose',
    issue: 'Pipe leakage',
    issueSummary: 'Leak reported under kitchen sink and customer wants same-day attention.',
    bookingType: 'Moderate',
    bookingStatus: 'New Alert',
    bookingStatusTone: 'amber',
    severityLabel: 'Moderate',
    severityTone: 'amber',
    scheduledSlot: 'Today, 3:00 PM - 5:00 PM',
    reportedAt: 'Booked 4 min ago',
    customer: {
      name: 'Neha Bhatia',
      initials: 'NB',
      phoneMasked: '+91 98990 2***',
      phoneUnlocked: '+91 98990 23456',
      note: 'Water supply can be switched off from common valve near the sink.',
    },
    location: {
      area: 'Pitampura, Delhi',
      address: 'House 27, Pitampura, Delhi - 110034',
      landmark: 'Behind Dilli Haat food block',
      distance: '2.4 km',
      eta: '11 min',
    },
    issueDetails: [
      'Leak has been active since morning',
      'Customer uploaded image from sink cabinet',
      'Possible washer or joint replacement',
    ],
    paymentModel: {
      mode: 'Online only',
      note: 'Technician shares final repair estimate after inspection and customer approves it online.',
    },
    fees: {
      visitCharge: 100,
      platformFee: 49,
    },
    planSnapshot: {
      name: 'Pro',
      commissionRate: 14,
      commissionRuleLabel: '14% commission on labour + parts only',
    },
    estimate: {
      diagnosis: 'Leak may be from sink trap joint and worn washer.',
      labourCharge: 320,
      parts: [
        {
          id: 'washer-kit',
          name: 'Trap washer kit',
          qty: 1,
          unitPrice: 90,
        },
      ],
      approvalStatus: 'pending',
      sentAt: null,
      approvedAt: null,
    },
    workboard: {
      checklist: [
        { id: 'inspect', label: 'Inspect sink line and leakage source', complete: false },
        { id: 'diagnose', label: 'Prepare estimate and explain fix', complete: false },
        { id: 'repair', label: 'Replace joint / washer', complete: false },
        { id: 'test', label: 'Run water flow test', complete: false },
      ],
      beforePhotos: 1,
      workPhotos: 0,
      afterPhotos: 0,
    },
  },
};

const clampNumber = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
};

const normalizeParts = (parts = []) => (
  Array.isArray(parts)
    ? parts
        .filter(Boolean)
        .map((part) => ({
          id: String(part.id || '').trim() || `part-${Math.random().toString(36).slice(2, 8)}`,
          name: String(part.name || '').trim() || 'Custom part',
          qty: clampNumber(part.qty || 0),
          unitPrice: clampNumber(part.unitPrice || 0),
        }))
    : []
);

export const formatTechnicianCurrency = (value) => (
  `\u20B9${Math.round(clampNumber(value)).toLocaleString('en-IN')}`
);

export const getTechnicianJobFlow = (jobId = FALLBACK_JOB_ID) => (
  JOB_FLOW_RECORDS[String(jobId || '').trim()] || JOB_FLOW_RECORDS[FALLBACK_JOB_ID]
);

export const createEstimateDraft = (job) => ({
  diagnosis: job?.estimate?.diagnosis || '',
  labourCharge: String(clampNumber(job?.estimate?.labourCharge || 0)),
  parts: normalizeParts(job?.estimate?.parts || []).map((part) => ({
    ...part,
    qtyText: String(part.qty || 1),
    unitPriceText: String(part.unitPrice || 0),
  })),
  approvalStatus: job?.estimate?.approvalStatus || 'draft',
  sentAt: job?.estimate?.sentAt || null,
  approvedAt: job?.estimate?.approvedAt || null,
});

export const buildJobFinancials = ({ job, estimateDraft }) => {
  const resolvedJob = job || getTechnicianJobFlow();
  const labourCharge = clampNumber(estimateDraft?.labourCharge || resolvedJob.estimate.labourCharge);
  const parts = normalizeParts(estimateDraft?.parts || resolvedJob.estimate.parts);
  const partsSubtotal = parts.reduce(
    (sum, part) => sum + (clampNumber(part.qty) * clampNumber(part.unitPrice)),
    0,
  );
  const commissionBase = labourCharge + partsSubtotal;
  const commissionRate = clampNumber(resolvedJob.planSnapshot?.commissionRate || 0);
  const commissionAmount = Math.round((commissionBase * commissionRate) / 100);
  const customerTotal =
    clampNumber(resolvedJob.fees.visitCharge) +
    clampNumber(resolvedJob.fees.platformFee) +
    commissionBase;
  const technicianPayout =
    clampNumber(resolvedJob.fees.visitCharge) +
    commissionBase -
    commissionAmount;
  const platformEarnings =
    clampNumber(resolvedJob.fees.platformFee) +
    commissionAmount;

  return {
    labourCharge,
    parts,
    partsSubtotal,
    commissionBase,
    commissionRate,
    commissionAmount,
    customerTotal,
    technicianPayout,
    platformEarnings,
  };
};

export { FALLBACK_JOB_ID };
