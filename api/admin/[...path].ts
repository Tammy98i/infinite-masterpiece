import { httpError, requireAdmin } from '../_lib/requireAdmin';
import {
  adminEmailsPayload,
  emptyAnalytics,
  emptyTracks,
  emptyWebinar,
  overviewFrom,
  readinessPayload,
  usersFromProfiles,
  WRITE_UNAVAILABLE,
} from '../_lib/adminDesk';
import { listProfiles, mergeCurrentUser, updateProfile } from '../_lib/profiles';
import { COURSES, CATEGORIES } from '../../src/data/initialData';
import { FOUNDERS } from '../../src/marketing/data/founders';

type VercelReq = {
  method?: string;
  url?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

function routeOf(req: VercelReq) {
  const raw = req.query?.path;
  if (Array.isArray(raw)) return raw.filter(Boolean).join('/');
  if (typeof raw === 'string' && raw) return raw.replace(/^\/+|\/+$/g, '');
  const url = String(req.url || '').split('?')[0];
  return url.replace(/^\/api\/admin\/?/, '').replace(/^\/+|\/+$/g, '');
}

function bodyOf(req: VercelReq) {
  const raw = req.body;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function json(res: VercelRes, status: number, body: unknown) {
  res.status(status).json(body);
}

export default async function handler(req: VercelReq, res: VercelRes) {
  const method = (req.method || 'GET').toUpperCase();
  if (method === 'OPTIONS') {
    json(res, 204, {});
    return;
  }

  try {
    const { token, user } = await requireAdmin(req);
    const route = routeOf(req);
    const profiles = mergeCurrentUser(await listProfiles(token), user);

    if (method === 'GET' && (route === 'overview' || route === '')) {
      json(res, 200, overviewFrom(profiles));
      return;
    }
    if (method === 'GET' && route === 'analytics') {
      json(res, 200, emptyAnalytics());
      return;
    }
    if (method === 'GET' && route === 'readiness') {
      json(res, 200, readinessPayload());
      return;
    }
    if (method === 'GET' && route === 'users') {
      json(res, 200, { users: usersFromProfiles(profiles) });
      return;
    }
    if (method === 'GET' && route === 'courses') {
      json(res, 200, { courses: COURSES });
      return;
    }
    if (method === 'GET' && route === 'categories') {
      json(res, 200, { categories: CATEGORIES });
      return;
    }
    if (method === 'GET' && route === 'founders') {
      json(res, 200, {
        founders: FOUNDERS.map((founder) => ({
          id: founder.id,
          name: founder.name,
          title: founder.title,
          avatarUrl: founder.image,
          bio: founder.description,
          credentials: founder.expertise,
          isFounder: true,
          founderId: founder.id,
        })),
      });
      return;
    }
    if (method === 'GET' && route === 'admin-emails') {
      json(res, 200, adminEmailsPayload());
      return;
    }
    if (method === 'GET' && route === 'applications') {
      json(res, 200, { applications: [] });
      return;
    }
    if (method === 'GET' && route === 'payments') {
      json(res, 200, { payments: [] });
      return;
    }
    if (method === 'GET' && route === 'tracks') {
      json(res, 200, emptyTracks());
      return;
    }
    if (method === 'GET' && route === 'premium-88') {
      json(res, 200, { applications: [] });
      return;
    }
    if (method === 'GET' && route === 'audit-logs') {
      json(res, 200, { logs: [] });
      return;
    }
    if (method === 'GET' && route === 'leads') {
      json(res, 200, { leads: [] });
      return;
    }
    if (method === 'GET' && route === 'notifications') {
      json(res, 200, { notifications: [], counts: { total: 0, high: 0 } });
      return;
    }
    if (method === 'GET' && route === 'team-messages') {
      json(res, 200, { messages: [] });
      return;
    }
    if (method === 'GET' && route === 'raffles') {
      json(res, 200, { termsApproved: false, unassignedTickets: 0, raffles: [], tickets: [] });
      return;
    }
    if (method === 'GET' && route === 'webinar') {
      json(res, 200, emptyWebinar());
      return;
    }
    if (method === 'GET' && route === 'legal') {
      json(res, 200, { terms: '', privacy: '', raffle: '', raffleTermsApproved: false });
      return;
    }
    if (method === 'GET' && route === 'accessibility-reports') {
      json(res, 200, { reports: [] });
      return;
    }

    if (method === 'GET') {
      json(res, 404, { error: 'העמוד לא נמצא' });
      return;
    }

    const userMatch = route.match(/^users\/([^/]+)$/);
    if (method === 'PATCH' && userMatch) {
      const body = bodyOf(req);
      const updated = await updateProfile(token, decodeURIComponent(userMatch[1]), {
        role: typeof body.role === 'string' ? body.role : undefined,
        subscriptionPlan: typeof body.subscriptionPlan === 'string' ? body.subscriptionPlan : undefined,
        isFounder: typeof body.isFounder === 'boolean' ? body.isFounder : undefined,
        staffDesk: typeof body.staffDesk === 'string' ? body.staffDesk : undefined,
        staffStatus: typeof body.staffStatus === 'string' ? body.staffStatus : undefined,
        blocked: typeof body.blocked === 'boolean' ? body.blocked : undefined,
      });
      const row = updated || profiles.find((item) => item.id === userMatch[1]);
      json(res, 200, { user: usersFromProfiles(row ? [row] : [])[0] });
      return;
    }

    json(res, 501, { error: WRITE_UNAVAILABLE });
  } catch (err) {
    const { status, message } = httpError(err);
    json(res, status, { error: message });
  }
}
