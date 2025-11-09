// CPT Code Database Service
// Provides CPT code lookup, validation, and search functionality

export interface CPTCode {
  code: string;
  description: string;
  category: string;
  typicalSiteOfService: 'inpatient' | 'outpatient' | 'freestanding' | 'home' | 'unknown';
  requiresPriorAuth: boolean;
  commonModifiers: string[];
  relatedCodes?: string[]; // Related CPT codes (e.g., with/without contrast variants)
  typicalPriceRange?: { min: number; max: number }; // For reference only
}

// Comprehensive CPT code database
// Focused on common procedures for Joplin/Springfield, MO area
const CPT_DATABASE: CPTCode[] = [
  // Radiology - MRI
  {
    code: '72141',
    description: 'MRI cervical spine without contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: true,
    commonModifiers: ['-26', 'TC'],
    relatedCodes: ['72142', '72146', '72147'],
  },
  {
    code: '72142',
    description: 'MRI cervical spine with contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: true,
    commonModifiers: ['-26', 'TC'],
    relatedCodes: ['72141', '72146', '72147'],
  },
  {
    code: '72146',
    description: 'MRI cervical spine without and with contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: true,
    commonModifiers: ['-26', 'TC'],
    relatedCodes: ['72141', '72142'],
  },
  {
    code: '72147',
    description: 'MRI cervical spine without and with contrast (enhanced)',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: true,
    commonModifiers: ['-26', 'TC'],
  },
  {
    code: '72148',
    description: 'MRI lumbar spine without contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: true,
    commonModifiers: ['-26', 'TC'],
    relatedCodes: ['72149', '72158', '72159'],
  },
  {
    code: '72149',
    description: 'MRI lumbar spine with contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: true,
    commonModifiers: ['-26', 'TC'],
    relatedCodes: ['72148', '72158', '72159'],
  },
  {
    code: '73718',
    description: 'MRI lower extremity (knee) without contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: true,
    commonModifiers: ['-26', 'TC', '-LT', '-RT'],
    relatedCodes: ['73719', '73720', '73721', '73722', '73723'],
  },
  {
    code: '73719',
    description: 'MRI lower extremity (knee) with contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: true,
    commonModifiers: ['-26', 'TC', '-LT', '-RT'],
    relatedCodes: ['73718', '73720', '73721'],
  },
  {
    code: '73720',
    description: 'MRI lower extremity (knee) without and with contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: true,
    commonModifiers: ['-26', 'TC', '-LT', '-RT'],
    relatedCodes: ['73718', '73719'],
  },
  {
    code: '73721',
    description: 'MRI lower extremity (knee) without contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: true,
    commonModifiers: ['-26', 'TC', '-LT', '-RT'],
    relatedCodes: ['73718', '73719', '73720', '73722', '73723'],
  },
  {
    code: '73722',
    description: 'MRI lower extremity (knee) with contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: true,
    commonModifiers: ['-26', 'TC', '-LT', '-RT'],
    relatedCodes: ['73721'],
  },
  {
    code: '73723',
    description: 'MRI lower extremity (knee) without and with contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: true,
    commonModifiers: ['-26', 'TC', '-LT', '-RT'],
    relatedCodes: ['73721', '73722'],
  },
  {
    code: '70551',
    description: 'MRI brain without contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: true,
    commonModifiers: ['-26', 'TC'],
    relatedCodes: ['70552', '70553'],
  },
  {
    code: '70552',
    description: 'MRI brain with contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: true,
    commonModifiers: ['-26', 'TC'],
    relatedCodes: ['70551', '70553'],
  },
  {
    code: '70553',
    description: 'MRI brain without and with contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: true,
    commonModifiers: ['-26', 'TC'],
    relatedCodes: ['70551', '70552'],
  },
  
  // Radiology - CT
  {
    code: '70450',
    description: 'CT head without contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: false,
    commonModifiers: ['-26', 'TC'],
    relatedCodes: ['70460', '70470'],
  },
  {
    code: '70460',
    description: 'CT head with contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: false,
    commonModifiers: ['-26', 'TC'],
    relatedCodes: ['70450', '70470'],
  },
  {
    code: '70470',
    description: 'CT head without and with contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: false,
    commonModifiers: ['-26', 'TC'],
    relatedCodes: ['70450', '70460'],
  },
  {
    code: '72130',
    description: 'CT lumbar spine without contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: false,
    commonModifiers: ['-26', 'TC'],
    relatedCodes: ['72131', '72132'],
  },
  {
    code: '72131',
    description: 'CT lumbar spine with contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: false,
    commonModifiers: ['-26', 'TC'],
    relatedCodes: ['72130', '72132'],
  },
  {
    code: '72132',
    description: 'CT lumbar spine without and with contrast',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: false,
    commonModifiers: ['-26', 'TC'],
    relatedCodes: ['72130', '72131'],
  },
  
  // Radiology - Ultrasound
  {
    code: '76700',
    description: 'Ultrasound, abdominal complete',
    category: 'Radiology',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: ['-26', 'TC'],
  },
  {
    code: '76705',
    description: 'Ultrasound, abdominal limited',
    category: 'Radiology',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: ['-26', 'TC'],
    relatedCodes: ['76700'],
  },
  {
    code: '76856',
    description: 'Ultrasound, pelvic (non-obstetric)',
    category: 'Radiology',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: ['-26', 'TC'],
  },
  {
    code: '76641',
    description: 'Ultrasound, breast',
    category: 'Radiology',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: ['-26', 'TC', '-LT', '-RT'],
  },
  
  // Laboratory
  {
    code: '80053',
    description: 'Comprehensive metabolic panel',
    category: 'Laboratory',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
  },
  {
    code: '80048',
    description: 'Basic metabolic panel',
    category: 'Laboratory',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
    relatedCodes: ['80053'],
  },
  {
    code: '85027',
    description: 'Complete blood count (CBC) with automated differential',
    category: 'Laboratory',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
  },
  {
    code: '80061',
    description: 'Lipid panel',
    category: 'Laboratory',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
  },
  {
    code: '80069',
    description: 'Renal function panel',
    category: 'Laboratory',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
  },
  
  // Evaluation & Management
  {
    code: '99213',
    description: 'Office visit, established patient, level 3',
    category: 'Evaluation & Management',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
    relatedCodes: ['99212', '99214', '99215'],
  },
  {
    code: '99214',
    description: 'Office visit, established patient, level 4',
    category: 'Evaluation & Management',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
    relatedCodes: ['99213', '99215'],
  },
  {
    code: '99215',
    description: 'Office visit, established patient, level 5',
    category: 'Evaluation & Management',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
    relatedCodes: ['99214'],
  },
  {
    code: '99203',
    description: 'Office visit, new patient, level 3',
    category: 'Evaluation & Management',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
    relatedCodes: ['99202', '99204', '99205'],
  },
  {
    code: '99204',
    description: 'Office visit, new patient, level 4',
    category: 'Evaluation & Management',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
    relatedCodes: ['99203', '99205'],
  },
  
  // Physical Therapy
  {
    code: '97110',
    description: 'Therapeutic exercise',
    category: 'Physical Medicine',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
  },
  {
    code: '97112',
    description: 'Neuromuscular reeducation',
    category: 'Physical Medicine',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
  },
  {
    code: '97140',
    description: 'Manual therapy',
    category: 'Physical Medicine',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
  },
  {
    code: '97161',
    description: 'Physical therapy evaluation, low complexity',
    category: 'Physical Medicine',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
    relatedCodes: ['97162', '97163'],
  },
  
  // Sleep Studies
  {
    code: '95810',
    description: 'Polysomnography, sleep study',
    category: 'Medicine',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: true,
    commonModifiers: [],
  },
  {
    code: '95811',
    description: 'Polysomnography, sleep study with CPAP',
    category: 'Medicine',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: true,
    commonModifiers: [],
    relatedCodes: ['95810'],
  },
  
  // Gastroenterology
  {
    code: '45378',
    description: 'Colonoscopy, flexible',
    category: 'Surgery',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: true,
    commonModifiers: [],
  },
  {
    code: '43239',
    description: 'Upper GI endoscopy',
    category: 'Surgery',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: true,
    commonModifiers: [],
  },
  
  // Cardiology
  {
    code: '93000',
    description: 'Electrocardiogram (EKG)',
    category: 'Medicine',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
  },
  {
    code: '93306',
    description: 'Echocardiogram, complete',
    category: 'Medicine',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: true,
    commonModifiers: ['-26', 'TC'],
  },
  {
    code: '93015',
    description: 'Cardiovascular stress test',
    category: 'Medicine',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: true,
    commonModifiers: [],
  },
  
  // Preventive Care / Screenings
  {
    code: '99213',
    description: 'Office visit, established patient, level 3',
    category: 'Evaluation & Management',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
    relatedCodes: ['99212', '99214', '99215'],
  },
  {
    code: '88142',
    description: 'Cervical or vaginal cytopathology (Pap smear)',
    category: 'Laboratory',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
  },
  {
    code: '77067',
    description: 'Screening mammography, bilateral',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: false,
    commonModifiers: ['-26', 'TC'],
  },
  {
    code: '77065',
    description: 'Diagnostic mammography, bilateral',
    category: 'Radiology',
    typicalSiteOfService: 'freestanding',
    requiresPriorAuth: false,
    commonModifiers: ['-26', 'TC'],
    relatedCodes: ['77067'],
  },
  {
    code: '17000',
    description: 'Destruction of benign lesion (skin cancer screening/biopsy)',
    category: 'Surgery',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
  },
  {
    code: '11300',
    description: 'Shave removal of skin lesion',
    category: 'Surgery',
    typicalSiteOfService: 'outpatient',
    requiresPriorAuth: false,
    commonModifiers: [],
  },
];

