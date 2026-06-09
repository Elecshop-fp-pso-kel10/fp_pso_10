import Stripe from 'stripe';

// Lazy-initialize Stripe so it only instantiates at request time,
// not at build time when STRIPE_SECRET_KEY is unavailable in CI.
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  return new Stripe(key);
}