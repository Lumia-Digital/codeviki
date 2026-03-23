import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { 
        id,
        userId: (session.user as any).id
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Parse the docs if they are stored as JSON in the database
    // Note: In our current schema, content is just one string. 
    // We might need to adjust how we store 'docs' if it's complex.
    // For now, let's assume 'content' might store the JSON docs.
    
    let docs = null;
    const projectWithContent = project as any;
    if (projectWithContent.content) {
      try {
        docs = JSON.parse(projectWithContent.content);
      } catch (e) {
        // If not JSON, return as a single section
        docs = {
          projectName: project.name,
          sections: [
            { id: 'overview', title: 'Overview', order: 1, content: projectWithContent.content }
          ],
          diagrams: []
        };
      }
    }

    return NextResponse.json({
      ...project,
      docs,
      aiInsights: projectWithContent.aiInsights ? JSON.parse(projectWithContent.aiInsights) : null,
      analysisData: projectWithContent.analysisData ? JSON.parse(projectWithContent.analysisData) : null,
      fileTree: projectWithContent.fileTree ? JSON.parse(projectWithContent.fileTree) : null,
    });
  } catch (error) {
    console.error('Fetch project detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch project details' }, { status: 500 });
  }
}
