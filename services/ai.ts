// AI Service - Handles AI interactions for onboarding, procedure parsing, and explanations
// Uses LLM APIs with fallback to rule-based logic

import { UserProfile, ProcedureIntent, OnboardingMessage, OnboardingState, Estimate } from '../types';
import { callLLM, callLLMWithJSON, getDefaultLLMConfig, LLMMessage } from './llm/client';
import {
  buildOnboardingMessages,
  buildProcedureParserMessages,
  buildPriceExplanationMessages,
} from './llm/prompts';
import { getCPTSuggestions, validateCPTCode } from './cpt';
import { estimateCoinsurance } from './coinsurance-estimator';

// Flag to enable/disable LLM (useful for testing or when API keys aren't available)
const USE_LLM = getDefaultLLMConfig() !== null;

/**
 * AI Onboarding Assistant
 * Conversational flow to collect user insurance and location data
 */
export class OnboardingAssistant {
  private state: OnboardingState;

  constructor(initialState?: OnboardingState) {
    this.state = initialState || {
      messages: [],
      currentStep: 'location',
      collectedData: {},
      isComplete: false,
      eobUploaded: false,
    };
  }

  getState(): OnboardingState {
    return this.state;
  }

  /**
   * Process user message and return AI response
   */
  async processMessage(userMessage: string): Promise<string> {
    const userMsg: OnboardingMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    this.state.messages.push(userMsg);

    // Extract data from user message - try LLM first, then fallback to rule-based
    console.log(`Processing message on step "${this.state.currentStep}": "${userMessage}"`);
    console.log('Current collectedData BEFORE extraction:', JSON.parse(JSON.stringify(this.state.collectedData)));
    
    // Save state before LLM extraction to check if it succeeded
    const dataBeforeLLM = JSON.parse(JSON.stringify(this.state.collectedData));
    await this.extractDataWithLLM(userMessage);
    const dataAfterLLM = JSON.parse(JSON.stringify(this.state.collectedData));
    
    // Only use rule-based if LLM didn't extract anything new for the current step
    const llmExtractedSomething = JSON.stringify(dataBeforeLLM) !== JSON.stringify(dataAfterLLM);
    if (!llmExtractedSomething) {
      console.log('LLM extraction did not find data, trying rule-based fallback...');
      // Make sure we're still on the same step before running rule-based
      const stepBeforeRuleBased = this.state.currentStep;
      this.extractData(userMessage);
      // Verify step didn't change unexpectedly
      if (this.state.currentStep !== stepBeforeRuleBased) {
        console.log(`Step changed from ${stepBeforeRuleBased} to ${this.state.currentStep} during rule-based extraction`);
      }
    } else {
      console.log('LLM extraction succeeded, skipping rule-based');
    }
    
    // IMPORTANT: Advance step after extraction (for both LLM and rule-based paths)
    // But only advance if we're not on deductible step (deductible needs user response first)
    const stepBeforeAdvance = this.state.currentStep;
    
    // Special handling for deductible step - only advance if user explicitly skipped
    // Otherwise, wait for their response about deductible met
    if (this.state.currentStep === 'deductible') {
      const lower = userMessage.toLowerCase();
      const skipWords = ['skip', "don't know", "dont know", "i don't know", "idk", "not sure", "no", "none"];
      const userSkipped = skipWords.some(word => lower.includes(word));
      
      // If user provided deductible total but not met, ask about met
      // If user skipped, advance to providers
      if (userSkipped || (this.state.collectedData.deductibleTotal && this.state.collectedData.deductibleMet !== undefined)) {
        this.advanceStepBasedOnData();
        if (stepBeforeAdvance !== this.state.currentStep) {
          console.log(`✅ Step advanced from ${stepBeforeAdvance} to ${this.state.currentStep} after deductible`);
        }
      } else if (this.state.collectedData.deductibleTotal && this.state.collectedData.deductibleMet === undefined) {
        // We have total but not met - ask about met in the response
        console.log('✅ Have deductible total, will ask about deductible met');
      }
    } else {
      // For other steps, advance normally
      this.advanceStepBasedOnData();
      if (stepBeforeAdvance !== this.state.currentStep) {
        console.log(`✅ Step advanced from ${stepBeforeAdvance} to ${this.state.currentStep} after extraction`);
      }
    }
    
    console.log('Current collectedData AFTER extraction:', JSON.parse(JSON.stringify(this.state.collectedData)));
    console.log('Current step AFTER extraction:', this.state.currentStep);

    // Check if onboarding is complete AFTER processing user's response
    // Completion conditions:
    // Only complete after user has answered the providers question (the last optional step)
    // We need zip + payer (required), and we should have asked about deductible and providers
    const hasRequiredData = this.isComplete();
    const isOnProvidersStep = this.state.currentStep === 'providers';
    const hasZipAndPayer = !!(this.state.collectedData.zip && this.state.collectedData.payer);
    
    console.log('Onboarding completion check (AFTER extraction):', {
      hasRequiredData,
      isOnProvidersStep,
      hasZipAndPayer,
      currentStep: this.state.currentStep,
      collectedData: this.state.collectedData,
    });
    
    // Only complete if we're on providers step AND have zip+payer AND user just answered
    // Check if this is a response to the providers question (not the first time we're asking)
    const lowerMessage = userMessage.toLowerCase();
    const providerSkipWords = ['skip', 'none', 'no', "don't have", "dont have", "not really", "i don't know", "idk"];
    const userSkippedProviders = providerSkipWords.some(word => lowerMessage.includes(word));
    // Check if preferredProviders was set (even if empty array - that means user answered)
    const preferredProvidersWasSet = this.state.collectedData.preferredProviders !== undefined;
    const userProvidedProviders = preferredProvidersWasSet && 
                                  this.state.collectedData.preferredProviders.length > 0;
    const userAnsweredProviders = isOnProvidersStep && hasZipAndPayer && (userSkippedProviders || preferredProvidersWasSet);
    
    console.log('Providers answer check:', {
      isOnProvidersStep,
      hasZipAndPayer,
      userSkippedProviders,
      preferredProvidersWasSet,
      userProvidedProviders,
      preferredProviders: this.state.collectedData.preferredProviders,
    });
    
    if (userAnsweredProviders) {
      console.log('✅ Onboarding is complete! User answered providers question. Setting isComplete to true');
      this.state.isComplete = true;
      this.state.currentStep = 'complete';
      
      // Return completion message instead of generating another response
      const completionMsg: OnboardingMessage = {
        role: 'assistant',
        content: "Perfect! We've set up your BillHarmony profile! We now have everything we need to provide you with personalized cost estimates.",
        timestamp: new Date().toISOString(),
      };
      this.state.messages.push(completionMsg);
      return completionMsg.content;
    }

    // Generate AI response only if not complete
    let aiResponse: string;
    
    // For EOB step, always use rule-based response to ensure correct message
    if (this.state.currentStep === 'eob') {
      aiResponse = this.generateResponse();
    } else if (USE_LLM) {
      try {
        // Use LLM for more natural conversation
        const conversationHistory = this.state.messages
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role,
            content: m.content,
          }));

