import Stripe from 'stripe';
import { amountWithVat, toAgorot } from '../../src/data/entryTracks.ts';
import { isLibraryPaidPricingReady, libraryPlanAmountBeforeVat } from '../../src/constants/libraryPlans.ts';

export function publicAppUrl() {
  const fromEnv = String(process.env.APP_URL || process.env.VITE_APP_URL || '').trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${String(process.env.VERCEL_URL).replace(/^https?:\/\//, '')}`;
  return 'http://localhost:3000';
}

export function libraryCheckoutPublicStatus() {
  const monthly = libraryPlanAmountBeforeVat('monthly');
  const annual = libraryPlanAmountBeforeVat('annual');
  return {
    enabled: Boolean(process.env.STRIPE_SECRET_KEY?.trim()) && isLibraryPaidPricingReady(),
    monthlyBeforeVat: monthly || null,
    annualBeforeVat: annual || null,
  };
}

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw Object.assign(new Error('תשלום בכרטיס עדיין לא מחובר'), { status: 503 });
  return new Stripe(key);
}

export async function createVercelLibrarySession(input: { userId: string; email: string; plan: string }) {
  const status = libraryCheckoutPublicStatus();
  if (!status.enabled) {
    throw Object.assign(new Error('סליקת מנוי ספרייה עדיין לא מחוברת'), { status: 503 });
  }
  const plan = input.plan === 'annual' ? 'annual' : input.plan === 'monthly' ? 'monthly' : '';
  if (!plan) throw Object.assign(new Error('תוכנית מנוי לא תקינה'), { status: 400 });
  const email = String(input.email || '').trim().toLowerCase();
  if (!email) throw Object.assign(new Error('חסר אימייל'), { status: 400 });

  const beforeVat = libraryPlanAmountBeforeVat(plan);
  const withVat = amountWithVat(beforeVat);
  const productName = plan === 'annual' ? 'מנוי ספרייה שנתי' : 'מנוי ספרייה חודשי';
  const origin = publicAppUrl();

  const session = await stripeClient().checkout.sessions.create({
    mode: 'subscription',
    locale: 'auto',
    customer_email: email,
    client_reference_id: input.userId,
    success_url: `${origin}/library?membership=success`,
    cancel_url: `${origin}/library-membership`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'ils',
          unit_amount: toAgorot(withVat),
          recurring: { interval: plan === 'annual' ? 'year' : 'month' },
          product_data: {
            name: productName,
            description: 'מנוי לצפייה בספרייה — נפרד ממסלול האמיצים / ההססנים',
          },
        },
      },
    ],
    metadata: { kind: 'library', userId: input.userId, libraryPlan: plan },
    subscription_data: {
      metadata: { kind: 'library', userId: input.userId, libraryPlan: plan },
    },
  });

  if (!session.url) throw Object.assign(new Error('לא נוצר קישור תשלום'), { status: 500 });
  return { url: session.url };
}

export function verifyStripeEvent(rawBody: string | Buffer, signature: string | undefined) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) throw Object.assign(new Error('Webhook לא מוגדר'), { status: 503 });
  if (!signature) throw Object.assign(new Error('חסרה חתימה'), { status: 400 });
  return stripeClient().webhooks.constructEvent(rawBody, signature, secret);
}
