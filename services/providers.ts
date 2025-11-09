// Provider recommendation service

import { Provider, RecommendedProvider, ProcedureIntent, CostProfile } from '../types';
import { getProvidersNearZip, findProviderByName, calculateDistance } from './data';
import { loadRegionalBenchmark } from './data';
import { getRecommendedPrice } from './pricing-data';
import { calcPatientCost } from './pricing';

/**
 * Get recommended providers for a procedure
 */
export async function getRecommendedProviders(
  procedureIntent: ProcedureIntent,
  userZip: string,
  preferredProviderNames: string[],
  costProfile: CostProfile,
  limit: number = 3,
  eobProviderName?: string, // Provider name from EOB (if available, confirms in-network)
  userLat?: number, // User's latitude for distance calculation
  userLng?: number // User's longitude for distance calculation
): Promise<RecommendedProvider[]> {
  // Get providers near user
  const providers = await getProvidersNearZip(userZip, 20);

  // Determine what specialty/procedure type this is
  const procedureCategory = getProcedureCategory(procedureIntent);
  
  // Filter providers by specialty match - EXCLUDE irrelevant providers
  let relevantProviders = providers;
  if (procedureCategory) {
    relevantProviders = providers.filter(provider => {
      // Only include providers that have matching specialty
      // This prevents showing imaging centers for sleep studies, etc.
      return provider.specialties?.some(specialty => {
        const specialtyLower = specialty.toLowerCase();
        const categoryLower = procedureCategory.toLowerCase();
        return specialtyLower.includes(categoryLower) || 
               categoryLower.includes(specialtyLower);
      }) || false; // Exclude if no match
    });
    
    // If no providers match, fall back to general providers (but log warning)
    if (relevantProviders.length === 0) {
      console.warn(`⚠️ No providers found matching category "${procedureCategory}", using general providers`);
      relevantProviders = providers.filter(p => 
        p.specialties?.some(s => s.toLowerCase().includes('general')) || 
        !p.specialties || p.specialties.length === 0
      );
    }
  }

  // Calculate estimated prices for each provider
  const recommendations: RecommendedProvider[] = [];

  for (const provider of relevantProviders) {
    // Check if this is a preferred provider
    const isPreferred = preferredProviderNames.some(
      name => provider.name.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(provider.name.toLowerCase())
    );

    // Determine network status
    // Priority: 1) Provider matches EOB provider name (confirmed in-network from EOB)
    //          2) Preferred providers (user-specified, likely in-network)
    //          3) Provider network hint
    //          4) Default to in-network if user preference is set
    let isInNetwork = false;
    
    // Check if this provider matches the EOB provider (confirmed in-network)
    // EOBs only show in-network providers, so if provider name matches, they're confirmed in-network
    if (eobProviderName) {
      const providerNameLower = provider.name.toLowerCase();
      const eobProviderLower = eobProviderName.toLowerCase();
      if (providerNameLower.includes(eobProviderLower) || eobProviderLower.includes(providerNameLower)) {
        isInNetwork = true;
        console.log(`✅ Provider ${provider.name} confirmed in-network via EOB provider: ${eobProviderName}`);
      }
    }
    
    if (!isInNetwork) {
      if (isPreferred) {
        // Preferred providers are assumed to be in-network (user specified them)
        isInNetwork = true;
      } else if (provider.networkHint === 'in') {
        // Provider has explicit in-network hint
        isInNetwork = costProfile.inNetworkPreference;
      } else if (provider.networkHint === 'out') {
        // Provider has explicit out-of-network hint
        isInNetwork = false;
      } else {
        // Unknown - default based on user preference
        isInNetwork = costProfile.inNetworkPreference;
      }
    }

    // Check specialty match
    const hasMatchingSpecialty = procedureCategory && provider.specialties?.some(specialty =>
      specialty.toLowerCase().includes(procedureCategory.toLowerCase()) ||
      procedureCategory.toLowerCase().includes(specialty.toLowerCase())
    ) || false;

    // Calculate price using the SAME logic as the estimate
    // This ensures provider prices match the estimate pricing
    const primaryCpt = procedureIntent.cpts[0];
    const recommendedPrice = getRecommendedPrice(primaryCpt, userZip, true);
    
    // Use the same allowed amount as the estimate
    let allowedAmount = recommendedPrice.price;
    
    // If no price found, fall back to benchmark
    if (allowedAmount === 0) {
      const benchmark = await loadRegionalBenchmark(primaryCpt, userZip);
      if (benchmark) {
        allowedAmount = (benchmark.min + benchmark.max) / 2;
      } else {
        allowedAmount = 500; // Last resort fallback
      }
    }
    
    // Apply provider price bias (small variation based on provider)
    const priceMultiplier = getPriceMultiplier(provider.priceBias);
    const providerAllowedAmount = Math.round(allowedAmount * priceMultiplier);
    
    // Check if we should use copay (office visits only)
    const useCopay = isInNetwork && procedureIntent.cpts[0]?.startsWith('99') &&
      (costProfile.copays?.primaryCare || costProfile.copays?.specialist);
    
    let estimatedPrice: number;
    if (useCopay) {
      // Use copay for office visits
      estimatedPrice = costProfile.copays?.primaryCare || costProfile.copays?.specialist || 0;
    } else {
      // Calculate patient OOP cost for this provider (same logic as estimate)
      const costCalc = calcPatientCost(
        providerAllowedAmount,
        costProfile.deductibleRemaining,
        costProfile.normalizedCoinsurance,
        costProfile.normalizedOopMax
      );
      estimatedPrice = Math.round(costCalc.estimatedOop);
    }
    

    // Calculate distance from user location
    let distance: string;
    if (userLat && userLng && provider.lat && provider.lng) {
      const distanceMiles = calculateDistance(userLat, userLng, provider.lat, provider.lng);
      distance = distanceMiles < 0.1 
        ? '< 0.1 mi' 
        : distanceMiles < 1 
          ? `${distanceMiles.toFixed(1)} mi` 
          : `${Math.round(distanceMiles)} mi`;
    } else {
      // Fallback: estimate based on ZIP code match
      const userZipPrefix = userZip.substring(0, 3);
      const providerZipPrefix = provider.zip.substring(0, 3);
      if (userZipPrefix === providerZipPrefix) {
        distance = '0.5-2 mi'; // Same ZIP area
      } else {
        distance = '5-15 mi'; // Different ZIP area
      }
    }

    recommendations.push({
      provider,
      estimatedPrice,
      distance,
      isPreferred,
      isInNetwork,
    });
  }

  // Sort: preferred first, then specialty match, then in-network, then by price
  recommendations.sort((a, b) => {
    if (a.isPreferred !== b.isPreferred) {
      return a.isPreferred ? -1 : 1;
    }
    
    // Check specialty match (if procedure category exists)
    if (procedureCategory) {
      const aHasSpecialty = a.provider.specialties?.some(s => 
        s.toLowerCase().includes(procedureCategory.toLowerCase()) ||
        procedureCategory.toLowerCase().includes(s.toLowerCase())
      ) || false;
      const bHasSpecialty = b.provider.specialties?.some(s => 
        s.toLowerCase().includes(procedureCategory.toLowerCase()) ||
        procedureCategory.toLowerCase().includes(s.toLowerCase())
      ) || false;
      if (aHasSpecialty !== bHasSpecialty) {
        return aHasSpecialty ? -1 : 1;
      }
    }
    
    if (a.isInNetwork !== b.isInNetwork) {
      return a.isInNetwork ? -1 : 1;
    }
    return a.estimatedPrice - b.estimatedPrice;
  });

  return recommendations.slice(0, limit);
}

