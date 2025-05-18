
'use server';
/**
 * @fileOverview Performs binary analysis.
 *
 * - performAnalysis - Orchestrates binary analysis.
 * - PerformAnalysisInput - Input type for performAnalysis.
 * - PerformAnalysisOutput - Output type for performAnalysis.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  analyzeBinaryCode,
  type AnalyzeBinaryCodeOutput,
} from './analyze-binary-code';

const PerformAnalysisInputSchema = z.object({
  binaryFileDataUri: z.string().describe("A binary file to analyze, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type PerformAnalysisInput = z.infer<typeof PerformAnalysisInputSchema>;

// Local schema definition for AnalyzeBinaryCodeOutput structure
const LocalAnalyzeBinaryCodeOutputSchema = z.object({
  vulnerabilities: z
    .array(z.string())
    .describe('A list of potential vulnerabilities identified in the binary code.'),
  maliciousBehavior: z
    .array(z.string())
    .describe('A list of potential malicious behaviors identified in the binary code.'),
  summary: z.string().describe('A summary of the analysis of the binary code.'),
});

const PerformAnalysisOutputSchema = z.object({
  binaryAnalysisResult: LocalAnalyzeBinaryCodeOutputSchema.optional(),
});
export type PerformAnalysisOutput = z.infer<typeof PerformAnalysisOutputSchema>;

export async function performAnalysis(input: PerformAnalysisInput): Promise<PerformAnalysisOutput> {
  return performAnalysisFlow(input);
}

const performAnalysisFlow = ai.defineFlow(
  {
    name: 'performAnalysisFlow',
    inputSchema: PerformAnalysisInputSchema,
    outputSchema: PerformAnalysisOutputSchema,
  },
  async (input) => {
    let binaryAnalysisResult: AnalyzeBinaryCodeOutput | undefined = undefined;
    let analyzeError: Error | null = null;

    if (input.binaryFileDataUri) {
      try {
        binaryAnalysisResult = await analyzeBinaryCode({ binaryCode: input.binaryFileDataUri });
      } catch (err) {
        console.error("Binary analysis part failed in flow:", err);
        analyzeError = err instanceof Error ? err : new Error(String(err));
      }
    } else {
      // This case should ideally be prevented by UI validation
      throw new Error("Binary file data URI is required for analysis.");
    }

    if (analyzeError) {
        throw new Error(`Binary analysis failed: ${analyzeError.message}`);
    }
    
    if (!binaryAnalysisResult) {
        throw new Error("Binary analysis did not produce a result.");
    }

    return {
      binaryAnalysisResult,
    };
  }
);
