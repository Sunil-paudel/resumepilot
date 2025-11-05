'use client';

import React, { useReducer, useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  runJobSuitabilityAnalysis,
  runResumeOptimization,
  runCoverLetterGeneration,
  runFollowUpEmailGeneration,
  runInterviewQuestionsGeneration,
  runExtractJobDetails,
  generateDocx,
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import {
  AnalyzeJobSuitabilityOutput,
} from '@/ai/flows/analyze-job-suitability';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Briefcase,
  FileText,
  Sparkles,
  Mail,
  Loader2,
  Copy,
  Check,
  Download,
  ExternalLink,
  PlusCircle,
  XCircle,
  User as UserIcon,
  Save,
  HelpCircle,
  LogOut,
  ChevronUp,
  LayoutDashboard,
  Eye,
} from 'lucide-react';
import { ScoreGauge } from '@/components/app/score-gauge';
import { Logo } from '@/components/app/icons';
import { Skeleton } from '../ui/skeleton';
import { saveAs } from 'file-saver';
import { Badge } from '../ui/badge';
import { useUser, useFirestore, useAuth, useMemoFirebase } from '@/firebase';
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { UserProfile, JobApplication } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';


type State = {
  resumeText: string;
  jobDescriptionText: string;
  jobTitle: string;
  companyName: string;
  analysisResult: AnalyzeJobSuitabilityOutput | null;
  optimizedAnalysisResult: AnalyzeJobSuitabilityOutput | null;
  optimizedResume: string | null;
  coverLetter: string | null;
  followUpEmail: string | null;
  interviewQuestions: string | null;
  skillsToAdd: string[];
  loading: 'analysis' | 'optimizing' | 'coverLetter' | 'followUp' | 'interview' | 'downloading' | 'profile' | 'savingApp' | 'extracting' | false;
  copied: 'resume' | 'coverLetter' | 'followUp' | 'interview' | false;
  profile: Partial<UserProfile>;
  isProfileOpen: boolean;
  applicationId: string | null;
};

type Action =
  | { type: 'SET_TEXT'; payload: { field: 'resumeText' | 'jobDescriptionText' | 'jobTitle' | 'companyName'; value: string } }
  | { type: 'SET_LOADING'; payload: State['loading'] }
  | { type: 'SET_ANALYSIS_RESULT'; payload: AnalyzeJobSuitabilityOutput | null }
  | { type: 'SET_OPTIMIZED_RESUME'; payload: string | null }
  | { type: 'SET_OPTIMIZED_ANALYSIS_RESULT'; payload: AnalyzeJobSuitabilityOutput | null }
  | { type: 'SET_COVER_LETTER'; payload: string | null }
  | { type: 'SET_FOLLOW_UP_EMAIL'; payload: string | null }
  | { type: 'SET_INTERVIEW_QUESTIONS'; payload: string | null }
  | { type: 'SET_COPIED'; payload: State['copied'] }
  | { type: 'ADD_SKILL'; payload: string }
  | { type: 'REMOVE_SKILL'; payload: string }
  | { type: 'DRAG_SKILL'; payload: { dragIndex: number; hoverIndex: number } }
  | { type: 'SET_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'UPDATE_PROFILE_FIELD'; payload: { field: keyof UserProfile; value: string } }
  | { type: 'TOGGLE_PROFILE' }
  | { type: 'SET_APPLICATION_ID', payload: string | null }
  | { type: 'RESET' };

const initialState: State = {
  resumeText: '',
  jobDescriptionText: '',
  jobTitle: '',
  companyName: '',
  analysisResult: null,
  optimizedAnalysisResult: null,
  optimizedResume: null,
  coverLetter: null,
  followUpEmail: null,
  interviewQuestions: null,
  skillsToAdd: [],
  loading: false,
  copied: false,
  profile: {},
  isProfileOpen: true,
  applicationId: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TEXT':
      return { ...state, [action.payload.field]: action.payload.value };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ANALYSIS_RESULT':
      return { ...state, analysisResult: action.payload, skillsToAdd: action.payload?.missingKeywords || [] };
    case 'SET_OPTIMIZED_RESUME':
        return { ...state, optimizedResume: action.payload };
    case 'SET_OPTIMIZED_ANALYSIS_RESULT':
        return { ...state, optimizedAnalysisResult: action.payload };
    case 'SET_COVER_LETTER':
        return { ...state, coverLetter: action.payload };
    case 'SET_FOLLOW_UP_EMAIL':
        return { ...state, followUpEmail: action.payload };
    case 'SET_INTERVIEW_QUESTIONS':
        return { ...state, interviewQuestions: action.payload };
    case 'SET_COPIED':
        return { ...state, copied: action.payload };
    case 'ADD_SKILL':
      if (state.skillsToAdd.includes(action.payload)) return state;
      return { ...state, skillsToAdd: [...state.skillsToAdd, action.payload] };
    case 'REMOVE_SKILL':
      return { ...state, skillsToAdd: state.skillsToAdd.filter(skill => skill !== action.payload) };
    case 'DRAG_SKILL':
      const newSkills = [...state.skillsToAdd];
      const [draggedItem] = newSkills.splice(action.payload.dragIndex, 1);
      newSkills.splice(action.payload.hoverIndex, 0, draggedItem);
      return { ...state, skillsToAdd: newSkills };
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    case 'UPDATE_PROFILE_FIELD':
      return { ...state, profile: { ...state.profile, [action.payload.field]: action.payload.value } };
    case 'TOGGLE_PROFILE':
      return { ...state, isProfileOpen: !state.isProfileOpen };
    case 'SET_APPLICATION_ID':
      return { ...state, applicationId: action.payload };
    case 'RESET':
      return { 
        ...initialState, 
        profile: state.profile,
        isProfileOpen: state.isProfileOpen,
        resumeText: state.resumeText, 
        jobDescriptionText: state.jobDescriptionText,
        jobTitle: state.jobTitle,
        companyName: state.companyName,
      };
    default:
      return state;
  }
}