/**
 * Validate if a CPT code exists in our database
 */
export function validateCPTCode(code: string): CPTCode | null {
  const normalized = code.trim().toUpperCase();
  return CPT_DATABASE.find(cpt => cpt.code === normalized) || null;
}

/**
 * Search CPT codes by description or keywords
 */
export function searchCPTCodes(query: string): CPTCode[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];
  
  return CPT_DATABASE.filter(cpt => {
    const description = cpt.description.toLowerCase();
    const category = cpt.category.toLowerCase();
    const code = cpt.code.toLowerCase();
    
    return description.includes(normalized) ||
           category.includes(normalized) ||
           code.includes(normalized);
  });
}

/**
 * Get related CPT codes (e.g., with/without contrast variants)
 */
export function getRelatedCPTCodes(code: string): CPTCode[] {
  const cpt = validateCPTCode(code);
  if (!cpt || !cpt.relatedCodes) return [];
  
  return cpt.relatedCodes
    .map(relatedCode => validateCPTCode(relatedCode))
    .filter((c): c is CPTCode => c !== null);
}

/**
 * Get all CPT codes in a category
 */
export function getCPTCodesByCategory(category: string): CPTCode[] {
  const normalized = category.toLowerCase();
  return CPT_DATABASE.filter(cpt => 
    cpt.category.toLowerCase().includes(normalized)
  );
}

