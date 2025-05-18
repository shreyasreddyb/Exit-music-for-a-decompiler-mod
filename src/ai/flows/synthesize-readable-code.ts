'use server';

/**
 * @fileOverview A flow for synthesizing readable code from decompiled malware using the Gemini API.
 *
 * - synthesizeReadableCode - A function that handles the code synthesis process.
 * - SynthesizeReadableCodeInput - The input type for the synthesizeReadableCode function.
 * - SynthesizeReadableCodeOutput - The return type for the synthesizeReadableCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SynthesizeReadableCodeInputSchema = z.object({
  decompiledCode: z
    .string()
    .describe('The decompiled malware code to be synthesized.'),
});
export type SynthesizeReadableCodeInput = z.infer<typeof SynthesizeReadableCodeInputSchema>;

const SynthesizeReadableCodeOutputSchema = z.object({
  readableCode: z
    .string()
    .describe('The synthesized, readable code representing the malware functionality.'),
});
export type SynthesizeReadableCodeOutput = z.infer<typeof SynthesizeReadableCodeOutputSchema>;

export async function synthesizeReadableCode(
  input: SynthesizeReadableCodeInput
): Promise<SynthesizeReadableCodeOutput> {
  return synthesizeReadableCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'synthesizeReadableCodePrompt',
  input: {schema: SynthesizeReadableCodeInputSchema},
  output: {schema: SynthesizeReadableCodeOutputSchema},
  prompt: `You are an expert reverse engineer specializing in malware analysis.

You will receive decompiled malware code and synthesize it into readable, understandable code that reveals its functionality.

Decompiled Code: {{{decompiledCode}}}`,
});

const synthesizeReadableCodeFlow = ai.defineFlow(
  {
    name: 'synthesizeReadableCodeFlow',
    inputSchema: SynthesizeReadableCodeInputSchema,
    outputSchema: SynthesizeReadableCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
