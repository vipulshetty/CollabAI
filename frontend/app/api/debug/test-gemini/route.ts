import { NextResponse } from 'next/server';
import { GeminiService } from '@/services/GeminiService';

export async function GET() {
  try {
    const geminiService = new GeminiService();
    
    const testTranscript = "Hello everyone, welcome to our test meeting. Today we will discuss the new project requirements and timeline. We need to complete the design phase by next Friday.";
    
    const summary = await geminiService.generateSummary([testTranscript]);
    const actionPoints = await geminiService.extractActionItems(testTranscript);
    
    return NextResponse.json({
      success: true,
      apiKeyConfigured: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      testSummary: summary,
      testActionPoints: actionPoints,
      message: 'Gemini API is working correctly'
    });
    
  } catch (error) {
    console.error('Gemini test error:', error);
    return NextResponse.json({
      success: false,
      apiKeyConfigured: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Gemini API test failed'
    });
  }
}
