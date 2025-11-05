'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDoc, useUser, useFirestore, useAuth } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Logo } from '@/components/app/icons';
import { Button } from '@/components/ui/button';
import { LogOut, Home, Loader2, ArrowLeft, Save, FileText, Mail, HelpCircle, Sparkles } from 'lucide-react';
import { signOut } from 'firebase/auth';
import type { JobApplication } from '@/lib/types';
import { useMemoFirebase } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { runInterviewQuestionsGeneration, runFollowUpEmailGeneration } from '@/app/actions';

type EditableField = 'optimizedResumeHtml' | 'coverLetterHtml' | 'interviewQuestionsHtml' | 'followUpEmailHtml';
type GenerationState = false | 'interview' | 'followup';

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [generationLoading, setGenerationLoading] = useState<GenerationState>(false);
  const [editedContent, setEditedContent] = useState<Partial<JobApplication>>({});

  const applicationRef = useMemoFirebase(() => {
    if (!firestore || !user || !params.id) return null;
    return doc(firestore, 'users', user.uid, 'applications', params.id);
  }, [firestore, user, params.id]);

  const { data: application, isLoading, error: applicationError } = useDoc<JobApplication>(applicationRef);

  useEffect(() => {
    if (application) {
      setEditedContent({
        optimizedResumeHtml: application.optimizedResumeHtml,
        coverLetterHtml: application.coverLetterHtml,
        interviewQuestionsHtml: application.interviewQuestionsHtml,
        followUpEmailHtml: application.followUpEmailHtml,
      });
    }
  }, [application]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
  };
  
  const handleContentChange = (field: EditableField, value: string) => {
    setEditedContent(prev => ({...prev, [field]: value}));
  };

  const updateApplication = async (dataToUpdate: Partial<JobApplication>) => {
    if(!user || !firestore || !params.id) return;
    
    const appRef = doc(firestore, 'users', user.uid, 'applications', params.id);
    
    return new Promise<boolean>((resolve) => {
      // Non-blocking update
      updateDoc(appRef, dataToUpdate)
        .then(() => {
            // Update local state optimistically
            setEditedContent(prev => ({...prev, ...dataToUpdate}));
            resolve(true);
        })
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: appRef.path,
                operation: 'update',
                requestResourceData: dataToUpdate,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: 'Could not save changes due to a permissions issue.',
            });
            resolve(false);
        });
    });
  }

  const handleSave = async () => {
      setIsSaving(true);
      const success = await updateApplication(editedContent);
      if (success) {
          toast({
              title: 'Saved!',
              description: 'Your changes have been saved successfully.',
          });
      }
      setIsSaving(false);
  };

  const handleGenerateInterviewQuestions = async () => {
    if (!application?.optimizedResumeHtml || !application.jobDescriptionText) {
      toast({ variant: 'destructive', title: 'Missing Content', description: 'Resume and job description are needed to generate questions.' });
      return;
    }
    setGenerationLoading('interview');
    const result = await runInterviewQuestionsGeneration({ resume: application.optimizedResumeHtml, jobDescription: application.jobDescriptionText });
    if (result.error || !result.data) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: result.error });
    } else {
      await updateApplication({ interviewQuestionsHtml: result.data.interviewQuestionsHtml });
      toast({ title: 'Success!', description: 'Interview prep has been generated and saved.' });
    }
    setGenerationLoading(false);
  }

  const handleGenerateFollowUpEmail = async () => {
    if (!application?.optimizedResumeHtml || !application?.coverLetterHtml || !application.jobDescriptionText) {
        toast({ variant: 'destructive', title: 'Missing Content', description: 'Resume, cover letter, and job description are needed.' });
        return;
    }
    setGenerationLoading('followup');
    const result = await runFollowUpEmailGeneration({ 
        resumeContent: application.optimizedResumeHtml, 
        coverLetterContent: application.coverLetterHtml, 
        jobDescription: application.jobDescriptionText
    });
    if (result.error || !result.data) {
        toast({ variant: 'destructive', title: 'Generation Failed', description: result.error });
    } else {
        await updateApplication({ followUpEmailHtml: result.data.followUpEmailHtml });
        toast({ title: 'Success!', description: 'Follow-up email has been generated and saved.' });
    }
    setGenerationLoading(false);
  }


  if (isUserLoading || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!application) {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-background">
             <h1 className="text-2xl font-bold font-headline text-destructive mb-4">{applicationError ? 'Access Denied' : 'Application Not Found'}</h1>
             <p className="text-muted-foreground mb-8">{applicationError ? "You don't have permission to view this." : "We couldn't find the application you were looking for."}</p>
             <Button asChild>
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
        </div>
    )
  }
  
  const renderEditableDocument = (
      field: EditableField,
      title: string,
      Icon: React.ElementType,
      handleGenerate?: () => void,
      generateLoading?: boolean
  ) => {
      const content = editedContent[field];
      
      return (
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline"><Icon className="w-5 h-5"/>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                  {content !== undefined && content !== '' ? (
                    <div className="prose dark:prose-invert max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: content || ''}} />
                    </div>
                  ) : handleGenerate ? (
                      <div className="flex flex-col items-center justify-center h-96 gap-4 bg-secondary/30 rounded-lg p-8 text-center">
                        <Icon className="w-12 h-12 text-muted-foreground" />
                        <p className="text-muted-foreground">This document hasn't been generated yet.</p>
                        <Button onClick={handleGenerate} disabled={!!generationLoading}>
                          {generateLoading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                              <Sparkles className="w-4 h-4 mr-2" />
                          )}
                          Generate {title}
                        </Button>
                      </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center h-96 gap-4 bg-secondary/30 rounded-lg">
                        <Icon className="w-12 h-12 text-muted-foreground" />
                        <p className="text-center text-muted-foreground">No content available.</p>
                     </div>
                  )}
              </CardContent>
          </Card>
      )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b px-4 py-4 md:px-8 flex items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2"/>
                Back to Dashboard
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <h1 className="text-xl font-bold font-headline text-foreground leading-tight">
                {application.jobTitle}
            </h1>
            <span className="hidden sm:inline-block text-muted-foreground">&middot;</span>
            <p className="text-md text-muted-foreground leading-tight">{application.companyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Save Changes</span>
            </Button>
            <Button variant="ghost" size="icon" asChild>
                <Link href="/generator" title="Generator">
                    <Home className="h-5 w-5" />
                </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign Out">
                <LogOut className="h-5 w-5" />
            </Button>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {renderEditableDocument('optimizedResumeHtml', 'Optimized Resume', Sparkles)}
                {renderEditableDocument('coverLetterHtml', 'Cover Letter', FileText)}
                {renderEditableDocument(
                  'interviewQuestionsHtml', 
                  'Interview Prep', 
                  HelpCircle,
                  handleGenerateInterviewQuestions,
                  generationLoading === 'interview'
                )}
                {renderEditableDocument(
                  'followUpEmailHtml',
                  'Follow-up Email',
                  Mail,
                  handleGenerateFollowUpEmail,
                  generationLoading === 'followup'
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
