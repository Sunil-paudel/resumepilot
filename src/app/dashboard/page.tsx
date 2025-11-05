'use client';

import React from 'react';
import Link from 'next/link';
import { useCollection, useUser, useFirestore, useAuth } from '@/firebase';
import { collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Logo } from '@/components/app/icons';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LogOut, Home, Loader2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import type { JobApplication } from '@/lib/types';
import { format } from 'date-fns';
import { useMemoFirebase } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const statusColors: { [key: string]: string } = {
  Applied: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
  Interviewing: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
  Accepted: 'bg-green-500/20 text-green-300 border-green-500/50',
  Rejected: 'bg-red-500/20 text-red-300 border-red-500/50',
};

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const applicationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'applications');
  }, [firestore, user]);

  const { data: applications, isLoading } = useCollection<JobApplication>(applicationsQuery);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    if (!user || !firestore) return;
    const appRef = doc(firestore, 'users', user.uid, 'applications', applicationId);
    const dataToUpdate = { status: newStatus };
    try {
        updateDoc(appRef, dataToUpdate).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: appRef.path,
              operation: 'update',
              requestResourceData: dataToUpdate,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: e.message || 'Could not update application status.',
        });
    }
  };

  const sortedApplications = React.useMemo(() => {
    if (!applications) return [];
    return [...applications].sort((a, b) => {
        const dateA = a.applicationDate ? new Date(a.applicationDate) : new Date(0);
        const dateB = b.applicationDate ? new Date(b.applicationDate) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });
  }, [applications]);

  if (isUserLoading || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b px-4 py-4 md:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">
            My Job Applications
          </h1>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/" title="Back to Generator">
                    <Home className="h-5 w-5" />
                </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign Out">
                <LogOut className="h-5 w-5" />
            </Button>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
            {sortedApplications.length > 0 ? (
          <Card>
            <CardContent className="p-0">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Date Applied</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedApplications.map((app) => (
                    <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.jobTitle}</TableCell>
                        <TableCell>{app.companyName}</TableCell>
                        <TableCell>
                        {app.applicationDate ? format(new Date(app.applicationDate), 'PPP') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-center">
                        <Select
                            defaultValue={app.status}
                            onValueChange={(value) => handleStatusChange(app.id, value)}
                        >
                            <SelectTrigger className="w-40 mx-auto">
                            <SelectValue>
                                <Badge className={statusColors[app.status] || ''}>{app.status}</Badge>
                            </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                            {['Applied', 'Interviewing', 'Accepted', 'Rejected'].map((status) => (
                                <SelectItem key={status} value={status}>
                                <Badge className={`${statusColors[status] || ''} w-full justify-center`}>{status}</Badge>
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
          </Card>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h2 className="text-2xl font-bold font-headline">No Applications Yet</h2>
                    <p className="text-muted-foreground mt-2 mb-4">Start by creating your first optimized resume and saving the application.</p>
                    <Button asChild>
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Go to Generator
                        </Link>
                    </Button>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

import { Card, CardContent } from '@/components/ui/card';
