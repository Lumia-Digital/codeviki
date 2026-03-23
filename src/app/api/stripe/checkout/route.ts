import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, createCheckoutSession } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier, interval } = await req.json();

    let priceId = '';
    if (tier === 'pro') {
      priceId = interval === 'year' 
        ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID! 
        : process.env.STRIPE_PRO_PRICE_ID!;
    } else if (tier === 'enterprise') {
      priceId = interval === 'year'
        ? process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID!
        : process.env.STRIPE_ENTERPRISE_PRICE_ID!;
    }

    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const user = await (prisma.user as any).findUnique({
      where: { id: userId },
    });

    const checkoutSession = await createCheckoutSession({
      customerId: user.stripeCustomerId || undefined,
      userEmail: user.email,
      priceId: priceId,
      successUrl: `${process.env.NEXTAUTH_URL}/settings/billing?success=true`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/settings/billing?canceled=true`,
      metadata: {
        userId: userId,
        tier: tier,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
