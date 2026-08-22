import Stripe from 'stripe';
import {
  amountWithVat,
  BRAVE_PRICE_BEFORE_VAT,
  HESITANT_INSTALLMENTS,
  toAgorot,
  type EntryTrackId,
} from '../../src/data/entryTracks.ts';
import {
  fulfillPaidCheckout,
  getLeadForCheckout,
  getPlanForLead,
  listDueInstallments,
  markInstallmentStatus,
} from './trackService.js';

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

export async function handleStripeWebhook(rawBody: Buffer, signature: string | undefined) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isStripeEnabled() || !secret) {
    throw Object.assign(new Error('Webhook לא מוגדר'), { status: 503 });
  }
  if (!signature) throw Object.assign(new Error('חסרה חתימה'), { status: 400 });

  const event = stripeClient().webhooks.constructEvent(rawBody, signature, secret);

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