        const messages = buildOnboardingMessages(conversationHistory, this.state.currentStep);
        const response = await callLLM(messages);
        aiResponse = response.content;
      } catch (error) {
        console.error('LLM error in onboarding, falling back to rule-based:', error);
        aiResponse = this.generateResponse();
      }
    } else {
      aiResponse = this.generateResponse();
    }

    const aiMsg: OnboardingMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
    };

    this.state.messages.push(aiMsg);

    return aiResponse;
  }

  /**
   * Extract data using LLM for better understanding
   */
  private async extractDataWithLLM(message: string): Promise<void> {
    if (!USE_LLM) return;

    try {
      const currentData = this.state.collectedData;
      // Step-specific extraction prompts to avoid confusion
      let extractionPrompt = '';
      let fieldsToExtract: string[] = [];
      
      switch (this.state.currentStep) {
        case 'location':
          extractionPrompt = `You are extracting data for the LOCATION step. The user is being asked for their ZIP code.

User message: "${message}"

Extract and return ONLY a JSON object with the zip field:
{
  "zip": "5-digit zip code (e.g., "63101") or null"
}

CRITICAL RULES:
- ONLY extract the ZIP code (5 digits) from this message
- Do NOT extract city, state, insurance company names, provider names, or any other information
- If user says "63101" or "ZIP code is 63101", extract zip="63101"
- If no ZIP code is found, return {"zip": null}`;
          fieldsToExtract = ['zip'];
          break;
        case 'insurance':
          extractionPrompt = `You are extracting data for the INSURANCE step. The user is being asked for their insurance company name.

User message: "${message}"

Extract and return ONLY a JSON object with the payer field:
{
  "payer": "insurance company name or null"
}

CRITICAL RULES:
- ONLY extract the insurance company/payer name from this message
- Do NOT extract city, state, zip, location, providers, or deductible information
- Do NOT extract any other fields - only "payer"
- If the message contains "Mercy", extract payer="Mercy"
- If the message contains "Aetna", extract payer="Aetna"
- If the message contains "BCBS" or "Blue Cross", extract payer="BCBS"
- Common insurance names: Aetna, BCBS, Blue Cross, UnitedHealthcare, Cigna, Humana, Kaiser, Mercy, Anthem
- If no insurance company is mentioned, return {"payer": null}`;
          fieldsToExtract = ['payer'];
          break;
        case 'deductible':
          // Check if we already have total - if so, we're asking for met
          const alreadyHaveTotal = this.state.collectedData.deductibleTotal !== undefined;
          
          if (alreadyHaveTotal) {
            extractionPrompt = `Extract ONLY the deductible met/used amount from this user message. Current step: deductible (asking for amount used).

User message: "${message}"

Extract and return ONLY a JSON object:
{
  "deductibleMet": number (e.g., 1200 for "$1,200" or "1200" or "1.2k") or null
}

IMPORTANT:
- Convert "k" to thousands (e.g., "1.2k" = 1200, "2k" = 2000)
- Extract dollar amounts (e.g., "$1,200" = 1200)
- Only extract the deductible met/used amount, nothing else
- If user says "skip" or "I don't know", return {"deductibleMet": 0}`;
            fieldsToExtract = ['deductibleMet'];
          } else {
            extractionPrompt = `Extract ONLY deductible information from this user message. Current step: deductible.

User message: "${message}"

Extract and return ONLY a JSON object:
{
  "deductibleTotal": number (e.g., 5000 for "$5,000" or "5k" or "5000") or null,
  "deductibleMet": number (e.g., 1200 for "$1,200" or "1200") or null
}

IMPORTANT:
- Convert "k" to thousands (e.g., "5k" = 5000, "3k" = 3000)
- Extract dollar amounts (e.g., "$5,000" = 5000)
- Only extract deductible information, nothing else`;
            fieldsToExtract = ['deductibleTotal', 'deductibleMet'];
          }
          break;
        case 'providers':
          extractionPrompt = `Extract ONLY provider/hospital names from this user message. Current step: providers.

User message: "${message}"

Extract and return ONLY a JSON object:
{
  "preferredProviders": ["provider name"] or []
}

IMPORTANT:
- Extract hospital, clinic, or provider names
- Return as array of strings
- If user says "skip" or "none", return empty array []`;
          fieldsToExtract = ['preferredProviders'];
          break;
        default:
          return;
      }

      const messages: LLMMessage[] = [
        { role: 'system', content: 'You are a data extraction assistant. Extract structured data from user messages. Return only valid JSON.' },
        { role: 'user', content: extractionPrompt },
      ];

      // Build schema based on current step
      const schema: any = {
        type: 'object',
        properties: {},
      };
      
      if (fieldsToExtract.includes('zip')) {
        schema.properties.zip = { type: 'string', nullable: true };
      }
      if (fieldsToExtract.includes('city')) {
        schema.properties.city = { type: 'string', nullable: true };
      }
      if (fieldsToExtract.includes('state')) {
        schema.properties.state = { type: 'string', nullable: true };
      }
      if (fieldsToExtract.includes('payer')) {
        schema.properties.payer = { type: 'string', nullable: true };
      }
      if (fieldsToExtract.includes('deductibleTotal')) {
        schema.properties.deductibleTotal = { type: 'number', nullable: true };
      }
      if (fieldsToExtract.includes('deductibleMet')) {
        schema.properties.deductibleMet = { type: 'number', nullable: true };
      }
      if (fieldsToExtract.includes('preferredProviders')) {
        schema.properties.preferredProviders = { type: 'array', items: { type: 'string' } };
      }

      const extracted = await callLLMWithJSON<any>(messages, schema);
      console.log(`LLM extracted data for step "${this.state.currentStep}":`, extracted);

      // CRITICAL: Update collected data ONLY with fields relevant to current step
      // Do NOT update fields that aren't in fieldsToExtract - this prevents cross-step contamination
      if (fieldsToExtract.includes('zip') && extracted.zip) {
        this.state.collectedData.zip = extracted.zip;
        console.log('✅ LLM: Set zip to:', extracted.zip);
      }
      // Note: We're no longer collecting city/state, only ZIP code
      if (fieldsToExtract.includes('payer') && extracted.payer) {
        this.state.collectedData.payer = extracted.payer;
        console.log('✅ LLM: Set payer to:', extracted.payer);
      }
      if (fieldsToExtract.includes('deductibleTotal') && extracted.deductibleTotal !== null && extracted.deductibleTotal !== undefined) {
        this.state.collectedData.deductibleTotal = extracted.deductibleTotal;
        console.log('✅ LLM: Set deductibleTotal to:', extracted.deductibleTotal);
      }
      if (fieldsToExtract.includes('deductibleMet') && extracted.deductibleMet !== null && extracted.deductibleMet !== undefined) {
        this.state.collectedData.deductibleMet = extracted.deductibleMet;
        console.log('✅ LLM: Set deductibleMet to:', extracted.deductibleMet);
      }
      if (fieldsToExtract.includes('preferredProviders') && extracted.preferredProviders && Array.isArray(extracted.preferredProviders)) {
        this.state.collectedData.preferredProviders = extracted.preferredProviders;
        console.log('✅ LLM: Set preferredProviders to:', extracted.preferredProviders);
      }
      
      // IMPORTANT: Log and CLEAR any fields that were extracted but shouldn't be
      const allFields = ['zip', 'city', 'state', 'payer', 'deductibleTotal', 'deductibleMet', 'preferredProviders'];
      const unexpectedFields = allFields.filter(f => !fieldsToExtract.includes(f) && extracted[f] !== null && extracted[f] !== undefined);
      if (unexpectedFields.length > 0) {
        console.warn('⚠️ LLM extracted fields for wrong step:', unexpectedFields, 'Current step:', this.state.currentStep);
        console.warn('⚠️ IGNORING these fields to prevent data contamination');
        // Explicitly do NOT update these fields - they should remain as they were
      }
      
      // Double-check: Verify we didn't accidentally update wrong fields
      const fieldsWeShouldNotTouch = allFields.filter(f => !fieldsToExtract.includes(f));
      for (const field of fieldsWeShouldNotTouch) {
        // Make sure we didn't accidentally set these fields
        if (extracted[field] !== null && extracted[field] !== undefined) {
          console.error(`❌ ERROR: LLM tried to extract ${field} for step ${this.state.currentStep} - IGNORED`);
        }
      }

      // Don't advance step here - it will be advanced in processMessage after extraction
    } catch (error) {
      // Silently fail - rule-based extraction will handle it
      console.debug('LLM extraction failed, using rule-based:', error);
    }
  }

  /**
   * Advance to next step based on collected data
   * Flow: location → eob → (if no eob) insurance → deductible → providers
   */
  private advanceStepBasedOnData(): void {
    const data = this.state.collectedData;

    // Location → EOB
    if (this.state.currentStep === 'location' && data.zip) {
      this.state.currentStep = 'eob';
      console.log('✅ Advanced from location to eob');
    }
    // EOB → If uploaded, complete. If not, continue to insurance
    else if (this.state.currentStep === 'eob') {
      if (this.state.eobUploaded) {
        // EOB uploaded - we're done!
        this.state.currentStep = 'complete';
        console.log('✅ EOB uploaded - onboarding complete');
      } else {
        // No EOB - continue with questions
        this.state.currentStep = 'insurance';
        console.log('✅ No EOB - advancing to insurance questions');
      }
    }
    // Insurance → Deductible
    else if (this.state.currentStep === 'insurance' && data.payer) {
      this.state.currentStep = 'deductible';
      console.log('✅ Advanced from insurance to deductible');
    }
    // Deductible → Providers
    else if (this.state.currentStep === 'deductible') {
      // Only advance to providers if we have both total and met (or user skipped)
      const hasDeductibleData = this.state.collectedData.deductibleTotal !== undefined && 
                                this.state.collectedData.deductibleMet !== undefined;
      if (hasDeductibleData) {
        this.state.currentStep = 'providers';
        console.log(`✅ Advanced from deductible to ${this.state.currentStep}`);
      } else {
        console.log('⏸️ Staying on deductible step - need deductible met');
      }
    }
    // Don't advance from providers - completion check will handle that
  }

  private extractData(message: string): void {
    const lower = message.toLowerCase();
    console.log(`Rule-based extraction for step "${this.state.currentStep}" with message: "${message}"`);

    // CRITICAL: Only extract data for the current step - don't extract other fields
    switch (this.state.currentStep) {
      case 'location':
        // ONLY extract ZIP code - do NOT extract city/state
        // Extract ZIP code (5 digits)
        const zipMatch = message.match(/\b\d{5}\b/);
        if (zipMatch) {
          console.log('✅ Rule-based: Found ZIP code:', zipMatch[0]);
          this.state.collectedData.zip = zipMatch[0];
          // Step will advance to age via advanceStepBasedOnData
        } else {
          console.log('❌ Rule-based: No ZIP code found in message');
        }
        break;

      case 'insurance':
        // ONLY extract insurance/payer - do NOT touch location or other fields
        // Extract payer name - expanded list with more variations including Mercy
        // DO NOT extract plan type - we don't need it
        const payers = [
          'aetna', 'bcbs', 'blue cross', 'blue shield', 'unitedhealthcare', 'united healthcare',
          'cigna', 'humana', 'kaiser', 'kaiser permanente', 'medicare', 'medicaid',
          'anthem', 'anthem blue cross', 'healthnet', 'health net', 'molina', 'oscar',
          'care first', 'carefirst', 'wellpoint', 'well point', 'mercy', 'mercy health',
          'mercycare', 'mercy care'
        ];
        for (const payer of payers) {
          if (lower.includes(payer)) {
            if (payer === 'bcbs' || payer === 'blue cross' || payer === 'blue shield' || payer === 'anthem blue cross') {
              this.state.collectedData.payer = 'BCBS';
            } else if (payer === 'unitedhealthcare' || payer === 'united healthcare') {
              this.state.collectedData.payer = 'UnitedHealthcare';
            } else if (payer === 'kaiser' || payer === 'kaiser permanente') {
              this.state.collectedData.payer = 'Kaiser';
            } else if (payer === 'healthnet' || payer === 'health net') {
              this.state.collectedData.payer = 'HealthNet';
            } else if (payer === 'care first' || payer === 'carefirst') {
              this.state.collectedData.payer = 'CareFirst';
            } else if (payer === 'mercy' || payer === 'mercy health' || payer === 'mercycare' || payer === 'mercy care') {
              this.state.collectedData.payer = 'Mercy';
            } else {
              this.state.collectedData.payer = payer.charAt(0).toUpperCase() + payer.slice(1);
            }
            console.log('✅ Rule-based: Set payer to:', this.state.collectedData.payer);
            // Advance step if we have payer
            this.state.currentStep = 'deductible';
            console.log(`✅ Step advanced to: ${this.state.currentStep}`);
            break;
          }
        }
        break;

      case 'deductible':
        // Check for skip responses
        const skipWords = ['skip', "don't know", "dont know", "i don't know", "idk", "not sure", "no", "none"];
        if (skipWords.some(word => lower.includes(word))) {
          // User wants to skip - set met to 0 if we have total, or set both to defaults
          if (this.state.collectedData.deductibleTotal) {
            this.state.collectedData.deductibleMet = 0;
            console.log('✅ Rule-based: User skipped deductible met, set to 0');
          } else {
            // User skipped entirely - use defaults
            console.log('✅ Rule-based: User skipped deductible entirely');
          }
          break;
        }
        
        // Extract numbers with support for "k" notation (e.g., "5k" = 5000)
        // Pattern: $5,000 or 5000 or 5k or $5k
        const numberPattern = /\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(k|thousand)?/gi;
        const matches = [...message.matchAll(numberPattern)];
        
        if (matches && matches.length >= 1) {
          // Parse first number (total)
          let totalStr = matches[0][1].replace(/,/g, '');
          let total = parseInt(totalStr);
          if (matches[0][2] && (matches[0][2].toLowerCase() === 'k' || matches[0][2].toLowerCase() === 'thousand')) {
            total = total * 1000;
          }
          this.state.collectedData.deductibleTotal = total;
          console.log('✅ Rule-based: Set deductibleTotal to:', total);
          
          // Parse second number if present (met)
          if (matches.length >= 2) {
            let metStr = matches[1][1].replace(/,/g, '');
            let met = parseInt(metStr);
            if (matches[1][2] && (matches[1][2].toLowerCase() === 'k' || matches[1][2].toLowerCase() === 'thousand')) {
              met = met * 1000;
            }
            this.state.collectedData.deductibleMet = met;
            console.log('✅ Rule-based: Set deductibleMet to:', met);
          }
        }
        
        // Also try simple "5k" pattern
        const simpleKPattern = /(\d+)\s*k\b/gi;
        const kMatches = [...message.matchAll(simpleKPattern)];
        if (kMatches.length > 0 && !this.state.collectedData.deductibleTotal) {
          const totalK = parseInt(kMatches[0][1]) * 1000;
          this.state.collectedData.deductibleTotal = totalK;
          console.log('✅ Rule-based: Set deductibleTotal from "k" notation to:', totalK);
        }
        
        // Don't advance step here - let advanceStepBasedOnData handle it after processing
        break;

      case 'providers':
        // Check for skip responses
        const providerSkipWords = ['skip', 'none', 'no', "don't have", "dont have", "not really", "i don't know", "idk"];
        if (providerSkipWords.some(word => lower.includes(word))) {
          // User wants to skip - set empty array to mark they answered
          this.state.collectedData.preferredProviders = [];
          console.log('✅ Rule-based: User skipped providers, set to empty array');
          break;
        }
        
        // Extract provider names (simple - just store the message)
        if (message.trim() && message.length > 3) {
          // Simple extraction - split by comma or "and"
          const providers = message
            .split(/[,;]| and /i)
            .map(p => p.trim())
            .filter(p => p.length > 0 && !providerSkipWords.some(skip => p.toLowerCase().includes(skip)));
          if (providers.length > 0) {
            this.state.collectedData.preferredProviders = providers;
            console.log('✅ Rule-based: Set preferredProviders to:', providers);
          } else {
            // If no providers extracted, set empty array to mark they answered
            this.state.collectedData.preferredProviders = [];
            console.log('✅ Rule-based: No providers extracted, set to empty array');
          }
        } else {
          // Empty or very short message - treat as skip
          this.state.collectedData.preferredProviders = [];
          console.log('✅ Rule-based: Empty message, set providers to empty array');
        }
        // Note: We don't change the step here - completion check will handle it
        break;
    }
  }

  private generateResponse(): string {
    switch (this.state.currentStep) {
      case 'location':
        return "Welcome to BillHarmony! I'm here to help you get personalized cost estimates. Let's start with your location. What's your ZIP code?";

      case 'eob':
        return "For the most accurate estimates, we can use your Explanation of Benefits (EOB) - the statement your insurance sends after a visit. Upload it here and we'll extract your plan details automatically, or say 'skip' to answer a few questions instead.";

      case 'insurance':
        if (!this.state.collectedData.zip) {
          return "To provide accurate estimates, we need your ZIP code. What's your ZIP code?";
        }
        return "Great! Which insurance company do you have? (e.g., Aetna, BCBS, UnitedHealthcare)";

      case 'deductible':
        if (!this.state.collectedData.payer) {
          return "Which insurance company do you have? This helps us provide more accurate estimates.";
        }
        // If we have total but not met, ask about met
        if (this.state.collectedData.deductibleTotal && this.state.collectedData.deductibleMet === undefined) {
          return "How much of your deductible have you already used this year? (If you don't know, just say 'skip' or 'I don't know')";
        }
        // Otherwise ask for both
        return "Do you know your deductible and how much you've used so far? For example: $5,000 total, $1,200 used. (If you don't know, just say 'skip' or 'I don't know')";

      case 'providers':
        return "Do you have a usual hospital or clinic you prefer? (This is optional - you can say 'skip' or 'none')";

      case 'complete':
        return "Perfect! Your BillHarmony profile is ready!";

      default:
        return "Let's continue setting up your profile. What's your ZIP code?";
    }
  }

  /**
   * Handle EOB upload - extract data and mark as uploaded
   */
  async handleEOBUpload(file: File): Promise<void> {
    console.log('📤 Starting EOB upload and parsing...');
    const { parseEOB } = await import('./eob-parser');
    const eobData = await parseEOB(file);
    
    console.log('📋 EOB data extracted:', JSON.stringify(eobData, null, 2));
    
    // Store EOB data in collectedData
    this.state.collectedData.eobData = eobData;
    this.state.eobUploaded = true;
    
    // Extract useful data from EOB into collectedData
    if (eobData.payer) {
      this.state.collectedData.payer = eobData.payer;
      console.log(`✅ Extracted payer from EOB: ${eobData.payer}`);
    }
    if (eobData.planType) {
      this.state.collectedData.planType = eobData.planType;
      console.log(`✅ Extracted planType from EOB: ${eobData.planType}`);
    }
    if (eobData.deductibleTotal !== undefined && eobData.deductibleTotal !== null) {
      this.state.collectedData.deductibleTotal = eobData.deductibleTotal;
      console.log(`✅ Extracted deductibleTotal from EOB: ${eobData.deductibleTotal}`);
    } else {
      console.log('⚠️ No deductibleTotal found in EOB');
    }
    if (eobData.deductibleMet !== undefined && eobData.deductibleMet !== null) {
      this.state.collectedData.deductibleMet = eobData.deductibleMet;
      console.log(`✅ Extracted deductibleMet from EOB: ${eobData.deductibleMet}`);
    } else {
      console.log('⚠️ No deductibleMet found in EOB');
    }
    if (eobData.coinsurance !== undefined && eobData.coinsurance !== null) {
      this.state.collectedData.coinsurance = eobData.coinsurance;
      console.log(`✅ Extracted coinsurance from EOB: ${eobData.coinsurance} (${(eobData.coinsurance * 100).toFixed(0)}%)`);
    } else {
      console.log('⚠️ No coinsurance found in EOB');
    }
    if (eobData.oopMax !== undefined && eobData.oopMax !== null) {
      this.state.collectedData.oopMax = eobData.oopMax;
      console.log(`✅ Extracted oopMax from EOB: ${eobData.oopMax}`);
    } else {
      console.log('⚠️ No oopMax found in EOB');
    }
    
    console.log('📊 Final collectedData after EOB extraction:', JSON.stringify(this.state.collectedData, null, 2));
    
    // Advance to complete since EOB was uploaded
    this.state.currentStep = 'complete';
    this.state.isComplete = true;
  }

  /**
   * Handle EOB skip - user doesn't have EOB
   */
  handleEOBSkip(): void {
    this.state.eobUploaded = false;
    // Advance to insurance questions
    this.state.currentStep = 'insurance';
  }

  private isComplete(): boolean {
    // If EOB was uploaded, we're complete
    if (this.state.eobUploaded) {
      return true;
    }
    
    // Otherwise, need ZIP and payer (deductible and providers are optional)
    const data = this.state.collectedData;
    return !!(data.zip && data.payer);
  }

  /**
   * Build UserProfile from collected data with smart defaults
   */
  buildProfile(userId: string, name: string): UserProfile {
    const data = this.state.collectedData;
    const now = new Date().toISOString();

    console.log('Building profile from collected data:', data);

    // If EOB data exists, use it; otherwise use collected data with defaults
    const eobData = data.eobData;
    const planType = eobData?.planType || data.planType || 'PPO';
    const payer = eobData?.payer || data.payer || 'Unknown';
    
    // Use EOB coinsurance if available, otherwise estimate
    const coinsurance = eobData?.coinsurance !== undefined 
      ? eobData.coinsurance 
      : estimateCoinsurance(planType, payer);

    // Handle deductible met from EOB (999999 means fully met)
    let deductibleMet = eobData?.deductibleMet !== undefined 
      ? eobData.deductibleMet 
      : (data.deductibleMet !== undefined && data.deductibleMet !== null ? data.deductibleMet : 0);
    
    const deductibleTotal = eobData?.deductibleTotal !== undefined 
      ? eobData.deductibleTotal 
      : (data.deductibleTotal !== undefined && data.deductibleTotal !== null ? data.deductibleTotal : 2000);
    
    // If EOB indicates deductible is fully met (999999), set it to deductibleTotal if we have it
    if (deductibleMet === 999999 && deductibleTotal !== undefined && deductibleTotal !== null) {
      deductibleMet = deductibleTotal;
      console.log(`✅ EOB indicates deductible fully met, setting deductibleMet to deductibleTotal: ${deductibleTotal}`);
    } else if (deductibleMet === 999999) {
      // Deductible is met but we don't know the total - use a high number to indicate it's met
      console.log(`✅ EOB indicates deductible fully met, but no total found. Using 999999 to indicate fully met.`);
    }

    // Smart defaults for MVP - only use defaults if data wasn't provided
    return {
      id: userId,
      name,
      zip: data.zip || '',
      city: data.city || undefined,
      state: data.state || undefined,
      age: data.age !== undefined && data.age !== null ? data.age : undefined,
      payer,
      planType,
      deductibleTotal,
      deductibleMet,
      coinsurance,
      oopMax: eobData?.oopMax !== undefined ? eobData.oopMax : data.oopMax,
      inNetworkPreference: true, // Default to in-network
      preferredProviders: data.preferredProviders || [],
      eobData: eobData, // Store full EOB data
      createdAt: now,
      updatedAt: now,
    };
  }
}

