import { getPublicConfig } from '../_lib/webinarStore.js';
import { DEFAULT_WEBINAR_CONFIG } from '../_lib/staticData.js';

type VercelReq = { method?: string; query?: Record<string, string | string[] | undefined> };
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const raw = req.query?.abVariant;
    const abVariant = Array.isArray(raw) ? raw[0] : raw;
    const payload = await getPublicConfig(abVariant);
    res.status(200).json(payload);
  } catch {
    res.status(200).json({
      config: DEFAULT_WEBINAR_CONFIG,
      registrationCount: 0,
      completeCount: 0,
      spotsRemaining: null,
      isWaitlist: false,
      abVariant: 'a',
      activeHeadline: DEFAULT_WEBINAR_CONFIG.heroHeadline,
      supabase: false,
      zoom: false,
      email: false,
    });
  }
}
