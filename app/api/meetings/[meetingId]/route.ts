import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('GET request for meeting:', { 
      meetingId: params.meetingId,
      userEmail: session.user.email 
    });

    const { data: meeting, error } = await supabase
      .from('meetings')
      .select(`
        id,
        title,
        scheduled_date,
        created_at,
        status,
        created_by,
        participants,
        meeting_url,
        description
      `)
      .eq('id', params.meetingId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!meeting) {
      console.error('Meeting not found:', params.meetingId);
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Check if user has access to this meeting
    if (meeting.created_by !== session.user.email && 
        !meeting.participants?.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('Found meeting:', meeting);
    return NextResponse.json({ meeting });
  } catch (error) {
    console.error('Error in GET /api/meetings/[meetingId]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('PATCH request for meeting:', {
      meetingId: params.meetingId,
      userEmail: session.user.email
    });

    const body = await request.json();
    const { status, transcripts } = body;

    console.log('Request body:', { status, transcripts });

    // Check if meeting exists first using both meeting_id and id columns
    const { data: existingMeeting, error: checkError } = await supabase
      .from('meetings')
      .select('id, meeting_id, status')
      .or(`id.eq.${params.meetingId},meeting_id.eq.${params.meetingId}`)
      .single();

    if (checkError) {
      console.error('Error checking meeting:', checkError);
      return NextResponse.json(
        { error: 'Error checking meeting existence', details: checkError.message },
        { status: 500 }
      );
    }

    if (!existingMeeting) {
      console.error('Meeting not found:', {
        meetingId: params.meetingId,
        query: `id.eq.${params.meetingId},meeting_id.eq.${params.meetingId}`
      });
      return NextResponse.json(
        { error: 'Meeting not found', meetingId: params.meetingId },
        { status: 404 }
      );
    }

    console.log('Found existing meeting:', existingMeeting);

    // Use the correct ID for the update
    const updateId = existingMeeting.meeting_id || existingMeeting.id;
    const idColumn = existingMeeting.meeting_id ? 'meeting_id' : 'id';

    // Update meeting status
    const { data: updatedMeeting, error: updateError } = await supabase
      .from('meetings')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq(idColumn, updateId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating meeting:', updateError);
      return NextResponse.json(
        { error: 'Failed to update meeting', details: updateError.message },
        { status: 500 }
      );
    }

    if (!updatedMeeting) {
      console.error('No meeting returned after update');
      return NextResponse.json(
        { error: 'Meeting update failed', meetingId: params.meetingId },
        { status: 500 }
      );
    }

    console.log('Meeting updated:', updatedMeeting);

    // Save transcripts if any
    let savedTranscripts = null;
    if (transcripts && transcripts.length > 0) {
      console.log('Saving transcripts:', { 
        count: transcripts.length, 
        transcripts,
        meetingId: updateId 
      });

      try {
        // First get the actual meeting ID (uuid) from the meetings table
        const { data: meetingData, error: meetingError } = await supabase
          .from('meetings')
          .select('id')
          .eq(idColumn, updateId)
          .single();

        if (meetingError) {
          console.error('Error getting meeting ID:', meetingError);
          throw meetingError;
        }

        if (!meetingData?.id) {
          console.error('Meeting ID not found');
          throw new Error('Meeting ID not found');
        }

        // Save as a single transcript record
        const { data: insertedTranscript, error: transcriptError } = await supabase
          .from('meeting_transcripts')
          .insert({
            meeting_id: meetingData.id,
            content: transcripts[0], // First element contains the full transcript
            created_at: new Date().toISOString(),
            created_by: session.user.email
          })
          .select()
          .single();

        if (transcriptError) {
          console.error('Error saving transcript:', {
            error: transcriptError,
            meetingId: meetingData.id
          });
          throw transcriptError;
        }

        console.log('Transcript saved successfully:', {
          transcript: insertedTranscript
        });
        savedTranscripts = insertedTranscript;
      } catch (error) {
        console.error('Exception saving transcript:', error);
      }
    } else {
      console.log('No transcript to save');
    }

    return NextResponse.json({
      meeting: updatedMeeting,
      message: 'Meeting ended successfully',
      ...(savedTranscripts && { transcripts: savedTranscripts })
    });
  } catch (error) {
    console.error('Error in PATCH /api/meetings/[meetingId]:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}