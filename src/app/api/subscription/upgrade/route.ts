import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier } = await req.json();

    if (!['free', 'pro', 'enterprise'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const updatedUser = await (prisma.user as any).update({
      where: { id: (session.user as any).id },
      data: {
        subscriptionTier: tier,
      },
    });

    return NextResponse.json({
      message: `Successfully upgraded to ${tier}`,
      tier: updatedUser.subscriptionTier,
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    return NextResponse.json({ error: 'Failed to upgrade subscription' }, { status: 500 });
  }
}
