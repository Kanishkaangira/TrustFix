import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../lib/supabase';

const STORAGE_KEY = '@trustfix/service-catalog';

const SERVICE_UI_META = {
  ac: {
    icon: 'snowflake',
    accentColor: '#2563EB',
    lightColor: '#DBEAFE',
    tag: 'Popular',
  },
  plumbing: {
    icon: 'pipe-wrench',
    accentColor: '#16A34A',
    lightColor: '#DCFCE7',
    tag: 'Fast fix',
  },
  electrician: {
    icon: 'lightning-bolt',
    accentColor: '#D97706',
    lightColor: '#FEF3C7',
    tag: 'Safe care',
  },
  carpentry: {
    icon: 'hammer',
    accentColor: '#7C3AED',
    lightColor: '#EDE9FE',
    tag: 'Custom',
  },
  cleaning: {
    icon: 'broom',
    accentColor: '#E11D48',
    lightColor: '#FFE4E6',
    tag: 'Deep clean',
  },
  appliance: {
    icon: 'tools',
    accentColor: '#0D9488',
    lightColor: '#CCFBF1',
    tag: 'Expert',
  },
};

const FALLBACK_SERVICES = [
  {
    id: 'ac',
    dbId: null,
    label: 'AC Repair',
    shortLabel: 'AC Repair',
    helper: 'Cooling, noise, gas refill',
    subtitle: 'Cooling, service, gas refill',
    tag: 'Popular',
    icon: 'snowflake',
    accentColor: '#2563EB',
    iconColor: '#2563EB',
    lightColor: '#DBEAFE',
    startingAt: '\u20B9350',
    baseVisitCharge: 149,
    baseLabourCost: 350,
    platformFee: 49,
  },
  {
    id: 'plumbing',
    dbId: null,
    label: 'Plumbing',
    shortLabel: 'Plumbing',
    helper: 'Leaks, taps, blocked drains',
    subtitle: 'Leakage, taps, pipelines',
    tag: 'Fast fix',
    icon: 'pipe-wrench',
    accentColor: '#16A34A',
    iconColor: '#16A34A',
    lightColor: '#DCFCE7',
    startingAt: '\u20B9200',
    baseVisitCharge: 99,
    baseLabourCost: 200,
    platformFee: 49,
  },
  {
    id: 'electrician',
    dbId: null,
    label: 'Electrical',
    shortLabel: 'Electrician',
    helper: 'Wiring, switches, no power',
    subtitle: 'Wiring, switchboards, faults',
    tag: 'Safe care',
    icon: 'lightning-bolt',
    accentColor: '#D97706',
    iconColor: '#D97706',
    lightColor: '#FEF3C7',
    startingAt: '\u20B9250',
    baseVisitCharge: 99,
    baseLabourCost: 250,
    platformFee: 49,
  },
  {
    id: 'carpentry',
    dbId: null,
    label: 'Carpentry',
    shortLabel: 'Carpentry',
    helper: 'Doors, locks, cabinets',
    subtitle: 'Doors, furniture, fittings',
    tag: 'Custom',
    icon: 'hammer',
    accentColor: '#7C3AED',
    iconColor: '#7C3AED',
    lightColor: '#EDE9FE',
    startingAt: '\u20B9280',
    baseVisitCharge: 99,
    baseLabourCost: 280,
    platformFee: 49,
  },
  {
    id: 'cleaning',
    dbId: null,
    label: 'Deep Cleaning',
    shortLabel: 'Cleaning',
    helper: 'Kitchen, sofa, full home',
    subtitle: 'Home deep cleaning and upkeep',
    tag: 'Deep clean',
    icon: 'broom',
    accentColor: '#E11D48',
    iconColor: '#E11D48',
    lightColor: '#FFE4E6',
    startingAt: '\u20B9499',
    baseVisitCharge: 0,
    baseLabourCost: 499,
    platformFee: 49,
  },
  {
    id: 'appliance',
    dbId: null,
    label: 'Appliance Repair',
    shortLabel: 'Appliance',
    helper: 'Washer, fridge, microwave',
    subtitle: 'Repair for washer, fridge, microwave and more',
    tag: 'Expert',
    icon: 'tools',
    accentColor: '#0D9488',
    iconColor: '#0D9488',
    lightColor: '#CCFBF1',
    startingAt: '\u20B9300',
    baseVisitCharge: 149,
    baseLabourCost: 300,
    platformFee: 49,
  },
];

