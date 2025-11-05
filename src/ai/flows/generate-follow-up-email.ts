'use server';

/**
 * @fileOverview Generates a follow-up email based on the resume and cover letter content.
 *
 * - generateFollowUpEmail - A function that generates a follow-up email.
 * - GenerateFollowUpEmailInput - The input type for the generateFollowUpEmail function.
 * - GenerateFollowUpEmailOutput - The return type for the generateFollowUpEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFollowUpEmailInputSchema = z.object({
  resumeContent: z
    .string()
    .describe('The content of the resume used for the job application.'),
  coverLetterContent: z
    .string()
    .describe('The content of the cover letter sent with the application.'),
  jobDescription: z.string().describe('The job description for the applied position.'),
});
export type GenerateFollowUpEmailInput = z.infer<typeof GenerateFollowUpEmailInputSchema>;

const GenerateFollowUpEmailOutputSchema = z.object({
  followUpEmailHtml: z.string().describe('The generated follow-up email draft as an HTML document.'),
});
export type GenerateFollowUpEmailOutput = z.infer<typeof GenerateFollowUpEmailOutputSchema>;

export async function generateFollowUpEmail(
  input: GenerateFollowUpEmailInput
): Promise<GenerateFollowUpEmailOutput> {
  return generateFollowUpEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFollowUpEmailPrompt',
  input: {schema: GenerateFollowUpEmailInputSchema},
  output: {schema: GenerateFollowUpEmailOutputSchema},
  prompt: `You are an AI assistant specialized in crafting professional follow-up emails.

  Given the resume content, cover letter content, and job description below, generate a follow-up email draft tailored to the job applied for.
  The output should be a well-structured HTML document. Use paragraphs (<p>) and appropriate spacing. Do not include <html>, <head>, or <body> tags.

  Resume Content: {{{resumeContent}}}
  Cover Letter Content: {{{coverLetterContent}}}
  Job Description: {{{jobDescription}}}

  The follow-up email should be concise, reiterate your interest in the position, and highlight key skills and experiences that align with the job requirements. Keep the tone professional and appreciative.
  Ensure the email includes a call to action, such as expressing your availability for an interview.
  The generated email must be professional and suitable for sending to recruiters and hiring managers.
  Do not include a signature. This will be added by the user.
  `,
});

const generateFollowUpEmailFlow = ai.defineFlow(
  {
    name: 'generateFollowUpEmailFlow',
    inputSchema: GenerateFollowUpEmailInputSchema,
    outputSchema: GenerateFollowUpEmailOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
