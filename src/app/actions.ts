'use server';

import { analyzeJobSuitability, AnalyzeJobSuitabilityInput } from '@/ai/flows/analyze-job-suitability';
import { generateCoverLetter, GenerateCoverLetterInput } from '@/ai/flows/generate-cover-letter';
import { generateFollowUpEmail, GenerateFollowUpEmailInput } from '@/ai/flows/generate-follow-up-email';
import { optimizeResumeForJob, OptimizeResumeForJobInput } from '@/ai/flows/optimize-resume-for-job';
import htmlToDocx from 'html-to-docx';

export async function runJobSuitabilityAnalysis(input: AnalyzeJobSuitabilityInput) {
  try {
    const result = await analyzeJobSuitability(input);
    return { data: result };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to analyze job suitability.' };
  }
}

export async function runResumeOptimization(input: OptimizeResumeForJobInput) {
  try {
    const result = await optimizeResumeForJob(input);
    return { data: result };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to optimize resume.' };
  }
}

export async function runCoverLetterGeneration(input: GenerateCoverLetterInput) {
  try {
    const result = await generateCoverLetter(input);
    return { data: result };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to generate cover letter.' };
  }
}

export async function runFollowUpEmailGeneration(input: GenerateFollowUpEmailInput) {
  try {
    const result = await generateFollowUpEmail(input);
    return { data: result };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to generate follow-up email.' };
  }
}

export async function generateDocx(htmlContent: string) {
    try {
      const fileBuffer = await htmlToDocx(htmlContent);
      // html-to-docx returns a Buffer on the server
      return { data: (fileBuffer as Buffer).toString('base64') };
    } catch (error) {
      console.error('Error generating DOCX:', error);
      return { error: 'Could not generate document for download.' };
    }
}
