'use client';
import React, { createContext, useContext, ReactNode } from 'react';
import { useRecording as useRecordingHook } from '@/hooks/useRecording';

interface RecordingContextType {
  isRecording: boolean;
  startRecording: (stream: MediaStream) => void;
  stopRecording: () => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export const RecordingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isRecording, startRecording, stopRecording } = useRecordingHook();

  return (
    <RecordingContext.Provider value={{ isRecording, startRecording, stopRecording }}>
      {children}
    </RecordingContext.Provider>
  );
};

export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (context === undefined) {
    throw new Error('useRecording must be used within a RecordingProvider');
  }
  return context;
};
