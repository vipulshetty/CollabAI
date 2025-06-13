import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private genAI: GoogleGenerativeAI | null;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('NEXT_PUBLIC_GEMINI_API_KEY is not set - AI features will use fallback');
      // Don't throw error, just log warning
    }
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  async generateSummary(transcripts: string[]): Promise<string> {
    try {
      if (!this.genAI) {
        throw new Error('Gemini API not configured');
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
        Please provide a comprehensive yet concise summary of this meeting transcript. Focus on:
        - Key discussion points and main topics covered
        - Important decisions made and their rationale
        - Action items or next steps with clear ownership
        - Any unresolved issues or follow-up items

        Format the summary in a professional, structured manner that would be useful for team members who missed the meeting.

        Meeting Transcript:
        ${transcripts.join('\n')}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean up markdown formatting for better display
      return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
        .replace(/#{1,6}\s/g, '')        // Remove heading markers
        .replace(/\n{3,}/g, '\n\n')      // Reduce multiple newlines
        .trim();
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Unable to generate AI summary at this time. Please review the transcript manually.';
    }
  }

  async generateText(prompt: string): Promise<string> {
    try {
      if (!this.genAI) {
        throw new Error('Gemini API not configured');
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean up markdown formatting
      return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
        .replace(/#{1,6}\s/g, '')        // Remove heading markers
        .trim();
    } catch (error) {
      console.error('Error generating text:', error);
      throw error;
    }
  }

  async extractActionItems(transcript: string): Promise<string[]> {
    try {
      const prompt = `
        Analyze the following meeting transcript and extract specific, actionable items that need to be completed.
        Focus on concrete tasks with clear next steps. Format each action item as a clear, concise statement.

        Transcript:
        ${transcript}

        Return only the action items, one per line, without bullet points or numbering.
        If no clear action items exist, suggest relevant follow-up tasks based on the discussion.
      `;

      const response = await this.generateText(prompt);
      return response
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .slice(0, 5);
    } catch (error) {
      console.error('Error extracting action items:', error);
      return ['Review meeting notes', 'Follow up with team members'];
    }
  }

  async extractKeyTopics(transcript: string): Promise<string[]> {
    try {
      const prompt = `
        Analyze the following meeting transcript and identify the main topics or themes discussed.
        Focus on the most important subjects that capture the essence of the meeting.

        Transcript:
        ${transcript}

        Return only the key topics, one per line, as concise phrases (2-4 words each).
        Limit to 5 most important topics.
      `;

      const response = await this.generateText(prompt);
      return response
        .split('\n')
        .map(topic => topic.trim())
        .filter(topic => topic.length > 0)
        .slice(0, 5);
    } catch (error) {
      console.error('Error extracting key topics:', error);
      return ['General Discussion', 'Team Updates'];
    }
  }
}
