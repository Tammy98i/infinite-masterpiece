import Stripe from 'stripe';
import {
  amountWithVat,
  BRAVE_PRICE_BEFORE_VAT,
  HESITANT_INSTALLMENTS,
  toAgorot,
  type EntryTrackId,
} from '../../src/data/entryTracks.ts';
import {
  DEFAULT_LIBRARY_ANNUAL_BEFORE_VAT,
  DEFAULT_LIBRARY_MONTHLY_BEFORE_VAT,
  LIBRARY_PLANS,
  libraryPriceLabel,
  type LibraryPaidPlan,
} from '../../src/constants/libraryPlans.ts';
import {
  fulfillPaidCheckout,
  getLeadForCheckout,
  getPlanForLead,
  listDueInstallments,
  markInstallmentStatus,
} from './trackService.js';
import {
  findUserIdByStripeCustomer,
  findUserIdByStripeSubscription,
  fulfillLibrarySubscription,
  getStripeSubscriptionId,
  revokeLibrarySubscription,
} from './librarySubscriptionService.js';
import { trackEvent } from './analyticsService.js';
import type { AuthUser } from './authService.js';

function appUrl() {
  return String(process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function isStripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw Object.assign(new Error('תשלום בכרטיס עדיין לא מחובר'), { status: 503 });
  return new Stripe(key);
}

function envAmount(name: string, fallback: number) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function libraryPricing() {
  const monthlyBeforeVat = envAmount(
    'LIBRARY_MONTHLY_ILS_BEFORE_VAT',
    DEFAULT_LIBRARY_MONTHLY_BEFORE_VAT
  );
  const annualBeforeVat = envAmount(
    'LIBRARY_ANNUAL_ILS_BEFORE_VAT',
    DEFAULT_LIBRARY_ANNUAL_BEFORE_VAT
  );
  return {
    monthly: {
      beforeVat: monthlyBeforeVat,
      withVat: amountWithVat(monthlyBeforeVat),
      label: libraryPriceLabel(monthlyBeforeVat),
    },
    annual: {
      beforeVat: annualBeforeVat,
      withVat: amountWithVat(annualBeforeVat),
      label: libraryPriceLabel(annualBeforeVat),
    },
  };
}

export function checkoutStatus() {
  return {
    enabled: isStripeEnabled(),
    library: libraryPricing(),
  };
}

export async function createCheckoutSession(input: {
  leadId: string;
  email: string;
  fullName: string;
  track: string;
}) {
  if (!isStripeEnabled()) {
    throw Object.assign(new Error('תשלום בכרטיס עדיין לא מחובר'), { status: 503 });
  }

  const lead = getLeadForCheckout(String(input.leadId || ''));
  if (!lead) throw Object.assign(new Error('הפנייה לא נמצאה'), { status: 404 });

  const email = String(input.email || '').trim().toLowerCase();
  if (!email || email !== lead.email.toLowerCase()) {
    throw Object.assign(new Error('האימייל לא תואם לפנייה'), { status: 400 });
  }

  const track: EntryTrackId = lead.trackType === 'brave' ? 'brave' : 'hesitant';
  const plan = getPlanForLead(lead.id);
  if (!plan) throw Object.assign(new Error('תוכנית תשלום לא נמצאה'), { status: 404 });

  const installmentNumber = 1;
  const beforeVat = track === 'brave' ? BRAVE_PRICE_BEFORE_VAT : HESITANT_INSTALLMENTS[0].amountBeforeVat;
  const withVat = amountWithVat(beforeVat);
  const successPath = track === 'brave' ? '/thank-you-application?paid=1' : '/hesitation-success?paid=1';
  const cancelPath = track === 'brave' ? '/application?track=brave' : '/hesitation';
  const productName = track === 'brave' ? 'מסלול האמיצים' : 'מסלול ההססנים, פעימה ראשונה';

  const session = await stripeClient().checkout.sessions.create({
    mode: 'payment',
    locale: 'auto',
    customer_email: email,
    client_reference_id: lead.id,
    success_url: `${appUrl()}${successPath}`,
    cancel_url: `${appUrl()}${cancelPath}`,
    customer_creation: 'always',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'ils',
          unit_amount: toAgorot(withVat),
          product_data: { name: productName },
        },
      },
    ],
    payment_intent_data:
      track === 'hesitant' ? { setup_future_usage: 'off_session', description: productName } : { description: productName },
    metadata: {
      leadId: lead.id,
      planId: plan.id,
      track,
      installmentNumber: String(installmentNumber),
      fullName: String(input.fullName || lead.fullName).slice(0, 80),
    },
  });

  if (!session.url) throw Object.assign(new Error('לא נוצר קישור תשלום'), { status: 500 });
  return { url: session.url };
}

