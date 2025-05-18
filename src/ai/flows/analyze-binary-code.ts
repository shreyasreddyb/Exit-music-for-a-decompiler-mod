
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

// Schema for the input to the exported function and the flow
const AnalyzeBinaryCodeFlowInputSchema = z.object({
  binaryCode: z
    .string()
    .describe('The binary code to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'),
});
// This type is exported and used by perform-analysis-flow.ts
export type AnalyzeBinaryCodeInput = z.infer<typeof AnalyzeBinaryCodeFlowInputSchema>;

// Schema for the actual data passed to the LLM prompt
const AnalyzeBinaryCodePromptInputSchema = z.object({
  binaryContentBase64: z.string().describe('The Base64 encoded content of the binary file.'),
});

// Output schema remains the same
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
  input: {schema: AnalyzeBinaryCodePromptInputSchema}, // Uses the prompt-specific input schema
  output: {schema: AnalyzeBinaryCodeOutputSchema},
  prompt: `You are an expert security researcher specializing in analyzing binary code for vulnerabilities and malicious behavior.

You will analyze the following Base64 encoded binary data to identify potential vulnerabilities and malicious behaviors.

Binary Data (Base64 Encoded):
{{{binaryContentBase64}}}

Provide a list of potential vulnerabilities, a list of potential malicious behaviors, and a summary of the analysis. Be thorough and detailed.
`,
});

const analyzeBinaryCodeFlow = ai.defineFlow(
  {
    name: 'analyzeBinaryCodeFlow',
    inputSchema: AnalyzeBinaryCodeFlowInputSchema, // Flow input is the data URI
    outputSchema: AnalyzeBinaryCodeOutputSchema,
  },
  async (flowInput) => {
    // Extract base64 content from data URI
    // Expected format: 'data:<mimetype>;base64,<encoded_data>'
    const parts = flowInput.binaryCode.split(',');
    if (parts.length < 2 || !parts[1]) {
      throw new Error('Invalid data URI format: could not extract Base64 data.');
    }
    const base64Data = parts[1];

    const promptInput = { binaryContentBase64: base64Data };
    const {output} = await analyzeBinaryCodePrompt(promptInput);
    
    if (!output) {
        throw new Error('The AI model did not return the expected output for binary analysis.');
    }
    return output;
  }
);