const FALLBACK_PROBLEMS_BY_SERVICE = {
  ac: [
    { id: 'not_cooling', dbId: null, label: 'Not Cooling', iconName: 'thermometer', tag: 'Most Common', defaultSeverity: 'moderate', estimatedPartsName: 'Gas R-32', estimatedPartsMrp: 900, estimatedPartsPrice: 750 },
    { id: 'water_leaking', dbId: null, label: 'Water Leaking', iconName: 'water', tag: 'Common', defaultSeverity: 'minor', estimatedPartsName: null, estimatedPartsMrp: null, estimatedPartsPrice: null },
    { id: 'noisy_unit', dbId: null, label: 'Noisy Unit', iconName: 'volume-high', tag: 'Minor', defaultSeverity: 'minor', estimatedPartsName: null, estimatedPartsMrp: null, estimatedPartsPrice: null },
    { id: 'wont_start', dbId: null, label: 'Won\'t Start', iconName: 'power', tag: 'Urgent', defaultSeverity: 'urgent', estimatedPartsName: null, estimatedPartsMrp: null, estimatedPartsPrice: null },
    { id: 'poor_airflow', dbId: null, label: 'Poor Airflow', iconName: 'weather-windy', tag: 'Minor', defaultSeverity: 'minor', estimatedPartsName: null, estimatedPartsMrp: null, estimatedPartsPrice: null },
    { id: 'gas_refill', dbId: null, label: 'Gas Refill', iconName: 'gas-cylinder', tag: 'Scheduled', defaultSeverity: 'moderate', estimatedPartsName: 'Gas R-32', estimatedPartsMrp: 900, estimatedPartsPrice: 750 },
  ],
};

const INITIAL_CATALOG = {
  services: FALLBACK_SERVICES,
  problemsByService: FALLBACK_PROBLEMS_BY_SERVICE,
  bookingSeverityPricing: {
    minor: { visitCharge: 70, platformFee: 30 },
    moderate: { visitCharge: 100, platformFee: 50 },
    urgent: { visitCharge: 150, platformFee: 100 },
  },
};

let catalog = INITIAL_CATALOG;
let hasHydrated = false;
let hydrationPromise = null;

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(catalog));
};

const formatCurrency = (value) => `\u20B9${Math.round(Number(value || 0))}`;

const buildProblemPreview = (problemNames = []) => {
  const cleanedNames = problemNames
    .map((name) => String(name || '').trim())
    .filter(Boolean)
    .slice(0, 3);

  return cleanedNames.join(', ');
};

const getServiceMeta = (slug = '', record = {}) => {
  const knownMeta = SERVICE_UI_META[String(slug || '').trim()] || {};
  const accentColor = String(record.accent_color || '').trim() || knownMeta.accentColor || '#FF6B2B';

  return {
    icon: String(record.icon_name || '').trim() || knownMeta.icon || 'tools',
    accentColor,
    lightColor: knownMeta.lightColor || '#FFF0E8',
    tag: knownMeta.tag || 'Trusted',
  };
};

const normalizeProblemRecord = (record = {}) => ({
  id: String(record.slug || '').trim(),
  dbId: record.id || null,
  serviceDbId: record.service_id || null,
  label: String(record.name || '').trim(),
  description: String(record.description || '').trim(),
  iconName: String(record.icon_name || '').trim() || 'tools',
  tag: String(record.tag || '').trim(),
  defaultSeverity: String(record.default_severity || 'minor').trim(),
  estimatedPartsName: record.estimated_parts_name || null,
  estimatedPartsMrp: record.estimated_parts_mrp ?? null,
  estimatedPartsPrice: record.estimated_parts_price ?? null,
  sortOrder: Number(record.sort_order || 0),
});

const normalizeCatalog = (nextCatalog) => {
  const candidate = nextCatalog && typeof nextCatalog === 'object'
    ? nextCatalog
    : INITIAL_CATALOG;

  const nextServices = Array.isArray(candidate.services)
    ? candidate.services.filter(Boolean)
    : INITIAL_CATALOG.services;

  const nextProblemsByService = candidate.problemsByService && typeof candidate.problemsByService === 'object'
    ? candidate.problemsByService
    : INITIAL_CATALOG.problemsByService;
  const nextBookingSeverityPricing = candidate.bookingSeverityPricing && typeof candidate.bookingSeverityPricing === 'object'
    ? candidate.bookingSeverityPricing
    : INITIAL_CATALOG.bookingSeverityPricing;

  return {
    services: nextServices,
    problemsByService: nextProblemsByService,
    bookingSeverityPricing: nextBookingSeverityPricing,
  };
};

const buildBookingSeverityPricing = (pricingRecords = []) => (
  pricingRecords.reduce((acc, record = {}) => {
    const severity = String(record.severity || '').trim();

    if (!severity) {
      return acc;
    }

    acc[severity] = {
      visitCharge: Number(record.visit_charge || 0),
      platformFee: Number(record.platform_fee || 0),
    };

    return acc;
  }, { ...INITIAL_CATALOG.bookingSeverityPricing })
);