function libraryLineItem(plan: LibraryPaidPlan) {
  const configuredPrice =
    plan === 'monthly'
      ? process.env.LIBRARY_STRIPE_PRICE_MONTHLY?.trim()
      : process.env.LIBRARY_STRIPE_PRICE_ANNUAL?.trim();
  if (configuredPrice) {
    return [{ price: configuredPrice, quantity: 1 }];
  }

  const pricing = libraryPricing()[plan];
  const meta = LIBRARY_PLANS[plan];
  return [
    {
      quantity: 1,
      price_data: {
        currency: 'ils' as const,
        unit_amount: toAgorot(pricing.withVat),
        recurring: { interval: meta.interval },
        product_data: {
          name: `מנוי ספרייה · ${meta.title}`,
          description: 'גישה לספריית Infinite Masterpiece. נפרד ממסלול האמיצים / ההססנים.',
        },
      },
    },
  ];
}

export async function createLibraryCheckoutSession(user: AuthUser, plan: string) {
  if (!isStripeEnabled()) {
    throw Object.assign(new Error('תשלום בכרטיס עדיין לא מחובר'), { status: 503 });
  }
  if (plan !== 'monthly' && plan !== 'annual') {
    throw Object.assign(new Error('תוכנית מנוי לא תקינה'), { status: 400 });
  }
  if (!user.email || !user.email.includes('@')) {
    throw Object.assign(new Error('חסר אימייל בחשבון'), { status: 400 });
  }

  const paidPlan = plan as LibraryPaidPlan;
  trackEvent('checkout_started', {
    userId: user.id,
    properties: { plan: paidPlan, product: 'library_membership' },
  });

  const session = await stripeClient().checkout.sessions.create({
    mode: 'subscription',
    locale: 'auto',
    customer_email: user.email,
    client_reference_id: user.id,
    success_url: `${appUrl()}/library-membership?paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/library-membership?cancelled=1`,
    line_items: libraryLineItem(paidPlan),
    metadata: {
      product: 'library_membership',
      plan: paidPlan,
      userId: user.id,
    },
    subscription_data: {
      metadata: {
        product: 'library_membership',
        plan: paidPlan,
        userId: user.id,
      },
    },
  });

  if (!session.url) throw Object.assign(new Error('לא נוצר קישור תשלום'), { status: 500 });
  return { url: session.url };
}

function sessionUserId(session: Stripe.Checkout.Session) {
  return String(session.metadata?.userId || session.client_reference_id || '');
}

function fulfillFromLibrarySession(session: Stripe.Checkout.Session) {
  const userId = sessionUserId(session);
  const plan = session.metadata?.plan === 'annual' ? 'annual' : session.metadata?.plan === 'monthly' ? 'monthly' : null;
  if (!userId || !plan) return null;
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  return fulfillLibrarySubscription({
    userId,
    plan,
    customerId,
    subscriptionId,
    transactionId: session.id,
  });
}

export async function confirmLibraryCheckout(user: AuthUser, sessionId: string) {
  if (!isStripeEnabled()) {
    throw Object.assign(new Error('תשלום בכרטיס עדיין לא מחובר'), { status: 503 });
  }
  const id = sessionId.trim();
  if (!id.startsWith('cs_')) {
    throw Object.assign(new Error('מזהה תשלום לא תקין'), { status: 400 });
  }
  const session = await stripeClient().checkout.sessions.retrieve(id);
  if (session.metadata?.product !== 'library_membership') {
    throw Object.assign(new Error('זה אינו תשלום מנוי ספרייה'), { status: 400 });
  }
  if (sessionUserId(session) !== user.id) {
    throw Object.assign(new Error('התשלום אינו שייך לחשבון הזה'), { status: 403 });
  }
  if (session.status !== 'complete' && session.payment_status !== 'paid') {
    throw Object.assign(new Error('התשלום עדיין לא הושלם'), { status: 409 });
  }
  const next = fulfillFromLibrarySession(session);
  if (!next) throw Object.assign(new Error('לא ניתן לעדכן את המנוי'), { status: 500 });
  return { user: next };
}

export async function cancelLibraryStripeSubscription(userId: string) {
  const subscriptionId = getStripeSubscriptionId(userId);
  if (!subscriptionId || !isStripeEnabled()) return;
  try {
    await stripeClient().subscriptions.cancel(subscriptionId);
  } catch {
    /* local cancel must still proceed */
  }
}

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const raw = invoice as unknown as {
    subscription?: string | { id: string };
    parent?: { subscription_details?: { metadata?: { plan?: string }; subscription?: string } };
    subscription_details?: { metadata?: { plan?: string } };
  };
  if (typeof raw.subscription === 'string') return raw.subscription;
  if (raw.subscription && typeof raw.subscription === 'object') return raw.subscription.id;
  return String(raw.parent?.subscription_details?.subscription || '');
}

