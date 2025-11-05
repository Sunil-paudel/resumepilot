import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { AppFooter } from '@/components/app/footer';

export const metadata: Metadata = {
  title: {
    default: 'ResumePilot | AI-Powered Job Application Assistant',
    template: '%s | ResumePilot',
  },
  description: 'Land your dream job with ResumePilot. Get AI-powered resume optimization, tailored cover letters, and interview preparation.',
  keywords: ['resume optimizer', 'AI resume writer', 'cover letter generator', 'job application', 'career coach'],
  openGraph: {
    title: 'ResumePilot | AI-Powered Job Application Assistant',
    description: 'Land your dream job with ResumePilot. Get AI-powered resume optimization, tailored cover letters, and interview preparation.',
    type: 'website',
    locale: 'en_US',
    url: 'https://resumepilot.app', // Replace with your actual domain
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <FirebaseClientProvider>
          <main className="flex-grow">{children}</main>
          <AppFooter />
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
