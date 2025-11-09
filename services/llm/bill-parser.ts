/**
 * Bill Parser - AI-powered bill analysis
 * Uses vision AI to extract and analyze medical bills
 */

import { callLLM, getDefaultLLMConfig, LLMMessage } from './client';

// Import types to avoid circular dependency
export interface BillLineItem {
  id: string;
  name: string;
  cptCode?: string;
  billedAmount: number;
  expectedRange?: [number, number];
  tags: string[];
  details: string;
  suggestedAction?: string;
}

export interface BillAnalysis {
  billTotal: number;
  expectedTotal: number;
  difference: number;
  lineItems: BillLineItem[];
  summary: {
    unexpectedCharges: number;
    possibleDuplicates: number;
    codingVerified: boolean;
    inNetworkConfirmed: boolean;
  };
  explanation: string; // "Explain like I'm 5" version
}

/**
 * Convert file to base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Parse bill from image using vision AI
 */
export async function parseBillWithAI(file: File): Promise<BillAnalysis> {
  console.log('📄 Starting bill analysis...');
  
  // Check file type
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
    throw new Error('Please upload an image (PNG, JPG) or PDF file');
  }

  // Convert to base64
  const base64 = await fileToBase64(file);
  const mimeType = file.type || 'image/png';

  // Build system prompt for bill analysis - concise to save tokens
  const systemPrompt = `Analyze this medical bill. Extract line items, detect errors/overcharges, and return ONLY valid JSON (no markdown, no text before/after).

JSON format:
{
  "billTotal": number,
  "expectedTotal": number,
  "difference": number,
  "lineItems": [{"name": "string", "cptCode": "string or null", "billedAmount": number, "expectedRange": [min, max], "tags": ["Unexpected Charge"|"Possible Duplicate"|"Coding Issue"], "details": "brief explanation", "suggestedAction": "action"}],
  "summary": {"unexpectedCharges": number, "possibleDuplicates": number, "codingVerified": boolean, "inNetworkConfirmed": boolean},
  "explanation": "brief simple explanation"
}

Rules:
- Extract all services/procedures with amounts
- Compare billed amounts to typical rates (expectedRange)
- Flag charges >20% above typical as "Unexpected Charge"
- Flag duplicate services as "Possible Duplicate"
- Keep explanations brief (1-2 sentences max)`;

  const userMessage = `Analyze this medical bill image. Extract all line items, detect any errors or overcharges, and provide a clear analysis.`;

  // Build messages for vision API
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: userMessage,
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64}`,
          },
        },
      ],
    },
  ];

  try {
    const config = getDefaultLLMConfig();
    if (!config) {
      throw new Error('No LLM API key configured. Please add an API key in .env.local');
    }

    // Increase max tokens for bill analysis (needs more tokens for JSON output)
    const billAnalysisConfig = {
      ...config,
      maxTokens: 4000, // Increased from default 2000 to handle large JSON responses
    };

    console.log('🤖 Calling LLM for bill analysis...');
    const llmResponse = await callLLM(messages, billAnalysisConfig);
    const response = llmResponse.content;
    
    // Check if response is empty
    if (!response || response.trim().length === 0) {
      console.error('LLM returned empty response');
      throw new Error('LLM returned empty response. The API may have timed out or encountered an error.');
    }
    
    console.log('📝 LLM response length:', response.length, 'characters');

    // Parse JSON response
    let analysisData: any;
    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonString = response;
      
      // First try to find JSON in code blocks
      const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1] || codeBlockMatch[0];
      } else {
        // Try to find JSON object in the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
      }
      
      // Try to fix incomplete JSON by closing brackets if needed
      let openBraces = (jsonString.match(/\{/g) || []).length;
      let closeBraces = (jsonString.match(/\}/g) || []).length;
      let openBrackets = (jsonString.match(/\[/g) || []).length;
      let closeBrackets = (jsonString.match(/\]/g) || []).length;
      
      // Close any unclosed brackets
      while (openBraces > closeBraces) {
        jsonString += '}';
        closeBraces++;
      }
      while (openBrackets > closeBrackets) {
        jsonString += ']';
        closeBrackets++;
      }
      
      analysisData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', parseError);
      console.error('Response was:', response.substring(0, 500));
      throw new Error(`Failed to parse bill analysis: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // Normalize and validate the data
    const analysis = normalizeBillAnalysis(analysisData);
    console.log('✅ Bill analysis complete:', analysis);
    return analysis;
  } catch (error) {
    console.error('❌ Error analyzing bill:', error);
    throw error;
  }
}

