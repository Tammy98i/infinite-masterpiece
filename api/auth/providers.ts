import { supabaseEnv } from '../_lib/session';

type VercelReq = { method?: string };
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

export default function handler(_req: VercelReq, res: VercelRes) {
  const { url, anonKey } = supabaseEnv();
  const configured = Boolean(url && anonKey);
  res.status(200).json({
    local: false,
    supabase: configured,
    ...(configured ? { supabaseUrl: url, anonKey } : {}),
  });
}
