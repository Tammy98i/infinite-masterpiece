import type { Request, Response, NextFunction } from 'express';
import type { AuthUser } from '../services/authService.js';
import { userFromBearer } from '../services/supabaseAuthService.js';
import { STAFF_DESK_TABS } from '../../src/data/staffDesks.ts';
import type { Tab } from '../../src/views/admin/adminNav.ts';

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

/**
 * Entry gate for /api/admin/*: lets a full admin OR a desk-tagged staff
 * member through. Which admin *screens* the staff member can actually use
 * is decided per-route by requireAdminTab below — this only decides who
 * gets past the front door.
 */
export function requireAdminOrDesk(req: Request, res: Response, next: NextFunction) {
  void userFromBearer(bearer(req))
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: 'יש להתחבר מחדש' });
        return;
      }
      if (user.role !== 'admin' && !user.staffDesk) {
        res.status(403).json({ error: 'אין הרשאת ניהול' });
        return;
      }
      (req as Request & { authUser: AuthUser }).authUser = user;
      next();
    })
    .catch(next);
}

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Per-route gate for /api/admin/* screens. Must run after
 * requireAdminOrDesk. A full admin (role === 'admin') always passes.
 * A desk-tagged staff member only passes for read requests (GET/HEAD) on a
 * tab their desk is allowed to see (STAFF_DESK_TABS) — every write is
 * admin-only, on every tab, regardless of desk. Pass every tab id a route
 * belongs to when more than one admin screen shares it (e.g. /users backs
 * both the "Users" and "Team" screens).
 */
export function requireAdminTab(...tabs: Tab[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = authUser(req);
    if (user.role === 'admin') {
      next();
      return;
    }
    if (WRITE_METHODS.has(req.method)) {
      res.status(403).json({ error: 'רק אדמין ראשי יכול לבצע שינוי כאן' });
      return;
    }
    const allowed = user.staffDesk ? STAFF_DESK_TABS[user.staffDesk] : undefined;
    if (!allowed || !tabs.some((tab) => allowed.includes(tab))) {
      res.status(403).json({ error: 'הדסק שלך לא כולל גישה למסך הזה' });
      return;
    }
    next();
  };
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
