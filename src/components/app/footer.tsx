import Link from 'next/link';
import { Github } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="border-t">
      <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-6">
        <div className="text-center text-muted-foreground text-sm space-y-2">
            <p>
            ResumePilot is an AI-powered tool designed to assist with job applications. All generated content should be carefully reviewed and edited for accuracy and suitability. This service relies on third-party APIs; we are not responsible for their availability, performance, or any issues arising from their use.
            </p>
            <p>&copy; {new Date().getFullYear()} ResumePilot. All rights reserved.</p>
        </div>
        <nav className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            <Link href="https://github.com/FirebaseExtended/ai-apps-templates-next" target="_blank" className="hover:text-foreground transition-colors">
                <Github className="w-5 h-5" />
            </Link>
        </nav>
      </div>
    </footer>
  );
}
