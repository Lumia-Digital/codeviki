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

    const userId = (session.user as any).id;
    const user = await (prisma.user as any).findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        usageProjects: true,
        usageApiCalls: true,
        stripeCurrentPeriodEnd: true,
        stripeCancelAtPeriodEnd: true,
        name: true,
        image: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Tier limits for convenience
    const tierLimits: Record<string, { projects: number; apiCalls: number }> = {
      free: { projects: 3, apiCalls: 1000 },
      pro: { projects: 15, apiCalls: 50000 },
      enterprise: { projects: 999999, apiCalls: 500000 },
    };
    
    const tierKey = (user.subscriptionTier as string || 'free').toLowerCase();
    const limits = (tierLimits as any)[tierKey] || tierLimits.free;

    return NextResponse.json({
      tier: user.subscriptionTier,
      usage: {
        projects: user.usageProjects,
        apiCalls: user.usageApiCalls,
      },
      limits: limits,
      stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
      stripeCancelAtPeriodEnd: user.stripeCancelAtPeriodEnd,
      user: {
        name: user.name,
        image: user.image,
      }
    });
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
