import { supabaseEnv } from '../_lib/session';
import { BUILT_IN_ADMIN_EMAILS, mergeAdminEmails } from '../../src/data/adminEmails';

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
    adminEmails: mergeAdminEmails(BUILT_IN_ADMIN_EMAILS, process.env.ADMIN_EMAILS, process.env.VITE_ADMIN_EMAILS),
    ...(configured ? { supabaseUrl: url, anonKey } : {}),
  });
}