function invoiceLibraryPlan(invoice: Stripe.Invoice): LibraryPaidPlan {
  const raw = invoice as unknown as {
    parent?: { subscription_details?: { metadata?: { plan?: string } } };
    subscription_details?: { metadata?: { plan?: string } };
  };
  const plan =
    raw.subscription_details?.metadata?.plan || raw.parent?.subscription_details?.metadata?.plan;
  return plan === 'annual' ? 'annual' : 'monthly';
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string | undefined) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isStripeEnabled() || !secret) {
    throw Object.assign(new Error('Webhook לא מוגדר'), { status: 503 });
  }
  if (!signature) throw Object.assign(new Error('חסרה חתימה'), { status: 400 });

  const event = stripeClient().webhooks.constructEvent(rawBody, signature, secret);

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const userId =
      findUserIdByStripeSubscription(sub.id) ||
      String(sub.metadata?.userId || '') ||
      (typeof sub.customer === 'string' ? findUserIdByStripeCustomer(sub.customer) : null);
    if (userId) revokeLibrarySubscription(userId);
    return { received: true };
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice;
    if (invoice.billing_reason === 'subscription_cycle') {
      const subId = invoiceSubscriptionId(invoice);
      const userId = subId
        ? findUserIdByStripeSubscription(subId)
        : typeof invoice.customer === 'string'
          ? findUserIdByStripeCustomer(invoice.customer)
          : null;
      const plan = invoiceLibraryPlan(invoice);
      if (userId) {
        fulfillLibrarySubscription({
          userId,
          plan,
          customerId: typeof invoice.customer === 'string' ? invoice.customer : undefined,
          subscriptionId: subId || undefined,
          transactionId: invoice.id,
        });
      }
    }
    return { received: true };
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const leadId = String(pi.metadata?.leadId || '');
    const planId = String(pi.metadata?.planId || '');
    const track = pi.metadata?.track === 'brave' ? 'brave' : 'hesitant';
    const installmentNumber = Number(pi.metadata?.installmentNumber || 0);
    if (leadId && planId && installmentNumber > 1) {
      fulfillPaidCheckout({
        leadId,
        planId,
        track,
        installmentNumber,
        transactionId: pi.id,
        customerId: typeof pi.customer === 'string' ? pi.customer : pi.customer?.id,
        paymentMethodId: typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method?.id,
        email: pi.receipt_email || undefined,
      });
    }
    return { received: true };
  }

  if (event.type !== 'checkout.session.completed') return { received: true };

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.metadata?.product === 'library_membership') {
    fulfillFromLibrarySession(session);
    return { received: true };
  }

  const leadId = String(session.metadata?.leadId || session.client_reference_id || '');
  const planId = String(session.metadata?.planId || '');
  const track = session.metadata?.track === 'brave' ? 'brave' : 'hesitant';
  const installmentNumber = Number(session.metadata?.installmentNumber || 1);
  if (!leadId || !planId) return { received: true };

  const paymentIntent = session.payment_intent;
  const transactionId =
    typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id || session.id;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const email = session.customer_email || session.customer_details?.email || undefined;
  let paymentMethodId: string | undefined;
  if (typeof session.payment_intent === 'string' || session.payment_intent) {
    try {
      const pi = await stripeClient().paymentIntents.retrieve(
        typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id
      );
      paymentMethodId = typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method?.id;
      if (customerId && paymentMethodId) {
        await stripeClient().customers.update(customerId, {
          invoice_settings: { default_payment_method: paymentMethodId },
        });
      }
    } catch {
      /* method save must not block access */
    }
  }

  fulfillPaidCheckout({
    leadId,
    planId,
    track,
    installmentNumber: Number.isFinite(installmentNumber) ? installmentNumber : 1,
    transactionId,
    customerId,
    paymentMethodId,
    email,
  });

  return { received: true };
}

export async function processDueInstallments() {
  const due = listDueInstallments();
  if (due.length === 0) return { processed: 0, charged: 0, markedDue: 0, failed: 0 };

  let charged = 0;
  let markedDue = 0;
  let failed = 0;

  for (const item of due) {
    if (!isStripeEnabled() || !item.customerId || !item.paymentMethodId) {
      if (item.status !== 'due') markInstallmentStatus(item.installmentId, 'due');
      markedDue += 1;
      continue;
    }

    const productName = `מסלול ההססנים, פעימה ${item.installmentNumber}`;
    try {
      const pi = await stripeClient().paymentIntents.create({
        amount: toAgorot(amountWithVat(item.amountBeforeVat)),
        currency: 'ils',
        customer: item.customerId,
        payment_method: item.paymentMethodId,
        off_session: true,
        confirm: true,
        description: productName,
        receipt_email: item.email || undefined,
        metadata: {
          leadId: item.leadId,
          planId: item.planId,
          track: 'hesitant',
          installmentNumber: String(item.installmentNumber),
        },
      });
      fulfillPaidCheckout({
        leadId: item.leadId,
        planId: item.planId,
        track: 'hesitant',
        installmentNumber: item.installmentNumber,
        transactionId: pi.id,
        customerId: item.customerId,
        paymentMethodId: item.paymentMethodId,
        email: item.email,
      });
      charged += 1;
    } catch {
      markInstallmentStatus(item.installmentId, 'failed');
      failed += 1;
    }
  }

  return { processed: due.length, charged, markedDue, failed };
}
