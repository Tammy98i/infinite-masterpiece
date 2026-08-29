import { bearer, sessionFromAccessToken, type SessionUser } from './session';

type VercelReq = {
  headers: Record<string, string | string[] | undefined>;
};

export async function requireAdmin(req: VercelReq) {
  const token = bearer(req);
  if (!token) {
    throw Object.assign(new Error('יש להתחבר מחדש'), { status: 401 });
  }
  const { user } = await sessionFromAccessToken(token);
  if (user.role !== 'admin') {
    throw Object.assign(new Error('אין הרשאת ניהול'), { status: 403 });
  }
  return { token, user };
}

export function httpError(err: unknown) {
  const status = (err as { status?: number }).status || 500;
  const message = err instanceof Error ? err.message : 'הבקשה נכשלה';
  return { status, message };
}

export type { SessionUser };
