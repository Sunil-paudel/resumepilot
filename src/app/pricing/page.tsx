'use client';

import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Logo } from '@/components/app/icons';
import { AppFooter } from '@/components/app/footer';

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 md:px-8 py-4 flex items-center justify-between gap-3 border-b">
        <Link href="/" className="flex items-center gap-3">
          <Logo className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">
            ResumePilot
          </h1>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/generator">Generator</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/contact">Contact</Link>
          </Button>
          <Button asChild>
            <Link href="/generator">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="flex-grow py-20 md:py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold font-headline text-foreground">
              Choose Your Plan
            </h2>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple, transparent pricing. Pick the plan that works for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Pay-as-you-go Plan */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline">Pay-as-you-go</CardTitle>
                <CardDescription>Perfect for single use or occasional applications.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-6">
                <div className="text-5xl font-bold font-headline">
                  $1 <span className="text-lg font-normal text-muted-foreground">/ per generation</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <span>One complete document set generation</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <span>Optimized Resume</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <span>Tailored Cover Letter</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <span>Interview Question Prep</span>
                  </li>
                   <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <span>Follow-Up Email Draft</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/generator">Get Started</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Monthly Plan */}
            <Card className="border-2 border-primary shadow-2xl flex flex-col relative">
              <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              </div>
              <CardHeader>
                <CardTitle className="font-headline">Pro Monthly</CardTitle>
                <CardDescription>The ultimate toolkit for your job search.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-6">
                <div className="text-5xl font-bold font-headline">
                  $20 <span className="text-lg font-normal text-muted-foreground">/ month</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 font-semibold">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <span>Unlimited Generations</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <span>Full Document Suite Included</span>
                  </li>
                   <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <span>Job Application Dashboard</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <span>Track Application Status</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <span>Cancel Anytime</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/generator">Go Pro</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
       <AppFooter />
    </div>
  );
}
