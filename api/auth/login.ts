import { jsonBody } from '../_lib/body.js';
import { previewLogin as matchPreview } from '../_lib/previewLogin.js';

type VercelReq = {
  method?: string;
  body?: unknown;
};

type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

export default function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const body = jsonBody(req);
    const result = matchPreview(String(body.email || ''), String(body.password || ''));
    res.status(200).json(result);
  } catch (err) {
    res.status(401).json({ error: (err as Error).message || 'אימייל או סיסמה שגויים' });
  }
}
