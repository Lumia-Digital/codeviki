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

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        openaiKey: true,
        anthropicKey: true,
        googleKey: true,
        mistralKey: true,
        cohereKey: true,
        deepseekKey: true,
        subscriptionTier: true,
        usageProjects: true,
        usageApiCalls: true,
        autoGenEnabled: true,
        codeContextEnabled: true,
        apiScannerEnabled: true,
        pushNotificationsEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      name, 
      image,
      openaiKey, 
      anthropicKey, 
      googleKey, 
      mistralKey, 
      cohereKey, 
      deepseekKey,
      autoGenEnabled,
      codeContextEnabled,
      apiScannerEnabled,
      pushNotificationsEnabled
    } = body;

    const updatedUser = await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        name,
        image,
        openaiKey,
        anthropicKey,
        googleKey,
        mistralKey,
        cohereKey,
        deepseekKey,
        autoGenEnabled,
        codeContextEnabled,
        apiScannerEnabled,
        pushNotificationsEnabled,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
