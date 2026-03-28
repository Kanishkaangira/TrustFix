// src/data/serviceProblems.js
// Single source of truth for all services and their problems
// Used by SelectService.js and SelectProblem.js

export const SERVICES = [
  { id: 'ac',          label: 'AC Repair',      icon: '❄️',  color: '#E8F4FD', accent: '#2196F3' },
  { id: 'electrician', label: 'Electrician',    icon: '⚡',  color: '#FFF8E1', accent: '#FFC107' },
  { id: 'plumbing',    label: 'Plumbing',       icon: '🔧',  color: '#E8F5E9', accent: '#4CAF50' },
  { id: 'appliance',   label: 'Appliance',      icon: '🏠',  color: '#FCE4EC', accent: '#E91E63' },
  { id: 'carpentry',   label: 'Carpentry',      icon: '🪚',  color: '#FBE9E7', accent: '#FF5722' },
  { id: 'cleaning',    label: 'Deep Cleaning',  icon: '🧹',  color: '#EDE7F6', accent: '#9C27B0' },
];

export const SERVICE_PROBLEMS = {
  ac: [
    { id: 'not_cooling',   label: 'Not Cooling',   icon: '🌡️', tag: 'Most Common', defaultSeverity: 'moderate' },
    { id: 'water_leaking', label: 'Water Leaking',  icon: '💧', tag: 'Common',      defaultSeverity: 'minor'    },
    { id: 'noisy_unit',    label: 'Noisy Unit',     icon: '🔊', tag: 'Minor',       defaultSeverity: 'minor'    },
    { id: 'wont_start',    label: "Won't Start",    icon: '⚡', tag: 'Urgent',      defaultSeverity: 'urgent'   },
    { id: 'poor_airflow',  label: 'Poor Airflow',   icon: '💨', tag: 'Minor',       defaultSeverity: 'minor'    },
    { id: 'gas_refill',    label: 'Gas Refill',     icon: '🧊', tag: 'Scheduled',   defaultSeverity: 'moderate' },
  ],
  electrician: [
    { id: 'no_power',        label: 'No Power',         icon: '🔌', tag: 'Urgent',   defaultSeverity: 'urgent'   },
    { id: 'short_circuit',   label: 'Short Circuit',    icon: '💥', tag: 'Urgent',   defaultSeverity: 'urgent'   },
    { id: 'fan_not_working', label: 'Fan Not Working',  icon: '🌀', tag: 'Common',   defaultSeverity: 'minor'    },
    { id: 'switch_sparking', label: 'Switch Sparking',  icon: '⚠️', tag: 'Urgent',   defaultSeverity: 'urgent'   },
    { id: 'flickering',      label: 'Light Flickering', icon: '💡', tag: 'Minor',    defaultSeverity: 'minor'    },
    { id: 'wiring_issue',    label: 'Wiring Issue',     icon: '🔧', tag: 'Moderate', defaultSeverity: 'moderate' },
  ],
  plumbing: [
    { id: 'pipe_leakage',  label: 'Pipe Leakage',   icon: '💧', tag: 'Urgent',   defaultSeverity: 'urgent'   },
    { id: 'blocked_drain', label: 'Blocked Drain',  icon: '🚿', tag: 'Common',   defaultSeverity: 'moderate' },
    { id: 'no_water',      label: 'No Water Flow',  icon: '🚰', tag: 'Urgent',   defaultSeverity: 'urgent'   },
    { id: 'tap_dripping',  label: 'Tap Dripping',   icon: '💦', tag: 'Minor',    defaultSeverity: 'minor'    },
    { id: 'toilet_issue',  label: 'Toilet Issue',   icon: '🚽', tag: 'Moderate', defaultSeverity: 'moderate' },
    { id: 'water_heater',  label: 'Water Heater',   icon: '♨️', tag: 'Moderate', defaultSeverity: 'moderate' },
  ],
  appliance: [
    { id: 'washing_machine', label: 'Washing Machine', icon: '🫧', tag: 'Common',   defaultSeverity: 'moderate' },
    { id: 'fridge',          label: 'Refrigerator',    icon: '🧊', tag: 'Common',   defaultSeverity: 'moderate' },
    { id: 'microwave',       label: 'Microwave',       icon: '📦', tag: 'Minor',    defaultSeverity: 'minor'    },
    { id: 'geyser',          label: 'Geyser',          icon: '♨️', tag: 'Common',   defaultSeverity: 'moderate' },
    { id: 'tv',              label: 'Television',      icon: '📺', tag: 'Minor',    defaultSeverity: 'minor'    },
    { id: 'chimney',         label: 'Chimney',         icon: '🏭', tag: 'Scheduled', defaultSeverity: 'minor'   },
  ],
  carpentry: [
    { id: 'door_repair',     label: 'Door Repair',     icon: '🚪', tag: 'Common',   defaultSeverity: 'minor'    },
    { id: 'furniture_fix',   label: 'Furniture Fix',   icon: '🪑', tag: 'Minor',    defaultSeverity: 'minor'    },
    { id: 'window_repair',   label: 'Window Repair',   icon: '🪟', tag: 'Minor',    defaultSeverity: 'minor'    },
    { id: 'cabinet_install', label: 'Cabinet Install', icon: '🗄️', tag: 'Scheduled', defaultSeverity: 'minor'  },
    { id: 'lock_repair',     label: 'Lock Repair',     icon: '🔒', tag: 'Urgent',   defaultSeverity: 'urgent'   },
    { id: 'custom_work',     label: 'Custom Work',     icon: '🔨', tag: 'Scheduled', defaultSeverity: 'minor'  },
  ],
  cleaning: [
    { id: 'full_home',     label: 'Full Home Clean',   icon: '🏠', tag: 'Popular',   defaultSeverity: 'minor' },
    { id: 'kitchen',       label: 'Kitchen Deep Clean',icon: '🍳', tag: 'Common',    defaultSeverity: 'minor' },
    { id: 'bathroom',      label: 'Bathroom Clean',    icon: '🚿', tag: 'Common',    defaultSeverity: 'minor' },
    { id: 'sofa',          label: 'Sofa Shampooing',   icon: '🛋️', tag: 'Popular',  defaultSeverity: 'minor' },
    { id: 'carpet',        label: 'Carpet Cleaning',   icon: '🧶', tag: 'Minor',     defaultSeverity: 'minor' },
    { id: 'post_construct',label: 'Post Construction', icon: '🧱', tag: 'Scheduled', defaultSeverity: 'minor' },
  ],
};

