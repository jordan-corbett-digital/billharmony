// EOB Parser Service - Extracts insurance plan details from EOB documents using vision AI

import { callLLM, getDefaultLLMConfig, LLMMessage } from './llm/client';
import { EOBData, PlanType } from '../types';

/**
 * Parse EOB document using vision AI
 * Supports PDF and image files
 */
export async function parseEOB(file: File): Promise<EOBData> {
  // Convert file to base64 for vision API
  const base64 = await fileToBase64(file);
  
  // Determine if it's an image or PDF
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';
  
  if (!isImage && !isPDF) {
    throw new Error('Unsupported file type. Please upload an image (JPG, PNG) or PDF.');
  }

  // Build prompt for EOB extraction
  const systemPrompt = `You are an expert at reading Explanation of Benefits (EOB) documents from health insurance companies. Your job is to extract structured insurance plan information from the EOB.

CRITICAL INSTRUCTIONS - READ THE SERVICE TABLE CAREFULLY:

1. **Insurance company/payer name**: Look in the header (e.g., "LifeWise Health Plan of Washington")

2. **Member ID or Subscriber ID**: Look in the header or patient information section

3. **Group number**: Look in the header or plan information section

4. **Plan type**: Look for HMO, PPO, EPO, or POS anywhere on the document

5. **Deductible information** - READ CAREFULLY:
   
   **Look for explicit deductible fields:**
   - Search for "Annual Deductible", "Deductible Total", "Year-to-Date Deductible", "Deductible Met", "Deductible Remaining"
   - Extract these values if shown
   
   **Infer from service details:**
   - If you see a "Deductible" column in a service table:
     * If ALL services show $0.00, set deductibleMet to 999999 (indicates fully met)
     * If any service shows deductible > $0, that's the amount applied to that service
   - If you see "Patient Responsibility" and "Allowed Amount" but NO deductible amount shown:
     * This usually means the deductible is already met (coinsurance is being applied)
     * Set deductibleMet to 999999 to indicate it's fully met
   
   **If deductibleTotal is not explicitly shown:**
   - Look for any mention of deductible amounts elsewhere on the document
   - If you cannot find it, set it to null (do NOT guess or use defaults)

6. **Coinsurance percentage - THIS IS THE MOST IMPORTANT FIELD**:
   
   EOBs come in different formats. Look for coinsurance in EITHER of these ways:
   
   **Format A - Detailed Service Table:**
   - Find columns like: "Amount billed", "Network discount", "Amount paid by plan", "Coinsurance", "Deductible"
   - Look for a service row where the "Coinsurance" column shows an amount > $0.00
   - Calculate: Allowed amount = Amount billed - Network discount
   - Calculate: Coinsurance % = Coinsurance amount / (Allowed amount - Deductible amount)
   
   **Format B - Simple Claim Summary (MOST COMMON):**
   - Look for sections showing: "Billed Amount", "Allowed Amount", "Insurance Paid", "Patient Responsibility"
   - If you see "Patient Responsibility" > $0 and "Allowed Amount" > $0:
     * This usually means deductible is met and coinsurance is being applied
     * Calculate: Coinsurance % = Patient Responsibility / Allowed Amount
     * EXAMPLE: If Patient Responsibility = $120 and Allowed Amount = $600:
       * Coinsurance % = $120 / $600 = 0.20 (20%)
   - If "Patient Responsibility" equals "Allowed Amount", coinsurance is 100% (rare, usually means out-of-network)
   - If "Patient Responsibility" is $0, coinsurance may be 0% or service is fully covered
   
   **Format C - If you see "Deductible" amount > $0:**
   - If Patient Responsibility = Deductible amount (and no coinsurance shown), deductible is being applied
   - In this case, coinsurance may not be applicable yet, but you can still calculate it if coinsurance amount is shown
   
   **CRITICAL RULES:**
   - If Patient Responsibility > $0 and Allowed Amount > $0 and no Deductible is shown, assume coinsurance = Patient Responsibility / Allowed Amount
   - Return coinsurance as a decimal (0.0 to 1.0), not a percentage (e.g., 0.20 for 20%, 0.50 for 50%)
   - If you cannot calculate coinsurance, return null (do NOT guess)

7. **Copay amounts**:
   - Look at the "Copay" column in the service table
   - If you see copay amounts > $0, note them
   - Office visits typically use primaryCare or specialist copays
   - Emergency visits use emergency copays

8. **Out-of-pocket maximum**:
   - Look for "OOP Max", "Out-of-Pocket Maximum", "Annual Out-of-Pocket Maximum", or similar text
   - Extract the dollar amount

9. **Allowed amount** (for cost estimation - CRITICAL):
   - This is the negotiated rate after network discounts
   - **Format A**: "Amount paid by your health plan" + "Coinsurance" + "Deductible"
   - **Format B**: Look for "Allowed Amount" field explicitly shown (this is the most common)
   - **Format A alternative**: Amount billed - Network discount
   - **ALWAYS extract this** - it's essential for accurate cost estimates
   - Use the value from the main service shown on the EOB

10. **Last EOB date**: Extract the claim date or processing date (format as YYYY-MM-DD)

11. **Provider name** (for network verification):
   - Look for "Provider", "Service Provider", "Provider Name", or similar fields
   - If a provider name is shown on the EOB, that provider is IN-NETWORK (EOBs only show in-network providers)
   - Extract the full provider name (e.g., "Joplin Sleep Center", "Mercy Hospital")

STEP-BY-STEP PROCESS:
1. First, identify the EOB format:
   - Format A: Detailed service table with multiple columns
   - Format B: Simple claim summary with Billed/Allowed/Insurance Paid/Patient Responsibility
   - Format C: Mixed format with both summary and details
2. Calculate coinsurance:
   - If Format B: Coinsurance = Patient Responsibility / Allowed Amount (if no deductible shown)
   - If Format A: Calculate from service table columns
3. Determine deductible status:
   - If Patient Responsibility > $0 and no Deductible column/amount shown, deductible is likely met (set deductibleMet to 999999)
   - If Deductible column shows all $0.00, deductible is met (set deductibleMet to 999999)
4. Extract allowed amount from the service (this is critical for cost estimation)
5. Look for deductible total, OOP max, and plan type in other sections
6. Extract copay amounts if shown

Return ONLY valid JSON in this format (no markdown, no code blocks):
{
  "payer": "exact insurance company name from header or null",
  "memberId": "member ID or null",
  "groupNumber": "group number or null",
  "planType": "HMO|PPO|EPO|POS|null",
  "deductibleTotal": number or null,
  "deductibleMet": number (if deductible column shows all $0.00, use 999999 to indicate met, otherwise use 0 or null),
  "oopMax": number or null,
  "coinsurance": number (0.0 to 1.0, e.g., 0.20 for 20%, 0.50 for 50%, 0.0 if all services show $0 coinsurance) or null,
  "copays": {
    "primaryCare": number or null,
    "specialist": number or null,
    "urgentCare": number or null,
    "emergency": number or null
  },
  "allowedAmount": number (from a service with coinsurance > $0 if possible) or null,
  "lastEOBDate": "YYYY-MM-DD or null",
  "providerName": "provider name from EOB or null"
}

CRITICAL: 
- Calculate coinsurance from the actual service table data - do NOT guess
- If deductible column shows all $0.00, set deductibleMet to 999999 (indicates fully met)
- Return coinsurance as a decimal (0.0 to 1.0), not a percentage
- If you cannot find a value, use null (do NOT use defaults or guesses)`;

  const userMessage = `Extract insurance plan information from this EOB document.`;

  // Build messages for vision API
  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        { type: 'text', text: userMessage },
        {
          type: 'image_url',
          image_url: {
            url: `data:${file.type};base64,${base64}`,
          },
        },
      ],
    },
  ];

  try {
    const config = getDefaultLLMConfig();
    
    if (!config) {
      throw new Error('No LLM API key configured. Please set VITE_GEMINI_API_KEY');
    }
    
    console.log('🔍 Parsing EOB with provider:', config.provider, 'model:', config.model);
    
    // For vision, we need to use a model that supports images
    // Gemini Vision
    if (config.provider === 'gemini') {
      // Try models in order of preference
      const visionModels = [
        'gemini-1.5-flash-latest', // Try latest version first
        'gemini-1.5-pro-latest',   // Pro version
        'gemini-2.0-flash-exp',    // Experimental
        'gemini-2.5-flash-preview-05-20', // Default model
      ];
      
      let lastError: Error | null = null;
      
      for (const visionModel of visionModels) {
        try {
          console.log(`🔍 Trying Gemini vision model: ${visionModel}`);
          
          const response = await callLLM(messages, {
            ...config,
            model: visionModel,
          });
          
          console.log('📄 Gemini response length:', response.content?.length || 0);
          console.log('📄 Gemini response preview:', response.content?.substring(0, 200));
          
          if (!response.content || response.content.trim().length === 0) {
            throw new Error('Empty response from Gemini');
          }
          
          let jsonString = response.content;
          const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                           response.content.match(/```\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonString = jsonMatch[1];
          }
          
          const trimmed = jsonString.trim();
          if (!trimmed || trimmed.length === 0) {
            throw new Error('Empty JSON in response from Gemini');
          }
          
          let extracted;
          try {
            extracted = JSON.parse(trimmed);
          } catch (parseError) {
            console.error('Failed to parse JSON from Gemini:', trimmed.substring(0, 500));
            throw new Error(`Invalid JSON from Gemini: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
          }
          
          console.log('✅ Extracted EOB data from AI:', JSON.stringify(extracted, null, 2));
          
          const normalized = normalizeEOBData(extracted);
          console.log('✅ Final normalized EOB data:', JSON.stringify(normalized, null, 2));
          
          return normalized;
        } catch (error) {
          console.warn(`⚠️ Model ${visionModel} failed:`, error instanceof Error ? error.message : String(error));
          lastError = error instanceof Error ? error : new Error(String(error));
          // Continue to next model
        }
      }
      
      // If all models failed, throw the last error
      throw new Error(`All vision models failed. Last error: ${lastError?.message || 'Unknown error'}`);
    } else {
      throw new Error(`Vision API not supported for provider: ${config.provider}. Please use Gemini.`);
    }
  } catch (error) {
    console.error('❌ Error parsing EOB:', error);
    if (error instanceof SyntaxError) {
      console.error('JSON parse error - response might not be valid JSON');
    }
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error(`Failed to parse EOB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Normalize extracted EOB data to ensure correct types
 */
function normalizeEOBData(data: any): EOBData {
  const normalized: EOBData = {};
  
  console.log('📋 Raw EOB data from AI:', data);
  
  if (data.payer) normalized.payer = String(data.payer);
  if (data.memberId) normalized.memberId = String(data.memberId);
  if (data.groupNumber) normalized.groupNumber = String(data.groupNumber);
  if (data.planType && ['HMO', 'PPO', 'EPO', 'POS'].includes(data.planType)) {
    normalized.planType = data.planType as PlanType;
  }
  if (typeof data.deductibleTotal === 'number') normalized.deductibleTotal = data.deductibleTotal;
  if (typeof data.deductibleMet === 'number') normalized.deductibleMet = data.deductibleMet;
  if (typeof data.oopMax === 'number') normalized.oopMax = data.oopMax;
  if (typeof data.coinsurance === 'number') {
    // Convert percentage to decimal if needed (e.g., 20 -> 0.20, 50 -> 0.50)
    // Also handle if it's already a decimal (e.g., 0.20 stays 0.20)
    if (data.coinsurance > 1) {
      normalized.coinsurance = data.coinsurance / 100;
      console.log(`✅ Converted coinsurance from ${data.coinsurance}% to ${normalized.coinsurance}`);
    } else {
      normalized.coinsurance = data.coinsurance;
      console.log(`✅ Using coinsurance as decimal: ${normalized.coinsurance} (${normalized.coinsurance * 100}%)`);
    }
    // Validate range
    if (normalized.coinsurance < 0 || normalized.coinsurance > 1) {
      console.warn(`⚠️ Coinsurance out of range: ${normalized.coinsurance}, clamping to 0-1`);
      normalized.coinsurance = Math.max(0, Math.min(1, normalized.coinsurance));
    }
  }
  if (typeof data.allowedAmount === 'number') normalized.allowedAmount = data.allowedAmount;
  if (data.lastEOBDate) normalized.lastEOBDate = String(data.lastEOBDate);
  if (data.providerName) normalized.providerName = String(data.providerName);
  
  // Normalize copays
  if (data.copays && typeof data.copays === 'object') {
    normalized.copays = {};
    if (typeof data.copays.primaryCare === 'number') normalized.copays.primaryCare = data.copays.primaryCare;
    if (typeof data.copays.specialist === 'number') normalized.copays.specialist = data.copays.specialist;
    if (typeof data.copays.urgentCare === 'number') normalized.copays.urgentCare = data.copays.urgentCare;
    if (typeof data.copays.emergency === 'number') normalized.copays.emergency = data.copays.emergency;
  }
  
  console.log('✅ Normalized EOB data:', normalized);
  
  return normalized;
}

/**
 * Convert file to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data URL prefix (e.g., "data:image/png;base64,")
          const base64 = reader.result.split(',')[1];
          if (!base64 || base64.length === 0) {
            reject(new Error('Failed to read file - empty base64 data'));
            return;
          }
          console.log('✅ File converted to base64, length:', base64.length);
          resolve(base64);
        } else {
          reject(new Error('Failed to read file as base64 - invalid result type'));
        }
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error(`Failed to read file: ${error}`));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error setting up FileReader:', error);
      reject(new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

/**
 * Validate EOB data completeness
 */
export function isEOBDataComplete(eobData: EOBData): boolean {
  // At minimum, we need coinsurance OR copays to be useful
  return !!(eobData.coinsurance || eobData.copays?.specialist || eobData.copays?.primaryCare);
}

