import { jsonBody } from '../_lib/body.js';
import { bearer, sessionFromAccessToken } from '../_lib/session.js';
import { createVercelLibrarySession } from '../_lib/libraryCheckout.js';

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
  const token = bearer(req);
  if (!token) {
    res.status(401).json({ error: 'יש להתחבר מחדש' });
    return;
  }
  try {
    const session = await sessionFromAccessToken(token);
    const body = jsonBody(req);
    const result = await createVercelLibrarySession({
      userId: session.user.id,
      email: session.user.email,
      plan: String(body.plan || ''),
    });
    res.status(200).json(result);
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message || 'לא ניתן לפתוח תשלום' });
  }
}
