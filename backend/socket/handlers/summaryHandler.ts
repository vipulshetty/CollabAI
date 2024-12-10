import { OpenAI } from 'openai';
import { clientPromise } from '../../lib/mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateMeetingSummary(transcripts: string[]): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional meeting summarizer. Create a concise summary of the meeting transcripts provided."
        },
        {
          role: "user",
          content: `Please summarize these meeting transcripts:\n${transcripts.join('\n')}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content || 'No summary generated.';
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
}




















































































































 









 




















 



 








 





 