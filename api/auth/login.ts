import { previewLogin as matchPreview } from '../../src/lib/previewAuth';

type VercelReq = {
  method?: string;
  body?: { email?: string; password?: string };
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
    const result = matchPreview(String(req.body?.email || ''), String(req.body?.password || ''));
    res.status(200).json(result);
  } catch (err) {
    res.status(401).json({ error: (err as Error).message || 'אימייל או סיסמה שגויים' });
  }
}
