import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('GET request for meeting:', {
      meetingId: params.meetingId,
      userEmail: user.email
    });

    // Use service role client to bypass RLS and check if meeting exists
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // First, let's check if there are multiple meetings with the same ID
    const { data: allMeetings, error: checkError } = await serviceSupabase
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
      .eq('id', params.meetingId);

    if (checkError) {
      console.error('Supabase error:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (!allMeetings || allMeetings.length === 0) {
      console.error('Meeting not found:', params.meetingId);
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (allMeetings.length > 1) {
      console.warn(`Multiple meetings found with ID ${params.meetingId}:`, allMeetings.length);
      // Use the first one, but log this issue
      console.warn('Multiple meetings with same ID:', allMeetings);
    }

    const meeting = allMeetings[0];

    // This check is now redundant since we already checked above
    // if (!meeting) {
    //   console.error('Meeting not found:', params.meetingId);
    //   return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    // }

    // Check if user has access to this meeting
    // participants array contains emails, so check both user.id and user.email
    const hasAccess = meeting.created_by === user.id ||
                     meeting.participants?.includes(user.email) ||
                     meeting.participants?.includes(user.id);

    if (!hasAccess) {
      console.log('Access denied for user:', {
        userId: user.id,
        userEmail: user.email,
        meetingCreatedBy: meeting.created_by,
        meetingParticipants: meeting.participants
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('Found meeting:', {
      id: meeting.id,
      title: meeting.title,
      created_by: meeting.created_by,
      participants: meeting.participants,
      status: meeting.status
    });
    console.log('User has access, returning meeting data');
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
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('PATCH request for meeting:', {
      meetingId: params.meetingId,
      userEmail: user.email
    });

    const body = await request.json();
    const { status, transcripts } = body;

    console.log('Request body:', { status, transcripts });

    // Check if meeting exists first
    const { data: existingMeeting, error: checkError } = await supabase
      .from('meetings')
      .select('id, status, created_by')
      .eq('id', params.meetingId)
      .single();

    if (checkError) {
      console.error('Error checking meeting:', checkError);
      return NextResponse.json(
        { error: 'Error checking meeting existence', details: checkError.message },
        { status: 500 }
      );
    }

    if (!existingMeeting) {
      console.error('Meeting not found:', params.meetingId);
      return NextResponse.json(
        { error: 'Meeting not found', meetingId: params.meetingId },
        { status: 404 }
      );
    }

    // Check if user has permission to update this meeting
    if (existingMeeting.created_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('Found existing meeting:', existingMeeting);

    // Update meeting status
    const { data: updatedMeeting, error: updateError } = await supabase
      .from('meetings')
      .update({
        status: status
      })
      .eq('id', params.meetingId)
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
        meetingId: params.meetingId
      });

      try {
        // Save as a single transcript record
        const { data: insertedTranscript, error: transcriptError } = await supabase
          .from('meeting_transcripts')
          .insert({
            meeting_id: params.meetingId,
            content: transcripts[0], // First element contains the full transcript
            speaker: 'System', // Default speaker
            timestamp: new Date().toISOString()
          })
          .select()
          .single();

        if (transcriptError) {
          console.error('Error saving transcript:', {
            error: transcriptError,
            meetingId: params.meetingId
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