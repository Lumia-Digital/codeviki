import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
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
    });

    if (!user.stripeCustomerId) {
      return NextResponse.json({ invoices: [] });
    }

    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 12,
    });

    return NextResponse.json({
      invoices: invoices.data.map((invoice: any) => ({
        id: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: invoice.status,
        date: new Date(invoice.created * 1000).toISOString(),
        pdf: invoice.invoice_pdf,
        number: invoice.number,
      })),
    });
  } catch (error: any) {
    console.error('Invoice fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
