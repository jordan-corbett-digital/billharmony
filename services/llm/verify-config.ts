// Configuration verification utility
// Run this in the browser console to check if your API key is configured correctly

import { getDefaultLLMConfig } from './client';

/**
 * Verify LLM configuration
 * Returns detailed status about the API key setup
 */
export function verifyLLMConfig(): {
  isConfigured: boolean;
  provider?: string;
  model?: string;
  apiKeyLength: number;
  apiKeyPreview: string;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  const config = getDefaultLLMConfig();

  if (!config) {
    issues.push('No API key found in environment variables');
    recommendations.push('Add VITE_OPENAI_API_KEY, VITE_ANTHROPIC_API_KEY, or VITE_GEMINI_API_KEY to .env.local');
    recommendations.push('Make sure the variable name starts with VITE_');
    recommendations.push('Restart your dev server after adding the key');
    
    return {
      isConfigured: false,
      apiKeyLength: 0,
      apiKeyPreview: '',
      issues,
      recommendations,
    };
  }

  // Check if API key looks like a placeholder
  const apiKey = config.apiKey;
  const isPlaceholder = 
    apiKey.includes('your_') ||
    apiKey.includes('_here') ||
    apiKey.includes('placeholder') ||
    apiKey === 'your_openai_api_key_here' ||
    apiKey === 'your_anthropic_api_key_here' ||
    apiKey === 'your_gemini_api_key_here';

  if (isPlaceholder) {
    issues.push('API key appears to be a placeholder');
    recommendations.push('Replace the placeholder text with your actual API key');
  }

  // Check API key format based on provider
  if (config.provider === 'openai' && !apiKey.startsWith('sk-')) {
    issues.push('OpenAI API key should start with "sk-"');
    recommendations.push('Verify you copied the full API key from OpenAI dashboard');
  }

  if (config.provider === 'anthropic' && !apiKey.startsWith('sk-ant-')) {
    issues.push('Anthropic API key should start with "sk-ant-"');
    recommendations.push('Verify you copied the full API key from Anthropic console');
  }

  // Check minimum length
  if (apiKey.length < 20) {
    issues.push('API key seems too short');
    recommendations.push('Make sure you copied the complete API key');
  }

  // Never expose the API key - only show masked version
  const apiKeyPreview = '***' + apiKey.substring(apiKey.length - 4);

  return {
    isConfigured: !isPlaceholder && issues.length === 0,
    provider: config.provider,
    model: config.model,
    apiKeyLength: apiKey.length,
    apiKeyPreview, // Only last 4 chars for verification
    issues,
    recommendations,
  };
}

/**
 * Print configuration status to console
 */
export function printConfigStatus(): void {
  const status = verifyLLMConfig();

  console.log('\n🔍 LLM Configuration Check\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (status.isConfigured) {
    console.log('✅ Configuration looks good!');
    console.log(`   Provider: ${status.provider}`);
    console.log(`   Model: ${status.model}`);
    console.log(`   API Key: ${status.apiKeyPreview} (${status.apiKeyLength} chars)`);
    console.log('\n💡 The app will use real AI features.');
  } else {
    console.log('⚠️  Configuration needs attention');
    
    if (status.provider) {
      console.log(`   Provider detected: ${status.provider}`);
      console.log(`   Model: ${status.model}`);
      // Only show last 4 chars for verification, never the full key
      console.log(`   API Key: ${status.apiKeyPreview} (${status.apiKeyLength} chars)`);
    }

    if (status.issues.length > 0) {
      console.log('\n   Issues found:');
      status.issues.forEach(issue => console.log(`   ❌ ${issue}`));
    }

    if (status.recommendations.length > 0) {
      console.log('\n   Recommendations:');
      status.recommendations.forEach(rec => console.log(`   💡 ${rec}`));
    }

    console.log('\n💡 The app will use rule-based fallbacks until configured.');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Make it available globally for easy console access
if (typeof window !== 'undefined') {
  (window as any).checkLLMConfig = printConfigStatus;
  (window as any).verifyLLMConfig = verifyLLMConfig;
}

