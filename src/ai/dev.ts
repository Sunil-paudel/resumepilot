'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/generate-follow-up-email.ts';
import '@/ai/flows/generate-cover-letter.ts';
import '@/ai/flows/analyze-job-suitability.ts';
import '@/ai/flows/optimize-resume-for-job.ts';
import '@/ai/flows/generate-interview-questions.ts';