/**
 * Analyze bill data (not from image)
 */
export async function analyzeBillDataWithAI(billData: {
  lineItems: Array<{ name: string; amount: number; cptCode?: string }>;
  total: number;
  provider?: string;
  date?: string;
}): Promise<BillAnalysis> {
  const systemPrompt = `You are an expert at analyzing medical bills and detecting errors, overcharges, and billing issues. Analyze the provided bill data and identify any problems.`;

  const userMessage = `Analyze this medical bill:
Total: $${billData.total}
Provider: ${billData.provider || 'Unknown'}
Date: ${billData.date || 'Unknown'}

Line Items:
${billData.lineItems.map(item => `- ${item.name}${item.cptCode ? ` (CPT: ${item.cptCode})` : ''}: $${item.amount}`).join('\n')}

Please analyze for:
1. Unexpected charges (amounts that seem high)
2. Possible duplicates
3. Coding issues
4. Network status issues

Return JSON in the same format as bill image analysis.`;

  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  try {
    const config = getDefaultLLMConfig();
    if (!config) {
      throw new Error('No LLM API key configured');
    }

    const llmResponse = await callLLM(messages, config);
    const response = llmResponse.content;
    
    // Parse JSON
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
    const analysisData = JSON.parse(jsonString);
    
    return normalizeBillAnalysis(analysisData);
  } catch (error) {
    console.error('Error analyzing bill data:', error);
    throw error;
  }
}

/**
 * Normalize bill analysis data
 */
function normalizeBillAnalysis(data: any): BillAnalysis {
  const lineItems: BillLineItem[] = (data.lineItems || []).map((item: any, index: number) => ({
    id: `item-${index}`,
    name: String(item.name || 'Unknown Service'),
    cptCode: item.cptCode || undefined,
    billedAmount: typeof item.billedAmount === 'number' ? item.billedAmount : parseFloat(item.billedAmount) || 0,
    expectedRange: item.expectedRange && Array.isArray(item.expectedRange) && item.expectedRange.length === 2
      ? [item.expectedRange[0], item.expectedRange[1]]
      : undefined,
    tags: Array.isArray(item.tags) ? item.tags : [],
    details: String(item.details || ''),
    suggestedAction: item.suggestedAction || undefined,
  }));

  const billTotal = typeof data.billTotal === 'number' ? data.billTotal : parseFloat(data.billTotal) || 0;
  const expectedTotal = typeof data.expectedTotal === 'number' ? data.expectedTotal : parseFloat(data.expectedTotal) || billTotal;
  const difference = billTotal - expectedTotal;

  return {
    billTotal,
    expectedTotal,
    difference,
    lineItems,
    summary: {
      unexpectedCharges: typeof data.summary?.unexpectedCharges === 'number' ? data.summary.unexpectedCharges : lineItems.filter(item => item.tags.includes('Unexpected Charge')).length,
      possibleDuplicates: typeof data.summary?.possibleDuplicates === 'number' ? data.summary.possibleDuplicates : lineItems.filter(item => item.tags.includes('Possible Duplicate')).length,
      codingVerified: data.summary?.codingVerified !== false,
      inNetworkConfirmed: data.summary?.inNetworkConfirmed !== false,
    },
    explanation: String(data.explanation || 'We analyzed your bill and found some items that may need attention.'),
  };
}

