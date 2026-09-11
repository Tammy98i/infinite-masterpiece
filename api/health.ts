import { isPreviewAuthEnabled } from './_lib/previewAuthEnabled.js';

type VercelReq = { method?: string };
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

function configured(...keys: string[]) {
  return keys.some((key) => Boolean(String(process.env[key] || '').trim()));
}

export default function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.status(200).json({
    status: 'ok',
    service: 'infinite-masterpiece-vercel',
    env: process.env.NODE_ENV || 'development',
    previewAuth: isPreviewAuthEnabled(),
    stripe: configured('STRIPE_SECRET_KEY'),
    supabase: configured('SUPABASE_URL', 'VITE_SUPABASE_URL'),
    resend: configured('RESEND_API_KEY'),
    zoom: configured('ZOOM_ACCOUNT_ID') && configured('ZOOM_CLIENT_ID'),
  });
}