/**
 * Determine procedure category from CPT code or procedure intent
 */
function getProcedureCategory(procedureIntent: ProcedureIntent): string | null {
  const primaryCpt = procedureIntent.cpts[0];
  if (!primaryCpt) return null;
  
  // Sleep studies (95xxx)
  if (primaryCpt.startsWith('95')) {
    return 'Sleep Medicine';
  }
  
  // Imaging procedures (7xxxx)
  if (primaryCpt.startsWith('7')) {
    return 'Imaging';
  }
  
  // Physical therapy (97xxx)
  if (primaryCpt.startsWith('97')) {
    return 'Physical Therapy';
  }
  
  // Lab work (8xxxx)
  if (primaryCpt.startsWith('8')) {
    return 'Laboratory';
  }
  
  // Office visits (99xxx)
  if (primaryCpt.startsWith('99')) {
    return 'Primary Care';
  }
  
  // Surgery (1xxxx-6xxxx)
  if (primaryCpt.match(/^[1-6]/)) {
    return 'Surgery';
  }
  
  // Check procedure label for keywords
  const label = procedureIntent.label.toLowerCase();
  if (label.includes('sleep') || label.includes('polysomnography')) {
    return 'Sleep Medicine';
  }
  if (label.includes('physical therapy') || label.includes('pt')) {
    return 'Physical Therapy';
  }
  if (label.includes('imaging') || label.includes('mri') || label.includes('ct') || label.includes('ultrasound')) {
    return 'Imaging';
  }
  if (label.includes('surgery') || label.includes('surgical')) {
    return 'Surgery';
  }
  
  return null;
}


/**
 * Get price multiplier based on provider's price bias
 */
function getPriceMultiplier(bias: Provider['priceBias']): number {
  switch (bias) {
    case 'low':
      return 0.85; // 15% below average
    case 'high':
      return 1.25; // 25% above average
    case 'avg':
    default:
      return 1.0;
  }
}

