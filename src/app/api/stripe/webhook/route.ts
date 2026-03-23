import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// Safe date helper: handles number, string, undefined, null
function safeDate(rawTimestamp: any): Date | null {
  if (!rawTimestamp) return null;
  const ts = typeof rawTimestamp === 'number' ? rawTimestamp : parseInt(String(rawTimestamp), 10);
  if (isNaN(ts) || ts <= 0) return null;
  const date = new Date(ts * 1000);
  return isNaN(date.getTime()) ? null : date;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error('❌ Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  const session = event.data.object as any;
  console.log(`🔔 Webhook received: ${event.type}`, { id: session.id });

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.updated') {
      const subscriptionId = session.subscription || session.id;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId as string) as any;
      
      // Log raw data for debugging
      console.log('📦 Subscription data:', JSON.stringify({
        id: subscription.id,
        customer: subscription.customer,
        current_period_end: subscription.current_period_end,
        current_period_end_type: typeof subscription.current_period_end,
        priceId: subscription.items?.data?.[0]?.price?.id,
      }));

      let userId = session.metadata?.userId || subscription.metadata?.userId;
      
      if (!userId) {
        console.log('🔍 Lookup by customer ID:', subscription.customer);
        const user = await (prisma.user as any).findFirst({
          where: { stripeCustomerId: subscription.customer as string }
        });
        userId = user?.id;
      }

      if (!userId) {
        console.error('❌ User not found for subscription:', subscriptionId);
        return NextResponse.json({ error: 'User not found' }, { status: 400 });
      }

      const priceId = subscription.items.data[0].price.id;
      let tier = 'free';
      if (priceId === process.env.STRIPE_PRO_PRICE_ID || priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID) tier = 'pro';
      if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID || priceId === process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID) tier = 'enterprise';

      const periodEnd = safeDate(subscription.current_period_end);
      console.log(`✅ Updating user ${userId} to tier ${tier}, periodEnd: ${periodEnd}`);

      const updateData: any = {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: priceId,
        subscriptionTier: tier,
        usageApiCalls: 0,
        stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
      if (periodEnd) {
        updateData.stripeCurrentPeriodEnd = periodEnd;
      }

      await (prisma.user as any).update({
        where: { id: userId },
        data: updateData,
      });
    }

    if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.paid') {
      const invoice = session;
      const subscriptionId = invoice.subscription as string;
      
      console.log('💰 Payment succeeded for invoice:', invoice.id);

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
        
        const user = await (prisma.user as any).findFirst({
          where: {
            OR: [
              { stripeSubscriptionId: subscriptionId },
              { stripeCustomerId: invoice.customer as string }
            ]
          }
        });

        if (user) {
          const periodEnd = safeDate(subscription.current_period_end);
          console.log(`✅ Resetting API usage for user: ${user.id}`);

          const updateData: any = {
            stripePriceId: subscription.items.data[0].price.id,
            usageApiCalls: 0, 
            stripeSubscriptionId: subscriptionId,
          };
          if (periodEnd) {
            updateData.stripeCurrentPeriodEnd = periodEnd;
          }

          await (prisma.user as any).update({
            where: { id: user.id },
            data: updateData,
          });
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      console.log('❌ Subscription deleted:', session.id);
      await (prisma.user as any).update({
        where: { stripeSubscriptionId: session.id },
        data: {
          subscriptionTier: 'free',
          stripePriceId: null,
          stripeCurrentPeriodEnd: null,
          stripeCancelAtPeriodEnd: false,
        },
      });
    }
  } catch (error: any) {
    console.error(`❌ Webhook handler error for ${event.type}:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
