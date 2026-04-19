export const technicianProfile = {
  name: 'Ramesh Kumar',
  initials: 'RK',
  plan: 'PRO',
  verified: true,
  rating: '4.8',
  phone: '+91 98765 43210',
  completionRate: '98%',
  jobsDone: '62',
  onPlatform: '45 days',
  serviceArea: 'North Delhi, Central Delhi',
  reviewCount: '62 reviews',
  monthlyPlan: 'Renews May 1 · ₹599/month',
  services: ['AC Repair', 'Electrical', 'Plumbing', 'Fan/Geyser'],
};

export const dashboardStats = {
  today: '₹1,240',
  todayJobs: '4 jobs done',
  month: '₹18,600',
  monthJobs: '62 jobs done',
};

export const jobAlert = {
  title: 'Plumbing - Pipe Leak',
  bookingType: 'Moderate booking · Same day',
  area: 'Pitampura, Delhi',
  distance: '2.4 km away',
  visitCut: '₹70 guaranteed',
  timeSlot: '3:00 - 5:00 PM',
  countdown: '2:47',
};

export const technicianJobs = [
  {
    id: 'job-ac',
    icon: 'snowflake',
    iconBg: 'amber',
    title: 'AC Repair',
    issue: 'Gas Refill',
    area: 'Karol Bagh, Delhi',
    slot: '2:00 PM slot',
    visitText: 'Visit ₹40 earned',
    status: 'In Progress',
    statusTone: 'emerald',
    type: 'Normal',
  },
  {
    id: 'job-electric',
    icon: 'flash',
    iconBg: 'sky',
    title: 'Electrical',
    issue: 'Wiring Issue',
    area: 'Rohini, Delhi',
    slot: '5:00 PM slot',
    visitText: 'Normal booking',
    status: 'En Route',
    statusTone: 'amber',
    type: 'Normal',
  },
];

export const jobDetail = {
  service: 'AC Repair',
  issue: 'Gas Refill / No cooling',
  customer: 'Priya Sharma',
  initials: 'P',
  phoneMasked: '📞 ••••',
  phoneUnlocked: '+91 98765 43210',
  address: 'B-42, Karol Bagh, New Delhi - 110005',
  distance: '2.3 km from you',
  bookingType: 'Normal',
  timeSlot: 'Today, 2:00 PM',
  problem: 'AC not cooling',
  notes: '1.5 ton split AC, 5 years old',
  visitCut: '₹79',
  labourHint: 'Your quoted price',
};

export const safetyOtp = {
  code: ['7', '3', '9', ''],
};

export const inProgressChecklist = [
  { id: 'inspect', label: 'Inspected AC unit', complete: true },
  { id: 'refill', label: 'Gas refill completed', complete: true },
  { id: 'cooling', label: 'Test cooling performance', complete: false },
  { id: 'final', label: 'Final inspection', complete: false },
];

export const photoEvidence = [
  { id: 'before', label: 'Before · Done', done: true },
  { id: 'work', label: 'Work · Done', done: true },
  { id: 'after', label: 'Add After photo', done: false },
];

export const completionBill = [
  { id: 'visit', label: 'Visit fee (paid)', value: '₹79', muted: true },
  { id: 'labour', label: 'Labour charge', value: '₹650' },
  { id: 'parts', label: 'Gas refill (R22 500g)', value: '₹480' },
];

export const earningsSummary = {
  month: 'April 2025',
  total: '₹18,600',
  subtitle: '62 jobs · Pro plan',
  today: '₹1,240',
  jobsDone: '4',
  commission: '₹0',
};

export const earningsTransactions = [
  {
    id: 'earn-1',
    icon: 'snowflake',
    iconBg: 'amber',
    title: 'AC Repair',
    subtitle: 'Visit ₹79 + Labour ₹650',
    amount: '+₹729',
    tone: 'emerald',
  },
  {
    id: 'earn-2',
    icon: 'flash',
    iconBg: 'sky',
    title: 'Electrical',
    subtitle: 'Visit ₹79 + Labour ₹380',
    amount: '+₹459',
    tone: 'emerald',
  },
  {
    id: 'earn-3',
    icon: 'pipe-leak',
    iconBg: 'rose',
    title: 'Plumbing',
    subtitle: 'Visit ₹40 (Moderate) + Labour ₹0',
    amount: '+₹40',
    tone: 'amber',
  },
];

export const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Basic',
    subtitle: 'Part-time technicians',
    price: '₹299',
    suffix: '/mo',
    yearly: '₹2,990/year',
    accent: 'sky',
    features: [
      '30 job leads/month',
      'Verified badge',
      '0% commission ≤ ₹400',
      'No emergency jobs',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'Full-time recommended',
    price: '₹599',
    suffix: '/mo',
    yearly: '₹5,990/year',
    accent: 'coral',
    active: true,
    features: [
      'Unlimited job leads',
      'Priority queue placement',
      'Emergency jobs access',
      '0% commission ≤ ₹800',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    subtitle: 'Top earners',
    price: '₹999',
    suffix: '/mo',
    yearly: '₹9,990/year',
    accent: 'gold',
    features: [
      'First pick on all jobs',
      'Featured on customer home',
      'Emergency first priority',
      '0% commission always ≤ ₹1,500',
    ],
  },
];
