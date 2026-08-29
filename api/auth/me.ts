import { bearer, sessionFromAccessToken, supabaseEnv } from '../_lib/session.js';

type VercelReq = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};

type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = bearer(req);
  if (!token) {
    res.status(401).json({ error: 'יש להתחבר מחדש' });
    return;
  }

  if (!supabaseEnv().url) {
    res.status(503).json({ error: 'התחברות חיצונית אינה מוגדרת בשרת' });
    return;
  }

  try {
    const result = await sessionFromAccessToken(token);
    res.status(200).json({ user: result.user });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
}
