'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function VideoCallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();


  useEffect(() => {
    if (!loading && !user) {
      // Preserve the current meeting URL for redirect after sign-in
      const currentPath = window.location.pathname;
      const redirectUrl = `/auth/signin?next=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
