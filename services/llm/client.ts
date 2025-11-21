// LLM Client - Abstraction layer for multiple AI providers
// Uses Firebase Functions for secure API key handling
// Supports OpenAI, Anthropic (Claude), and Google Gemini

let functionsInitialized = false;
let functionsInstance: any = null;

export type LLMProvider = 'openai' | 'anthropic' | 'gemini';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
}

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/**
 * Get the default LLM provider configuration
 * Note: API keys are now stored server-side in Firebase Functions
 * This just returns the preferred provider and model settings
 */
export function getDefaultLLMConfig(): LLMConfig | null {
  // Always return a config - the actual API key is stored server-side
  // Default to Gemini if available, otherwise try others
  const preferredProvider = import.meta.env.VITE_PREFERRED_LLM_PROVIDER || 'gemini';
  const preferredModel = import.meta.env.VITE_PREFERRED_LLM_MODEL || 
    (preferredProvider === 'gemini' ? 'gemini-1.5-pro' : // Use gemini-1.5-pro (works in v1 API)
     preferredProvider === 'openai' ? 'gpt-4o-mini' :
     'claude-3-5-sonnet-20241022');

  return {
    provider: preferredProvider as LLMProvider,
    apiKey: '', // Not needed - handled server-side
    model: preferredModel,
    temperature: 0.7,
    maxTokens: 2000,
  };
}

/**
 * Initialize Firebase Functions (lazy load)
 */
async function initializeFunctions() {
  if (functionsInitialized && functionsInstance) {
    return functionsInstance;
  }

  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const { initializeApp, getApps } = await import('firebase/app');
    
    // Initialize Firebase app if not already initialized
    let app;
    const apps = getApps();
    if (apps.length === 0) {
      app = initializeApp({
        projectId: 'spitegarden',
      });
    } else {
      app = apps[0];
    }

    // Specify the region where the function is deployed (us-central1)
    functionsInstance = getFunctions(app, 'us-central1');
    functionsInitialized = true;
    console.log('✅ Firebase Functions initialized');
    return functionsInstance;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Functions:', error);
    throw error;
  }
}

/**
 * Call LLM with messages via Firebase Functions (secure backend)
 */
