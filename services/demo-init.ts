// Demo initialization service
// Automatically sets up a default profile and demo data for showcasing the app

import { UserProfile, Estimate, SavedBill, Appointment, ProcedureIntent, PricingResult, RecommendedProvider, CostProfile } from '../types';
import { storageService } from './storage';
import { buildCostProfile } from './profile';
import { getProvidersNearZip } from './data';

/**
 * Initialize demo data if no profile exists
 * This allows the app to be used as a demo without requiring onboarding
 */
export async function initializeDemoData(): Promise<void> {
  // Check if profile already exists
  const existingProfile = storageService.getUserProfile();
  if (existingProfile) {
    // Profile exists - but ensure we have sample bills
    // Check if we have the demo bills (by ID)
    const existingBills = storageService.getBills();
    const hasDemoBills = existingBills.some(b => 
      b.id === 'bill-mri-demo' || b.id === 'bill-consultation-demo'
    );
    if (!hasDemoBills) {
      createSampleBills();
    }
    return;
  }

  // Create default demo profile
  const now = new Date().toISOString();
  const demoProfile: UserProfile = {
    id: 'demo-user-001',
    name: 'Sarah Johnson',
    zip: '64801',
    city: 'Joplin',
    state: 'MO',
    age: 42,
    payer: 'Aetna',
    planType: 'PPO',
    deductibleTotal: 2000,
    deductibleMet: 1500,
    coinsurance: 0.2, // 20%
    oopMax: 5000,
    inNetworkPreference: true,
    preferredProviders: ['CoxHealth', 'Mercy'],
    createdAt: now,
    updatedAt: now,
  };

  // Save profile
  storageService.saveUserProfile(demoProfile);
  storageService.setOnboardingComplete(true);

  // Build cost profile
  const costProfile = buildCostProfile(demoProfile);

  // Create Sleep Study estimate
  await createSleepStudyEstimate(demoProfile, costProfile);

  // Create sample bills
  createSampleBills();

  // Create appointment
  createSleepStudyAppointment(demoProfile, costProfile);
}

/**
 * Create a Sleep Study estimate with proper providers
 */
async function createSleepStudyEstimate(profile: UserProfile, costProfile: CostProfile): Promise<void> {
  const procedureIntent: ProcedureIntent = {
    label: 'Sleep Study',
    cpts: ['95810'],
    siteOfService: 'outpatient',
    modifiers: [],
    requiresPriorAuth: false,
    confidence: 0.95,
  };

  // Calculate pricing
  const allowedAmount = 737.5; // $590 / 0.8 (accounting for 20% coinsurance)
  const deductibleApplied = Math.min(costProfile.deductibleRemaining, 590);
  const remainingAfterDeductible = 590 - deductibleApplied;
  const coinsuranceDue = remainingAfterDeductible * profile.coinsurance;

  const pricingResult: PricingResult = {
    allowedAmount,
    deductibleApplied,
    coinsuranceDue,
    estimatedOop: 590,
    explanationBullets: [
      'Sleep study (CPT 95810) identified from your description',
      'Using CMS Physician Fee Schedule data for Joplin, MO area',
      `You have $${costProfile.deductibleRemaining.toFixed(0)} remaining on your deductible`,
      `After deductible, you'll pay 20% coinsurance`,
      'Estimated out-of-pocket: $590',
    ],
    confidence: 92,
    totalBilled: allowedAmount,
    insuranceAdjustment: allowedAmount - 590,
  };

  // Get sleep study providers
  const providers = await getProvidersNearZip(profile.zip, 50);
  const sleepProviders = providers.filter(p => 
    p.specialties?.some(s => s.toLowerCase().includes('sleep'))
  );

  // Create recommended providers
  const recommendedProviders: RecommendedProvider[] = sleepProviders.slice(0, 3).map(provider => {
    // All providers show $590 for consistency
    const priceVariation = provider.priceBias === 'low' ? 0.95 : provider.priceBias === 'high' ? 1.05 : 1.0;
    const providerPrice = Math.round(590 * priceVariation);
    
    return {
      provider: provider,
      estimatedPrice: providerPrice,
      distance: '2.5 mi', // Placeholder
      isInNetwork: provider.networkHint === 'in' || profile.inNetworkPreference,
      isPreferred: profile.preferredProviders?.some(pref => 
        provider.name.toLowerCase().includes(pref.toLowerCase()) ||
        pref.toLowerCase().includes(provider.name.toLowerCase())
      ) || false,
    };
  });

  const estimate: Estimate = {
    id: 'est-sleep-study-demo',
    userId: profile.id,
    title: 'Sleep Study',
    procedureIntent,
    inputsSnapshot: {
      profile,
      costProfile,
    },
    pricingInputs: {
      procedureIntent,
      costProfile,
      region: profile.zip,
      sourceTags: ['CMS_PFS'],
      payer: profile.payer,
      planType: profile.planType,
    },
    results: pricingResult,
    explanationBullets: pricingResult.explanationBullets,
    recommendedProviders,
    createdAt: new Date().toISOString(),
  };

  storageService.saveEstimate(estimate);
}

