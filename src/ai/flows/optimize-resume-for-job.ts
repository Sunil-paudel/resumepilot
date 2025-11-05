'use server';

/**
 * @fileOverview This file defines a Genkit flow to optimize a resume for a specific job description.
 *
 * The flow takes a resume and a job description as input, and generates a new resume tailored to the job requirements.
 * It uses keyword optimization techniques based on a suitability analysis.
 *
 * @exports optimizeResumeForJob - The main function to trigger the resume optimization flow.
 * @exports OptimizeResumeForJobInput - The input type for the optimizeResumeForJob function.
 * @exports OptimizeResumeForJobOutput - The output type for the optimizeResumeForJob function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeResumeForJobInputSchema = z.object({
  resumeText: z
    .string()
    .describe('The text content of the resume (PDF, DOC, or HTML).'),
  jobDescriptionText: z.string().describe('The text content of the job description.'),
});
export type OptimizeResumeForJobInput = z.infer<typeof OptimizeResumeForJobInputSchema>;

const OptimizeResumeForJobOutputSchema = z.object({
  optimizedResumeText: z
    .string()
    .describe('The optimized resume text tailored to the job description.'),
});
export type OptimizeResumeForJobOutput = z.infer<typeof OptimizeResumeForJobOutputSchema>;

export async function optimizeResumeForJob(
  input: OptimizeResumeForJobInput
): Promise<OptimizeResumeForJobOutput> {
  return optimizeResumeForJobFlow(input);
}

const optimizeResumeForJobPrompt = ai.definePrompt({
  name: 'optimizeResumeForJobPrompt',
  input: {schema: OptimizeResumeForJobInputSchema},
  output: {schema: OptimizeResumeForJobOutputSchema},
  prompt: `You are an expert resume writer specializing in tailoring resumes to specific job descriptions.

  Given the following resume and job description, create a new resume that is optimized for the job requirements.
  Focus on incorporating relevant keywords from the job description into the resume while maintaining a professional and readable tone.

  Resume:
  {{resumeText}}

  Job Description:
  {{jobDescriptionText}}

  Optimized Resume:
  `,
});

const optimizeResumeForJobFlow = ai.defineFlow(
  {
    name: 'optimizeResumeForJobFlow',
    inputSchema: OptimizeResumeForJobInputSchema,
    outputSchema: OptimizeResumeForJobOutputSchema,
  },
  async input => {
    const {output} = await optimizeResumeForJobPrompt(input);
    return output!;
  }
);