export async function callLLM(
  messages: LLMMessage[],
  config?: LLMConfig
): Promise<LLMResponse> {
  const llmConfig = config || getDefaultLLMConfig();

  if (!llmConfig) {
    throw new Error('No LLM configuration available');
  }

  // Use Firebase Functions for secure API calls
  try {
    console.log('🔐 Calling LLM via Firebase Functions...');
    const functions = await initializeFunctions();
    const { httpsCallable } = await import('firebase/functions');
    
    const callLLMFunction = httpsCallable(functions, 'callLLM');
    console.log('📞 Calling callLLM function with:', { 
      provider: llmConfig.provider, 
      model: llmConfig.model,
      messageCount: messages.length 
    });
    
    const result = await callLLMFunction({
      messages,
      provider: llmConfig.provider,
      model: llmConfig.model,
      temperature: llmConfig.temperature,
      maxTokens: llmConfig.maxTokens,
    });

    console.log('✅ Firebase Functions response received');
    return result.data as LLMResponse;
  } catch (error: any) {
    console.error('❌ Firebase Functions error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    throw new Error(`Failed to call LLM via backend: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  messages: LLMMessage[],
  config: LLMConfig
): Promise<LLMResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      messages: messages.map(msg => {
        // Handle both string and array content (for vision API)
        if (typeof msg.content === 'string') {
          return {
            role: msg.role,
            content: msg.content,
          };
        } else {
          // Array content for vision API
          return {
            role: msg.role,
            content: msg.content.map(item => {
              if (item.type === 'text') {
                return { type: 'text', text: item.text || '' };
              } else if (item.type === 'image_url') {
                return { 
                  type: 'image_url', 
                  image_url: item.image_url 
                };
              }
              return item;
            }),
          };
        }
      }),
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    // Don't expose API key in error messages
    let errorMessage = error.error?.message || 'API request failed';
    // Remove any API key from error message (OpenAI sometimes includes it)
    errorMessage = errorMessage.replace(/sk-[a-zA-Z0-9-]+/g, '***');
    throw new Error(`OpenAI API error: ${errorMessage}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

/**
 * Call Anthropic (Claude) API
 */
async function callAnthropic(
  messages: LLMMessage[],
  config: LLMConfig
): Promise<LLMResponse> {
  // Anthropic requires system message to be separate
  const systemMessage = messages.find(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.7,
      system: systemMessage?.content || '',
      messages: conversationMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    // Don't expose API key in error messages
    const errorMessage = error.error?.message || 'API request failed';
    throw new Error(`Anthropic API error: ${errorMessage}`);
  }

  const data = await response.json();
  return {
    content: data.content[0]?.text || '',
    usage: data.usage ? {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    } : undefined,
  };
}

/**
 * Call Google Gemini API
 */
async function callGemini(
  messages: LLMMessage[],
  config: LLMConfig
): Promise<LLMResponse> {
  // Gemini API structure is different
  const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
  const conversationMessages = messages.filter(m => m.role !== 'system');

  // Gemini API - use v1beta for most models, but some vision models need v1
  const modelName = config.model || 'gemini-1.5-flash';
  
  // Use the model name as-is - it should match exactly what's in the API
  // Remove 'models/' prefix if present (API adds it automatically)
  let apiModelName = modelName.replace(/^models\//, '');
  
  // Check if this message contains images (vision)
  const hasImages = conversationMessages.some(msg => {
    if (typeof msg.content === 'string') return false;
    return msg.content.some(item => item.type === 'image_url');
  });
  
  // Use v1beta for all models - it supports vision for models that have it
  // v1beta is more stable and supports more models
  const apiVersion = 'v1beta';
  const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${apiModelName}:generateContent?key=${config.apiKey}`;
  
  console.log(`🔍 Using Gemini API ${apiVersion} for model ${apiModelName}${hasImages ? ' (with vision)' : ''}`);
  
  // Convert messages to Gemini format, handling both text and vision (images)
  const betaContents = conversationMessages.map(msg => {
    const parts: any[] = [];
    
    // Handle content - can be string or array (for vision)
    if (typeof msg.content === 'string') {
      parts.push({ text: msg.content });
    } else {
      // Array content for vision API
      for (const item of msg.content) {
        if (item.type === 'text' && item.text) {
          parts.push({ text: item.text });
        } else if (item.type === 'image_url' && item.image_url?.url) {
          // Extract base64 and mime type from data URL
          const dataUrl = item.image_url.url;
          const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            parts.push({
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            });
          } else {
            console.warn('Invalid image URL format:', dataUrl.substring(0, 50));
          }
        }
      }
    }
    
    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: parts,
    };
  });

  const requestBody: any = {
    contents: betaContents,
    generationConfig: {
      temperature: config.temperature || 0.7,
      maxOutputTokens: config.maxTokens || 2000,
    },
  };
  
  // Add system instruction if present (v1beta supports it)
  if (systemInstruction && typeof systemInstruction === 'string') {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }
  
  // Use v1beta API for all Gemini models
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    // Don't expose API key in error messages
    const errorMessage = error.error?.message || 'API request failed';
    console.error('Gemini API error details:', error);
    throw new Error(`Gemini API error: ${errorMessage}`);
  }

  const data = await response.json();
  
  // Check for errors in response
  if (data.error) {
    console.error('Gemini API error:', data.error);
    throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`);
  }
  
  // Extract content - handle different response structures
  let content = '';
  if (data.candidates && data.candidates.length > 0) {
    const candidate = data.candidates[0];
    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
      content = candidate.content.parts[0].text || '';
    }
    // Check for finish reason
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      console.warn('Gemini finish reason:', candidate.finishReason);
      if (candidate.finishReason === 'MAX_TOKENS') {
        console.warn('Response was truncated due to token limit');
      }
    }
  }
  
  if (!content) {
    console.error('Empty response from Gemini. Full response:', JSON.stringify(data, null, 2));
    throw new Error('Gemini API returned empty response. Check console for details.');
  }
  
  return {
    content: content,
    usage: data.usageMetadata ? {
      promptTokens: data.usageMetadata.promptTokenCount,
      completionTokens: data.usageMetadata.candidatesTokenCount,
      totalTokens: data.usageMetadata.totalTokenCount,
    } : undefined,
  };
}

/**
 * Call LLM with JSON structured output
 */
export async function callLLMWithJSON<T>(
  messages: LLMMessage[],
  schema: object,
  config?: LLMConfig
): Promise<T> {
  const llmConfig = config || getDefaultLLMConfig();

  if (!llmConfig) {
    throw new Error('No LLM API key configured');
  }

  // Add JSON schema instruction to the last user message
  const enhancedMessages = [...messages];
  const lastUserMessage = enhancedMessages[enhancedMessages.length - 1];
  if (lastUserMessage && lastUserMessage.role === 'user') {
    enhancedMessages[enhancedMessages.length - 1] = {
      ...lastUserMessage,
      content: `${lastUserMessage.content}\n\nPlease respond with valid JSON matching this schema:\n${JSON.stringify(schema, null, 2)}`,
    };
  }

  const response = await callLLM(enhancedMessages, config);

  // Check if response is empty
  if (!response.content || response.content.trim().length === 0) {
    console.error('LLM returned empty response');
    throw new Error('LLM returned empty response');
  }

  // Parse JSON from response
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                     response.content.match(/```\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : response.content;
    
    const trimmed = jsonString.trim();
    if (!trimmed || trimmed.length === 0) {
      throw new Error('Empty JSON string after extraction');
    }
    
    return JSON.parse(trimmed) as T;
  } catch (error) {
    console.error('Failed to parse LLM JSON response:', error);
    console.error('Response content:', response.content);
    console.error('Response length:', response.content?.length || 0);
    throw new Error(`Failed to parse LLM response as JSON: ${error}`);
  }
}

