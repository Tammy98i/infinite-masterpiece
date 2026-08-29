import { jsonBody } from './_lib/body.js';

type VercelReq = { method?: string; body?: unknown };
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

export default function handler(req: VercelReq, res: VercelRes) {
  const method = (req.method || 'GET').toUpperCase();
  if (method === 'OPTIONS') {
    res.status(204).json({});
    return;
  }
  if (method === 'PUT') {
    jsonBody(req);
    res.status(200).json({ ok: true });
    return;
  }
  res.status(200).json({ progress: [] });
}
