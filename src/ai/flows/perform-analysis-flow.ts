
'use server';
/**
 * @fileOverview Performs combined malware decompilation and binary analysis.
 *
 * - performAnalysis - Orchestrates decompilation and binary analysis.
 * - PerformAnalysisInput - Input type for performAnalysis.
 * - PerformAnalysisOutput - Output type for performAnalysis.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  decompileMalware,
  type DecompileMalwareOutput,
} from './decompile-malware';
import {
  analyzeBinaryCode,
  type AnalyzeBinaryCodeOutput,
} from './analyze-binary-code';

const PerformAnalysisInputSchema = z.object({
  obfuscatedCode: z.string().optional().describe('The obfuscated malware code to decompile.'),
  binaryFileDataUri: z.string().optional().describe("A binary file to analyze, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type PerformAnalysisInput = z.infer<typeof PerformAnalysisInputSchema>;

// Local schema definition for DecompileMalwareOutput structure
const LocalDecompileMalwareOutputSchema = z.object({
  decompiledCode: z
    .string()
    .describe('The decompiled, human-readable malware code.'),
  analysisReport: z
    .string()
    .describe('A report detailing the analysis of the decompiled code.'),
  potentialThreats: z
    .string()
    .describe('Identified potential threats and vulnerabilities.'),
});

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
  decompilationResult: LocalDecompileMalwareOutputSchema.optional(),
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
    let decompilationResult: DecompileMalwareOutput | undefined = undefined;
    let binaryAnalysisResult: AnalyzeBinaryCodeOutput | undefined = undefined;
    let decompileError: Error | null = null;
    let analyzeError: Error | null = null;

    const analysisPromises: Promise<void>[] = [];

    if (input.obfuscatedCode) {
      analysisPromises.push(
        decompileMalware({ obfuscatedCode: input.obfuscatedCode })
          .then(result => { decompilationResult = result; })
          .catch(err => {
            console.error("Decompilation part failed in combined flow:", err);
            decompileError = err instanceof Error ? err : new Error(String(err));
          })
      );
    }

    if (input.binaryFileDataUri) {
      analysisPromises.push(
        analyzeBinaryCode({ binaryCode: input.binaryFileDataUri })
          .then(result => { binaryAnalysisResult = result; })
          .catch(err => {
            console.error("Binary analysis part failed in combined flow:", err);
            analyzeError = err instanceof Error ? err : new Error(String(err));
          })
      );
    }

    await Promise.allSettled(analysisPromises); // Use allSettled to ensure all promises complete

    const attemptedDecompile = !!input.obfuscatedCode;
    const attemptedBinaryAnalysis = !!input.binaryFileDataUri;
    const decompileSucceeded = !!decompilationResult;
    const analysisSucceeded = !!binaryAnalysisResult;
    
    if ((attemptedDecompile && !decompileSucceeded && decompileError) || (attemptedBinaryAnalysis && !analysisSucceeded && analyzeError) ||
        (attemptedDecompile && attemptedBinaryAnalysis && !decompileSucceeded && !analysisSucceeded && (decompileError || analyzeError))) {
      
      let errorMessages = [];
      if (decompileError) errorMessages.push(`Decompilation failed: ${decompileError.message}`);
      if (analyzeError) errorMessages.push(`Binary analysis failed: ${analyzeError.message}`);
      
      if (errorMessages.length > 0) {
        throw new Error(errorMessages.join('; '));
      }
    }

    return {
      decompilationResult,
      binaryAnalysisResult,
    };
  }
);
