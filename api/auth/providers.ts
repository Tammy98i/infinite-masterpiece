import { BUILT_IN_ADMIN_EMAILS, mergeAdminEmails, supabaseEnv } from '../_lib/publicConfig.js';

type VercelReq = { method?: string };
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

export default function handler(_req: VercelReq, res: VercelRes) {
  try {
    const { url, anonKey } = supabaseEnv();
    const configured = Boolean(url && anonKey);
    res.status(200).json({
      local: false,
      supabase: configured,
      adminEmails: mergeAdminEmails(BUILT_IN_ADMIN_EMAILS, process.env.ADMIN_EMAILS, process.env.VITE_ADMIN_EMAILS),
      ...(configured ? { supabaseUrl: url, anonKey } : {}),
    });
  } catch {
    res.status(200).json({
      local: false,
      supabase: true,
      adminEmails: BUILT_IN_ADMIN_EMAILS,
    });
  }
}
