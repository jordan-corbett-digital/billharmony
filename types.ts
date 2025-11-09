
export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
}

export interface CostBreakdownItem {
  name: string;
  amount: number;
  details: {
    transparencyFileRef: string;
    insurerRule: string;
    regionalCostRange: string;
    explanation: string;
  };
}

export interface FacilityOption {
  name: string;
  price: number;
  distance: string;
  rating: number;
  recommended?: boolean;
}

export interface BillLineItem {
  id: string;
  name: string;
  billedAmount: number;
  expectedRange: [number, number];
  tags: string[];
  details: {
    policyExcerpt: string;
    transparencyFileData: string;
    comparison: string;
    likelihoodOfError: string;
    suggestedAction: string;
  };
}

export interface InsurancePlan {
  name: string;
  memberId: string;
  groupNumber: string;
  deductible: {
    individual: number;
    family: number;
    individualMet: number;
    familyMet: number;
  };
  outOfPocketMax: {
    individual: number;
    family: number;
    individualMet: number;
    familyMet: number;
  };
}

// ===== NEW BILLHARMONY MVP TYPES =====

export type PlanType = 'HMO' | 'PPO' | 'EPO' | 'POS';

export interface EOBData {
  coinsurance?: number; // Actual coinsurance from EOB
  copays?: {
    primaryCare?: number;
    specialist?: number;
    urgentCare?: number;
    emergency?: number;
  };
  deductibleTotal?: number; // Verify against user input
  deductibleMet?: number;
  oopMax?: number;
  planType?: PlanType;
  memberId?: string;
  groupNumber?: string;
  payer?: string; // Insurance company from EOB
  allowedAmount?: number; // Example allowed amount from EOB
  lastEOBDate?: string;
  providerName?: string; // Provider name from EOB (if shown, they're in-network)
}

export interface UserProfile {
  id: string;
  name: string;
  zip: string;
  city?: string;
  state?: string;
  age?: number; // Age for preventive care eligibility
  payer: string; // e.g., "Aetna", "BCBS", "UnitedHealthcare"
  planType: PlanType;
  deductibleTotal: number;
  deductibleMet: number;
  coinsurance: number; // 0.0 to 1.0 (e.g., 0.2 = 20%)
  oopMax?: number;
  inNetworkPreference: boolean;
  preferredProviders: string[];
  eobData?: EOBData; // Extracted EOB data if available
  createdAt: string;
  updatedAt: string;
}

export interface CostProfile {
  userId: string;
  deductibleRemaining: number;
  hasMetDeductible: boolean;
  needsPriorAuth: boolean; // derived flag
  inNetworkPreference: boolean;
  // Normalized currency values
  normalizedDeductible: number;
  normalizedCoinsurance: number;
  normalizedOopMax?: number;
}

export interface ProcedureIntent {
  label: string; // Human-readable description
  cpts: string[]; // CPT/HCPCS codes
  siteOfService: 'inpatient' | 'outpatient' | 'freestanding' | 'home' | 'unknown';
  modifiers: string[];
  requiresPriorAuth: boolean;
  confidence: number; // 0-1
  flags?: {
    contrast?: boolean;
    sedation?: boolean;
    laterality?: 'left' | 'right' | 'bilateral';
    [key: string]: any;
  };
}

export interface PricingInputs {
  procedureIntent: ProcedureIntent;
  costProfile: CostProfile;
  region: string; // ZIP or CBSA code
  sourceTags: string[]; // e.g., ["CMS_PFS", "MRF_SAMPLE"]
  payer?: string; // Insurance payer name for preventive care checks
  planType?: string; // Plan type for preventive care checks
  eobData?: EOBData; // EOB data if available (for copays, actual coinsurance, etc.)
}

export interface PricingResult {
  allowedAmount: number;
  deductibleApplied: number;
  coinsuranceDue: number;
  estimatedOop: number;
  explanationBullets: string[];
  confidence: number; // 0-100
  totalBilled?: number;
  insuranceAdjustment?: number;
  regionalBenchmark?: {
    min: number;
    max: number;
    source: string;
  };
}

export interface Provider {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  networkHint: 'in' | 'out' | 'unknown';
  priceBias: 'low' | 'avg' | 'high';
  specialties?: string[];
}

export interface RecommendedProvider {
  provider: Provider;
  estimatedPrice: number;
  distance: string; // e.g., "2.1 mi"
  isPreferred: boolean;
  isInNetwork: boolean;
}

export interface Estimate {
  id: string;
  userId: string;
  title: string;
  procedureIntent: ProcedureIntent;
  inputsSnapshot: {
    profile: UserProfile;
    costProfile: CostProfile;
  };
  pricingInputs: PricingInputs;
  results: PricingResult;
  explanationBullets: string[];
  recommendedProviders: RecommendedProvider[];
  createdAt: string;
  updatedAt?: string;
}

export interface OnboardingMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface OnboardingState {
  messages: OnboardingMessage[];
  currentStep: 'location' | 'age' | 'eob' | 'insurance' | 'deductible' | 'coinsurance' | 'providers' | 'complete';
  collectedData: Partial<UserProfile>;
  isComplete: boolean;
  eobUploaded?: boolean; // Track if EOB was uploaded
}

export interface Appointment {
  id: string;
  date: string; // ISO date string
  doctor: string;
  specialty: string;
  visitType: string;
  estimatedOop: number;
  deductibleRemaining?: number; // Amount remaining to meet deductible
  confidence?: 'High' | 'Medium' | 'Low'; // AI confidence level
  createdAt: string;
}

// Note: BillAnalysis is imported from services/bill-analyzer.ts
// We use a type reference here to avoid circular dependencies
export type BillStatus = 'uploaded' | 'sent' | 'approved' | 'needs_review' | 'disputed' | 'trash';

export interface SavedBill {
  id: string;
  fileName: string;
  uploadedAt: string;
  analysis: any; // BillAnalysis from services/bill-analyzer.ts
  imageUrl?: string; // Data URL of the uploaded bill image
  provider?: string;
  dateOfService?: string;
  status?: BillStatus; // Defaults to 'uploaded' if not set
}
