import Stripe from 'stripe';
import { verifyStripeEvent } from '../_lib/libraryCheckout.js';
import { updateProfile } from '../_lib/profiles.js';

type VercelReq = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

export const config = { api: { bodyParser: false } };

function header(req: VercelReq, name: string) {
  const value = req.headers[name] || req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value || '';
}

function rawBody(req: VercelReq) {
  if (typeof req.body === 'string') return req.body;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(req.body)) return req.body;
  return JSON.stringify(req.body || {});
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const event = verifyStripeEvent(rawBody(req), header(req, 'stripe-signature'));
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.kind === 'library') {
        const userId = String(session.metadata.userId || session.client_reference_id || '');
        const libraryPlan = session.metadata.libraryPlan === 'annual' ? 'annual' : 'monthly';
        if (userId) {
          await updateProfile('', userId, { subscriptionPlan: libraryPlan });
        }
      }
    }
    res.status(200).json({ received: true });
  } catch (err) {
    const status = (err as { status?: number }).status || 400;
    res.status(status).json({ error: (err as Error).message || 'webhook failed' });
  }
}
