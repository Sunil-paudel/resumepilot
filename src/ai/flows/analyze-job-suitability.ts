'use server';

/**
 * @fileOverview Analyzes job suitability based on resume and job description.
 *
 * - analyzeJobSuitability - A function that analyzes job suitability.
 * - AnalyzeJobSuitabilityInput - The input type for the analyzeJobSuitability function.
 * - AnalyzeJobSuitabilityOutput - The return type for the analyzeJobSuitability function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeJobSuitabilityInputSchema = z.object({
  resumeText: z.string().describe('Text content of the resume file.'),
  jobDescriptionText: z.string().describe('Text content of the job description file.'),
});

export type AnalyzeJobSuitabilityInput = z.infer<typeof AnalyzeJobSuitabilityInputSchema>;

const AnalyzeJobSuitabilityOutputSchema = z.object({
  compatibilityScore: z
    .number()
    .min(0)
    .max(100)
    .describe('A score indicating compatibility (0-100).'),
  isRightForMe: z.boolean().describe('Whether the job is right for the user'),
  matchedKeywords: z.array(z.string()).describe('Keywords from the job description found in the resume.'),
  missingKeywords: z.array(z.string()).describe('Keywords from the job description missing from the resume.'),
});

export type AnalyzeJobSuitabilityOutput = z.infer<typeof AnalyzeJobSuitabilityOutputSchema>;

export async function analyzeJobSuitability(
  input: AnalyzeJobSuitabilityInput
): Promise<AnalyzeJobSuitabilityOutput> {
  return analyzeJobSuitabilityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeJobSuitabilityPrompt',
  input: {schema: AnalyzeJobSuitabilityInputSchema},
  output: {schema: AnalyzeJobSuitabilityOutputSchema},
  prompt: `You are a career advisor who analyzes a resume against a job description.
  
  1. Provide a compatibility score (0-100).
  2. Determine if a candidate should apply for the job ('isRightForMe').
  3. Extract relevant keywords from the job description.
  4. Identify which of those keywords are present in the resume ('matchedKeywords').
  5. Identify which of those keywords are missing from the resume ('missingKeywords').

  Consider skills, experience, and qualifications. Both lists of keywords should be comprehensive.

  Resume:
  {{resumeText}}

  Job Description:
  {{jobDescriptionText}}`,
});

const analyzeJobSuitabilityFlow = ai.defineFlow(
  {
    name: 'analyzeJobSuitabilityFlow',
    inputSchema: AnalyzeJobSuitabilityInputSchema,
    outputSchema: AnalyzeJobSuitabilityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
