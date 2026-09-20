import type { NextFunction, Request, Response } from 'express';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

export function authRateLimit(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  if (attempts.size > 10_000) {
    for (const [key, value] of attempts) {
      if (value.resetAt <= now) attempts.delete(key);
    }
  }
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const current = attempts.get(key);
  const entry = !current || current.resetAt <= now ? { count: 0, resetAt: now + WINDOW_MS } : current;
  entry.count += 1;
  attempts.set(key, entry);

  res.setHeader('RateLimit-Limit', String(MAX_ATTEMPTS));
  res.setHeader('RateLimit-Remaining', String(Math.max(0, MAX_ATTEMPTS - entry.count)));
  res.setHeader('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

  if (entry.count > MAX_ATTEMPTS) {
    res.status(429).json({ error: 'יותר מדי ניסיונות התחברות. נסו שוב מאוחר יותר.' });
    return;
  }
  next();
}
