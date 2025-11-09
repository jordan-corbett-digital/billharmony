/**
 * Bill Analyzer Service
 * Analyzes medical bills using AI to detect errors, duplicates, and overcharges
 */

// Re-export types from bill-parser to maintain backward compatibility
export type { BillLineItem, BillAnalysis } from './llm/bill-parser';

/**
 * Analyze a bill image using vision AI
 */
export async function analyzeBillImage(file: File): Promise<BillAnalysis> {
  const { parseBillWithAI } = await import('./llm/bill-parser');
  return parseBillWithAI(file);
}

/**
 * Analyze a bill from text/data
 */
export async function analyzeBillData(billData: {
  lineItems: Array<{ name: string; amount: number; cptCode?: string }>;
  total: number;
  provider?: string;
  date?: string;
}): Promise<BillAnalysis> {
  // Use AI to analyze the bill data
  const { analyzeBillDataWithAI } = await import('./llm/bill-parser');
  return analyzeBillDataWithAI(billData);
}

