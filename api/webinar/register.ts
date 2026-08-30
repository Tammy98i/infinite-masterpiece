import { parseClientKey, readJson, registerWebinar } from '../_lib/webinarStore.js';

type VercelReq = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method === 'OPTIONS') {
    res.status(204).json({});
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const body = readJson(req);
    const registration = await registerWebinar(
      {
        fullName: String(body.fullName || ''),
        phone: String(body.phone || ''),
        email: String(body.email || ''),
        marketingOptIn: Boolean(body.marketingOptIn),
        abVariant: String(body.abVariant || ''),
        utmSource: String(body.utmSource || ''),
        utmMedium: String(body.utmMedium || ''),
        utmCampaign: String(body.utmCampaign || ''),
        utmTerm: String(body.utmTerm || ''),
        utmContent: String(body.utmContent || ''),
        gclid: String(body.gclid || ''),
        fbclid: String(body.fbclid || ''),
        landingPage: String(body.landingPage || ''),
        referrer: String(body.referrer || ''),
        website: String(body.website || ''),
      },
      parseClientKey(req)
    );
    res.status(200).json({ ok: true, registration });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message || 'ההרשמה נכשלה' });
  }
}
