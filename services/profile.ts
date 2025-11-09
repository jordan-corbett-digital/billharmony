// Profile utilities - build CostProfile from UserProfile

import { UserProfile, CostProfile } from '../types';

/**
 * Build CostProfile from UserProfile
 */
export function buildCostProfile(profile: UserProfile): CostProfile {
  const deductibleRemaining = Math.max(0, profile.deductibleTotal - profile.deductibleMet);
  const hasMetDeductible = deductibleRemaining === 0;

  return {
    userId: profile.id,
    deductibleRemaining,
    hasMetDeductible,
    needsPriorAuth: false, // Will be determined per procedure
    inNetworkPreference: profile.inNetworkPreference,
    normalizedDeductible: deductibleRemaining,
    normalizedCoinsurance: profile.coinsurance,
    normalizedOopMax: profile.oopMax,
  };
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

