const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setup() {
  console.log('Creating Annual Stripe prices...');

  try {
    // Pro Plan - Annual
    const proProducts = await stripe.products.list({ limit: 10 });
    const proProduct = proProducts.data.find(p => p.name === 'CodeWiki Pro');
    
    if (!proProduct) throw new Error('Pro Product not found');

    const proPriceAnnual = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 19000, // $190.00 (discounted from $19*12=$228)
      currency: 'usd',
      recurring: { interval: 'year' },
    });

    console.log(`STRIPE_PRO_ANNUAL_PRICE_ID=${proPriceAnnual.id}`);

    // Enterprise Plan - Annual
    const enterpriseProduct = proProducts.data.find(p => p.name === 'CodeWiki Enterprise');
    
    if (!enterpriseProduct) throw new Error('Enterprise Product not found');

    const enterprisePriceAnnual = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 49000, // $490.00 (discounted from $49*12=$588)
      currency: 'usd',
      recurring: { interval: 'year' },
    });

    console.log(`STRIPE_ENTERPRISE_ANNUAL_PRICE_ID=${enterprisePriceAnnual.id}`);

  } catch (error) {
    console.error('Error creating Stripe resources:', error);
    process.exit(1);
  }
}

setup();
