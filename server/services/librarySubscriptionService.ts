import { getDb } from '../db/connection.js';
import { updateSubscription } from './authService.js';
import { recordPayment } from './paymentService.js';
import { trackEvent } from './analyticsService.js';

export type LibraryPaidPlan = 'monthly' | 'annual';

export function setStripeBilling(
  userId: string,
  input: { customerId?: string; subscriptionId?: string | null }
) {
  const db = getDb();
  const row = db.prepare(`SELECT stripe_customer_id, stripe_subscription_id FROM users WHERE id = ?`).get(
    userId
  ) as { stripe_customer_id?: string; stripe_subscription_id?: string } | undefined;
  if (!row) return;

  const customerId = input.customerId || row.stripe_customer_id || null;
  const subscriptionId =
    input.subscriptionId === undefined ? row.stripe_subscription_id || null : input.subscriptionId;

  db.prepare(`UPDATE users SET stripe_customer_id = ?, stripe_subscription_id = ? WHERE id = ?`).run(
    customerId,
    subscriptionId,
    userId
  );
}

export function findUserIdByStripeSubscription(subscriptionId: string) {
  const row = getDb()
    .prepare(`SELECT id FROM users WHERE stripe_subscription_id = ?`)
    .get(subscriptionId) as { id: string } | undefined;
  return row?.id || null;
}

export function findUserIdByStripeCustomer(customerId: string) {
  const row = getDb()
    .prepare(`SELECT id FROM users WHERE stripe_customer_id = ?`)
    .get(customerId) as { id: string } | undefined;
  return row?.id || null;
}

export function getStripeSubscriptionId(userId: string) {
  const row = getDb()
    .prepare(`SELECT stripe_subscription_id FROM users WHERE id = ?`)
    .get(userId) as { stripe_subscription_id?: string } | undefined;
  return row?.stripe_subscription_id || '';
}

export function fulfillLibrarySubscription(input: {
  userId: string;
  plan: LibraryPaidPlan;
  customerId?: string;
  subscriptionId?: string;
  transactionId?: string;
}) {
  const row = getDb().prepare(`SELECT id FROM users WHERE id = ?`).get(input.userId) as
    | { id: string }
    | undefined;
  if (!row) return null;

  const user = updateSubscription(input.userId, input.plan);
  setStripeBilling(input.userId, {
    customerId: input.customerId,
    subscriptionId: input.subscriptionId,
  });
  recordPayment(input.userId, input.plan, 'stripe');
  trackEvent('checkout_completed', {
    userId: input.userId,
    properties: { plan: input.plan, product: 'library_membership' },
  });
  trackEvent('subscription_started', {
    userId: input.userId,
    properties: { plan: input.plan, product: 'library_membership' },
  });
  return user;
}

export function revokeLibrarySubscription(userId: string) {
  setStripeBilling(userId, { subscriptionId: null });
  const user = updateSubscription(userId, 'none');
  trackEvent('subscription_cancelled', {
    userId,
    properties: { product: 'library_membership' },
  });
  return user;
}
