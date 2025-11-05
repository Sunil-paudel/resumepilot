
import Link from 'next/link';
import { Logo } from '@/components/app/icons';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function HomePage() {
  const features = [
    'AI-Powered Resume Analysis',
    'Keyword Optimization',
    'Tailored Resume Generation',
    'Personalized Cover Letters',
    'Interview Question Prep',
    'Application Tracking Dashboard',
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 md:px-8 py-4 flex items-center justify-between gap-3 border-b">
        <Link href="/" className="flex items-center gap-3">
          <Logo className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">
            ResumePilot
          </h1>
        </Link>
        <Button asChild>
          <Link href="/generator">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32 text-center px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold font-headline text-foreground">
              Your AI Co-Pilot for the Perfect Job Application
            </h2>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Got your degree but found out getting a job is trickier than you
              thought? Don't worry. We've automated your job application process to
              help you land your dream role.
            </p>
            <div className="mt-8 flex justify-center">
              <Button size="lg" asChild>
                <Link href="/generator">
                  Start Optimizing Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section className="bg-secondary/50 py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold font-headline text-foreground">How It Works</h3>
              <p className="text-lg text-muted-foreground mt-2">A simple, powerful process to get you hired.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</span>
                    Upload & Analyze
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Paste your resume and the job description. Our AI analyzes
                    the compatibility and identifies missing keywords.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</span>
                    Optimize & Generate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Add missing skills and let the AI generate a perfectly optimized
                    resume and a tailored cover letter.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</span>
                    Prepare & Track
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Get AI-generated interview questions and save your
                    application to our dashboard to track its status.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold font-headline text-foreground">
                All-In-One Application Toolkit
              </h3>
              <p className="text-lg text-muted-foreground mt-2">
                Everything you need to stand out to recruiters and hiring
                managers.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span className="text-lg text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ResumePilot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
