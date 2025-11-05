export type UserProfile = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    credits?: number;
    visaStatus?: string;
};

export type JobApplication = {
    id: string;
    userId: string;
    jobTitle: string;
    companyName: string;
    status: 'Applied' | 'Interviewing' | 'Accepted' | 'Rejected';
    applicationDate: string;
    resumeText: string;
    jobDescriptionText: string;
    optimizedResumeHtml?: string;
    coverLetterHtml?: string;
    interviewQuestionsHtml?: string;
    followUpEmailHtml?: string;
};