const buildCatalogFromRecords = (serviceRecords = [], problemRecords = [], pricingRecords = []) => {
  const normalizedProblems = problemRecords
    .filter(Boolean)
    .map(normalizeProblemRecord);

  const groupedProblems = normalizedProblems.reduce((acc, problem) => {
    const key = String(problem.serviceDbId || '').trim();
    if (!key) {
      return acc;
    }

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(problem);
    return acc;
  }, {});

  const services = serviceRecords
    .filter(Boolean)
    .map((record) => {
      const serviceProblems = groupedProblems[record.id] || [];
      const previewText = buildProblemPreview(serviceProblems.map((item) => item.label));
      const meta = getServiceMeta(record.slug, record);
      const shortName = String(record.short_name || '').trim();
      const name = String(record.name || '').trim();
      const subtitle = String(record.description || '').trim() || previewText || 'Trusted home service';
      const startingValue = Number(record.base_labour_cost || record.base_visit_charge || 0);

      return {
        id: String(record.slug || '').trim(),
        dbId: record.id || null,
        label: name,
        shortLabel: shortName || name,
        helper: subtitle,
        subtitle,
        tag: meta.tag,
        icon: meta.icon,
        accentColor: meta.accentColor,
        iconColor: meta.accentColor,
        lightColor: meta.lightColor,
        startingAt: formatCurrency(startingValue),
        baseVisitCharge: Number(record.base_visit_charge || 0),
        baseLabourCost: Number(record.base_labour_cost || 0),
        platformFee: Number(record.platform_fee || 0),
      };
    });

  const problemsByService = services.reduce((acc, service) => {
    const serviceProblems = normalizedProblems
      .filter((problem) => problem.serviceDbId === service.dbId)
      .sort((left, right) => left.sortOrder - right.sortOrder);

    acc[service.id] = serviceProblems;
    return acc;
  }, {});

  return normalizeCatalog({
    services,
    problemsByService,
    bookingSeverityPricing: buildBookingSeverityPricing(pricingRecords),
  });
};

const persistCatalog = async (nextCatalog) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextCatalog));
  } catch (_) {}
};

export const getServiceCatalog = () => catalog;

export const getServices = () => catalog.services;

export const getServiceById = (serviceId) => (
  catalog.services.find((item) => item.id === serviceId) || null
);

export const getProblemsForService = (serviceId) => (
  catalog.problemsByService[String(serviceId || '').trim()] || []
);

export const getBookingSeverityPricing = () => catalog.bookingSeverityPricing || INITIAL_CATALOG.bookingSeverityPricing;

export const hydrateServiceCatalog = async () => {
  if (hasHydrated) {
    return catalog;
  }

  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = AsyncStorage.getItem(STORAGE_KEY)
    .then((storedValue) => {
      if (!storedValue) {
        return catalog;
      }

      const parsed = JSON.parse(storedValue);
      catalog = normalizeCatalog(parsed);
      notify();
      return catalog;
    })
    .catch(() => catalog)
    .finally(() => {
      hasHydrated = true;
      hydrationPromise = null;
    });

  return hydrationPromise;
};

export const subscribeToServiceCatalog = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const syncServiceCatalog = async () => {
  const [servicesResult, problemsResult, bookingPricingResult] = await Promise.all([
    supabase.db.select('services', {
      filters: [{ column: 'is_active', op: 'eq', value: true }],
      order: [{ column: 'sort_order', ascending: true }],
    }),
    supabase.db.select('service_problems', {
      filters: [{ column: 'is_active', op: 'eq', value: true }],
      order: [
        { column: 'service_id', ascending: true },
        { column: 'sort_order', ascending: true },
      ],
    }),
    supabase.db.select('booking_severity_pricing', {
      order: [{ column: 'sort_order', ascending: true }],
    }),
  ]);

  if (servicesResult.error) {
    return { data: catalog, error: servicesResult.error };
  }

  if (problemsResult.error) {
    return { data: catalog, error: problemsResult.error };
  }

  if (bookingPricingResult.error) {
    return { data: catalog, error: bookingPricingResult.error };
  }

  catalog = buildCatalogFromRecords(
    Array.isArray(servicesResult.data) ? servicesResult.data : [],
    Array.isArray(problemsResult.data) ? problemsResult.data : [],
    Array.isArray(bookingPricingResult.data) ? bookingPricingResult.data : [],
  );
  notify();
  persistCatalog(catalog);

  return { data: catalog, error: null };
};

hydrateServiceCatalog();
