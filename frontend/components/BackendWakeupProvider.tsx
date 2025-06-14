'use client';

import { useEffect } from 'react';
import { backendWakeupService } from '@/services/backendWakeupService';

export function BackendWakeupProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only start wakeup service in production
    if (process.env.NODE_ENV === 'production') {
      console.log('🚀 Starting backend wakeup service...');
      backendWakeupService.startPeriodicWakeup();

      return () => {
        console.log('🛑 Stopping backend wakeup service...');
        backendWakeupService.stopPeriodicWakeup();
      };
    }
  }, []);

  return <>{children}</>;
}
