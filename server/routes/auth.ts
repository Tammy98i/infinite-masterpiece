import { Router } from 'express';
import {
  loginUser,
  logoutToken,
  registerUser,
  updateInterests,
  updateSubscription,
  userFromToken,
  type DbPlan,
} from '../services/authService.js';
import { syncSupabaseSession, isSupabaseAuthConfigured } from '../services/supabaseAuthService.js';
import { trackEvent } from '../services/analyticsService.js';
import { recordPayment } from '../services/paymentService.js';

const router = Router();

router.get('/providers', (_req, res) => {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  res.json({
    local: true,
    supabase: isSupabaseAuthConfigured(),
    ...(url && anonKey ? { supabaseUrl: url, anonKey } : {}),
  });
});

router.post('/supabase', async (req, res) => {
  try {
    const accessToken = String(req.body?.accessToken || '');
    const fullName = String(req.body?.fullName || '');
    if (!accessToken) {
      res.status(400).json({ error: 'חסר טוקן התחברות' });
      return;
    }
    const result = await syncSupabaseSession(accessToken, fullName);
    res.json(result);
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

function bearer(req: { headers: { authorization?: string } }) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : undefined;
}

router.post('/register', (req, res) => {
  try {
    const { fullName, email, password, referredByLecturerId } = req.body ?? {};
    const result = registerUser(
      String(fullName || ''),
      String(email || ''),
      String(password || ''),
      String(referredByLecturerId || '')
    );
    res.status(201).json(result);
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    const result = loginUser(String(email || ''), String(password || ''));
    res.json(result);
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.post('/logout', (req, res) => {
  logoutToken(bearer(req));
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const user = userFromToken(bearer(req));
  if (!user) {
    res.status(401).json({ error: 'יש להתחבר מחדש' });
    return;
  }
  res.json({ user });
});

router.patch('/subscription', (req, res) => {
  const user = userFromToken(bearer(req));
  if (!user) {
    res.status(401).json({ error: 'יש להתחבר מחדש' });
    return;
  }
  const plan = String(req.body?.plan || '') as DbPlan;
  if (!['none', 'free_trial', 'monthly', 'annual', 'premium_88'].includes(plan)) {
    res.status(400).json({ error: 'תוכנית לא תקינה' });
    return;
  }
  const trialEndsAt = typeof req.body?.trialEndsAt === 'string' ? req.body.trialEndsAt : undefined;
  const next = updateSubscription(user.id, plan, trialEndsAt);
  if (plan !== 'none') {
    recordPayment(user.id, plan, 'user');
  }
  if (plan === 'free_trial') {
    trackEvent('trial_started', { userId: user.id, properties: { plan } });
  } else if (plan === 'none') {
    trackEvent('subscription_cancelled', { userId: user.id });
  } else {
    trackEvent('subscription_started', { userId: user.id, properties: { plan } });
  }
  res.json({ user: next });
});

router.patch('/interests', (req, res) => {
  const user = userFromToken(bearer(req));
  if (!user) {
    res.status(401).json({ error: 'יש להתחבר מחדש' });
    return;
  }
  const interests = Array.isArray(req.body?.interests) ? req.body.interests.map(String) : [];
  updateInterests(user.id, interests);
  res.json({ ok: true });
});

export default router;
