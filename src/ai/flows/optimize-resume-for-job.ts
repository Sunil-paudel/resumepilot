
'use server';

/**
 * @fileOverview This file defines a Genkit flow to optimize a resume for a specific job description.
 *
 * The flow takes a resume and a job description as input, and generates a new resume tailored to the job requirements.
 * It uses keyword optimization techniques based on a suitability analysis.
 *
 * @exports optimizeResumeForJob - The main function to trigger the resume optimization flow.
 * @exports OptimizeResumeForJobInput - The input type for the optimizeResumeFor-Job function.
 * @exports OptimizeResumeForJobOutput - The output type for the optimizeResumeFor-Job function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { UserProfile } from '@/lib/types';


const OptimizeResumeForJobInputSchema = z.object({
  resumeText: z
    .string()
    .describe('The text content of the resume (PDF, DOC, or HTML).'),
  jobDescriptionText: z.string().describe('The text content of the job description.'),
  additionalSkills: z.array(z.string()).optional().describe('A list of additional skills or keywords to incorporate into the resume.'),
  profile: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    linkedinUrl: z.string().optional(),
    githubUrl: z.string().optional(),
    visaStatus: z.string().optional(),
  }).optional().describe('User\'s profile information to be included in the resume header.'),
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

  Your main goal is to create a new, optimized resume based on the original resume, the job description, and a list of additional skills.
  Incorporate relevant keywords from the job description and the 'additionalSkills' list into the new resume. Maintain a professional and readable tone.

  **Crucially, do not just list the skills.** You must show evidence of these skills. Weave the skills and keywords into the bullet points under the "Experience" or "Projects" sections.
  For example, if the skill to add is "Project Management", find a relevant job experience and add or modify a bullet point to say something like: "Successfully managed a project from conception to completion, resulting in a 15% increase in efficiency."
  If a skill is completely new and not reflected in the original resume, create a plausible bullet point that demonstrates that skill within the context of a past role.

  The output should be a well-structured HTML document. Use semantic HTML tags. Do not include <html>, <head>, or <body> tags. Do not use inline styles.
  - Use <h2> for main section titles (e.g., "Experience", "Skills", "Education").
  - Use <h3> for job titles or school names.
  - Use <p> for descriptions.
  - Use <ul> and <li> for bullet points.

  {{#if profile}}
  Start the resume with a header containing the user's contact information. Format it professionally.
  - At the top, include the user's full name in an <h1> tag: {{profile.firstName}} {{profile.lastName}}
  - Below the name, create a paragraph (<p>) containing the following, separated by a character like ' | ':
    - If city and state are available, display them as '{{profile.city}}, {{profile.state}}'.
    - Phone number: {{profile.phone}}
    - Email address: {{profile.email}}
  {{#if profile.linkedinUrl}}
  - Include a hyperlink with the text "LinkedIn" that points to {{profile.linkedinUrl}}. Example: <a href="{{profile.linkedinUrl}}">LinkedIn</a>
  {{/if}}
  {{#if profile.githubUrl}}
  - Include a hyperlink with the text "GitHub" that points to {{profile.githubUrl}}. Example: <a href="{{profile.githubUrl}}">GitHub</a>
  {{/if}}
  {{/if}}

  Resume:
  {{resumeText}}

  Job Description:
  {{jobDescriptionText}}
  
  {{#if additionalSkills}}
  Additional skills to integrate and demonstrate:
  {{#each additionalSkills}}
  - {{this}}
  {{/each}}
  {{/if}}

  At the very end of the resume, add two sections:
  1. A "Visa Status" section. Use an <h2> for the title. If the user's visa status is provided, display it in a <p> tag. If not provided, do not include this section.
  {{#if profile.visaStatus}}
  <h2>Visa Status</h2>
  <p>{{profile.visaStatus}}</p>
  {{/if}}
  2. A "References" section. Use an <h2> for the title and a <p> tag with the text "Available upon request."
  
  <h2>References</h2>
  <p>Available upon request.</p>

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