// Pricing engine — base prices per service
export const PRICING = {
  ac:          { visitCharge: 149, labourCost: 350, platformFee: 49 },
  electrician: { visitCharge: 99,  labourCost: 250, platformFee: 49 },
  plumbing:    { visitCharge: 99,  labourCost: 200, platformFee: 49 },
  appliance:   { visitCharge: 149, labourCost: 300, platformFee: 49 },
  carpentry:   { visitCharge: 99,  labourCost: 280, platformFee: 49 },
  cleaning:    { visitCharge: 0,   labourCost: 499, platformFee: 49 },
};

// Parts catalog — shown in PriceSummary
export const PARTS_CATALOG = {
  not_cooling:   { name: 'Gas R-32',        mrp: 900,  price: 750  },
  gas_refill:    { name: 'Gas R-32',        mrp: 900,  price: 750  },
  short_circuit: { name: 'MCB Switch',      mrp: 250,  price: 180  },
  wiring_issue:  { name: 'Copper Wire 2m',  mrp: 180,  price: 120  },
  pipe_leakage:  { name: 'PVC Pipe 1m',     mrp: 120,  price: 85   },
  tap_dripping:  { name: 'Tap Washer Kit',  mrp: 80,   price: 55   },
  geyser:        { name: 'Heating Element', mrp: 450,  price: 320  },
  fridge:        { name: 'Compressor Gas',  mrp: 600,  price: 480  },
};

export const REPAIR_PROTECTION_PRICE = 19;