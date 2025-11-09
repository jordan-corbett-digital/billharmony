// Data loading service - loads seed data files

import { Provider } from '../types';

export interface CPTBenchmark {
  cpt: string;
  description: string;
  min: number;
  max: number;
  source: string; // e.g., "CMS_PFS", "MRF_SAMPLE"
  regionalMultiplier?: number; // For regional adjustment
}

// Seed data - in production, this would come from a database or API
const CPT_BENCHMARKS: CPTBenchmark[] = [
  { cpt: '95810', description: 'Polysomnography, sleep study', min: 800, max: 1200, source: 'CMS_PFS' },
  { cpt: '72148', description: 'MRI lumbar spine w/o contrast', min: 550, max: 750, source: 'CMS_PFS' },
  { cpt: '73721', description: 'MRI lower extremity (knee) w/o contrast', min: 500, max: 700, source: 'CMS_PFS' },
  { cpt: '70450', description: 'CT head w/o contrast', min: 300, max: 500, source: 'CMS_PFS' },
  { cpt: '45378', description: 'Colonoscopy', min: 800, max: 1200, source: 'CMS_PFS' },
  { cpt: '99213', description: 'Office visit, established patient', min: 100, max: 200, source: 'CMS_PFS' },
  { cpt: '99214', description: 'Office visit, established patient (detailed)', min: 150, max: 250, source: 'CMS_PFS' },
  { cpt: '97110', description: 'Therapeutic exercise', min: 50, max: 100, source: 'CMS_PFS' },
  { cpt: '76700', description: 'Ultrasound, abdominal', min: 200, max: 400, source: 'CMS_PFS' },
  { cpt: '80053', description: 'Comprehensive metabolic panel', min: 50, max: 100, source: 'CMS_PFS' },
];

// Real providers for Joplin/Springfield, MO area
const PROVIDERS: Provider[] = [
  {
    id: 'mercy-joplin',
    name: 'Mercy Hospital Joplin',
    address: '100 Mercy Way',
    city: 'Joplin',
    state: 'MO',
    zip: '64801',
    lat: 37.0842,
    lng: -94.5133,
    networkHint: 'in',
    priceBias: 'avg',
    specialties: ['General', 'Imaging', 'Cardiology', 'Emergency'],
  },
  {
    id: 'mercy-springfield',
    name: 'Mercy Hospital Springfield',
    address: '1235 E Cherokee St',
    city: 'Springfield',
    state: 'MO',
    zip: '65804',
    lat: 37.2089,
    lng: -93.2923,
    networkHint: 'in',
    priceBias: 'avg',
    specialties: ['General', 'Imaging', 'Cardiology', 'Emergency'],
  },
  {
    id: 'cox-springfield',
    name: 'CoxHealth Springfield',
    address: '3801 S National Ave',
    city: 'Springfield',
    state: 'MO',
    zip: '65807',
    lat: 37.1614,
    lng: -93.2956,
    networkHint: 'in',
    priceBias: 'avg',
    specialties: ['General', 'Imaging', 'Cardiology', 'Emergency'],
  },
  {
    id: 'freeman-joplin',
    name: 'Freeman Health System',
    address: '1102 W 32nd St',
    city: 'Joplin',
    state: 'MO',
    zip: '64804',
    lat: 37.0708,
    lng: -94.5203,
    networkHint: 'in',
    priceBias: 'low',
    specialties: ['General', 'Imaging', 'Cardiology'],
  },
  {
    id: 'ozark-imaging',
    name: 'Ozark Imaging Center',
    address: '1965 S Fremont Ave',
    city: 'Springfield',
    state: 'MO',
    zip: '65804',
    lat: 37.1800,
    lng: -93.2800,
    networkHint: 'in',
    priceBias: 'low',
    specialties: ['Imaging'],
  },
  {
    id: 'springfield-pt',
    name: 'Springfield Physical Therapy',
    address: '1234 E Sunshine St',
    city: 'Springfield',
    state: 'MO',
    zip: '65804',
    lat: 37.1900,
    lng: -93.2700,
    networkHint: 'in',
    priceBias: 'low',
    specialties: ['Physical Therapy'],
  },
  {
    id: 'mercy-sleep-center',
    name: 'Mercy Sleep Center',
    address: '1965 S Fremont Ave, Suite 200',
    city: 'Springfield',
    state: 'MO',
    zip: '65804',
    lat: 37.1800,
    lng: -93.2800,
    networkHint: 'in',
    priceBias: 'avg',
    specialties: ['Sleep Medicine', 'General'],
  },
  {
    id: 'cox-sleep-medicine',
    name: 'CoxHealth Sleep Disorders Center',
    address: '3801 S National Ave, 4th Floor',
    city: 'Springfield',
    state: 'MO',
    zip: '65807',
    lat: 37.1614,
    lng: -93.2956,
    networkHint: 'in',
    priceBias: 'avg',
    specialties: ['Sleep Medicine', 'General'],
  },
  {
    id: 'freeman-sleep',
    name: 'Freeman Sleep Center',
    address: '1102 W 32nd St, 2nd Floor',
    city: 'Joplin',
    state: 'MO',
    zip: '64804',
    lat: 37.0708,
    lng: -94.5203,
    networkHint: 'in',
    priceBias: 'low',
    specialties: ['Sleep Medicine', 'General'],
  },
];

