import { lookupRegistration, readJson } from '../_lib/webinarStore.js';

type VercelReq = { method?: string; body?: unknown };
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const body = readJson(req);
    const registration = await lookupRegistration(String(body.email || ''));
    res.status(200).json({ ok: true, registration });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message || 'חיפוש נכשל' });
  }
}
