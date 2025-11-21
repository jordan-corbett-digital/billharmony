/**
 * Assistance Programs Service
 * Provides database of financial assistance programs and matching logic
 */

export interface AssistanceProgram {
  id: string;
  name: string;
  type: 'charity' | 'payment-plan' | 'discount' | 'insurance-assistance' | 'prescription';
  description: string;
  eligibilityCriteria: string[];
  benefits: string[];
  applicationUrl?: string;
  phoneNumber?: string;
  requiredDocuments: string[];
  estimatedProcessingTime: string;
  icon: string; // Icon name for display
  priority: number; // Higher = more important/relevant
}

/**
 * Assistance Program Database
 * In production, this would come from a CMS or API
 */
export const ASSISTANCE_PROGRAMS: AssistanceProgram[] = [
  {
    id: 'charity-care',
    name: 'Charity Care Program',
    type: 'charity',
    description: 'Financial assistance for patients who cannot afford their medical bills. Coverage ranges from partial to full based on income and household size.',
    eligibilityCriteria: [
      'Income below 400% of Federal Poverty Level',
      'Financial hardship due to medical costs',
      'Uninsured or underinsured patients',
    ],
    benefits: [
      'Up to 100% bill reduction for eligible patients',
      'Based on income and household size',
      'Covers all medical services',
    ],
    requiredDocuments: [
      'Proof of income (tax returns, pay stubs)',
      'Proof of household size',
      'Photo ID',
      'Recent medical bills',
    ],
    estimatedProcessingTime: '2-4 weeks',
    icon: 'shieldCheck',
    priority: 10,
  },
  {
    id: 'payment-plan',
    name: 'Interest-Free Payment Plan',
    type: 'payment-plan',
    description: 'Spread your medical costs over time with an interest-free payment plan. Flexible terms based on your financial situation.',
    eligibilityCriteria: [
      'Any patient with outstanding balance',
      'No credit check required',
      'Minimum monthly payment varies',
    ],
    benefits: [
      'No interest charges',
      'Flexible payment terms (3-24 months)',
      'Automatic payment options available',
    ],
    requiredDocuments: [
      'Photo ID',
      'Recent bill or statement',
    ],
    estimatedProcessingTime: '1-2 business days',
    icon: 'cardPayment',
    priority: 8,
  },
  {
    id: 'sliding-scale',
    name: 'Sliding Scale Discount',
    type: 'discount',
    description: 'Receive a discount on your medical services based on your income level. The lower your income, the greater the discount.',
    eligibilityCriteria: [
      'Income below 300% of Federal Poverty Level',
      'Uninsured or high-deductible plan',
    ],
    benefits: [
      'Discounts from 20% to 80%',
      'Applied at time of service',
      'No application required for some services',
    ],
    requiredDocuments: [
      'Proof of income',
      'Photo ID',
    ],
    estimatedProcessingTime: '1 week',
    icon: 'star',
    priority: 7,
  },
  {
    id: 'prescription-assistance',
    name: 'Prescription Assistance Program',
    type: 'prescription',
    description: 'Help with prescription medication costs through manufacturer programs and pharmacy discounts.',
    eligibilityCriteria: [
      'Uninsured or underinsured',
      'Prescription not fully covered',
    ],
    benefits: [
      'Access to manufacturer patient assistance programs',
      'Pharmacy discount cards',
      'Generic medication options',
    ],
    requiredDocuments: [
      'Prescription information',
      'Insurance card (if applicable)',
    ],
    estimatedProcessingTime: '3-5 business days',
    icon: 'bloodTest',
    priority: 6,
  },
  {
    id: 'medicaid-navigator',
    name: 'Medicaid Enrollment Assistance',
    type: 'insurance-assistance',
    description: 'Free help enrolling in Medicaid or other government health insurance programs.',
    eligibilityCriteria: [
      'Income below state Medicaid threshold',
      'Not currently enrolled in Medicaid',
    ],
    benefits: [
      'Free enrollment assistance',
      'Help with application paperwork',
      'Coverage backdating if eligible',
    ],
    requiredDocuments: [
      'Proof of income',
      'Proof of citizenship/immigration status',
      'Social Security numbers for household',
    ],
    estimatedProcessingTime: '2-6 weeks',
    icon: 'shieldCheck',
    priority: 5,
  },
  {
    id: 'emergency-assistance',
    name: 'Emergency Financial Assistance',
    type: 'charity',
    description: 'Immediate financial assistance for emergency medical situations. Faster processing for urgent cases.',
    eligibilityCriteria: [
      'Emergency medical situation',
      'Financial hardship',
      'Unable to pay immediately',
    ],
    benefits: [
      'Expedited processing (24-48 hours)',
      'Temporary payment deferral',
      'Connection to other assistance programs',
    ],
    requiredDocuments: [
      'Proof of emergency situation',
      'Recent medical bills',
      'Proof of income',
    ],
    estimatedProcessingTime: '24-48 hours',
    icon: 'warningTriangle',
    priority: 9,
  },
];

/**
 * Match assistance programs to user's situation
 */
export function getRecommendedPrograms(inputs: {
  estimatedOop: number;
  hasInsurance: boolean;
  zipCode?: string;
  procedureType?: string;
  isEmergency?: boolean;
}): AssistanceProgram[] {
  const { estimatedOop, hasInsurance, procedureType, isEmergency } = inputs;

  // Start with all programs
  let programs = [...ASSISTANCE_PROGRAMS];

  // Filter and prioritize based on situation
  programs = programs.filter(program => {
    // Emergency programs for emergency situations
    if (isEmergency && program.id === 'emergency-assistance') {
      return true;
    }

    // High-cost procedures get charity care priority
    if (estimatedOop > 1000 && program.type === 'charity') {
      return true;
    }

    // Payment plans for any situation
    if (program.type === 'payment-plan') {
      return true;
    }

    // Insurance assistance for uninsured
    if (!hasInsurance && program.type === 'insurance-assistance') {
      return true;
    }

    // Discounts for moderate costs
    if (estimatedOop > 200 && estimatedOop < 1000 && program.type === 'discount') {
      return true;
    }

    // Prescription assistance for medication-related procedures
    if (procedureType && (
      procedureType.toLowerCase().includes('prescription') ||
      procedureType.toLowerCase().includes('medication') ||
      procedureType.toLowerCase().includes('pharmacy')
    ) && program.type === 'prescription') {
      return true;
    }

    return false;
  });

  // Sort by priority (higher first), then by name
  programs.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return a.name.localeCompare(b.name);
  });

  // Return top 5 most relevant
  return programs.slice(0, 5);
}

/**
 * Get all available programs (for the assistance hub page)
 */
export function getAllPrograms(): AssistanceProgram[] {
  return [...ASSISTANCE_PROGRAMS].sort((a, b) => b.priority - a.priority);
}