/**
 * Load regional benchmark for a CPT code
 * In production, this would query a database with regional adjustments
 */
export async function loadRegionalBenchmark(
  cpt: string,
  zipOrRegion: string
): Promise<CPTBenchmark | null> {
  // Find base benchmark
  const benchmark = CPT_BENCHMARKS.find(b => b.cpt === cpt);
  if (!benchmark) return null;

  // Apply regional multiplier (simplified - in production, use ZIP → CBSA mapping)
  // For MVP, we'll use a simple multiplier based on ZIP prefix
  const regionalMultiplier = getRegionalMultiplier(zipOrRegion);
  const adjustedMin = benchmark.min * regionalMultiplier;
  const adjustedMax = benchmark.max * regionalMultiplier;

  return {
    ...benchmark,
    min: Math.round(adjustedMin),
    max: Math.round(adjustedMax),
    regionalMultiplier,
  };
}

/**
 * Get regional cost multiplier based on ZIP code
 * Updated for Joplin/Springfield, MO area
 */
function getRegionalMultiplier(zip: string): number {
  // Extract first 3 digits of ZIP for region approximation
  const zipPrefix = zip.substring(0, 3);
  
  // Joplin, MO area (648xx) - slightly below national average
  if (zipPrefix === '648') {
    return 0.95; // 5% below baseline (rural Missouri)
  }
  
  // Springfield, MO area (658xx) - near national average
  if (zipPrefix === '658') {
    return 1.0; // At baseline (medium-sized city)
  }
  
  // High-cost areas (e.g., SF Bay Area, NYC, Boston)
  if (['940', '941', '100', '101', '021', '022'].includes(zipPrefix)) {
    return 1.4; // 40% above baseline
  }
  
  // Medium-cost areas
  if (['900', '902', '606', '303', '787'].includes(zipPrefix)) {
    return 1.2; // 20% above baseline
  }
  
  // Default (rural/low-cost) - Missouri average
  return 0.95;
}

/**
 * Get providers near a ZIP code
 */
export async function getProvidersNearZip(
  zip: string,
  limit: number = 10
): Promise<Provider[]> {
  // For MVP, return all providers (in production, filter by distance)
  return PROVIDERS.slice(0, limit);
}

/**
 * Find provider by name (fuzzy match)
 */
export function findProviderByName(name: string): Provider | null {
  const normalized = name.toLowerCase().trim();
  return (
    PROVIDERS.find(
      p =>
        p.name.toLowerCase().includes(normalized) ||
        normalized.includes(p.name.toLowerCase())
    ) || null
  );
}

/**
 * Calculate distance between two points (Haversine formula)
 * Returns distance in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

