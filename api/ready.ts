import { productionReadiness } from '../src/lib/productionReadiness.ts';

type VercelReq = { method?: string };
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

export default function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const readiness = productionReadiness();
  if (!readiness.ready) {
    res.status(503).json({ status: 'not_ready', missing: readiness.missing, warnings: readiness.warnings });
    return;
  }
  res.status(200).json({ status: 'ready', warnings: readiness.warnings });
}
