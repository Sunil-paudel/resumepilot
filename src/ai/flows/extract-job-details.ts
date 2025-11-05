'use server';

/**
 * @fileOverview Extracts job title and company name from a job description.
 *
 * - extractJobDetails - A function that extracts job title and company.
 * - ExtractJobDetailsInput - The input type for the extractJobDetails function.
 * - ExtractJobDetailsOutput - The return type for the extractJobDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractJobDetailsInputSchema = z.object({
  jobDescriptionText: z.string().describe('Text content of the job description file.'),
});

export type ExtractJobDetailsInput = z.infer<typeof ExtractJobDetailsInputSchema>;

const ExtractJobDetailsOutputSchema = z.object({
    jobTitle: z.string().optional().describe('The job title extracted from the description.'),
    companyName: z.string().optional().describe('The company name extracted from the description.'),
});

export type ExtractJobDetailsOutput = z.infer<typeof ExtractJobDetailsOutputSchema>;

export async function extractJobDetails(
  input: ExtractJobDetailsInput
): Promise<ExtractJobDetailsOutput> {
  return extractJobDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractJobDetailsPrompt',
  input: {schema: ExtractJobDetailsInputSchema},
  output: {schema: ExtractJobDetailsOutputSchema},
  prompt: `You are an expert text analyst. Your task is to extract the Job Title and Company Name from the provided job description.
  
  Only return the job title and the company name. Do not invent details. If a detail cannot be found, omit it.

  Job Description:
  {{jobDescriptionText}}`,
});

const extractJobDetailsFlow = ai.defineFlow(
  {
    name: 'extractJobDetailsFlow',
    inputSchema: ExtractJobDetailsInputSchema,
    outputSchema: ExtractJobDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