/**
 * Create sample bills for demo
 */
function createSampleBills(): void {
  const bills: SavedBill[] = [
    {
      id: 'bill-mri-demo',
      fileName: 'Mercy Hospital - MRI Bill.pdf',
      uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      provider: 'Mercy Hospital',
      dateOfService: '2024-01-15',
      status: 'needs_review',
      analysis: {
        billTotal: 2850,
        expectedTotal: 2200,
        difference: 650,
        lineItems: [
          {
            id: 'item-1',
            name: 'MRI KNEE WO/CONTR',
            cptCode: '73721',
            billedAmount: 2850,
            expectedRange: [2000, 2400],
            tags: ['Unexpected Charge'],
            details: {
              policyExcerpt: 'In-network MRI rates typically range from $2,000-$2,400',
              transparencyFileData: 'CMS data shows average allowed amount of $2,200',
              comparison: 'This charge is $650 higher than typical rates',
              likelihoodOfError: 'High - charge exceeds expected range by 27%',
              suggestedAction: 'Contact billing department to verify network status and negotiate rate',
            },
          },
        ],
        summary: {
          unexpectedCharges: 1,
          possibleDuplicates: 0,
          codingVerified: true,
          inNetworkConfirmed: true,
        },
        explanation: 'This MRI charge is $650 higher than typical rates for in-network facilities. The expected range for this CPT code is $2,000-$2,400.',
      },
    },
    {
      id: 'bill-consultation-demo',
      fileName: 'Dr. Smith - Consultation Bill.pdf',
      uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      provider: 'Dr. Smith Family Practice',
      dateOfService: '2024-01-20',
      status: 'approved',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2Y5ZmFmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM2YjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Eci4gU21pdGggQ29uc3VsdGF0aW9uPC90ZXh0Pjwvc3ZnPg==',
      analysis: {
        billTotal: 450,
        expectedTotal: 450,
        difference: 0,
        lineItems: [
          {
            id: 'item-1',
            name: 'Office Visit - Established Patient',
            cptCode: '99213',
            billedAmount: 150,
            expectedRange: [120, 180],
            tags: [],
            details: {
              policyExcerpt: 'Standard office visit charge',
              transparencyFileData: 'Charge is within expected range',
              comparison: 'Charge is within normal range',
              likelihoodOfError: 'Low',
              suggestedAction: 'No action needed',
            },
          },
          {
            id: 'item-2',
            name: 'Lab Work - Blood Test',
            cptCode: '80053',
            billedAmount: 300,
            expectedRange: [250, 350],
            tags: [],
            details: {
              policyExcerpt: 'Comprehensive metabolic panel',
              transparencyFileData: 'Charge is within expected range',
              comparison: 'Charge is within normal range',
              likelihoodOfError: 'Low',
              suggestedAction: 'No action needed',
            },
          },
        ],
        summary: {
          unexpectedCharges: 0,
          possibleDuplicates: 0,
          codingVerified: true,
          inNetworkConfirmed: true,
        },
        explanation: 'Great news! Your bill looks correct. All charges are within the expected ranges for these services. No action needed.',
      },
    },
  ];

  bills.forEach(bill => {
    storageService.saveBill(bill);
  });
}

/**
 * Create Sleep Study appointment
 */
function createSleepStudyAppointment(profile: UserProfile, costProfile: CostProfile): void {
  const appointment: Appointment = {
    id: 'apt-sleep-study-demo',
    date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    doctor: 'CoxHealth Sleep Disorders Center',
    specialty: 'Sleep Medicine',
    visitType: 'Sleep Study',
    estimatedOop: 590,
    deductibleRemaining: costProfile.deductibleRemaining,
    confidence: 'High',
    createdAt: new Date().toISOString(),
  };

  storageService.saveAppointment(appointment);
}

