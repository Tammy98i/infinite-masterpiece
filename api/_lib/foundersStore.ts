import { randomUUID } from 'node:crypto';
import { supabaseRest } from './supabaseAdmin.js';
import { FOUNDERS } from './staticData.js';

export type TeamFounderRow = {
  id: string;
  founder_id: string;
  profile_id?: string | null;
  name: string;
  title: string;
  bio: string;
  avatar_url: string;
  credentials?: unknown;
  external_links?: Array<{ label: string; url: string }>;
  sort_order: number;
};

function isStockPhoto(url: string) {
  const value = url.toLowerCase();
  return !value || value.includes('unsplash.com') || value.includes('placeholder');
}

function staticFounders() {
  return FOUNDERS.map((founder, index) => ({
    id: founder.id,
    founderId: founder.id,
    name: founder.name,
    title: founder.title,
    avatarUrl: founder.image,
    bio: founder.description,
    credentials: founder.expertise,
    isFounder: true,
    externalLinks: [] as Array<{ label: string; url: string }>,
    sortOrder: index,
    source: 'static' as const,
  }));
}

function rowToFounder(row: TeamFounderRow) {
  const links = Array.isArray(row.external_links) ? row.external_links : [];
  const credentials = Array.isArray(row.credentials) ? (row.credentials as string[]) : [];
  return {
    id: row.id,
    founderId: row.founder_id,
    name: row.name,
    title: row.title,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    credentials,
    isFounder: true,
    externalLinks: links,
    sortOrder: row.sort_order,
    source: 'db' as const,
  };
}

export async function listTeamFounders() {
  const res = await supabaseRest<TeamFounderRow[]>(
    'team_founders?select=*&order=sort_order.asc,name.asc'
  );
  const dbRows = res.ok && Array.isArray(res.data) ? res.data.map(rowToFounder) : [];
  if (!dbRows.length) return staticFounders();
  const staticIds = new Set(dbRows.map((row) => row.founderId));
  const merged = [
    ...dbRows,
    ...staticFounders().filter((row) => !staticIds.has(row.founderId)),
  ];
  return merged.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'he'));
}

export async function createTeamFounder(input: {
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
  profileId?: string;
}) {
  const name = input.name.trim();
  const title = input.title.trim() || 'יזם';
  const bio = input.bio.trim() || title;
  const avatarUrl = input.avatarUrl.trim();
  if (!name) throw Object.assign(new Error('נא למלא שם'), { status: 400 });
  if (!avatarUrl) throw Object.assign(new Error('נא למלא תמונה (קישור או העלאה)'), { status: 400 });
  if (isStockPhoto(avatarUrl)) {
    throw Object.assign(new Error('נא להעלות תמונה אמיתית, לא תמונת מאגר'), { status: 400 });
  }

  const existing = await listTeamFounders();
  const maxSort = existing.reduce((max, row) => Math.max(max, row.sortOrder), 0);
  const id = `inst-${randomUUID().slice(0, 8)}`;
  const founderId = `founder-${randomUUID().slice(0, 8)}`;
  const row = {
    id,
    founder_id: founderId,
    profile_id: input.profileId || null,
    name,
    title,
    bio,
    avatar_url: avatarUrl,
    credentials: [],
    external_links: [],
    sort_order: maxSort + 1,
    updated_at: new Date().toISOString(),
  };
  const res = await supabaseRest<TeamFounderRow[]>('team_founders', {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    if (res.status === 404 || String(res.error || '').includes('team_founders')) {
      throw Object.assign(new Error('טבלת team_founders חסרה ב-Supabase. הריצו supabase/team.sql'), { status: 503 });
    }
    throw Object.assign(new Error(res.error || 'יצירת איש צוות נכשלה'), { status: res.status });
  }
  const saved = Array.isArray(res.data) ? res.data[0] : row;
  return rowToFounder(saved as TeamFounderRow);
}

export async function updateTeamFounder(
  id: string,
  patch: { avatarUrl?: string; externalLinks?: Array<{ label: string; url: string }> }
) {
  const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.avatarUrl !== undefined) body.avatar_url = String(patch.avatarUrl || '');
  if (patch.externalLinks !== undefined) {
    body.external_links = patch.externalLinks
      .map((item) => {
        const label = String(item.label || '').trim();
        const raw = String(item.url || '').trim();
        const url = /^https?:\/\//i.test(raw) ? raw : raw ? `https://${raw}` : '';
        return { label, url };
      })
      .filter((item) => item.label && item.url);
  }
  const res = await supabaseRest<TeamFounderRow[]>(`team_founders?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    prefer: 'return=representation',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw Object.assign(new Error(res.error || 'עדכון נכשל'), { status: res.status });
  const row = Array.isArray(res.data) ? res.data[0] : null;
  if (!row) throw Object.assign(new Error('איש הצוות לא נמצא'), { status: 404 });
  return rowToFounder(row);
}

export async function reorderTeamFounders(ids: string[]) {
  for (let index = 0; index < ids.length; index += 1) {
    await supabaseRest(`team_founders?id=eq.${encodeURIComponent(ids[index])}`, {
      method: 'PATCH',
      body: JSON.stringify({ sort_order: index, updated_at: new Date().toISOString() }),
    });
  }
  return listTeamFounders();
}

export async function syncFounderFromProfile(input: {
  profileId: string;
  name: string;
  isFounder: boolean;
}) {
  if (!input.isFounder) return null;
  const res = await supabaseRest<TeamFounderRow[]>(
    `team_founders?profile_id=eq.${encodeURIComponent(input.profileId)}&select=*&limit=1`
  );
  if (res.ok && Array.isArray(res.data) && res.data[0]) return rowToFounder(res.data[0]);
  return null;
}
