'use client';

import { SessionProvider } from "next-auth/react";
import { MeetingProvider } from "@/context/MeetingContext";
import { RecordingProvider } from "@/context/RecordingContext";
import AuthStatus from "@/components/AuthStatus";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MeetingProvider>
        <RecordingProvider>
          <AuthStatus />
          {children}
        </RecordingProvider>
      </MeetingProvider>
    </SessionProvider>
  );
} 