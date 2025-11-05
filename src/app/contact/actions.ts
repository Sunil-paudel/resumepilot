'use server';

import { z } from 'zod';
import { sendInquiryEmails } from '@/lib/nodemailer';

const inquirySchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

export type InquiryState = {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    message?: string[];
  } | null;
}

export async function handleInquiry(
  prevState: InquiryState, 
  formData: FormData
): Promise<InquiryState> {
  const parsed = inquirySchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      success: false,
      message: 'Please correct the errors below.',
      errors,
    };
  }

  try {
    // Fire and forget - don't make the user wait for the email to send
    sendInquiryEmails(parsed.data);
    
    return {
      success: true,
      message: 'Thank you for your message! We will get back to you shortly.',
      errors: null,
    };

  } catch (error) {
    console.error('[Contact Action Error]:', error);
    return {
      success: false,
      message: 'A server error occurred. Please try again later.',
      errors: null,
    };
  }
}
