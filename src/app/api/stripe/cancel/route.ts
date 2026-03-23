import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cancel } = await req.json(); // true to cancel, false to reactive

    const userId = (session.user as any).id;
    const user = await (prisma.user as any).findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true }
    });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Update Stripe subscription
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: cancel,
    });

    // Update local database immediately
    await (prisma.user as any).update({
      where: { id: userId },
      data: {
        stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
      }
    });

    console.log(`✅ Subscription ${cancel ? 'cancelled' : 'reactivated'} for user ${userId}`);

    return NextResponse.json({ 
      success: true, 
      cancelAtPeriodEnd: subscription.cancel_at_period_end 
    });
  } catch (error: any) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
