'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating potential interview questions based on a resume and job description.
 *
 * - generateInterviewQuestions - A function that generates interview questions.
 * - GenerateInterviewQuestionsInput - The input type for the generateInterviewQuestions function.
 * - GenerateInterviewQuestionsOutput - The return type for the generateInterviewQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInterviewQuestionsInputSchema = z.object({
  resume: z.string().describe('The text content of the optimized resume.'),
  jobDescription: z.string().describe('The text content of the job description.'),
});
export type GenerateInterviewQuestionsInput = z.infer<typeof GenerateInterviewQuestionsInputSchema>;

const GenerateInterviewQuestionsOutputSchema = z.object({
  interviewQuestionsHtml: z.string().describe('The generated interview questions and answers as an HTML document.'),
});
export type GenerateInterviewQuestionsOutput = z.infer<typeof GenerateInterviewQuestionsOutputSchema>;

export async function generateInterviewQuestions(input: GenerateInterviewQuestionsInput): Promise<GenerateInterviewQuestionsOutput> {
  return generateInterviewQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInterviewQuestionsPrompt',
  input: {schema: GenerateInterviewQuestionsInputSchema},
  output: {schema: GenerateInterviewQuestionsOutputSchema},
  prompt: `You are an expert career coach and interview preparer. Based on the provided resume and job description, generate a list of potential interview questions.

  Include a mix of:
  1.  **Non-Technical/Behavioral Questions**
  2.  **Technical Questions**

  For each question, provide a sample answer using the STAR (Situation, Task, Action, Result) method. The answer should be tailored to the provided resume.
  
  The output should be a well-structured HTML document. Use semantic HTML tags. Do not include <html>, <head>, or <body> tags. Do not use inline styles.
  - Use <h2> for main section titles (e.g., "Non-Technical Questions", "Technical Questions").
  - Use <h3> for each question.
  - Use paragraphs (<p>) and bold tags (<strong>) to structure the STAR answers clearly (e.g., "<strong>Situation:</strong> ...").

  Resume:
  {{resume}}

  Job Description:
  {{jobDescription}}

  Interview Questions HTML:`,
});

const generateInterviewQuestionsFlow = ai.defineFlow(
  {
    name: 'generateInterviewQuestionsFlow',
    inputSchema: GenerateInterviewQuestionsInputSchema,
    outputSchema: GenerateInterviewQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