/**
 * AI Procedure Parser
 * Maps natural language to CPT codes and procedure details
 */
export async function parseProcedureIntent(
  userInput: string
): Promise<ProcedureIntent> {
  if (USE_LLM) {
    try {
      // Get CPT suggestions to help the AI
      const cptSuggestions = getCPTSuggestions(userInput);
      const suggestionContext = cptSuggestions.slice(0, 5).map(cpt => ({
        code: cpt.code,
        description: cpt.description,
      }));
      
      const messages = buildProcedureParserMessages(userInput, suggestionContext);
      
      const schema = {
        type: 'object',
        properties: {
          label: { type: 'string' },
          cpts: { type: 'array', items: { type: 'string' } },
          siteOfService: { type: 'string', enum: ['inpatient', 'outpatient', 'freestanding', 'home', 'unknown'] },
          modifiers: { type: 'array', items: { type: 'string' } },
          requiresPriorAuth: { type: 'boolean' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          flags: {
            type: 'object',
            properties: {
              contrast: { type: 'boolean' },
              sedation: { type: 'boolean' },
              laterality: { type: 'string', enum: ['left', 'right', 'bilateral'] },
            },
          },
          clarificationNeeded: { type: 'string', nullable: true },
        },
        required: ['label', 'cpts', 'siteOfService', 'requiresPriorAuth', 'confidence'],
      };

      const result = await callLLMWithJSON<ProcedureIntent & { clarificationNeeded?: string | null }>(
        messages,
        schema
      );

      // Validate CPT codes
      const validatedCPTs: string[] = [];
      for (const cpt of result.cpts) {
        const validated = validateCPTCode(cpt);
        if (validated) {
          validatedCPTs.push(cpt);
        } else {
          console.warn(`Invalid CPT code from AI: ${cpt}, attempting to find similar...`);
          // Try to find similar codes
          const suggestions = getCPTSuggestions(userInput);
          if (suggestions.length > 0) {
            validatedCPTs.push(suggestions[0].code);
            console.log(`Using suggested CPT: ${suggestions[0].code} (${suggestions[0].description})`);
          }
        }
      }

      // If no valid CPTs found, use suggestions
      if (validatedCPTs.length === 0) {
        const suggestions = getCPTSuggestions(userInput);
        if (suggestions.length > 0) {
          validatedCPTs.push(suggestions[0].code);
          result.confidence = Math.min(0.7, result.confidence); // Lower confidence if we had to use fallback
        }
      }

      // Update result with validated CPTs
      result.cpts = validatedCPTs.length > 0 ? validatedCPTs : result.cpts;

      // If clarification is needed, we'll handle that in the UI
      if (result.clarificationNeeded) {
        // For now, proceed with lower confidence
        result.confidence = Math.max(0.5, result.confidence - 0.2);
      }

      // Remove clarificationNeeded from result
      const { clarificationNeeded, ...procedureIntent } = result;
      return procedureIntent;
    } catch (error) {
      console.error('LLM error in procedure parsing, falling back to rule-based:', error);
      // Fall through to rule-based logic
    }
  }

  // Fallback to rule-based logic
  return parseProcedureIntentRuleBased(userInput);
}

/**
 * Result type for procedure parsing that includes clarification info
 */
export interface ProcedureParseResult {
  procedureIntent: ProcedureIntent;
  clarificationNeeded: string | null;
  needsConversation: boolean; // true if confidence is low or clarification is needed
}

/**
 * Parse procedure intent with clarification information
 * Used when we need to know if a conversation is needed
 */
export async function parseProcedureIntentWithClarification(
  userInput: string
): Promise<ProcedureParseResult> {
  if (USE_LLM) {
    try {
      // Get CPT suggestions to help the AI
      const cptSuggestions = getCPTSuggestions(userInput);
      const suggestionContext = cptSuggestions.slice(0, 5).map(cpt => ({
        code: cpt.code,
        description: cpt.description,
      }));
      
      const messages = buildProcedureParserMessages(userInput, suggestionContext);
      
      const schema = {
        type: 'object',
        properties: {
          label: { type: 'string' },
          cpts: { type: 'array', items: { type: 'string' } },
          siteOfService: { type: 'string', enum: ['inpatient', 'outpatient', 'freestanding', 'home', 'unknown'] },
          modifiers: { type: 'array', items: { type: 'string' } },
          requiresPriorAuth: { type: 'boolean' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          flags: {
            type: 'object',
            properties: {
              contrast: { type: 'boolean' },
              sedation: { type: 'boolean' },
              laterality: { type: 'string', enum: ['left', 'right', 'bilateral'] },
            },
          },
          clarificationNeeded: { type: 'string', nullable: true },
        },
        required: ['label', 'cpts', 'siteOfService', 'requiresPriorAuth', 'confidence'],
      };

      const result = await callLLMWithJSON<ProcedureIntent & { clarificationNeeded?: string | null }>(
        messages,
        schema
      );

      // Validate CPT codes
      const validatedCPTs: string[] = [];
      for (const cpt of result.cpts) {
        const validated = validateCPTCode(cpt);
        if (validated) {
          validatedCPTs.push(validated);
        } else {
          console.warn(`Invalid CPT code from AI: ${cpt}, attempting to find similar...`);
          // Try to find similar codes
          const suggestions = getCPTSuggestions(userInput);
          if (suggestions.length > 0) {
            validatedCPTs.push(suggestions[0].code);
            console.log(`Using suggested CPT: ${suggestions[0].code} (${suggestions[0].description})`);
          }
        }
      }

      // If no valid CPTs found, use suggestions
      if (validatedCPTs.length === 0) {
        const suggestions = getCPTSuggestions(userInput);
        if (suggestions.length > 0) {
          validatedCPTs.push(suggestions[0].code);
          result.confidence = Math.min(0.7, result.confidence); // Lower confidence if we had to use fallback
        }
      }

      // Update result with validated CPTs
      result.cpts = validatedCPTs.length > 0 ? validatedCPTs : result.cpts;

      // For demo: Default common values when not specified to avoid clarification questions
      // Default to "without contrast" if contrast not mentioned
      if (!result.flags) {
        result.flags = {};
      }
      if (result.flags.contrast === undefined) {
        result.flags.contrast = false; // Default to without contrast
      }

      // Determine if clarification is needed
      const clarificationNeeded = result.clarificationNeeded || null;
      const confidence = result.confidence || 0.5;
      
      // For demo: Only need conversation if confidence is very low (< 0.5) 
      // Don't ask for clarification on common things like contrast (we default to without contrast)
      const needsConversation = confidence < 0.5;

      // If clarification is needed, lower confidence further
      if (clarificationNeeded) {
        result.confidence = Math.max(0.5, confidence - 0.2);
      }

      // Remove clarificationNeeded from result to get ProcedureIntent
      const { clarificationNeeded: _, ...procedureIntent } = result;
      
      return {
        procedureIntent,
        clarificationNeeded,
        needsConversation,
      };
    } catch (error) {
      console.error('LLM error in procedure parsing, falling back to rule-based:', error);
      // Fall through to rule-based logic
    }
  }

  // Fallback to rule-based logic
  const procedureIntent = parseProcedureIntentRuleBased(userInput);
  // For demo: Only need conversation if confidence is very low (< 0.5)
  const needsConversation = procedureIntent.confidence < 0.5;
  
  return {
    procedureIntent,
    clarificationNeeded: needsConversation ? "I want to make sure I understand correctly. Could you provide more details about the procedure?" : null,
    needsConversation,
  };
}

/**
 * Rule-based procedure parser (fallback)
 */
function parseProcedureIntentRuleBased(userInput: string): ProcedureIntent {
  const lower = userInput.toLowerCase();

  let cpts: string[] = [];
  let label = userInput;
  let siteOfService: ProcedureIntent['siteOfService'] = 'outpatient';
  let requiresPriorAuth = false;
  let confidence = 0.8;

  // MRI patterns
  if (lower.includes('mri')) {
    if (lower.includes('knee') || lower.includes('lower extremity') || lower.includes('left knee') || lower.includes('right knee')) {
      // Check for contrast
      if (lower.includes('with contrast') || lower.includes('w/ contrast')) {
        cpts = ['73722'];
        label = 'MRI lower extremity (knee) with contrast';
      } else {
        cpts = ['73721'];
        label = 'MRI lower extremity (knee) without contrast';
      }
      requiresPriorAuth = true;
    } else if (lower.includes('spine') || lower.includes('back') || lower.includes('lumbar')) {
      cpts = ['72148'];
      label = 'MRI lumbar spine without contrast';
      requiresPriorAuth = true;
    } else {
      cpts = ['72148'];
      label = 'MRI scan';
      requiresPriorAuth = true;
    }
    siteOfService = 'freestanding';
    confidence = 0.85;
  }
  // Sleep study
  else if (lower.includes('sleep study') || lower.includes('polysomnography')) {
    cpts = ['95810'];
    label = 'Overnight sleep study (polysomnography)';
    siteOfService = lower.includes('home') ? 'home' : 'freestanding';
    requiresPriorAuth = true;
    confidence = 0.9;
  }
  // Colonoscopy
  else if (lower.includes('colonoscopy')) {
    cpts = ['45378'];
    label = 'Colonoscopy';
    siteOfService = 'outpatient';
    requiresPriorAuth = true;
    confidence = 0.9;
  }
  // Physical therapy
  else if (lower.includes('physical therapy') || lower.includes('pt') || lower.includes('therapy session')) {
    cpts = ['97110'];
    label = 'Therapeutic exercise (physical therapy)';
    siteOfService = 'outpatient';
    confidence = 0.85;
  }
  // Ultrasound
  else if (lower.includes('ultrasound') || lower.includes('sonogram')) {
    if (lower.includes('abdominal') || lower.includes('abdomen')) {
      cpts = ['76700'];
      label = 'Ultrasound, abdominal';
    } else {
      cpts = ['76700'];
      label = 'Ultrasound';
    }
    siteOfService = 'outpatient';
    confidence = 0.8;
  }
  // Blood test / lab work
  else if (lower.includes('blood test') || lower.includes('blood panel') || lower.includes('lab work')) {
    cpts = ['80053'];
    label = 'Comprehensive metabolic panel';
    siteOfService = 'outpatient';
    confidence = 0.75;
  }
  // Cancer screenings
  else if (lower.includes('skin cancer') || lower.includes('mole check') || lower.includes('dermatology')) {
    cpts = ['99213']; // Office visit for skin exam
    label = 'Skin cancer screening';
    siteOfService = 'outpatient';
    confidence = 0.8;
  }
  // Breast cancer screening / mammogram
  else if (lower.includes('breast cancer') || lower.includes('mammogram')) {
    if (lower.includes('screening') || lower.includes('routine')) {
      cpts = ['77067']; // Screening mammography
      label = 'Screening mammography, bilateral';
    } else {
      cpts = ['77065']; // Diagnostic mammography
      label = 'Diagnostic mammography, bilateral';
    }
    siteOfService = 'freestanding';
    requiresPriorAuth = false;
    confidence = 0.9;
  }
  // Pap smear / Well-woman visit
  else if (lower.includes('pap') || lower.includes('pap smear') || lower.includes('cervical') ||
           lower.includes('well-woman') || lower.includes('well woman') || lower.includes('womens wellness') ||
           lower.includes("women's wellness")) {
    cpts = ['88142'];
    if (lower.includes('well') || lower.includes('wellness')) {
      label = 'Well-woman visit (includes Pap smear)';
    } else {
      label = 'Cervical cytopathology (Pap smear)';
    }
    siteOfService = 'outpatient';
    requiresPriorAuth = false;
    confidence = 0.9;
  }
  // Office visit / Consultation
  else if (lower.includes('checkup') || lower.includes('check-up') || lower.includes('office visit') || 
           lower.includes('annual') || lower.includes('consultation') || lower.includes('follow-up') || 
           lower.includes('followup') || lower.includes('follow up')) {
    cpts = ['99213'];
    label = 'Office visit, established patient';
    siteOfService = 'outpatient';
    confidence = 0.8;
  }
  // Default fallback - try to use CPT suggestions
  else {
    // Try to get suggestions from CPT database
    const suggestions = getCPTSuggestions(userInput);
    if (suggestions.length > 0) {
      cpts = [suggestions[0].code];
      label = suggestions[0].description;
      siteOfService = suggestions[0].typicalSiteOfService;
      requiresPriorAuth = suggestions[0].requiresPriorAuth;
      confidence = 0.6; // Lower confidence for fallback
    } else {
      // Last resort: generic office visit
      cpts = ['99213'];
      label = userInput;
      confidence = 0.4; // Very low confidence
    }
  }

  // Extract modifiers
  const flags: ProcedureIntent['flags'] = {};
  if (lower.includes('contrast')) flags.contrast = true;
  if (lower.includes('sedation') || lower.includes('anesthesia')) flags.sedation = true;
  if (lower.includes('left')) flags.laterality = 'left';
  if (lower.includes('right')) flags.laterality = 'right';
  if (lower.includes('bilateral')) flags.laterality = 'bilateral';

  return {
    label,
    cpts,
    siteOfService,
    modifiers: [],
    requiresPriorAuth,
    confidence,
    flags,
  };
}

/**
 * AI Explainer
 * Generate plain English explanation of pricing
 */
export async function generatePriceExplanation(
  pricingResult: {
    allowedAmount: number;
    deductibleApplied: number;
    coinsuranceDue: number;
    estimatedOop: number;
  },
  costProfile: {
    deductibleRemaining: number;
    normalizedCoinsurance: number;
    inNetworkPreference: boolean;
  },
  procedureIntent: ProcedureIntent
): Promise<string[]> {
  if (USE_LLM) {
    try {
      const messages = buildPriceExplanationMessages(pricingResult, costProfile, procedureIntent);
      
      const schema = {
        type: 'array',
        items: { type: 'string' },
      };

      const bullets = await callLLMWithJSON<string[]>(messages, schema);
      return bullets;
    } catch (error) {
      console.error('LLM error in price explanation, falling back to rule-based:', error);
      // Fall through to rule-based logic
    }
  }

  // Fallback to rule-based logic
  const bullets: string[] = [];

  bullets.push(
    `Based on your ${costProfile.inNetworkPreference ? 'in-network' : 'out-of-network'} coverage, the estimated allowed amount is $${pricingResult.allowedAmount}.`
  );

  if (pricingResult.deductibleApplied > 0) {
    bullets.push(
      `You'll pay $${pricingResult.deductibleApplied} toward your remaining deductible of $${costProfile.deductibleRemaining}.`
    );
  } else {
    bullets.push('Your deductible has been met, so coinsurance applies.');
  }

  if (pricingResult.coinsuranceDue > 0) {
    const coinsurancePercent = Math.round(costProfile.normalizedCoinsurance * 100);
    bullets.push(
      `After your deductible, you'll pay ${coinsurancePercent}% coinsurance: $${pricingResult.coinsuranceDue}.`
    );
  }

  bullets.push(
    `Your total estimated out-of-pocket cost is $${pricingResult.estimatedOop}.`
  );

  if (procedureIntent.requiresPriorAuth) {
    bullets.push('⚠️ This procedure typically requires prior authorization from your insurance.');
  }

  return bullets;
}

/**
 * Generate AI-powered cost insights for an estimate
 * Provides helpful context about the price and what it means
 */
export async function generateCostInsights(estimate: Estimate): Promise<string[]> {
  // Safety check
  if (!estimate || !estimate.inputsSnapshot || !estimate.inputsSnapshot.profile || !estimate.inputsSnapshot.costProfile || !estimate.results) {
    console.warn('Invalid estimate data for cost insights');
    return [];
  }

  if (USE_LLM) {
    try {
      const profile = estimate.inputsSnapshot.profile;
      const costProfile = estimate.inputsSnapshot.costProfile;
      const results = estimate.results;
      
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: `You are a helpful healthcare cost advisor for BillHarmony. Provide clear, empathetic insights about medical costs. Be conversational and helpful, not clinical.`
        },
        {
          role: 'user',
          content: `Generate exactly 3 concise insights about this cost estimate. Each insight must be 80 characters or less. Be specific and actionable.

Procedure: ${estimate.title}
Estimated Cost: $${results.estimatedOop}
Allowed Amount: $${results.allowedAmount}
Deductible Remaining: $${costProfile.deductibleRemaining}
Coinsurance: ${Math.round(costProfile.normalizedCoinsurance * 100)}%
Network: ${costProfile.inNetworkPreference ? 'In-network' : 'Out-of-network'}
Insurance: ${profile.payer || 'Unknown'}
Regional Price Range: $${estimate.results.regionalBenchmark?.min || 0} - $${estimate.results.regionalBenchmark?.max || 0}

Provide 3 short insights (max 80 chars each) that help the user understand:
- Whether this is a good price compared to alternatives
- What factors are affecting the cost
- What they should know about this procedure

Format as a JSON array of exactly 3 strings: ["insight 1", "insight 2", "insight 3"]`
        }
      ];

      const schema = {
        type: 'array',
        items: { type: 'string' },
      };

      const insights = await callLLMWithJSON<string[]>(messages, schema);
      return insights;
    } catch (error) {
      console.error('LLM error generating cost insights, using fallback:', error);
    }
  }

  // Fallback insights
  return [
    `This estimate is based on ${estimate.results.regionalBenchmark?.source || 'regional pricing data'} for your area.`,
    `The price assumes an ${costProfile.inNetworkPreference ? 'in-network' : 'out-of-network'} provider.`,
    `Your ${costProfile.deductibleRemaining > 0 ? `$${costProfile.deductibleRemaining} remaining deductible` : 'deductible is met'} affects your out-of-pocket cost.`,
  ];
}

