-- Drop existing tables if they exist
drop table if exists meeting_transcripts;
drop table if exists meetings;

-- Create the meetings table
create table meetings (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    scheduled_date timestamp with time zone not null,
    status text not null default 'scheduled',
    created_by text not null,
    participants text[] default array[]::text[],
    meeting_url text,
    description text,
    created_at timestamp with time zone default now()
);

-- Add status check constraint
alter table meetings 
add constraint meetings_status_check 
check (status in ('scheduled', 'completed', 'cancelled'));

-- Create meeting_transcripts table
create table meeting_transcripts (
    id uuid default gen_random_uuid() primary key,
    meeting_id uuid references meetings(id) on delete cascade,
    content text not null,
    speaker text not null,
    timestamp timestamp with time zone not null,
    summary text,
    created_at timestamp with time zone default now()
);

-- Enable RLS
alter table meetings enable row level security;
alter table meeting_transcripts enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their own meetings or meetings they are participants in" on meetings;
drop policy if exists "Users can create meetings" on meetings;
drop policy if exists "Users can update their own meetings" on meetings;
drop policy if exists "Users can delete their own meetings" on meetings;
drop policy if exists "Users can view transcripts of meetings they have access to" on meeting_transcripts;
drop policy if exists "Users can create transcripts for their meetings" on meeting_transcripts;

-- Create policies for meetings table
create policy "Users can view their own meetings or meetings they are participants in"
    on meetings for select
    using (auth.uid()::text = created_by or auth.uid()::text = any(participants));

create policy "Users can create meetings"
    on meetings for insert
    with check (auth.uid()::text = created_by);

create policy "Users can update their own meetings"
    on meetings for update
    using (auth.uid()::text = created_by);

create policy "Users can delete their own meetings"
    on meetings for delete
    using (auth.uid()::text = created_by);

-- Create policies for meeting_transcripts table
create policy "Users can view transcripts of meetings they have access to"
    on meeting_transcripts for select
    using (exists (
        select 1 from meetings
        where meetings.id = meeting_transcripts.meeting_id
        and (meetings.created_by = auth.uid()::text or auth.uid()::text = any(meetings.participants))
    ));

create policy "Users can create transcripts for their meetings"
    on meeting_transcripts for insert
    with check (exists (
        select 1 from meetings
        where meetings.id = meeting_transcripts.meeting_id
        and (meetings.created_by = auth.uid()::text or auth.uid()::text = any(meetings.participants))
    ));

-- Drop existing indexes if they exist
drop index if exists idx_meetings_created_by;
drop index if exists idx_meetings_scheduled_date;
drop index if exists idx_meetings_status;
drop index if exists idx_meeting_transcripts_meeting_id;

-- Create indexes for better performance
create index idx_meetings_created_by on meetings(created_by);
create index idx_meetings_scheduled_date on meetings(scheduled_date);
create index idx_meetings_status on meetings(status);
create index idx_meeting_transcripts_meeting_id on meeting_transcripts(meeting_id);
