// Preventive Care Service - Identifies procedures covered at 100% under ACA preventive care benefits

/**
 * CPT codes that are typically covered at 100% as preventive care under ACA
 * These are covered with no deductible, no coinsurance when performed as preventive screening
 */
const PREVENTIVE_CARE_CPTS: Set<string> = new Set([
  // Women's Health
  '88142', // Pap smear (cervical cancer screening)
  '77067', // Screening mammography (breast cancer screening)
  '77065', // Diagnostic mammography (when part of screening follow-up)
  '99391', // Well-woman visit (preventive medicine)
  '99392', // Well-woman visit (preventive medicine, established patient)
  
  // Cancer Screenings
  // NOTE: Colonoscopy CPT codes 45378, 45380, 45385 can be screening OR diagnostic
  // We check the procedure label to determine if it's preventive
  // Only Medicare-specific codes are always screening:
  'G0105', // Colonoscopy screening (Medicare - always screening)
  'G0121', // Colonoscopy screening (Medicare - always screening)
  
  // Other Preventive
  '80053', // Comprehensive metabolic panel (when part of annual physical)
  '85027', // CBC (when part of annual physical)
  '80061', // Lipid panel (cholesterol screening)
  '83036', // Hemoglobin A1c (diabetes screening)
  
  // Immunizations (covered separately, but preventive)
  '90471', // Immunization administration
  '90472', // Immunization administration (each additional)
]);

/**
 * Check if a CPT code is typically covered as preventive care
 */
export function isPreventiveCare(cpt: string): boolean {
  return PREVENTIVE_CARE_CPTS.has(cpt);
}

/**
 * Check if a procedure is likely covered as preventive care
 * Based on CPT code and procedure description
 */
export function isPreventiveCareProcedure(
  cpt: string,
  procedureLabel?: string
): boolean {
  // Check CPT code first
  if (isPreventiveCare(cpt)) {
    return true;
  }
  
    // Check procedure label for preventive keywords
    if (procedureLabel) {
      const lower = procedureLabel.toLowerCase();
      const preventiveKeywords = [
        'screening',
        'preventive',
        'wellness',
        'well-woman',
        'well woman',
        'womens wellness',
        "women's wellness",
        'annual',
        'routine',
        'preventative',
        'well-woman visit',
        'well woman visit',
      ];
      
      // Check for specific preventive procedures by name
      // Pap smears and mammograms are typically preventive
      if (lower.includes('pap') || lower.includes('mammogram')) {
        return true;
      }
      
      // Colonoscopies: Only preventive if explicitly labeled as "screening"
      // Diagnostic colonoscopies are NOT preventive and subject to deductible/coinsurance
      if (lower.includes('colonoscopy')) {
        // Only treat as preventive if it explicitly says "screening"
        const isScreening = lower.includes('screening') || 
                           lower.includes('preventive') ||
                           lower.includes('routine');
        if (isScreening) {
          return true;
        }
        // If it says "diagnostic" or doesn't specify, it's NOT preventive
        if (lower.includes('diagnostic')) {
          return false;
        }
        // If just "colonoscopy" without context, default to NOT preventive (safer assumption)
        // User can clarify if it's screening
        return false;
      }
      
      // Skin cancer: Only preventive if explicitly labeled as "screening" or "check"
      // Treatment, biopsy, or removal of skin cancer is NOT preventive
      if (lower.includes('skin cancer') || (lower.includes('dermatology') && (lower.includes('screening') || lower.includes('check') || lower.includes('exam'))) || (lower.includes('mole') && (lower.includes('check') || lower.includes('screening')))) {
        // Only treat as preventive if it explicitly says "screening" or "check" (for screening purposes)
        const isScreening = lower.includes('screening') || 
                           (lower.includes('check') && !lower.includes('treatment')) ||
                           (lower.includes('exam') && (lower.includes('preventive') || lower.includes('routine')));
        if (isScreening) {
          return true;
        }
        // If it says "treatment", "biopsy", "removal", "excision", or "surgery", it's NOT preventive
        if (lower.includes('treatment') || lower.includes('biopsy') || 
            lower.includes('removal') || lower.includes('excision') || 
            lower.includes('surgery') || lower.includes('destruction')) {
          return false;
        }
        // If just "skin cancer" or "dermatology" without context, default to NOT preventive (safer assumption)
        // User can clarify if it's screening
        return false;
      }
      
      return preventiveKeywords.some(keyword => lower.includes(keyword));
    }
  
  return false;
}

/**
 * Check if insurance plan likely covers preventive care at 100%
 * Most ACA-compliant plans (2010+) cover preventive care at 100%
 * Grandfathered plans may not
 */
export function likelyCoversPreventiveCare(
  payer?: string,
  planType?: string
): boolean {
  if (!payer) return true; // Default to yes (most common)
  
  const payerLower = payer.toLowerCase();
  
  // Medicare Part B covers preventive care, but with some cost-sharing
  if (payerLower.includes('medicare')) {
    return false; // Medicare has some cost-sharing for preventive care
  }
  
  // Medicaid typically covers preventive care at 100%
  if (payerLower.includes('medicaid')) {
    return true;
  }
  
  // Most commercial insurers (BCBS, Aetna, UHC, Cigna, etc.) cover preventive care at 100%
  // for ACA-compliant plans (plans issued after 2010)
  // We'll assume yes for commercial plans unless it's clearly a grandfathered plan
  return true; // Default to yes for commercial plans
}

/**
 * Get preventive care explanation message
 */
export function getPreventiveCareMessage(
  cpt: string,
  procedureLabel?: string
): string | null {
  if (!isPreventiveCareProcedure(cpt, procedureLabel)) {
    return null;
  }
  
  // Check if it's part of a well-woman visit
  const isWellWoman = procedureLabel?.toLowerCase().includes('well') || 
                      procedureLabel?.toLowerCase().includes('wellness');
  
  // Specific messages for common preventive procedures
  if (cpt === '88142' || (procedureLabel?.toLowerCase().includes('pap'))) {
    if (isWellWoman) {
      return 'Well-woman visits (including Pap smears) are typically covered at 100% as preventive care under the Affordable Care Act. This includes the Pap smear as part of the visit.';
    }
    return 'Pap smears are typically covered at 100% as preventive care under the Affordable Care Act (no deductible, no coinsurance).';
  }
  
  if (cpt === '77067' || cpt === '77065' || procedureLabel?.toLowerCase().includes('mammogram')) {
    return 'Mammograms are typically covered at 100% as preventive care under the Affordable Care Act (no deductible, no coinsurance).';
  }
  
  // Colonoscopies: Only screening colonoscopies are preventive
  const lowerLabel = procedureLabel?.toLowerCase() || '';
  if ((cpt === '45378' || cpt === '45380' || cpt === '45385') && 
      (lowerLabel.includes('screening') || lowerLabel.includes('preventive') || lowerLabel.includes('routine'))) {
    return 'Screening colonoscopies are typically covered at 100% as preventive care under the Affordable Care Act.';
  }
  
  // Diagnostic colonoscopies are NOT preventive
  if (lowerLabel.includes('colonoscopy') && lowerLabel.includes('diagnostic')) {
    return null; // Not preventive, so no special message
  }
  
  if (isWellWoman) {
    return 'Well-woman visits are typically covered at 100% as preventive care under the Affordable Care Act (no deductible, no coinsurance).';
  }
  
  return 'This procedure may be covered at 100% as preventive care under the Affordable Care Act. Check with your insurance to confirm.';
}

