'use client';

import React, { useReducer, useRef, useState } from 'react';
import {
  runJobSuitabilityAnalysis,
  runResumeOptimization,
  runCoverLetterGeneration,
  runFollowUpEmailGeneration,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { ScoreGauge } from '@/components/app/score-gauge';
import { Logo } from '@/components/app/icons';
import { Skeleton } from '../ui/skeleton';
import { saveAs } from 'file-saver';
import { Badge } from '../ui/badge';

type State = {
  resumeText: string;
  jobDescriptionText: string;
  analysisResult: AnalyzeJobSuitabilityOutput | null;
  optimizedAnalysisResult: AnalyzeJobSuitabilityOutput | null;
  optimizedResume: string | null;
  coverLetter: string | null;
  followUpEmail: string | null;
  skillsToAdd: string[];
  loading: 'analysis' | 'optimizing' | 'coverLetter' | 'followUp' | 'downloading' | false;
  copied: 'resume' | 'coverLetter' | 'followUp' | false;
};

type Action =
  | { type: 'SET_TEXT'; payload: { field: 'resumeText' | 'jobDescriptionText'; value: string } }
  | { type: 'SET_LOADING'; payload: State['loading'] }
  | { type: 'SET_ANALYSIS_RESULT'; payload: AnalyzeJobSuitabilityOutput | null }
  | { type: 'SET_OPTIMIZED_RESUME'; payload: string | null }
  | { type: 'SET_OPTIMIZED_ANALYSIS_RESULT'; payload: AnalyzeJobSuitabilityOutput | null }
  | { type: 'SET_COVER_LETTER'; payload: string | null }
  | { type: 'SET_FOLLOW_UP_EMAIL'; payload: string | null }
  | { type: 'SET_COPIED'; payload: State['copied'] }
  | { type: 'ADD_SKILL'; payload: string }
  | { type: 'REMOVE_SKILL'; payload: string }
  | { type: 'DRAG_SKILL'; payload: { dragIndex: number; hoverIndex: number } }
  | { type: 'RESET' };

const initialState: State = {
  resumeText: '',
  jobDescriptionText: '',
  analysisResult: null,
  optimizedAnalysisResult: null,
  optimizedResume: null,
  coverLetter: null,
  followUpEmail: null,
  skillsToAdd: [],
  loading: false,
  copied: false,
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
    case 'RESET':
      return { 
        ...initialState, 
        resumeText: state.resumeText, 
        jobDescriptionText: state.jobDescriptionText 
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

export default function ResumePilotClient() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleCopy = (text: string | null, type: State['copied']) => {
    if (!text || !type) return;
    // We need to strip HTML for the copy
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
    const blob = new Blob([`<html><head><title>Document</title></head><body class="prose dark:prose-invert max-w-4xl mx-auto p-8"><style>body { font-family: sans-serif; } h1,h2,h3 { font-weight: bold; } ul { list-style-type: disc; margin-left: 20px; }</style>${content}</body></html>`], { type: 'text/html' });
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
    });

    if (optResult.error || !optResult.data) {
        toast({ variant: 'destructive', title: 'Optimization Failed', description: optResult.error });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
    }
    dispatch({ type: 'SET_OPTIMIZED_RESUME', payload: optResult.data.optimizedResumeHtml });

    // We need to strip HTML for the analysis
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

  const isAnalyzeDisabled = !state.resumeText || !state.jobDescriptionText || !!state.loading;

  const renderContent = (
    type: 'resume' | 'coverLetter' | 'followUp',
    content: string | null,
    handleGenerate: () => void,
    generateButtonText: string,
    title: string,
    Icon: React.ElementType,
    dependency: any,
    fileName: string
  ) => {
    const loadingType = type === 'resume' ? 'optimizing' : type;

    if (state.loading === 'analysis') return <Skeleton className="w-full h-64" />;
    
    if (type === 'resume' && state.analysisResult && !state.optimizedResume && state.loading !== 'optimizing') {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 bg-secondary rounded-lg p-4">
                <KeywordAnalysis />
                <Button onClick={handleGenerate} disabled={state.loading === 'optimizing'}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generateButtonText}
                </Button>
            </div>
        )
    }

    if (state.loading === loadingType) {
      return <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Generating your {title.toLowerCase()}...</p>
      </div>;
    }
    
    if (!dependency && type !== 'resume') {
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Complete previous steps to generate {title.toLowerCase()}.</p>
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
    
    // Initial state for resume tab before analysis
    if (type === 'resume' && !state.analysisResult) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4 bg-secondary rounded-lg">
                <Icon className="w-12 h-12 text-muted-foreground" />
                <p className="text-center text-muted-foreground">Your {title.toLowerCase()} will appear here.</p>
            </div>
        )
    }

    // Fallback for cover letter and follow-up
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 bg-secondary rounded-lg">
        <Icon className="w-12 h-12 text-muted-foreground" />
        <p className="text-center text-muted-foreground">Your {title.toLowerCase()} will appear here.</p>
        <Button onClick={handleGenerate}>
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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 md:px-8 py-4 flex items-center gap-3 border-b">
        <Logo className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold font-headline text-foreground">ResumePilot</h1>
      </header>

      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-8">
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
              <CardContent>
                <Label htmlFor="jd-text" className="sr-only">Job Description Text</Label>
                <Textarea
                  id="jd-text"
                  placeholder="Paste job description here..."
                  value={state.jobDescriptionText}
                  onChange={(e) => dispatch({ type: 'SET_TEXT', payload: { field: 'jobDescriptionText', value: e.target.value }})}
                  className="h-48"
                />
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
                )}
              </CardContent>
            </Card>

            <Tabs defaultValue="resume" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="resume"><Sparkles className="w-4 h-4 mr-2"/>Resume</TabsTrigger>
                <TabsTrigger value="coverLetter" disabled={!state.optimizedResume}><FileText className="w-4 h-4 mr-2"/>Cover Letter</TabsTrigger>
                <TabsTrigger value="followUp" disabled={!state.coverLetter}><Mail className="w-4 h-4 mr-2"/>Follow-Up</TabsTrigger>
              </TabsList>
              <TabsContent value="resume" className="mt-4">
                {renderContent('resume', state.optimizedResume, handleOptimizeResume, 'Optimize My Resume', 'Optimized Resume', Sparkles, state.analysisResult, 'optimized-resume')}
              </TabsContent>
              <TabsContent value="coverLetter" className="mt-4">
                {renderContent('coverLetter', state.coverLetter, handleGenerateCoverLetter, 'Generate Cover Letter', 'Cover Letter', FileText, state.optimizedResume, 'cover-letter')}
              </TabsContent>
              <TabsContent value="followUp" className="mt-4">
                {renderContent('followUp', state.followUpEmail, handleGenerateFollowUp, 'Generate Follow-Up Email', 'Follow-Up Email', Mail, state.coverLetter, 'follow-up-email')}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
