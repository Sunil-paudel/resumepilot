'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized cover letters based on a resume and job description.
 *
 * - generateCoverLetter - A function that generates a cover letter.
 * - GenerateCoverLetterInput - The input type for the generateCoverLetter function.
 * - GenerateCoverLetterOutput - The return type for the generateCoverLetter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCoverLetterInputSchema = z.object({
  resume: z.string().describe('The text content of the optimized resume.'),
  jobDescription: z.string().describe('The text content of the job description.'),
});
export type GenerateCoverLetterInput = z.infer<typeof GenerateCoverLetterInputSchema>;

const GenerateCoverLetterOutputSchema = z.object({
  coverLetterHtml: z.string().describe('The generated cover letter as an HTML document.'),
});
export type GenerateCoverLetterOutput = z.infer<typeof GenerateCoverLetterOutputSchema>;

export async function generateCoverLetter(input: GenerateCoverLetterInput): Promise<GenerateCoverLetterOutput> {
  return generateCoverLetterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCoverLetterPrompt',
  input: {schema: GenerateCoverLetterInputSchema},
  output: {schema: GenerateCoverLetterOutputSchema},
  prompt: `You are an expert cover letter writer. You will generate a cover letter based on the provided resume and job description.
  The output should be a well-structured HTML document. Use semantic HTML tags. Do not include <html>, <head>, or <body> tags. Do not use inline styles.
  - Use paragraphs (<p>) for the body of the letter.
  - Use appropriate spacing between paragraphs.

  Resume:
  {{resume}}

  Job Description:
  {{jobDescription}}

  Cover Letter HTML:`,
});

const generateCoverLetterFlow = ai.defineFlow(
  {
    name: 'generateCoverLetterFlow',
    inputSchema: GenerateCoverLetterInputSchema,
    outputSchema: GenerateCoverLetterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
