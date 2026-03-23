import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { userId: (session.user as any).id },
      orderBy: { lastUpdated: 'desc' },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Fetch projects error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      name, 
      description, 
      source, 
      repoUrl, 
      content, 
      language, 
      framework, 
      pages, 
      diagrams, 
      coverage,
      aiInsights,
      analysisData,
      fileTree
    } = await req.json();

    if (!name || !source) {
      return NextResponse.json({ error: 'Name and source are required' }, { status: 400 });
    }

    // Check plan limits
    const user = await (prisma.user as any).findUnique({
      where: { id: (session.user as any).id },
      select: { usageProjects: true, subscriptionTier: true }
    });

    if (user) {
      const { canCreateProject } = await import('@/lib/tiers');
      if (!canCreateProject(user.usageProjects, user.subscriptionTier)) {
        return NextResponse.json({ 
          error: 'Project limit reached. Please upgrade to Pro for unlimited workspace creation.' 
        }, { status: 403 });
      }
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        source,
        repoUrl,
        content,
        language,
        framework,
        pages: pages || 0,
        diagrams: diagrams || 0,
        coverage: coverage || 0,
        aiInsights: aiInsights ? JSON.stringify(aiInsights) : null,
        analysisData: analysisData ? JSON.stringify(analysisData) : null,
        fileTree: fileTree ? JSON.stringify(fileTree) : null,
        userId: (session.user as any).id,
        status: content ? 'completed' : 'processing',
        lastUpdated: new Date(),
      } as any,
    });

    // Increment usage count
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { usageProjects: { increment: 1 } } as any
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
