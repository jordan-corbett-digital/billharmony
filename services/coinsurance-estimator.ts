// Coinsurance Estimator - Estimates coinsurance percentage based on plan type and payer
// This provides better defaults than a flat 20%

import { PlanType } from '../types';

/**
 * Estimate coinsurance percentage based on plan type and payer
 * 
 * Coinsurance is the percentage you pay after your deductible is met.
 * Common values:
 * - HMO: Usually 0% (copay only, no coinsurance)
 * - PPO: Usually 10-30% (most common is 20%)
 * - EPO: Usually 10-20%
 * - POS: Usually 20-30%
 * 
 * Some payers have typical patterns:
 * - BCBS: Often 20% for PPO
 * - Aetna: Often 20% for PPO
 * - UnitedHealthcare: Often 20-30% for PPO
 * - Cigna: Often 20% for PPO
 * - Medicare: Usually 20% for Part B
 */
export function estimateCoinsurance(planType: PlanType, payer?: string): number {
  // Base estimate by plan type
  let baseCoinsurance: number;
  
  switch (planType) {
    case 'HMO':
      // HMO plans typically use copays, not coinsurance
      // But if coinsurance applies, it's usually 0-10%
      baseCoinsurance = 0.0; // Most HMOs use copays only
      break;
    case 'PPO':
      // PPO plans commonly have 20% coinsurance
      baseCoinsurance = 0.2; // 20% is most common
      break;
    case 'EPO':
      // EPO plans are similar to PPO but often slightly lower
      baseCoinsurance = 0.15; // 15% is common
      break;
    case 'POS':
      // POS plans often have higher coinsurance
      baseCoinsurance = 0.25; // 25% is common
      break;
    default:
      baseCoinsurance = 0.2; // Default to 20%
  }
  
  // Adjust based on payer if known
  if (payer) {
    const payerLower = payer.toLowerCase();
    
    // Medicare typically has 20% coinsurance for Part B
    if (payerLower.includes('medicare')) {
      return 0.2;
    }
    
    // Medicaid typically has very low or no coinsurance
    if (payerLower.includes('medicaid')) {
      return 0.0;
    }
    
    // Most commercial insurers (BCBS, Aetna, UHC, Cigna) use 20% for PPO
    if (payerLower.includes('bcbs') || 
        payerLower.includes('blue cross') || 
        payerLower.includes('blue shield') ||
        payerLower.includes('aetna') ||
        payerLower.includes('cigna')) {
      // If it's a PPO, use 20%, otherwise use plan type default
      if (planType === 'PPO') {
        return 0.2;
      }
    }
    
    // UnitedHealthcare often uses 20-30% for PPO
    if (payerLower.includes('united') || payerLower.includes('uhc')) {
      if (planType === 'PPO') {
        return 0.25; // Slightly higher
      }
    }
    
    // Kaiser typically uses copays, minimal coinsurance
    if (payerLower.includes('kaiser')) {
      return 0.1; // 10% if coinsurance applies
    }
  }
  
  return baseCoinsurance;
}

/**
 * Get a human-readable explanation of coinsurance
 */
export function getCoinsuranceExplanation(coinsurance: number): string {
  const percent = Math.round(coinsurance * 100);
  
  if (coinsurance === 0) {
    return 'Your plan uses copays instead of coinsurance.';
  }
  
  return `After your deductible is met, you pay ${percent}% of the allowed amount, and your insurance pays the remaining ${100 - percent}%.`;
}


