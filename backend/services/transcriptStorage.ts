
import fs from 'fs/promises';
import path from 'path';

const TRANSCRIPTS_DIR = path.join(process.cwd(), 'data', 'transcripts');

export async function saveTranscripts(meetingId: string, transcripts: string[]) {
  try {
    // Ensure directory exists
    await fs.mkdir(TRANSCRIPTS_DIR, { recursive: true });
    
    const filePath = path.join(TRANSCRIPTS_DIR, `${meetingId}.json`);
    await fs.writeFile(filePath, JSON.stringify(transcripts, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error saving transcripts:', error);
    return false;
  }
}

export async function getTranscripts(meetingId: string): Promise<string[]> {
  try {
    const filePath = path.join(TRANSCRIPTS_DIR, `${meetingId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}