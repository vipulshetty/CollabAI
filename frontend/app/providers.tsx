'use client';

import { AuthProvider } from "@/contexts/AuthContext";
import { MeetingProvider } from "@/contexts/MeetingContext";
import { RecordingProvider } from "@/contexts/RecordingContext";
import AuthStatus from "@/components/AuthStatus";

export function Providers({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <MeetingProvider>
        <RecordingProvider>
          <AuthStatus />
          {children}
        </RecordingProvider>
      </MeetingProvider>
    </AuthProvider>
  );
}