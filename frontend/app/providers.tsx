'use client';

import { SessionProvider } from "next-auth/react";
import { MeetingProvider } from "@/contexts/MeetingContext";
import { RecordingProvider } from "@/contexts/RecordingContext";
import AuthStatus from "@/components/AuthStatus";
import { Session } from "next-auth";

export function Providers({ 
  children,
  session
}: { 
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <MeetingProvider>
        <RecordingProvider>
          <AuthStatus />
          {children}
        </RecordingProvider>
      </MeetingProvider>
    </SessionProvider>
  );
}