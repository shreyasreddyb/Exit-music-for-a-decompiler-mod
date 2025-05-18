'use server';
/**
 * @fileOverview Analyzes binary code to identify vulnerabilities and malicious behavior.
 *
 * - analyzeBinaryCode - Analyzes binary code to identify vulnerabilities and malicious behavior.
 * - AnalyzeBinaryCodeInput - The input type for the analyzeBinaryCode function.
 * - AnalyzeBinaryCodeOutput - The return type for the analyzeBinaryCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeBinaryCodeInputSchema = z.object({
  binaryCode: z
    .string()
    .describe('The binary code to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'),
});
export type AnalyzeBinaryCodeInput = z.infer<typeof AnalyzeBinaryCodeInputSchema>;

const AnalyzeBinaryCodeOutputSchema = z.object({
  vulnerabilities: z
    .array(z.string())
    .describe('A list of potential vulnerabilities identified in the binary code.'),
  maliciousBehavior: z
    .array(z.string())
    .describe('A list of potential malicious behaviors identified in the binary code.'),
  summary: z.string().describe('A summary of the analysis of the binary code.'),
});
export type AnalyzeBinaryCodeOutput = z.infer<typeof AnalyzeBinaryCodeOutputSchema>;

export async function analyzeBinaryCode(input: AnalyzeBinaryCodeInput): Promise<AnalyzeBinaryCodeOutput> {
  return analyzeBinaryCodeFlow(input);
}

const analyzeBinaryCodePrompt = ai.definePrompt({
  name: 'analyzeBinaryCodePrompt',
  input: {schema: AnalyzeBinaryCodeInputSchema},
  output: {schema: AnalyzeBinaryCodeOutputSchema},
  prompt: `You are an expert security researcher specializing in analyzing binary code for vulnerabilities and malicious behavior.

You will use this binary code to identify potential vulnerabilities and malicious behavior.

Binary Code: {{media url=binaryCode}}

Provide a list of potential vulnerabilities, a list of potential malicious behaviors, and a summary of the analysis.
`,
});

const analyzeBinaryCodeFlow = ai.defineFlow(
  {
    name: 'analyzeBinaryCodeFlow',
    inputSchema: AnalyzeBinaryCodeInputSchema,
    outputSchema: AnalyzeBinaryCodeOutputSchema,
  },
  async input => {
    const {output} = await analyzeBinaryCodePrompt(input);
    return output!;
  }
);
