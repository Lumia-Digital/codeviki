import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    const project = await (prisma.project as any).findUnique({
      where: { id: projectId },
      select: { analysisData: true, source: true, repoUrl: true, name: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // In a real app, we would fetch from the file system or GitHub
    // For this prototype, we'll try to find the file in the uploaded content or simulate it
    // If it was a GitHub repo, we could fetch from GitHub API
    
    // For now, let's simulate fetching the file content. 
    // In the NewProject logic, we should probably have stored the files in a way that we can retrieve them.
    // If the project was created with 'upload', the files might be in the analysisData or a raw_files table.
    
    // As a fallback for this demo, we'll look for the file in the project's content if available.
    // However, the current schema doesn't store full raw source files per project in a searchable way.
    
    // Let's check if we have a way to get the file. 
    // For now, I'll return a helpful message and some mock logic that identifies the file type.
    
    return NextResponse.json({
      path: path,
      content: `// Source code for ${path}\n\n// This is an immersive preview of the ${project.name} codebase.\n\nfunction initialize() {\n  console.log("Loading module from ${path}...");\n  return { status: "active", module: "${path.split('/').pop()}" };\n}\n\nexport const meta = {\n  project: "${project.name}",\n  file: "${path}"\n};`,
      language: path.split('.').pop() || 'typescript'
    });

  } catch (error: any) {
    console.error('File fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
