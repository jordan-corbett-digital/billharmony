// Pricing Engine - Deterministic cost calculation logic

import { ProcedureIntent, CostProfile, PricingResult, PricingInputs } from '../types';
import { loadRegionalBenchmark } from './data';
import { getRecommendedPrice, getPriceRange } from './pricing-data';
import { isPreventiveCareProcedure, likelyCoversPreventiveCare, getPreventiveCareMessage } from './preventive-care';

/**
 * Calculate patient out-of-pocket cost based on insurance details
 */
export function calcPatientCost(
  allowedAmount: number,
  deductibleRemaining: number,
  coinsurance: number,
  oopMax?: number
): {
  deductibleApplied: number;
  coinsuranceDue: number;
  estimatedOop: number;
} {
  // Apply deductible
  const deductibleApplied = Math.min(deductibleRemaining, allowedAmount);
  const remainingAfterDed = allowedAmount - deductibleApplied;

  // Apply coinsurance
  const coinsuranceDue = remainingAfterDed * coinsurance;

  // Calculate total OOP
  let estimatedOop = deductibleApplied + coinsuranceDue;

  // Cap by OOP max if provided
  if (oopMax !== undefined) {
    estimatedOop = Math.min(estimatedOop, oopMax);
  }

  return {
    deductibleApplied,
    coinsuranceDue,
    estimatedOop,
  };
}

/**
 * Calculate confidence score for pricing estimate
 */
export function confidenceScore(
  nluConfidence: number,
  hasSiteOfService: boolean,
  regionalVariance: number, // coefficient of variation or range spread
  hasRegionalData: boolean
): number {
  let confidence = nluConfidence * 100; // Start with NLU confidence (0-1 -> 0-100)

  // Penalize if site of service is unknown
  if (!hasSiteOfService) {
    confidence *= 0.8;
  }

  // Penalize for high regional variance
  if (regionalVariance > 0.3) {
    confidence *= 0.85;
  } else if (regionalVariance > 0.15) {
    confidence *= 0.95;
  }

  // Penalize if no regional data available
  if (!hasRegionalData) {
    confidence *= 0.7;
  }

  return Math.round(Math.min(100, Math.max(0, confidence)));
}

/**
 * Main pricing engine function
 */
