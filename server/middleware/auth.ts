import type { Request, Response, NextFunction } from 'express';
import type { AuthUser } from '../services/authService.js';
import { userFromBearer } from '../services/supabaseAuthService.js';

export function bearer(req: { headers: { authorization?: string } }) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : undefined;
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  void userFromBearer(bearer(req))
    .then((user) => {
      if (user) (req as Request & { authUser: AuthUser }).authUser = user;
      next();
    })
    .catch(() => next());
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  void userFromBearer(bearer(req))
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: 'יש להתחבר מחדש' });
        return;
      }
      (req as Request & { authUser: AuthUser }).authUser = user;
      next();
    })
    .catch(next);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  void userFromBearer(bearer(req))
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: 'יש להתחבר מחדש' });
        return;
      }
      if (user.role !== 'admin') {
        res.status(403).json({ error: 'אין הרשאת ניהול' });
        return;
      }
      (req as Request & { authUser: AuthUser }).authUser = user;
      next();
    })
    .catch(next);
}

export function requireLecturer(req: Request, res: Response, next: NextFunction) {
  void userFromBearer(bearer(req))
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: 'יש להתחבר מחדש' });
        return;
      }
      if (user.role !== 'instructor' && user.role !== 'admin') {
        res.status(403).json({ error: 'אין הרשאת מרצה' });
        return;
      }
      (req as Request & { authUser: AuthUser }).authUser = user;
      next();
    })
    .catch(next);
}

export function authUser(req: Request) {
  return (req as Request & { authUser: AuthUser }).authUser;
}
