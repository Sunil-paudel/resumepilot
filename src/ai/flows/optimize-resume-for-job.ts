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
  additionalSkills: z.array(z.string()).optional().describe('A list of additional skills or keywords to incorporate into the resume.'),
});
export type OptimizeResumeForJobInput = z.infer<typeof OptimizeResumeForJobInputSchema>;

const OptimizeResumeForJobOutputSchema = z.object({
  optimizedResumeHtml: z
    .string()
    .describe('The optimized resume HTML tailored to the job description.'),
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

  Given the following resume, job description, and an optional list of additional skills, create a new resume that is optimized for the job requirements.
  Focus on incorporating relevant keywords from the job description and the provided additional skills list into the resume while maintaining a professional and readable tone.
  
  The output should be a well-structured HTML document. Use semantic HTML tags like <h2> for sections, <ul> and <li> for lists, etc. Do not include <html>, <head>, or <body> tags.

  Resume:
  {{resumeText}}

  Job Description:
  {{jobDescriptionText}}
  
  {{#if additionalSkills}}
  Additional skills to include:
  {{#each additionalSkills}}
  - {{this}}
  {{/each}}
  {{/if}}

  Optimized Resume HTML:
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