export async function runPricingEngine(inputs: PricingInputs): Promise<PricingResult> {
  const { procedureIntent, costProfile, region, payer, planType, eobData } = inputs;

  // Validate that we have at least one CPT code
  if (!procedureIntent.cpts || procedureIntent.cpts.length === 0) {
    console.error(`❌ No CPT codes found for procedure: ${procedureIntent.label}`);
    throw new Error(`Unable to generate estimate: No CPT code identified for "${procedureIntent.label}". Please try rephrasing your request.`);
  }

  // Get real pricing data (Phase 2)
  const primaryCpt = procedureIntent.cpts[0];
  
  console.log(`🔍 Pricing engine called for CPT ${primaryCpt} (${procedureIntent.label})`);
  
  // Check if this is preventive care
  const isPreventive = isPreventiveCareProcedure(primaryCpt, procedureIntent.label);
  const coversPreventive = likelyCoversPreventiveCare(payer, planType);
  const isCoveredAsPreventive = isPreventive && coversPreventive;
  
  if (isPreventive) {
    console.log(`🛡️ Preventive care detected for CPT ${primaryCpt}: ${procedureIntent.label}`);
    console.log(`   Insurance likely covers preventive: ${coversPreventive}`);
  }
  
  // PRIORITY 1: Use EOB allowed amount ONLY if we can verify it matches this CPT
  // NOTE: EOB allowedAmount is from a specific procedure on the EOB, not a general rate
  // We should NOT use it for different CPT codes as it will give wrong results
  let allowedAmount: number;
  let dataSource: string;
  let hasRealData: boolean;
  let isFromEOB = false;
  
  // IMPORTANT: EOB allowedAmount is from a specific procedure on the EOB
  // We should only use it if we know it matches the current CPT, or as a last resort
  // For now, we'll skip EOB allowedAmount and use real pricing data instead
  // This prevents using a $600 MRI rate for a $140 office visit
  
  // PRIORITY 1: Try to get recommended price from MRF/CMS data (most accurate for specific CPT)
  const recommendedPrice = getRecommendedPrice(primaryCpt, region, true);
  
  if (recommendedPrice.price > 0 && recommendedPrice.confidence > 0) {
    // Use real pricing data
    allowedAmount = recommendedPrice.price;
    dataSource = recommendedPrice.source;
    hasRealData = true;
    console.log(`✅ Using ${dataSource} data for CPT ${primaryCpt}: $${allowedAmount}`);
  } else {
    // PRIORITY 2: Fall back to benchmark system
    console.log(`⚠️ No MRF/CMS data found for CPT ${primaryCpt}, trying benchmark...`);
    const benchmark = await loadRegionalBenchmark(primaryCpt, region);
    if (benchmark) {
      allowedAmount = (benchmark.min + benchmark.max) / 2;
      dataSource = benchmark.source;
      hasRealData = false;
      console.log(`⚠️ Using benchmark ${dataSource} for CPT ${primaryCpt}: $${allowedAmount} (range: $${benchmark.min}-$${benchmark.max})`);
    } else {
      // PRIORITY 3: Last resort - use EOB allowedAmount as a rough estimate (but log warning)
      if (eobData?.allowedAmount && eobData.allowedAmount > 0) {
        allowedAmount = eobData.allowedAmount;
        dataSource = 'EOB (Your Insurance - Approximate)';
        hasRealData = false;
        isFromEOB = true;
        console.warn(`⚠️ Using EOB allowed amount as fallback: $${allowedAmount} (CPT ${primaryCpt}) - NOTE: This may not match the actual rate for this procedure`);
      } else {
        // Last resort: use a reasonable default based on CPT category
        allowedAmount = getDefaultPriceForCPT(primaryCpt);
        dataSource = 'ESTIMATE';
        hasRealData = false;
        console.error(`❌ No pricing data found for CPT ${primaryCpt}, using default: $${allowedAmount}`);
      }
    }
  }
  
  // Get price range for confidence calculation
  const priceRange = getPriceRange(primaryCpt, region);
  
  // Adjust for network status (if we know it's out-of-network, increase allowed amount)
  // Out-of-network rates are typically 2-3x higher and may not be covered
  // For now, we'll assume in-network unless explicitly told otherwise
  // TODO: Add network status detection from provider selection
  const networkMultiplier = 1.0; // 1.0 = in-network, 2.5 = out-of-network (typical)

  // Check if plan uses copays (from EOB data)
  // Many plans use copays for office visits and some procedures
  // IMPORTANT: Only office visits (99xxx) should use copays, not procedures like MRI
  const useCopay = eobData?.copays && primaryCpt.startsWith('99') && 
    (eobData.copays.primaryCare || eobData.copays.specialist);
  
  console.log(`💳 Copay check for CPT ${primaryCpt}:`, {
    hasEOBData: !!eobData,
    hasCopays: !!eobData?.copays,
    isOfficeVisit: primaryCpt.startsWith('99'),
    useCopay,
    copays: eobData?.copays,
  });
  
  let costCalc;
  
  if (useCopay && eobData.copays) {
    // Use copay instead of coinsurance calculation (ONLY for office visits)
    const copayAmount = eobData.copays.specialist || eobData.copays.primaryCare || 0;
    
    console.log(`💰 Using copay from EOB for office visit: $${copayAmount}`);
    
    costCalc = {
      deductibleApplied: 0, // Copays typically don't apply to deductible
      coinsuranceDue: 0,
      estimatedOop: copayAmount,
    };
  } else {
    // Use standard deductible + coinsurance calculation
    const deductibleStatus = costProfile.deductibleRemaining > 0 
      ? `$${costProfile.deductibleRemaining} remaining` 
      : 'MET (no remaining deductible)';
    
    console.log(`💵 Using standard deductible + coinsurance calculation:`, {
      allowedAmount: `$${allowedAmount}`,
      deductibleStatus,
      coinsurance: `${(costProfile.normalizedCoinsurance * 100).toFixed(0)}%`,
      oopMax: costProfile.normalizedOopMax ? `$${costProfile.normalizedOopMax}` : 'none',
    });
    
    costCalc = calcPatientCost(
      allowedAmount,
      costProfile.deductibleRemaining,
      costProfile.normalizedCoinsurance,
      costProfile.normalizedOopMax
    );
    
    const breakdownParts = [];
    if (costCalc.deductibleApplied > 0) {
      breakdownParts.push(`$${costCalc.deductibleApplied} toward deductible`);
    } else {
      breakdownParts.push('$0 (deductible already met)');
    }
    if (costCalc.coinsuranceDue > 0) {
      breakdownParts.push(`$${costCalc.coinsuranceDue} coinsurance (${(costProfile.normalizedCoinsurance * 100).toFixed(0)}% of remaining)`);
    }
    
    console.log(`💵 Cost calculation result:`, {
      ...costCalc,
      breakdown: breakdownParts.join(' + ') + ` = $${costCalc.estimatedOop} total`,
      note: costProfile.deductibleRemaining === 0 
        ? '✅ Deductible is met - you only pay coinsurance/copays' 
        : `⚠️ You have $${costProfile.deductibleRemaining} remaining on your deductible`,
    });
  }
  
  // Override cost calculation for preventive care
  if (isCoveredAsPreventive) {
    console.log(`✅ Preventive care: Setting patient cost to $0 (covered at 100%)`);
    costCalc = {
      deductibleApplied: 0,
      coinsuranceDue: 0,
      estimatedOop: 0,
    };
  }

  // Calculate confidence using real data if available
  let regionalVariance: number;
  let hasRegionalData: boolean;
  
  if (priceRange) {
    regionalVariance = (priceRange.max - priceRange.min) / priceRange.min;
    hasRegionalData = true;
  } else {
    // Fall back to benchmark
    const benchmark = await loadRegionalBenchmark(primaryCpt, region);
    regionalVariance = benchmark
      ? (benchmark.max - benchmark.min) / benchmark.min
      : 0.3; // Default variance if no benchmark
    hasRegionalData = !!benchmark;
  }

  const confidence = confidenceScore(
    procedureIntent.confidence,
    procedureIntent.siteOfService !== 'unknown',
    regionalVariance,
    hasRegionalData
  );

  // Generate explanation bullets (simplified for MVP - in production, use AI explainer)
  const explanationBullets = generateExplanationBullets(
    costCalc,
    costProfile,
    allowedAmount,
    procedureIntent,
    isCoveredAsPreventive,
    isFromEOB,
    dataSource
  );

  // Calculate total billed (estimate as 1.5-2x allowed for commercial)
  const totalBilled = allowedAmount * 1.75;
  const insuranceAdjustment = totalBilled - allowedAmount;

  // Use price range from real data if available, otherwise fall back to benchmark
  let regionalBenchmark;
  if (priceRange) {
    regionalBenchmark = {
      min: priceRange.min,
      max: priceRange.max,
      source: priceRange.source,
    };
  } else {
    const benchmark = await loadRegionalBenchmark(primaryCpt, region);
    if (benchmark) {
      regionalBenchmark = {
        min: benchmark.min,
        max: benchmark.max,
        source: benchmark.source,
      };
    }
  }

  return {
    allowedAmount: Math.round(allowedAmount),
    deductibleApplied: Math.round(costCalc.deductibleApplied),
    coinsuranceDue: Math.round(costCalc.coinsuranceDue),
    estimatedOop: Math.round(costCalc.estimatedOop),
    explanationBullets,
    confidence,
    totalBilled: Math.round(totalBilled),
    insuranceAdjustment: Math.round(insuranceAdjustment),
    regionalBenchmark,
  };
}