/**
 * Get CPT code suggestions based on natural language input
 * This helps the AI by providing context
 */
export function getCPTSuggestions(userInput: string): CPTCode[] {
  const lower = userInput.toLowerCase();
  const suggestions: CPTCode[] = [];
  
  // MRI patterns
  if (lower.includes('mri')) {
    if (lower.includes('knee') || lower.includes('lower extremity')) {
      suggestions.push(...searchCPTCodes('mri lower extremity'));
    } else if (lower.includes('spine') || lower.includes('back') || lower.includes('lumbar')) {
      suggestions.push(...searchCPTCodes('mri lumbar'));
    } else if (lower.includes('cervical') || lower.includes('neck')) {
      suggestions.push(...searchCPTCodes('mri cervical'));
    } else if (lower.includes('brain') || lower.includes('head')) {
      suggestions.push(...searchCPTCodes('mri brain'));
    } else {
      suggestions.push(...getCPTCodesByCategory('Radiology').filter(c => c.code.startsWith('7')));
    }
  }
  
  // CT patterns
  if (lower.includes('ct') || lower.includes('cat scan')) {
    if (lower.includes('head') || lower.includes('brain')) {
      suggestions.push(...searchCPTCodes('ct head'));
    } else if (lower.includes('spine') || lower.includes('back')) {
      suggestions.push(...searchCPTCodes('ct lumbar'));
    } else {
      suggestions.push(...getCPTCodesByCategory('Radiology').filter(c => c.code.startsWith('7')));
    }
  }
  
  // Ultrasound patterns
  if (lower.includes('ultrasound') || lower.includes('sonogram')) {
    suggestions.push(...searchCPTCodes('ultrasound'));
  }
  
  // Lab patterns
  if (lower.includes('blood') || lower.includes('lab') || lower.includes('panel')) {
    suggestions.push(...getCPTCodesByCategory('Laboratory'));
  }
  
  // Physical therapy
  if (lower.includes('physical therapy') || lower.includes('pt') || lower.includes('therapy')) {
    suggestions.push(...getCPTCodesByCategory('Physical Medicine'));
  }
  
  // Office visit
  if (lower.includes('visit') || lower.includes('checkup') || lower.includes('appointment')) {
    suggestions.push(...getCPTCodesByCategory('Evaluation & Management'));
  }
  
  // Sleep study
  if (lower.includes('sleep') || lower.includes('polysomnography')) {
    suggestions.push(...searchCPTCodes('sleep'));
  }
  
  // Colonoscopy
  if (lower.includes('colonoscopy') || lower.includes('colon')) {
    suggestions.push(...searchCPTCodes('colonoscopy'));
  }
  
  // EKG/ECG
  if (lower.includes('ekg') || lower.includes('ecg') || lower.includes('electrocardiogram')) {
    suggestions.push(...searchCPTCodes('electrocardiogram'));
  }
  
  // Cancer screenings
  if (lower.includes('skin cancer') || lower.includes('mole') || lower.includes('dermatology')) {
    suggestions.push(...getCPTCodesByCategory('Evaluation & Management'));
  }
  
  // Breast cancer / mammogram
  if (lower.includes('breast') || lower.includes('mammogram')) {
    suggestions.push(...searchCPTCodes('mammography'));
  }
  
  // Pap smear
  if (lower.includes('pap') || lower.includes('cervical')) {
    suggestions.push(...searchCPTCodes('pap'));
  }
  
  // Remove duplicates
  const seen = new Set<string>();
  return suggestions.filter(cpt => {
    if (seen.has(cpt.code)) return false;
    seen.add(cpt.code);
    return true;
  });
}

/**
 * Get all available CPT codes (for reference)
 */
export function getAllCPTCodes(): CPTCode[] {
  return [...CPT_DATABASE];
}

