/**
 * Charity Eligibility Screening Service
 * Determines if a patient may qualify for charity care based on:
 * - Estimated out-of-pocket cost
 * - Income (if provided) or ZIP code demographics
 * - Household size (if provided)
 * - Federal poverty level guidelines
 */

export interface CharityEligibilityResult {
  isEligible: boolean;
  confidence: 'high' | 'medium' | 'low';
  estimatedReduction: number; // Amount that could be reduced
  eligibilityPercentage: number; // 0-100% of cost that could be covered
  message: string;
  criteria: {
    costThreshold: boolean; // Cost > 10% of income
    incomeThreshold: boolean; // Income < 400% FPL
    hardship: boolean; // Special circumstances
  };
}

export interface CharityScreeningInputs {
  estimatedOop: number;
  zipCode?: string;
  annualIncome?: number;
  householdSize?: number;
  hasInsurance: boolean;
  procedureType?: string;
}

/**
 * Federal Poverty Level (FPL) guidelines for 2024
 * Source: https://aspe.hhs.gov/poverty-guidelines
 */
const FPL_2024 = {
  1: 15760,   // 1 person household
  2: 21340,   // 2 person household
  3: 26920,   // 3 person household
  4: 32500,   // 4 person household
  5: 38080,   // 5 person household
  6: 43660,   // 6 person household
  7: 49240,   // 7 person household
  8: 54820,   // 8 person household
};

/**
 * Estimate median household income from ZIP code
 * Uses Census data approximations for common ZIP codes
 * In production, this would use a real API or database
 */
function estimateIncomeFromZip(zipCode: string): number | null {
  // Simplified estimation - in production, use Census API or similar
  // For now, return null to indicate we can't estimate
  // This allows the system to still work without income data
  return null;
}

/**
 * Get FPL threshold for household size
 */
function getFPLThreshold(householdSize: number): number {
  if (householdSize <= 0) return FPL_2024[1];
  if (householdSize <= 8) return FPL_2024[householdSize as keyof typeof FPL_2024];
  // For households > 8, add $5,460 per additional person
  return FPL_2024[8] + (householdSize - 8) * 5460;
}

/**
 * Check if patient may qualify for charity care
 */
export function checkCharityEligibility(inputs: CharityScreeningInputs): CharityEligibilityResult {
  const {
    estimatedOop,
    zipCode,
    annualIncome,
    householdSize = 1, // Default to 1 if not provided
    hasInsurance,
    procedureType,
  } = inputs;

  // Default result
  let result: CharityEligibilityResult = {
    isEligible: false,
    confidence: 'low',
    estimatedReduction: 0,
    eligibilityPercentage: 0,
    message: '',
    criteria: {
      costThreshold: false,
      incomeThreshold: false,
      hardship: false,
    },
  };

  // Try to get income
  let income = annualIncome;
  if (!income && zipCode) {
    income = estimateIncomeFromZip(zipCode);
  }

  // If we have income, do detailed screening
  if (income && income > 0) {
    const fplThreshold = getFPLThreshold(householdSize);
    const fplPercentage = (income / fplThreshold) * 100;

    // Criteria 1: Income < 400% of FPL (common charity care threshold)
    const incomeEligible = fplPercentage < 400;
    result.criteria.incomeThreshold = incomeEligible;

    // Criteria 2: Cost > 10% of annual income (financial hardship)
    const costPercentage = (estimatedOop / income) * 100;
    const costEligible = costPercentage > 10;
    result.criteria.costThreshold = costEligible;

    // Determine eligibility
    if (incomeEligible || costEligible) {
      result.isEligible = true;
      result.confidence = 'high';

      // Calculate estimated reduction based on income level
      if (fplPercentage < 200) {
        // < 200% FPL: Usually 100% coverage
        result.eligibilityPercentage = 100;
        result.estimatedReduction = estimatedOop;
        result.message = `Based on your income, you may qualify for full financial assistance. Your cost could be reduced to $0.`;
      } else if (fplPercentage < 300) {
        // 200-300% FPL: Usually 75-100% coverage
        result.eligibilityPercentage = 85;
        result.estimatedReduction = Math.round(estimatedOop * 0.85);
        result.message = `Based on your income, you may qualify for significant financial assistance. Your cost could be reduced to approximately $${Math.round(estimatedOop * 0.15)}.`;
      } else if (fplPercentage < 400) {
        // 300-400% FPL: Usually 50-75% coverage
        result.eligibilityPercentage = 60;
        result.estimatedReduction = Math.round(estimatedOop * 0.60);
        result.message = `Based on your income, you may qualify for partial financial assistance. Your cost could be reduced to approximately $${Math.round(estimatedOop * 0.40)}.`;
      } else if (costEligible) {
        // Income > 400% FPL but cost > 10% of income: Partial assistance possible
        result.eligibilityPercentage = 30;
        result.estimatedReduction = Math.round(estimatedOop * 0.30);
        result.message = `Given your procedure cost, you may qualify for partial financial assistance. Your cost could be reduced to approximately $${Math.round(estimatedOop * 0.70)}.`;
      }
    } else {
      result.message = `Based on your income, you may not qualify for charity care, but other assistance programs may be available.`;
    }
  } else {
    // No income data - use cost-based screening
    // If cost is high (>$500), suggest they may qualify
    if (estimatedOop > 500) {
      result.isEligible = true;
      result.confidence = 'medium';
      result.eligibilityPercentage = 50; // Unknown, estimate 50%
      result.estimatedReduction = Math.round(estimatedOop * 0.50);
      result.message = `Given your estimated cost of $${estimatedOop.toLocaleString()}, you may qualify for financial assistance. Complete an application to determine your eligibility.`;
      result.criteria.costThreshold = true;
    } else if (estimatedOop > 200) {
      result.isEligible = true;
      result.confidence = 'low';
      result.eligibilityPercentage = 30;
      result.estimatedReduction = Math.round(estimatedOop * 0.30);
      result.message = `You may qualify for financial assistance. Complete an application to determine your eligibility.`;
      result.criteria.costThreshold = true;
    } else {
      result.message = `Your estimated cost is relatively low. If you need assistance, payment plans may be available.`;
    }
  }

  // Special circumstances (hardship cases)
  // High-cost procedures often have more lenient criteria
  if (procedureType && ['surgery', 'emergency', 'cancer', 'chronic'].some(type => 
    procedureType.toLowerCase().includes(type)
  )) {
    if (estimatedOop > 1000) {
      result.criteria.hardship = true;
      if (!result.isEligible) {
        result.isEligible = true;
        result.confidence = 'medium';
        result.eligibilityPercentage = 40;
        result.estimatedReduction = Math.round(estimatedOop * 0.40);
        result.message = `For this type of procedure, you may qualify for financial assistance. Complete an application to determine your eligibility.`;
      }
    }
  }

  return result;
}

/**
 * Get charity care application URL or instructions
 */
export function getCharityApplicationInfo(hospitalName?: string): {
  url?: string;
  instructions: string;
  requiredDocuments: string[];
} {
  return {
    instructions: hospitalName
      ? `Contact ${hospitalName}'s financial assistance office to apply for charity care.`
      : `Contact your healthcare provider's financial assistance office to apply for charity care.`,
    requiredDocuments: [
      'Proof of income (tax returns, pay stubs, or benefits statements)',
      'Proof of household size',
      'Photo ID',
      'Recent bills or statements',
    ],
  };
}