/**
 * Get a reasonable default price for a CPT code when no data is available
 * Based on CPT code ranges and typical pricing
 */
function getDefaultPriceForCPT(cpt: string): number {
  // Office visits (99xxx)
  if (cpt.startsWith('99')) {
    return 150; // Typical office visit
  }
  // MRI (7xxxx, typically 7xxxx for radiology)
  if (cpt.startsWith('73') || cpt.startsWith('72')) {
    return 600; // Typical MRI
  }
  // CT scans (7xxxx)
  if (cpt.startsWith('70')) {
    return 400; // Typical CT
  }
  // Lab work (8xxxx)
  if (cpt.startsWith('80')) {
    return 75; // Typical lab panel
  }
  // Physical therapy (97xxx)
  if (cpt.startsWith('97')) {
    return 65; // Typical PT session
  }
  // Default fallback
  return 500;
}

/**
 * Generate plain English explanation bullets
 */
function generateExplanationBullets(
  costCalc: ReturnType<typeof calcPatientCost>,
  costProfile: CostProfile,
  allowedAmount: number,
  procedureIntent: ProcedureIntent,
  isCoveredAsPreventive: boolean = false,
  isFromEOB: boolean = false,
  dataSource: string = 'ESTIMATE'
): string[] {
  const bullets: string[] = [];

  // If covered as preventive care, lead with that
  if (isCoveredAsPreventive) {
    const preventiveMessage = getPreventiveCareMessage(procedureIntent.cpts[0], procedureIntent.label);
    if (preventiveMessage) {
      bullets.push(preventiveMessage);
    } else {
      bullets.push('✅ This procedure is typically covered at 100% as preventive care under the Affordable Care Act (no deductible, no coinsurance).');
    }
    bullets.push(`Your estimated out-of-pocket cost: $0`);
    bullets.push('💡 Note: This assumes the procedure is coded as preventive/screening and performed by an in-network provider. Check with your insurance to confirm coverage.');
    return bullets;
  }

  // Add data source information
  if (isFromEOB) {
    bullets.push(
      `The allowed amount for this service is $${Math.round(allowedAmount)} (based on your EOB - actual negotiated rate with your insurance).`
    );
    bullets.push('✅ This estimate uses your actual insurance negotiated rates for higher accuracy.');
  } else {
    bullets.push(
      `The estimated allowed amount for this service is $${Math.round(allowedAmount)} (based on ${dataSource}).`
    );
    if (dataSource.includes('CMS') || dataSource.includes('MRF')) {
      bullets.push('💡 This estimate uses real pricing data from CMS and hospital records for your area.');
    } else {
      bullets.push('⚠️ This is an estimated rate. For more accurate estimates, upload an EOB from a similar procedure.');
    }
  }

  // Add network status note
  bullets.push('📍 This estimate assumes an in-network provider. Out-of-network costs may be significantly higher (2-3x) and may not be covered.');

  if (costCalc.deductibleApplied > 0) {
    bullets.push(
      `You'll pay $${Math.round(costCalc.deductibleApplied)} toward your deductible ($${costProfile.deductibleRemaining} remaining).`
    );
  } else if (costProfile.deductibleRemaining === 0) {
    bullets.push('✅ Your deductible has been met, so you only pay coinsurance/copays (no deductible applies).');
  } else {
    bullets.push('Your deductible has been met, so coinsurance applies.');
  }

  if (costCalc.coinsuranceDue > 0) {
    const coinsurancePercent = Math.round(costProfile.normalizedCoinsurance * 100);
    bullets.push(
      `After your deductible, you'll pay ${coinsurancePercent}% coinsurance: $${Math.round(costCalc.coinsuranceDue)}.`
    );
  }

  // Add a clear summary
  if (costProfile.deductibleRemaining === 0) {
    bullets.push(
      `💰 Your total estimated out-of-pocket cost is $${Math.round(costCalc.estimatedOop)}. This is ${Math.round((costCalc.estimatedOop / allowedAmount) * 100)}% of the $${Math.round(allowedAmount)} allowed amount because your deductible is already met.`
    );
  } else {
    bullets.push(
      `Your total estimated out-of-pocket cost is $${Math.round(costCalc.estimatedOop)} (out of $${Math.round(allowedAmount)} allowed amount).`
    );
  }

  if (procedureIntent.requiresPriorAuth) {
    bullets.push('⚠️ This procedure typically requires prior authorization from your insurance.');
  }

  return bullets;
}