// Helper function to convert base64 to a Blob
function base64ToBlob(base64: string, contentType: string = ''): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];
  
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
  
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
  
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
  
    return new Blob(byteArrays, { type: contentType });
  }

const DraggableSkill = ({ skill, index, moveSkill, onRemove }: { skill: string, index: number, moveSkill: (dragIndex: number, hoverIndex: number) => void, onRemove: (skill: string) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', index.toString());
    setIsDragging(true);
  };
  
  const handleDragEnd = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    moveSkill(dragIndex, index);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div
      ref={ref}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`p-2 bg-secondary rounded-md flex items-center justify-between transition-opacity ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <span>{skill}</span>
      <button onClick={() => onRemove(skill)} className="text-muted-foreground hover:text-destructive">
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
};

const LoginView = ({ onLogin }: { onLogin: () => void }) => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] gap-6 text-center">
        <Logo className="w-24 h-24 text-primary" />
        <div className="space-y-2">
            <h1 className="text-4xl font-bold font-headline">Welcome to ResumePilot</h1>
            <p className="text-lg text-muted-foreground">
                Sign in to optimize your resume, generate cover letters, and track your job applications.
            </p>
        </div>
        <Button size="lg" onClick={onLogin}>
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.3 64.5c-24.5-23.4-58.3-38.2-96.6-38.2-83.3 0-151.5 68.2-151.5 151.5s68.2 151.5 151.5 151.5c97.1 0 134.3-71.2 137.5-108.3H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
          Sign in with Google
        </Button>
    </div>
);

export default function ResumePilotClient() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  
  const handleJobDescriptionChange = useCallback((value: string) => {
    dispatch({ type: 'SET_TEXT', payload: { field: 'jobDescriptionText', value }});
    if (value.length > 250) { // Only run if JD is reasonably long
        handleExtractDetails(value);
    }
  }, []);

  const handleExtractDetails = async (jobDescription: string) => {
      if (state.loading === 'extracting') return;
      dispatch({ type: 'SET_LOADING', payload: 'extracting' });
      const result = await runExtractJobDetails({ jobDescriptionText: jobDescription });
      if(result.data) {
          if (result.data.jobTitle) dispatch({ type: 'SET_TEXT', payload: { field: 'jobTitle', value: result.data.jobTitle }});
          if (result.data.companyName) dispatch({ type: 'SET_TEXT', payload: { field: 'companyName', value: result.data.companyName }});
      }
      dispatch({ type: 'SET_LOADING', payload: false });
  }

  useEffect(() => {
    if (user && firestore) {
      const fetchProfile = async () => {
        const profileRef = doc(firestore, 'users', user.uid);
        try {
          const docSnap = await getDoc(profileRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            dispatch({ type: 'SET_PROFILE', payload: data });
            if (data.email) {
              dispatch({ type: 'UPDATE_PROFILE_FIELD', payload: { field: 'email', value: data.email } });
            }
          } else {
            // Pre-fill email and name from auth if profile doesn't exist
            if(user.email) dispatch({ type: 'UPDATE_PROFILE_FIELD', payload: { field: 'email', value: user.email } });
            const nameParts = user.displayName?.split(' ') || [];
            if(nameParts[0]) dispatch({ type: 'UPDATE_PROFILE_FIELD', payload: { field: 'firstName', value: nameParts[0] } });
            if(nameParts[1]) dispatch({ type: 'UPDATE_PROFILE_FIELD', payload: { field: 'lastName', value: nameParts.slice(1).join(' ') } });
            
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      };
      fetchProfile();
    }
  }, [user, firestore]);

  const handleLogin = async () => {
    if (!auth) return;
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log('Sign-in popup closed by user.');
        return;
      }
      console.error("Error during sign-in:", error);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: "Could not sign in with Google. Please try again.",
      });
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: "Could not sign out. Please try again.",
      });
    }
  };


  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    dispatch({ type: 'UPDATE_PROFILE_FIELD', payload: { field, value } });
  };

  const handleSaveProfile = async () => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Not logged in',
        description: 'You must be logged in to save your profile.',
      });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: 'profile' });
    const profileRef = doc(firestore, 'users', user.uid);
    try {
      const dataToSave: UserProfile = {
        id: user.uid,
        firstName: state.profile.firstName || '',
        lastName: state.profile.lastName || '',
        email: state.profile.email || user.email || '',
        phone: state.profile.phone || '',
        address: state.profile.address || '',
        city: state.profile.city || '',
        state: state.profile.state || '',
        zipCode: state.profile.zipCode || '',
        linkedinUrl: state.profile.linkedinUrl || '',
        githubUrl: state.profile.githubUrl || '',
      };
      
      setDoc(profileRef, dataToSave, { merge: true }).catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: profileRef.path,
            operation: 'update',
            requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', permissionError);
      });
      
      toast({
        title: 'Profile Saved',
        description: 'Your information has been updated.',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: e.message || 'Could not save profile.',
      });
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  };


  const handleCopy = (text: string | null, type: State['copied']) => {
    if (!text || !type) return;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    navigator.clipboard.writeText(plainText);

    dispatch({ type: 'SET_COPIED', payload: type });
    setTimeout(() => dispatch({ type: 'SET_COPIED', payload: false }), 2000);
  };
  
  const handleDownload = async (content: string | null, fileName: string) => {
    if (!content) return;
    dispatch({ type: 'SET_LOADING', payload: 'downloading' });
    try {
        const result = await generateDocx(content);
        if (result.error || !result.data) {
            throw new Error(result.error || 'Failed to get document from server.');
        }

        const blob = base64ToBlob(result.data, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        saveAs(blob, `${fileName}.docx`);

    } catch(e: any) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: e.message || 'Could not generate document for download.',
      });
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  };
  
  const handleOpenInNewTab = (content: string | null) => {
    if (!content) return;
    const blob = new Blob([`<html><head><title>Document</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tailwindcss/typography@0.5.x/dist/typography.min.css" /><style>body { font-family: sans-serif; } h1,h2,h3 { font-weight: bold; } ul { list-style-type: disc; margin-left: 20px; }</style></head><body class="prose dark:prose-invert max-w-4xl mx-auto p-8">${content}</body></html>`], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleAnalyze = async () => {
    if (!state.resumeText || !state.jobDescriptionText) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide both your resume and the job description.',
      });
      return;
    }

    dispatch({ type: 'RESET' });
    dispatch({ type: 'SET_LOADING', payload: 'analysis' });

    const result = await runJobSuitabilityAnalysis({
      resumeText: state.resumeText,
      jobDescriptionText: state.jobDescriptionText,
    });

    if (result.error || !result.data) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: result.error || 'An unknown error occurred.',
      });
    } else {
      dispatch({ type: 'SET_ANALYSIS_RESULT', payload: result.data });
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  };
  
  const handleOptimizeResume = async () => {
    dispatch({ type: 'SET_LOADING', payload: 'optimizing' });
    const optResult = await runResumeOptimization({ 
        resumeText: state.resumeText, 
        jobDescriptionText: state.jobDescriptionText,
        additionalSkills: state.skillsToAdd,
        profile: state.profile,
    });

    if (optResult.error || !optResult.data) {
        toast({ variant: 'destructive', title: 'Optimization Failed', description: optResult.error });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
    }
    dispatch({ type: 'SET_OPTIMIZED_RESUME', payload: optResult.data.optimizedResumeHtml });

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = optResult.data.optimizedResumeHtml;
    const optimizedText = tempDiv.textContent || tempDiv.innerText || '';

    const newAnalysisResult = await runJobSuitabilityAnalysis({ resumeText: optimizedText, jobDescriptionText: state.jobDescriptionText });
    if(newAnalysisResult.data) {
        dispatch({ type: 'SET_OPTIMIZED_ANALYSIS_RESULT', payload: newAnalysisResult.data });
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  }

  const handleGenerateCoverLetter = async () => {
    if (!state.optimizedResume) return;
    dispatch({ type: 'SET_LOADING', payload: 'coverLetter' });
    const result = await runCoverLetterGeneration({ resume: state.optimizedResume, jobDescription: state.jobDescriptionText });
    if (result.error || !result.data) {
        toast({ variant: 'destructive', title: 'Generation Failed', description: result.error });
    } else {
        dispatch({ type: 'SET_COVER_LETTER', payload: result.data.coverLetterHtml });
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  }

  const handleGenerateFollowUp = async () => {
    if (!state.optimizedResume || !state.coverLetter) return;
    dispatch({ type: 'SET_LOADING', payload: 'followUp' });
    const result = await runFollowUpEmailGeneration({ resumeContent: state.optimizedResume, coverLetterContent: state.coverLetter, jobDescription: state.jobDescriptionText });
    if (result.error || !result.data) {
        toast({ variant: 'destructive', title: 'Generation Failed', description: result.error });
    } else {
        dispatch({ type: 'SET_FOLLOW_UP_EMAIL', payload: result.data.followUpEmailHtml });
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  }

  const handleGenerateInterviewQuestions = async () => {
    if (!state.optimizedResume) return;
    dispatch({ type: 'SET_LOADING', payload: 'interview' });
    const result = await runInterviewQuestionsGeneration({ resume: state.optimizedResume, jobDescription: state.jobDescriptionText });
    if (result.error || !result.data) {
        toast({ variant: 'destructive', title: 'Generation Failed', description: result.error });
    } else {
        dispatch({ type: 'SET_INTERVIEW_QUESTIONS', payload: result.data.interviewQuestionsHtml });
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  }

  const handleSaveApplication = async () => {
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to save.' });
        return;
    }
    if (!state.jobTitle || !state.companyName) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a Job Title and Company Name.' });
        return;
    }

    dispatch({ type: 'SET_LOADING', payload: 'savingApp' });

    const applicationData: Omit<JobApplication, 'id'> = {
        userId: user.uid,
        jobTitle: state.jobTitle,
        companyName: state.companyName,
        applicationDate: serverTimestamp().toDate().toISOString(),
        status: 'Applied',
        resumeText: state.resumeText,
        jobDescriptionText: state.jobDescriptionText,
        optimizedResumeHtml: state.optimizedResume || '',
        coverLetterHtml: state.coverLetter || '',
        interviewQuestionsHtml: state.interviewQuestions || '',
        followUpEmailHtml: state.followUpEmail || '',
    };

    try {
        const applicationsRef = collection(firestore, 'users', user.uid, 'applications');
        const docRef = await addDoc(applicationsRef, applicationData);
        dispatch({ type: 'SET_APPLICATION_ID', payload: docRef.id });
        toast({
            title: 'Application Saved!',
            description: 'Your application has been saved to your dashboard.',
        });
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: e.message || 'Could not save application.',
        });
    }

    dispatch({ type: 'SET_LOADING', payload: false });
  };


  const isAnalyzeDisabled = !state.resumeText || !state.jobDescriptionText || !!state.loading;

  const renderContent = (
    type: 'resume' | 'coverLetter' | 'followUp' | 'interview',
    content: string | null,
    handleGenerate: () => void,
    generateButtonText: string,
    title: string,
    Icon: React.ElementType,
    dependency: any,
    fileName: string
  ) => {
    const loadingType = type === 'resume' ? 'optimizing' : type;

    if (state.loading === loadingType) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Generating your {title.toLowerCase()}...</p>
        </div>
      );
    }
    
    if (content) {
      return (
        <div className="relative">
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleCopy(content, type)}
              title="Copy to clipboard"
            >
              {state.copied === type ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleDownload(content, fileName)}
              title="Download as .docx"
              disabled={state.loading === 'downloading'}
            >
              {state.loading === 'downloading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleOpenInNewTab(content)}
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
          <div 
            dangerouslySetInnerHTML={{ __html: content }} 
            className="w-full h-96 overflow-y-auto bg-secondary rounded-lg p-4 border prose dark:prose-invert"
          />
        </div>
      );
    }

    if (!dependency) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 bg-secondary rounded-lg">
          <Icon className="w-12 h-12 text-muted-foreground" />
          <p className="text-center text-muted-foreground">Your {title.toLowerCase()} will appear here.</p>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 bg-secondary rounded-lg">
        <Icon className="w-12 h-12 text-muted-foreground" />
        <p className="text-center text-muted-foreground">Your {title.toLowerCase()} will appear here.</p>
        <Button onClick={handleGenerate} disabled={!!state.loading}>
          <Sparkles className="w-4 h-4 mr-2" />
          {generateButtonText}
        </Button>
      </div>
    );
  }

  const KeywordAnalysis = () => {
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const skill = e.dataTransfer.getData('text/plain');
        if (skill && !state.skillsToAdd.includes(skill)) {
            dispatch({ type: 'ADD_SKILL', payload: skill });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const moveSkill = (dragIndex: number, hoverIndex: number) => {
      dispatch({ type: 'DRAG_SKILL', payload: { dragIndex, hoverIndex } });
    };

    const removeSkill = (skill: string) => {
      dispatch({ type: 'REMOVE_SKILL', payload: skill });
    };
    
    if (!state.analysisResult) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-6">
            <div>
                <h4 className="font-semibold mb-2">Keywords Analysis</h4>
                <div className="space-y-2">
                    <div>
                        <h5 className="font-medium text-sm mb-1 text-emerald-400">Matched Keywords</h5>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-md bg-background/50">
                            {state.analysisResult?.matchedKeywords.map(k => <Badge variant="secondary" key={k} className="bg-emerald-900/50 text-emerald-300 border-emerald-700">{k}</Badge>)}
                        </div>
                    </div>
                    <div>
                        <h5 className="font-medium text-sm mb-1 text-red-400">Missing Keywords</h5>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-md bg-background/50">
                            {state.analysisResult?.missingKeywords.filter(k => !state.skillsToAdd.includes(k)).map(k => (
                                <div key={k} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', k)}>
                                    <Badge variant="secondary" className="bg-red-900/50 text-red-300 border-red-700 cursor-grab active:cursor-grabbing flex items-center gap-2">
                                        {k}
                                        <button onClick={() => dispatch({ type: 'ADD_SKILL', payload: k })} className="hover:text-foreground"><PlusCircle className="w-3 h-3"/></button>
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div 
                className="bg-background/50 rounded-lg p-2"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <h4 className="font-semibold mb-2">Skills to Add to Resume</h4>
                <div className="space-y-2 min-h-[10rem] max-h-72 overflow-y-auto">
                    {state.skillsToAdd.length === 0 && <p className="text-sm text-muted-foreground text-center pt-8">Drag missing keywords here or add your own.</p>}
                    {state.skillsToAdd.map((skill, i) => (
                        <DraggableSkill key={skill} index={i} skill={skill} moveSkill={moveSkill} onRemove={removeSkill} />
                    ))}
                </div>
            </div>
        </div>
    )
  }

  const renderProfileCard = () => {
    return (
      <Collapsible
        open={state.isProfileOpen}
        onOpenChange={() => dispatch({ type: 'TOGGLE_PROFILE' })}
      >
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle className="font-headline flex items-center gap-2">
                <UserIcon />
                My Profile
              </CardTitle>
              <CardDescription>
                This information will be used to populate your documents.
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronUp className={`h-4 w-4 transition-transform ${!state.isProfileOpen && "rotate-180"}`} />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={state.profile.firstName || ''} onChange={(e) => handleProfileChange('firstName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={state.profile.lastName || ''} onChange={(e) => handleProfileChange('lastName', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={state.profile.email || ''} onChange={(e) => handleProfileChange('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={state.profile.phone || ''} onChange={(e) => handleProfileChange('phone', e.target.value)} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={state.profile.address || ''} onChange={(e) => handleProfileChange('address', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={state.profile.city || ''} onChange={(e) => handleProfileChange('city', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={state.profile.state || ''} onChange={(e) => handleProfileChange('state', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input id="zipCode" value={state.profile.zipCode || ''} onChange={(e) => handleProfileChange('zipCode', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                  <Input id="linkedinUrl" value={state.profile.linkedinUrl || ''} onChange={(e) => handleProfileChange('linkedinUrl', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="githubUrl">GitHub URL</Label>
                  <Input id="githubUrl" value={state.profile.githubUrl || ''} onChange={(e) => handleProfileChange('githubUrl', e.target.value)} />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={state.loading === 'profile'}>
                {state.loading === 'profile' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Profile
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  if (isUserLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 md:px-8 py-4 flex items-center justify-between gap-3 border-b">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">ResumePilot</h1>
        </div>
        {user && (
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                    </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign Out">
                    <LogOut className="w-5 h-5" />
                </Button>
            </div>
        )}
      </header>

      <main className="flex-grow p-4 md:p-8">
        {!user ? (
            <LoginView onLogin={handleLogin} />
        ) : (
            <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-8">
                {renderProfileCard()}
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                        <Briefcase />
                        Job & Company Info
                        </CardTitle>
                        <CardDescription>
                        Enter the job title and company you are applying to. The AI will try to extract this from the job description for you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <Label htmlFor="job-title">Job Title</Label>
                        <Input 
                            id="job-title" 
                            placeholder="e.g. Software Engineer"
                            value={state.jobTitle}
                            onChange={(e) => dispatch({ type: 'SET_TEXT', payload: { field: 'jobTitle', value: e.target.value }})}
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="company-name">Company Name</Label>
                        <Input 
                            id="company-name"
                            placeholder="e.g. Google"
                            value={state.companyName}
                            onChange={(e) => dispatch({ type: 'SET_TEXT', payload: { field: 'companyName', value: e.target.value }})}
                        />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                    <FileText />
                    Your Resume
                    </CardTitle>
                    <CardDescription>
                    Paste the full text of your resume below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Label htmlFor="resume-text" className="sr-only">Resume Text</Label>
                    <Textarea
                    id="resume-text"
                    placeholder="Paste your resume here..."
                    value={state.resumeText}
                    onChange={(e) => dispatch({ type: 'SET_TEXT', payload: { field: 'resumeText', value: e.target.value }})}
                    className="h-48"
                    />
                </CardContent>
                </Card>

                <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                    <Briefcase />
                    The Job Description
                    </CardTitle>
                    <CardDescription>
                    Paste the job description you're applying for.
                    </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                    <Label htmlFor="jd-text" className="sr-only">Job Description Text</Label>
                    <Textarea
                    id="jd-text"
                    placeholder="Paste job description here..."
                    value={state.jobDescriptionText}
                    onChange={(e) => handleJobDescriptionChange(e.target.value)}
                    className="h-48"
                    />
                    {state.loading === 'extracting' && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin"/>
                            <span>Extracting...</span>
                        </div>
                    )}
                </CardContent>
                </Card>
                
                <Button size="lg" onClick={handleAnalyze} disabled={isAnalyzeDisabled}>
                {state.loading === 'analysis' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                Analyze & Generate
                </Button>
            </div>

            {/* RIGHT COLUMN */}
            <div ref={resultsRef} className="flex flex-col gap-8">
                <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline">Analysis & Optimization</CardTitle>
                    <CardDescription>Your resume's compatibility score and optimization results.</CardDescription>
                </CardHeader>
                <CardContent>
                    {state.loading === 'analysis' && (
                    <div className="flex justify-center items-center h-48 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-muted-foreground">Analyzing...</p>
                    </div>
                    )}
                    {!state.loading && !state.analysisResult && (
                    <div className="flex justify-center items-center h-48 text-center text-muted-foreground">
                        <p>Your analysis results will appear here after you submit your documents.</p>
                    </div>
                    )}
                    {state.analysisResult && (
                        <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="flex flex-col items-center gap-2">
                            <ScoreGauge value={state.analysisResult.compatibilityScore} />
                            <p className="font-semibold">Initial Match Score</p>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex flex-col items-center">
                            {state.optimizedAnalysisResult ? (
                                <>
                                <ScoreGauge value={state.optimizedAnalysisResult.compatibilityScore} />
                                <p className="font-semibold">Optimized Score</p>
                                </>
                            ) : state.loading === 'optimizing' ? (
                                <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Recalculating...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-center">
                                <div className="w-24 h-24 border-2 border-dashed rounded-full flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <p className="font-semibold text-muted-foreground">Optimized Score</p>
                                </div>
                            )}
                            </div>
                            <div className="text-center">
                            <p className="text-sm text-muted-foreground">Is this job right for you?</p>
                            <p className={`text-2xl font-bold font-headline ${state.analysisResult.isRightForMe ? 'text-accent-foreground' : 'text-destructive'}`}>
                                {state.analysisResult.isRightForMe ? 'Looks Promising!' : 'Might Not Be a Fit'}
                            </p>
                            </div>
                        </div>
                    </div>
                    <KeywordAnalysis />
                    </>
                    )}
                </CardContent>
                </Card>

                <Tabs defaultValue="resume" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="resume"><Sparkles className="w-4 h-4 mr-2"/>Resume</TabsTrigger>
                    <TabsTrigger value="coverLetter" disabled={!state.optimizedResume}><FileText className="w-4 h-4 mr-2"/>Cover Letter</TabsTrigger>
                    <TabsTrigger value="interview" disabled={!state.coverLetter}><HelpCircle className="w-4 h-4 mr-2"/>Interview</TabsTrigger>
                    <TabsTrigger value="followUp" disabled={!state.coverLetter}><Mail className="w-4 h-4 mr-2"/>Follow-Up</TabsTrigger>
                </TabsList>
                <TabsContent value="resume" className="mt-4">
                    {renderContent('resume', state.optimizedResume, handleOptimizeResume, 'Optimize My Resume', 'Optimized Resume', Sparkles, state.analysisResult, 'optimized-resume')}
                </TabsContent>
                <TabsContent value="coverLetter" className="mt-4">
                    {renderContent('coverLetter', state.coverLetter, handleGenerateCoverLetter, 'Generate Cover Letter', 'Cover Letter', FileText, state.optimizedResume, 'cover-letter')}
                </TabsContent>
                <TabsContent value="interview" className="mt-4">
                    {renderContent('interview', state.interviewQuestions, handleGenerateInterviewQuestions, 'Generate Interview Questions', 'Interview Prep', HelpCircle, state.coverLetter, 'interview-prep')}
                </TabsContent>
                <TabsContent value="followUp" className="mt-4">
                    {renderContent('followUp', state.followUpEmail, handleGenerateFollowUp, 'Generate Follow-Up Email', 'Follow-Up Email', Mail, state.coverLetter, 'follow-up-email')}
                </TabsContent>
                </Tabs>
                {state.coverLetter && !state.applicationId && (
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Save Your Application</CardTitle>
                            <CardDescription>Save this application to your dashboard to track its status.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button size="lg" className="w-full" onClick={handleSaveApplication} disabled={state.loading === 'savingApp'}>
                                {state.loading === 'savingApp' ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                Save Application to Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                )}
                 {state.applicationId && (
                    <Card className="shadow-lg bg-green-500/10 border-green-500/50">
                        <CardHeader className="text-center">
                            <CardTitle className="text-green-300">Application Saved!</CardTitle>
                            <CardDescription className="text-green-400/80">You can view and track this application on your dashboard.</CardDescription>
                             <div className="pt-2">
                                <Button asChild variant="outline">
                                    <Link href="/dashboard">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        Go to Dashboard
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>
                )}
            </div>
            </div>
        )}
      </main>
    </div>
  );
}
