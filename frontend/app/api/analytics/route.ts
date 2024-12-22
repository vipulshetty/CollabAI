import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For demo purposes, returning mock data
    // In a real application, you would fetch this data from your database
    const mockData = {
      meetingId: 'mock-meeting-1',
      totalDuration: 3600, // 1 hour in seconds
      participantStats: [
        {
          name: 'John Doe',
          speakingTime: 1200, // 20 minutes
          messageCount: 45,
          actionItems: 5,
          sentimentScore: 0.8,
        },
        {
          name: 'Jane Smith',
          speakingTime: 900, // 15 minutes
          messageCount: 38,
          actionItems: 3,
          sentimentScore: 0.75,
        },
        {
          name: 'Bob Johnson',
          speakingTime: 600, // 10 minutes
          messageCount: 25,
          actionItems: 2,
          sentimentScore: 0.85,
        },
      ],
      sentimentTrend: [
        { timestamp: '2024-12-12T13:00:00Z', score: 0.7 },
        { timestamp: '2024-12-12T13:10:00Z', score: 0.75 },
        { timestamp: '2024-12-12T13:20:00Z', score: 0.8 },
        { timestamp: '2024-12-12T13:30:00Z', score: 0.85 },
        { timestamp: '2024-12-12T13:40:00Z', score: 0.82 },
        { timestamp: '2024-12-12T13:50:00Z', score: 0.88 },
      ],
      actionItems: [
        { participant: 'John Doe', count: 5, completed: 3 },
        { participant: 'Jane Smith', count: 3, completed: 2 },
        { participant: 'Bob Johnson', count: 2, completed: 1 },
      ],
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error in GET /api/analytics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
