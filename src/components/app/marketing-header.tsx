'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Logo } from '@/components/app/icons';
import { ArrowRight, Menu } from 'lucide-react';

export function MarketingHeader() {
  const navLinks = [
    { href: '/pricing', label: 'Pricing' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header className="px-4 md:px-8 py-4 flex items-center justify-between gap-3 border-b">
      <Link href="/" className="flex items-center gap-3">
        <Logo className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold font-headline text-foreground">
          ResumePilot
        </h1>
      </Link>
      <nav className="hidden md:flex items-center gap-2">
        {navLinks.map((link) => (
          <Button variant="ghost" asChild key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
        <Button asChild>
          <Link href="/generator">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </nav>
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[240px]">
            <SheetHeader className="sr-only">
              <SheetTitle>Mobile Menu</SheetTitle>
              <SheetDescription>Navigation links for ResumePilot</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 pt-8">
              {navLinks.map((link) => (
                <SheetClose asChild key={link.href}>
                    <Link href={link.href} className="text-lg font-medium hover:text-primary transition-colors">
                        {link.label}
                    </Link>
                </SheetClose>
              ))}
               <SheetClose asChild>
                 <Button asChild className="mt-4">
                    <Link href="/generator">
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
