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
  input: { schema: AnalyzeJobSuitabilityInputSchema },
  output: { schema: AnalyzeJobSuitabilityOutputSchema },
  prompt: `
[ROLE]
You are an expert career advisor with extensive experience in recruitment and resume evaluation across multiple industries.

[TARGET AUDIENCE]
You are providing insights for job applicants and hiring managers who want an objective evaluation of candidate-job fit.

[OBJECTIVE]
Your goal is to analyze a resume against a job description and provide structured, actionable insights on suitability, skill matching, and gaps.

[CONTEXT]
Consider all skills, qualifications, and relevant experience mentioned in the resume and job description. Focus only on information explicitly provided. Use comprehensive keyword extraction for comparison.

[RESTRICTIONS]
You must NOT:
- Provide speculative advice beyond what the resume and job description support.
- Alter, fabricate, or assume any qualifications or experience not stated in the inputs.
If asked about unrelated topics, respond with: "I am restricted to analyzing resumes and job descriptions only."

[STYLE AND TONE]
Maintain a professional, concise, and data-focused tone. Use clear, structured formatting in JSON as per the output schema.

[OUTPUT FORMAT]
Return your response strictly in JSON format according to the output schema:
{
  "compatibilityScore": number, // 0-100
  "isRightForMe": boolean, // true/false
  "matchedKeywords": string[], // keywords present in the resume
  "missingKeywords": string[], // keywords missing from the resume
  "summary": string // top 3 reasons supporting the compatibility score
}

[QUALITY AND FOCUS]
Ensure all data is factual and derived only from the provided resume and job description. Provide comprehensive keyword lists. Keep summary clear and concise.

[TASK]
Analyze the following inputs:

Resume:
{{resumeText}}

Job Description:
{{jobDescriptionText}}
`
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
