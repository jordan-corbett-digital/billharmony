// Utility to test LLM configuration
// This can be imported and called from the browser console or a test page

import { getDefaultLLMConfig } from './client';

/**
 * Test LLM configuration and return status
 */
export function testLLMConfig(): {
  configured: boolean;
  provider?: string;
  hasApiKey: boolean;
  model?: string;
  error?: string;
} {
  try {
    const config = getDefaultLLMConfig();
    
    if (!config) {
      return {
        configured: false,
        hasApiKey: false,
        error: 'No API key found. Please add VITE_OPENAI_API_KEY, VITE_ANTHROPIC_API_KEY, or VITE_GEMINI_API_KEY to .env.local',
      };
    }

    // Check if API key looks valid (not placeholder)
    const apiKey = config.apiKey;
    const isPlaceholder = apiKey.includes('your_') || 
                         apiKey.includes('here') || 
                         apiKey.length < 10;

    return {
      configured: !isPlaceholder,
      provider: config.provider,
      hasApiKey: true,
      model: config.model,
      error: isPlaceholder 
        ? 'API key appears to be a placeholder. Please replace it with your actual API key.'
        : undefined,
    };
  } catch (error) {
    return {
      configured: false,
      hasApiKey: false,
      error: `Error checking configuration: ${error}`,
    };
  }
}

/**
 * Log configuration status to console (for debugging)
 */
export function logLLMConfig(): void {
  const status = testLLMConfig();
  console.log('🔍 LLM Configuration Status:', status);
  
  if (status.configured) {
    console.log(`✅ LLM is configured! Provider: ${status.provider}, Model: ${status.model}`);
  } else {
    console.warn('⚠️ LLM is not configured:', status.error);
    console.log('💡 The app will use rule-based fallbacks, which is fine for development.');
  }
}

