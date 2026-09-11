import { libraryCheckoutPublicStatus } from '../_lib/libraryCheckout.js';

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
  res.status(200).json({
    enabled: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    library: libraryCheckoutPublicStatus(),
  });
}
