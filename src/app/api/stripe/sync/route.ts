import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const user = await (prisma.user as any).findUnique({
      where: { id: userId },
    });

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      // Look up customer by email if ID is missing
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      
      if (customers.data.length === 0) {
        return NextResponse.json({ message: 'No Stripe customer found', synced: false });
      }
      
      customerId = customers.data[0].id;
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      await (prisma.user as any).update({
        where: { id: userId },
        data: {
          subscriptionTier: 'free',
          stripeCustomerId: customerId,
        },
      });
      return NextResponse.json({ message: 'No active subscription found', synced: true, tier: 'free' });
    }

    const subscription = subscriptions.data[0] as any;
    const priceId = subscription.items.data[0].price.id;

    // Log the raw value for debugging
    console.log('🔍 Sync - subscription object:', JSON.stringify({
      id: subscription.id,
      current_period_end: subscription.current_period_end,
      current_period_end_type: typeof subscription.current_period_end,
    }));

    let tier = 'free';
    if (priceId === process.env.STRIPE_PRO_PRICE_ID || priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID) tier = 'pro';
    if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID || priceId === process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID) tier = 'enterprise';

    // Safe date: handle number, string-number, or null
    let periodEnd: Date | null = null;
    const rawEnd = subscription.current_period_end;
    if (rawEnd) {
      const ts = typeof rawEnd === 'number' ? rawEnd : parseInt(String(rawEnd), 10);
      if (!isNaN(ts) && ts > 0) {
        periodEnd = new Date(ts * 1000);
      }
    }

    console.log(`✅ Sync - Updating user ${userId} to tier ${tier}, periodEnd: ${periodEnd}`);

    const updateData: any = {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      stripePriceId: priceId,
      subscriptionTier: tier,
      stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
    };

    // Only set the date if it's valid
    if (periodEnd && !isNaN(periodEnd.getTime())) {
      updateData.stripeCurrentPeriodEnd = periodEnd;
    }

    await (prisma.user as any).update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ message: 'Protocol synchronized', synced: true, tier });
  } catch (error: any) {
    console.error('Subscription sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