/**
 * Generate AI-powered money-saving tips for an estimate
 * Provides actionable advice for reducing costs
 */
export async function generateMoneySavingTips(estimate: Estimate): Promise<string[]> {
  // Safety check
  if (!estimate || !estimate.inputsSnapshot || !estimate.inputsSnapshot.profile || !estimate.inputsSnapshot.costProfile || !estimate.results) {
    console.warn('Invalid estimate data for money-saving tips');
    return [];
  }

  if (USE_LLM) {
    try {
      const profile = estimate.inputsSnapshot.profile;
      const costProfile = estimate.inputsSnapshot.costProfile;
      const results = estimate.results;
      
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: `You are a healthcare cost savings advisor for BillHarmony. Provide practical, actionable tips for saving money on medical procedures. Be specific and helpful.`
        },
        {
          role: 'user',
          content: `Generate exactly 3 concise money-saving tips for this procedure. Each tip must be 80 characters or less. Be specific and actionable.

Procedure: ${estimate.title}
Estimated Cost: $${results.estimatedOop}
Allowed Amount: $${results.allowedAmount}
Requires Prior Auth: ${estimate.procedureIntent.requiresPriorAuth ? 'Yes' : 'No'}
Network: ${costProfile.inNetworkPreference ? 'In-network' : 'Out-of-network'}
Has Preferred Providers: ${profile.preferredProviders?.length > 0 ? 'Yes' : 'No'}

Provide 3 short tips (max 80 chars each) like:
- How to verify network status
- Questions to ask providers
- Timing considerations (deductible reset, etc.)
- Alternative options if available

Format as a JSON array of exactly 3 strings: ["tip 1", "tip 2", "tip 3"]`
        }
      ];

      const schema = {
        type: 'array',
        items: { type: 'string' },
      };

      const tips = await callLLMWithJSON<string[]>(messages, schema);
      return tips;
    } catch (error) {
      console.error('LLM error generating money-saving tips, using fallback:', error);
    }
  }

  // Fallback tips
  const tips: string[] = [];
  
  if (costProfile.deductibleRemaining > 0 && results.estimatedOop > costProfile.deductibleRemaining) {
    tips.push(`You're close to meeting your deductible. Consider scheduling other needed procedures before the year ends to maximize your benefit.`);
  }
  
  if (!costProfile.inNetworkPreference) {
    tips.push(`Using an in-network provider could significantly reduce your costs. Verify network status before scheduling.`);
  }
  
  if (estimate.procedureIntent.requiresPriorAuth) {
    tips.push(`This procedure requires prior authorization. Get approval from your insurance before scheduling to avoid surprise bills.`);
  }
  
  tips.push(`Compare prices at different facilities. Prices can vary significantly even for the same procedure.`);
  
  return tips;
}
