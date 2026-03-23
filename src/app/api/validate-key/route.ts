import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, type AIProvider } from '@/lib/ai-providers';

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json() as { provider: AIProvider; apiKey: string };

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Provider and API key are required' }, { status: 400 });
    }

    const result = await validateApiKey(provider, apiKey);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { valid: false, error: err.message || 'Validation failed' },
      { status: 500 }
    );
  }
}
