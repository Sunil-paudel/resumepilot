'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDoc, useUser, useFirestore, useAuth } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Logo } from '@/components/app/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Home, Loader2, ArrowLeft, Save, FileText, Mail, HelpCircle, Sparkles } from 'lucide-react';
import { signOut } from 'firebase/auth';
import type { JobApplication } from '@/lib/types';
import { format } from 'date-fns';
import { useMemoFirebase } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const statusColors: { [key: string]: string } = {
  Applied: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
  Interviewing: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
  Accepted: 'bg-green-500/20 text-green-300 border-green-500/50',
  Rejected: 'bg-red-500/20 text-red-300 border-red-500/50',
};

type EditableField = 'optimizedResumeHtml' | 'coverLetterHtml' | 'interviewQuestionsHtml' | 'followUpEmailHtml';

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [editedContent, setEditedContent] = useState<Partial<JobApplication>>({});

  const applicationRef = useMemoFirebase(() => {
    if (!firestore || !user || !params.id) return null;
    return doc(firestore, 'users', user.uid, 'applications', params.id);
  }, [firestore, user, params.id]);

  const { data: application, isLoading } = useDoc<JobApplication>(applicationRef);

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

  const handleSave = async () => {
      if(!user || !firestore || !params.id) return;
      setIsSaving(true);
      
      const appRef = doc(firestore, 'users', user.uid, 'applications', params.id);
      const dataToUpdate = {
          ...editedContent
      };
      
      try {
        await updateDoc(appRef, dataToUpdate);
        toast({
            title: 'Saved!',
            description: 'Your changes have been saved successfully.',
        });
      } catch (e: any) {
         const permissionError = new FirestorePermissionError({
              path: appRef.path,
              operation: 'update',
              requestResourceData: dataToUpdate,
            });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: e.message || 'Could not save changes.',
        });
      }
      setIsSaving(false);
  };


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
             <h1 className="text-2xl font-bold font-headline text-destructive mb-4">Application Not Found</h1>
             <p className="text-muted-foreground mb-8">We couldn't find the application you were looking for.</p>
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
      Icon: React.ElementType
  ) => {
      const content = editedContent[field];
      
      return (
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline"><Icon className="w-5 h-5"/>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                  <Label htmlFor={field} className="sr-only">{title}</Label>
                  <Textarea
                    id={field}
                    value={content || ''}
                    onChange={(e) => handleContentChange(field, e.target.value)}
                    className="h-96 font-mono text-sm"
                    placeholder={`No ${title.toLowerCase()} content available.`}
                  />
              </CardContent>
          </Card>
      )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b px-4 py-4 md:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
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
                <span className="ml-2">Save Changes</span>
            </Button>
            <Button variant="ghost" size="icon" asChild>
                <Link href="/" title="Home">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {renderEditableDocument('optimizedResumeHtml', 'Optimized Resume', Sparkles)}
                {renderEditableDocument('coverLetterHtml', 'Cover Letter', FileText)}
                {renderEditableDocument('interviewQuestionsHtml', 'Interview Prep', HelpCircle)}
                {renderEditableDocument('followUpEmailHtml', 'Follow-up Email', Mail)}
            </div>
        </div>
      </main>
    </div>
  );
}
