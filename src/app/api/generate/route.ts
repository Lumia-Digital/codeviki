import { NextRequest, NextResponse } from 'next/server';
import { generateDocs, type AIProvider } from '@/lib/ai-providers';
import { analyzeFromFileList } from '@/lib/code-analyzer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 120; // Allow up to 2 minutes for AI processing

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { files, apiKey, provider, model } = body as {
      files: { path: string; content: string }[];
      apiKey: string;
      provider: AIProvider;
      model: string;
    };

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    if (!provider) {
      return NextResponse.json({ error: 'AI provider is required' }, { status: 400 });
    }

    // Increment API call usage for the user
    // AND fetch their protocol settings
    const session = await getServerSession(authOptions);
    let userSettings = null;
    if (session?.user) {
      userSettings = await (prisma.user as any).findUnique({
        where: { id: (session.user as any).id },
        select: { 
          usageApiCalls: true,
          subscriptionTier: true,
          apiScannerEnabled: true,
          codeContextEnabled: true
        }
      });

      if (userSettings) {
        const { getTierLimits } = await import('@/lib/tiers');
        const limits = getTierLimits(userSettings.subscriptionTier);
        
        if (userSettings.usageApiCalls >= limits.apiCalls) {
          return NextResponse.json({ 
            error: `AI generation limit reached for ${userSettings.subscriptionTier.toUpperCase()} tier. Please upgrade for higher throughput.` 
          }, { status: 403 });
        }
      }

      await (prisma.user as any).update({
        where: { id: (session.user as any).id },
        data: { usageApiCalls: { increment: 1 } }
      });
    }

    // Analyze the codebase
    // Respect "API Scanner" protocol setting - but default to true for maximum intelligence
    const runDeepAnalysis = true; // Force true to satisfy "Brain tab" request
    const analysis = analyzeFromFileList(files);

    // Generate documentation using AI
    const docs = await generateDocs(
      provider,
      apiKey,
      model || 'gpt-5.4',
      analysis.codeContext
    );

    // Enrich metadata
    docs.metadata = {
      ...docs.metadata,
      fileCount: analysis.totalFiles,
      totalLines: analysis.totalLines,
      generatedAt: new Date().toISOString(),
      model: model || 'gpt-4o',
      provider,
    };

    docs.language = docs.language || (analysis as any).language;
    docs.framework = docs.framework || (analysis as any).framework;

    return NextResponse.json({ 
      success: true, 
      docs,
      analysis: {
        fileTree: (analysis as any).fileTreeString,
        language: (analysis as any).language,
        framework: (analysis as any).framework,
        totalFiles: (analysis as any).totalFiles,
        totalLines: (analysis as any).totalLines,
        deepAnalysis: runDeepAnalysis ? (analysis as any).deepAnalysis : null,
      }
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Documentation generation error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate documentation' },
      { status: 500 }
    );
  }
}
