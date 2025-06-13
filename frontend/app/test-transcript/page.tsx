'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestTranscriptPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const createTestMeeting = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/create-test-meeting', {
        method: 'POST',
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to create test meeting' });
    } finally {
      setLoading(false);
    }
  };

  const checkTranscripts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/transcripts');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to fetch debug data' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Test Transcript Functionality</h1>
      
      <div className="space-y-4 mb-8">
        <Button onClick={createTestMeeting} disabled={loading}>
          {loading ? 'Creating...' : 'Create Test Meeting with Transcripts'}
        </Button>
        
        <Button onClick={checkTranscripts} disabled={loading} variant="outline">
          {loading ? 'Checking...' : 'Check Database Contents'}
        </Button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
