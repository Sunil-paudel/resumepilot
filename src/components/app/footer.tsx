import Link from 'next/link';
import { Github } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="border-t">
      <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-4 text-center text-muted-foreground text-sm">
        <p>
          ResumePilot is an AI-powered tool designed to assist with job applications. All generated content should be carefully reviewed and edited for accuracy and suitability. This service relies on third-party APIs; we are not responsible for their availability, performance, or any issues arising from their use.
        </p>
        <div className="flex items-center justify-center gap-4">
            <p>&copy; {new Date().getFullYear()} ResumePilot. All rights reserved.</p>
            <Link href="https://github.com/FirebaseExtended/ai-apps-templates-next" target="_blank" className="hover:text-foreground transition-colors">
                <Github className="w-5 h-5" />
            </Link>
        </div>
      </div>
    </footer>
  );
}
