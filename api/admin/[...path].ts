import { httpError, requireAdmin } from '../_lib/requireAdmin.js';
import {
  adminEmailsPayload,
  emptyAnalytics,
  emptyTracks,
  overviewFrom,
  readinessPayload,
  usersFromProfiles,
  WRITE_UNAVAILABLE,
} from '../_lib/adminDesk.js';
import { listProfiles, mergeCurrentUser, createAdminUser, updateProfile } from '../_lib/profiles.js';
import { createTeamFounder, listTeamFounders, reorderTeamFounders, updateTeamFounder } from '../_lib/foundersStore.js';
import { createTeamMessage, listTeamMessages } from '../_lib/teamMessagesStore.js';
import { CATEGORIES, COURSES } from '../_lib/staticData.js';
import { webinarAdminPayload } from '../_lib/webinarAdmin.js';

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
      const founders = await listTeamFounders();
      json(res, 200, {
        founders: founders.map((founder) => ({
          id: founder.id,
          name: founder.name,
          title: founder.title,
          avatarUrl: founder.avatarUrl,
          bio: founder.bio,
          credentials: founder.credentials,
          isFounder: true,
          founderId: founder.founderId,
          externalLinks: founder.externalLinks || [],
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
      json(res, 200, { messages: await listTeamMessages() });
      return;
    }
    if (method === 'GET' && route === 'raffles') {
      json(res, 200, { termsApproved: false, unassignedTickets: 0, raffles: [], tickets: [] });
      return;
    }
    if (method === 'GET' && route === 'webinar') {
      json(res, 200, await webinarAdminPayload());
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
    if (method === 'POST' && route === 'users') {
      const body = bodyOf(req);
      const profile = await createAdminUser({
        fullName: String(body.fullName || body.name || ''),
        email: String(body.email || ''),
        password: String(body.password || ''),
        role: typeof body.role === 'string' ? body.role : undefined,
        isFounder: typeof body.isFounder === 'boolean' ? body.isFounder : undefined,
      });
      json(res, 201, { user: usersFromProfiles([profile])[0] });
      return;
    }
    if (method === 'POST' && route === 'founders') {
      const body = bodyOf(req);
      const founder = await createTeamFounder({
        name: String(body.name || ''),
        title: String(body.title || 'יזם'),
        bio: String(body.bio || ''),
        avatarUrl: String(body.avatarUrl || ''),
        profileId: typeof body.profileId === 'string' ? body.profileId : undefined,
      });
      json(res, 201, {
        founder: {
          id: founder.id,
          name: founder.name,
          title: founder.title,
          avatarUrl: founder.avatarUrl,
          bio: founder.bio,
          credentials: founder.credentials,
          isFounder: true,
          founderId: founder.founderId,
          externalLinks: founder.externalLinks || [],
        },
      });
      return;
    }
    if (method === 'PATCH' && route === 'founders/order') {
      const body = bodyOf(req);
      const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
      const founders = await reorderTeamFounders(ids);
      json(res, 200, {
        founders: founders.map((founder) => ({
          id: founder.id,
          name: founder.name,
          title: founder.title,
          avatarUrl: founder.avatarUrl,
          bio: founder.bio,
          credentials: founder.credentials,
          isFounder: true,
          founderId: founder.founderId,
          externalLinks: founder.externalLinks || [],
        })),
      });
      return;
    }
    const founderMatch = route.match(/^founders\/([^/]+)$/);
    if (method === 'PATCH' && founderMatch) {
      const body = bodyOf(req);
      const founder = await updateTeamFounder(decodeURIComponent(founderMatch[1]), {
        avatarUrl: typeof body.avatarUrl === 'string' ? body.avatarUrl : undefined,
        externalLinks: Array.isArray(body.externalLinks)
          ? (body.externalLinks as Array<{ label: string; url: string }>)
          : undefined,
      });
      json(res, 200, {
        founder: {
          id: founder.id,
          name: founder.name,
          title: founder.title,
          avatarUrl: founder.avatarUrl,
          bio: founder.bio,
          credentials: founder.credentials,
          isFounder: true,
          founderId: founder.founderId,
          externalLinks: founder.externalLinks || [],
        },
      });
      return;
    }
    if (method === 'POST' && route === 'team-messages') {
      const body = bodyOf(req);
      const message = await createTeamMessage({
        toUserId:
          typeof body.toUserId === 'string'
            ? body.toUserId
            : typeof body.lecturerUserId === 'string'
              ? body.lecturerUserId
              : undefined,
        subject: String(body.subject || ''),
        body: String(body.body || ''),
        createdBy: user.id,
      });
      json(res, 201, { message });
      return;
    }
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
