import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasGeminiKey: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    keyLength: process.env.NEXT_PUBLIC_GEMINI_API_KEY?.length || 0,
    keyPrefix: process.env.NEXT_PUBLIC_GEMINI_API_KEY?.substring(0, 10) + '...',
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('GEMINI'))
  });
}
