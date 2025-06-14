-- CollabAI Database Cleanup and Multi-User Transcription Fix
-- Run this in your Supabase SQL editor (step by step)
-- IMPORTANT: Run each section separately and check results

-- ========================================
-- STEP 1: ANALYZE CURRENT STATE
-- ========================================

-- Check if meetings table exists and its structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'meetings'
ORDER BY ordinal_position;

-- Check if meeting_transcripts table exists and its structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'meeting_transcripts'
ORDER BY ordinal_position;

-- ========================================
-- STEP 2: CHECK FOR DUPLICATES
-- ========================================

-- Check for duplicate meetings
SELECT id, COUNT(*) as count
FROM meetings
GROUP BY id
HAVING COUNT(*) > 1;

-- ========================================
-- STEP 3: SAFE DUPLICATE REMOVAL
-- ========================================

-- Create a backup table first (optional but recommended)
-- CREATE TABLE meetings_backup AS SELECT * FROM meetings;

-- Remove duplicates safely (Supabase-compatible)
WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at ASC) as rn
    FROM meetings
)
DELETE FROM meetings
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 4. Clean up any orphaned transcripts (transcripts without meetings)
DELETE FROM meeting_transcripts 
WHERE meeting_id NOT IN (
    SELECT id FROM meetings
);

-- 5. Update any meetings with invalid status
UPDATE meetings 
SET status = 'scheduled' 
WHERE status NOT IN ('scheduled', 'completed', 'cancelled');

-- 6. Fix any null participant arrays (for text[] type)
UPDATE meetings 
SET participants = ARRAY[]::text[] 
WHERE participants IS NULL;

-- 7. Add speaker identification to transcripts table (if column doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meeting_transcripts' AND column_name = 'speaker'
    ) THEN
        ALTER TABLE meeting_transcripts ADD COLUMN speaker TEXT DEFAULT 'Unknown';
    END IF;
END $$;

-- 8. Add instance_id for multi-user transcription tracking
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meeting_transcripts' AND column_name = 'instance_id'
    ) THEN
        ALTER TABLE meeting_transcripts ADD COLUMN instance_id TEXT;
    END IF;
END $$;

-- 9. Add socket_id for user identification
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meeting_transcripts' AND column_name = 'socket_id'
    ) THEN
        ALTER TABLE meeting_transcripts ADD COLUMN socket_id TEXT;
    END IF;
END $$;

-- 10. Create index for better performance on transcripts
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_meeting_id_created_at 
ON meeting_transcripts(meeting_id, created_at);

-- 11. Create index for speaker-based queries
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_speaker 
ON meeting_transcripts(speaker);

-- 12. Verify the cleanup
SELECT 
    COUNT(*) as total_meetings,
    COUNT(DISTINCT id) as unique_meetings,
    COUNT(*) - COUNT(DISTINCT id) as duplicates
FROM meetings;

-- 13. Show meeting status distribution
SELECT status, COUNT(*) as count 
FROM meetings 
GROUP BY status;

-- 14. Show sample of meetings to verify structure
SELECT id, title, status, participants, created_at 
FROM meetings 
ORDER BY created_at DESC 
LIMIT 5;

-- 15. Check the actual schema of meetings table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'meetings' 
ORDER BY ordinal_position;

-- 16. Check the actual schema of meeting_transcripts table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'meeting_transcripts' 
ORDER BY ordinal_position;

-- 17. Show recent transcripts to verify multi-user support
SELECT 
    meeting_id,
    speaker,
    socket_id,
    instance_id,
    LEFT(transcript, 50) as transcript_preview,
    created_at
FROM meeting_transcripts 
ORDER BY created_at DESC 
LIMIT 10;
