import { jsonBody } from '../_lib/body';
import { sessionFromAccessToken } from '../_lib/session';

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
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = jsonBody(req);
  const accessToken = String(body.accessToken || '');
  const fullName = String(body.fullName || '');
  if (!accessToken) {
    res.status(400).json({ error: 'חסר טוקן התחברות' });
    return;
  }

  try {
    const result = await sessionFromAccessToken(accessToken, fullName);
    res.status(200).json(result);
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
}
