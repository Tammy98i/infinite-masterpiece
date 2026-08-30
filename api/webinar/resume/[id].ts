import { resumeRegistration } from '../../_lib/webinarStore.js';

type VercelReq = {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  url?: string;
};
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

function idOf(req: VercelReq) {
  const raw = req.query?.id;
  if (typeof raw === 'string' && raw) return raw;
  if (Array.isArray(raw) && raw[0]) return raw[0];
  const url = String(req.url || '');
  const match = url.match(/\/resume\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const registration = await resumeRegistration(idOf(req));
    res.status(200).json({ ok: true, registration });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message || 'טעינה נכשלה' });
  }
}
