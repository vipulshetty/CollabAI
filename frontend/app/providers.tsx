'use client';

import { AuthProvider } from "@/contexts/AuthContext";
import { MeetingProvider } from "@/contexts/MeetingContext";
import { RecordingProvider } from "@/contexts/RecordingContext";

export function Providers({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <MeetingProvider>
        <RecordingProvider>
          {children}
        </RecordingProvider>
      </MeetingProvider>
    </AuthProvider>
  );
}