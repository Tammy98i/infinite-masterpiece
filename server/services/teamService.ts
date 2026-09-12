import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';
import { TEAM_SECTION_DEFAULTS, type TeamSectionSettings } from '../../src/constants/teamGalaxySeed.ts';

export interface TeamMember {
  id: string;
  slug: string;
  name: string;
  name_he: string;
  name_en: string;
  role: string;
  role_he: string;
  role_en: string;
  photo: string;
  photo_alt: string;
  quote: string;
  bio: string;
  contribution: string;
  vision: string;
  closing_quote: string;
  responsibilities: string[];
  expertise: string[];
  impact_score: number;
  hierarchy_level: string;
  group_key: string;
  visual_tier: string;
  featured: boolean;
  status: string;
  archived: boolean;
  orbit: number;
  active: boolean;
  display_order: number;
  professional_url: string;
}

type TeamMemberRow = Record<string, unknown>;

function str(row: TeamMemberRow, key: string, fallback = ''): string {
  const v = row[key];
  return typeof v === 'string' ? v : fallback;
}

function num(row: TeamMemberRow, key: string, fallback = 0): number {
  const v = row[key];
  return typeof v === 'number' ? v : Number(v) || fallback;
}

function cleanText(value: string) {
  return value.replace(/<[^>]*>/g, '').trim();
}

function rowToMember(row: TeamMemberRow): TeamMember {
  const name_he = str(row, 'name_he') || str(row, 'name');
  const name_en = str(row, 'name_en') || str(row, 'name');
  const role_he = str(row, 'role_he') || str(row, 'role');
  const role_en = str(row, 'role_en') || str(row, 'role');
  const group = str(row, 'group_key') || str(row, 'hierarchy_level') || 'core';
  const status = str(row, 'status') || (num(row, 'active', 1) === 1 ? 'published' : 'hidden');
  return {
    id: str(row, 'id'),
    slug: str(row, 'slug') || str(row, 'id'),
    name: name_he,
    name_he,
    name_en,
    role: role_en,
    role_he,
    role_en,
    photo: str(row, 'photo'),
    photo_alt: str(row, 'photo_alt'),
    quote: str(row, 'quote'),
    bio: str(row, 'bio'),
    contribution: str(row, 'contribution'),
    vision: str(row, 'vision'),
    closing_quote: str(row, 'closing_quote'),
    responsibilities: JSON.parse(str(row, 'responsibilities', '[]') || '[]'),
    expertise: JSON.parse(str(row, 'expertise', '[]') || '[]'),
    impact_score: num(row, 'impact_score', 50),
    hierarchy_level: str(row, 'hierarchy_level') || group,
    group_key: group,
    visual_tier: str(row, 'visual_tier') || 'medium',
    featured: num(row, 'featured', 1) === 1,
    status,
    archived: num(row, 'archived', 0) === 1,
    orbit: num(row, 'orbit', 2),
    active: status === 'published',
    display_order: num(row, 'display_order', 0),
    professional_url: str(row, 'professional_url'),
  };
}

export function listActiveTeamMembers(): TeamMember[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM team_members
       WHERE archived = 0 AND (status = 'published' OR (status IS NULL AND active = 1))
       ORDER BY display_order ASC, orbit ASC`,
    )
    .all() as TeamMemberRow[];
  return rows.map(rowToMember);
}

export function getTeamMember(id: string): TeamMember | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM team_members WHERE id = ?`).get(id) as TeamMemberRow | undefined;
  return row ? rowToMember(row) : null;
}

export function listAllTeamMembers(): TeamMember[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM team_members WHERE archived = 0 ORDER BY display_order ASC, orbit ASC`)
    .all() as TeamMemberRow[];
  return rows.map(rowToMember);
}

export interface TeamMemberInput {
  name?: string;
  name_he?: string;
  name_en?: string;
  role?: string;
  role_he?: string;
  role_en?: string;
  photo?: string;
  photo_alt?: string;
  quote?: string;
  bio?: string;
  contribution?: string;
  vision?: string;
  closing_quote?: string;
  responsibilities?: string[];
  expertise?: string[];
  impact_score?: number;
  hierarchy_level?: string;
  group_key?: string;
  visual_tier?: string;
  featured?: boolean;
  status?: string;
  archived?: boolean;
  orbit?: number;
  active?: boolean;
  display_order?: number;
  slug?: string;
  professional_url?: string;
}

type PersistShape = ReturnType<typeof mergeInput> & { archived?: boolean };

function persist(id: string, input: PersistShape) {
  const db = getDb();
  const name = input.name_he || input.name_en;
  const role = input.role_en || input.role_he;
  const active = input.status === 'published' ? 1 : 0;
  if (input.photo && !input.photo_alt) {
    throw new Error('טקסט חלופי לתמונה הוא שדה חובה');
  }
  db.prepare(`
    UPDATE team_members SET
      slug = ?, name = ?, name_he = ?, name_en = ?, role = ?, role_he = ?, role_en = ?,
      photo = ?, photo_alt = ?, quote = ?, bio = ?, contribution = ?, vision = ?, closing_quote = ?,
      responsibilities = ?, expertise = ?, impact_score = ?, hierarchy_level = ?, group_key = ?,
      visual_tier = ?, featured = ?, status = ?, archived = ?, orbit = ?, active = ?, display_order = ?,
      professional_url = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    input.slug, name, input.name_he, input.name_en, role, input.role_he, input.role_en,
    input.photo, input.photo_alt, input.quote, input.bio, input.contribution, input.vision, input.closing_quote,
    JSON.stringify(input.responsibilities), JSON.stringify(input.expertise), input.impact_score,
    input.hierarchy_level, input.group_key, input.visual_tier, input.featured ? 1 : 0, input.status,
    input.archived ? 1 : 0, input.orbit, active, input.display_order, input.professional_url, id,
  );
}

function mergeInput(existing: TeamMember | null, input: TeamMemberInput) {
  const name_he = cleanText(input.name_he ?? existing?.name_he ?? input.name ?? existing?.name ?? '');
  const name_en = cleanText(input.name_en ?? existing?.name_en ?? input.name ?? existing?.name ?? '');
  const role_he = cleanText(input.role_he ?? existing?.role_he ?? input.role ?? existing?.role ?? '');
  const role_en = cleanText(input.role_en ?? existing?.role_en ?? input.role ?? existing?.role ?? '');
  const group_key = input.group_key ?? existing?.group_key ?? input.hierarchy_level ?? 'core';
  const status = input.status ?? existing?.status ?? (input.active === false ? 'hidden' : 'published');
  return {
    slug: input.slug ?? existing?.slug ?? '',
    name_he,
    name_en,
    role_he,
    role_en,
    photo: input.photo ?? existing?.photo ?? '',
    photo_alt: cleanText(input.photo_alt ?? existing?.photo_alt ?? ''),
    quote: cleanText(input.quote ?? existing?.quote ?? ''),
    bio: cleanText(input.bio ?? existing?.bio ?? ''),
    contribution: cleanText(input.contribution ?? existing?.contribution ?? ''),
    vision: cleanText(input.vision ?? existing?.vision ?? ''),
    closing_quote: cleanText(input.closing_quote ?? existing?.closing_quote ?? ''),
    responsibilities: (input.responsibilities ?? existing?.responsibilities ?? []).map((item) => cleanText(String(item))),
    expertise: (input.expertise ?? existing?.expertise ?? []).map((item) => cleanText(String(item))),
    impact_score: input.impact_score ?? existing?.impact_score ?? 50,
    hierarchy_level: input.hierarchy_level ?? existing?.hierarchy_level ?? group_key,
    group_key,
    visual_tier: input.visual_tier ?? existing?.visual_tier ?? 'medium',
    featured: input.featured ?? existing?.featured ?? true,
    status,
    archived: input.archived ?? existing?.archived ?? false,
    orbit: input.orbit ?? existing?.orbit ?? 2,
    display_order: input.display_order ?? existing?.display_order ?? 0,
    professional_url: cleanText(input.professional_url ?? existing?.professional_url ?? ''),
  };
}

export function createTeamMember(input: TeamMemberInput): TeamMember {
  const db = getDb();
  const id = `tm-${randomUUID().slice(0, 8)}`;
  const merged = mergeInput(null, { ...input, name_he: input.name_he || input.name || '' });
  if (!merged.name_he && !merged.name_en) {
    throw new Error('שם הוא שדה חובה');
  }
  if (!(merged.role_he || merged.role_en)) {
    throw new Error('תפקיד הוא שדה חובה');
  }
  db.prepare(`
    INSERT INTO team_members (
      id, slug, name, name_he, name_en, role, role_he, role_en, photo, photo_alt, quote, bio,
      contribution, vision, closing_quote, responsibilities, expertise, impact_score,
      hierarchy_level, group_key, visual_tier, featured, status, archived, orbit, active, display_order, professional_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
  `).run(
    id,
    merged.slug || id,
    merged.name_he || merged.name_en,
    merged.name_he,
    merged.name_en,
    merged.role_en || merged.role_he,
    merged.role_he,
    merged.role_en,
    merged.photo,
    merged.photo_alt,
    merged.quote,
    merged.bio,
    merged.contribution,
    merged.vision,
    merged.closing_quote,
    JSON.stringify(merged.responsibilities),
    JSON.stringify(merged.expertise),
    merged.impact_score,
    merged.hierarchy_level,
    merged.group_key,
    merged.visual_tier,
    merged.featured ? 1 : 0,
    merged.status,
    merged.orbit,
    merged.status === 'published' ? 1 : 0,
    merged.display_order,
    merged.professional_url,
  );
  return getTeamMember(id)!;
}

export function updateTeamMember(id: string, input: Partial<TeamMemberInput>): TeamMember {
  const existing = getTeamMember(id);
  if (!existing) throw new Error('איש הצוות לא נמצא');
  persist(id, mergeInput(existing, input));
  return getTeamMember(id)!;
}

export function archiveTeamMember(id: string): void {
  const existing = getTeamMember(id);
  if (!existing) throw new Error('איש הצוות לא נמצא');
  persist(id, { ...mergeInput(existing, {}), archived: true, status: 'hidden' });
}

export function duplicateTeamMember(id: string): TeamMember {
  const existing = getTeamMember(id);
  if (!existing) throw new Error('איש הצוות לא נמצא');
  return createTeamMember({
    ...existing,
    name_he: `${existing.name_he} (עותק)`,
    name_en: existing.name_en ? `${existing.name_en} (copy)` : '',
    status: 'draft',
    slug: '',
    display_order: existing.display_order + 1,
  });
}

export function reorderTeamMembers(ids: string[]): void {
  const db = getDb();
  const stmt = db.prepare(`UPDATE team_members SET display_order = ?, updated_at = datetime('now') WHERE id = ?`);
  ids.forEach((id, i) => stmt.run(i, id));
}

function parseSection(payload: string, updated_at?: string): TeamSectionSettings & { updated_at?: string } {
  try {
    return { ...TEAM_SECTION_DEFAULTS, ...JSON.parse(payload), updated_at };
  } catch {
    return { ...TEAM_SECTION_DEFAULTS, updated_at };
  }
}

function readSectionRow(id: string) {
  const db = getDb();
  return db.prepare(`SELECT payload, updated_at FROM webinar_team_section WHERE id = ?`).get(id) as
    | { payload: string; updated_at: string }
    | undefined;
}

export function getTeamSection(kind: 'live' | 'draft' = 'draft'): TeamSectionSettings & { updated_at?: string } {
  const row = readSectionRow(kind) || readSectionRow('default') || readSectionRow(kind === 'draft' ? 'live' : 'draft');
  if (!row) return { ...TEAM_SECTION_DEFAULTS };
  return parseSection(row.payload, row.updated_at);
}

function writeSection(id: string, payload: TeamSectionSettings) {
  const db = getDb();
  const { updated_at: _updated, ...rest } = payload as TeamSectionSettings & { updated_at?: string };
  void _updated;
  db.prepare(`
    INSERT INTO webinar_team_section (id, payload, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = datetime('now')
  `).run(id, JSON.stringify(rest));
}

export function saveTeamSection(patch: Partial<TeamSectionSettings>): TeamSectionSettings {
  const next = { ...getTeamSection('draft'), ...patch, published: false };
  writeSection('draft', next);
  return getTeamSection('draft');
}

export function publishTeamSection(adminUserId = '') {
  const draft = getTeamSection('draft');
  const live = { ...draft, published: true };
  const db = getDb();
  db.prepare(
    `INSERT INTO webinar_team_section_versions (payload, created_at, created_by) VALUES (?, datetime('now'), ?)`,
  ).run(JSON.stringify(live), adminUserId);
  const extra = db
    .prepare(`SELECT id FROM webinar_team_section_versions ORDER BY id DESC LIMIT -1 OFFSET 10`)
    .all() as Array<{ id: number }>;
  if (extra.length) {
    const ids = extra.map((row) => row.id);
    db.prepare(`DELETE FROM webinar_team_section_versions WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids);
  }
  writeSection('live', live);
  writeSection('draft', live);
  writeSection('default', live);
  return getTeamSection('live');
}

export function listTeamSectionVersions() {
  const db = getDb();
  return db
    .prepare(`SELECT id, payload, created_at, created_by FROM webinar_team_section_versions ORDER BY id DESC LIMIT 10`)
    .all() as Array<{ id: number; payload: string; created_at: string; created_by: string }>;
}

export function restoreTeamSectionVersion(id: number) {
  const db = getDb();
  const row = db.prepare(`SELECT payload FROM webinar_team_section_versions WHERE id = ?`).get(id) as
    | { payload: string }
    | undefined;
  if (!row) throw new Error('גרסה לא נמצאה');
  const parsed = parseSection(row.payload);
  writeSection('draft', { ...parsed, published: false });
  return getTeamSection('draft');
}

export function getPublicTeamPayload(_locale = 'he') {
  return {
    settings: getTeamSection('live'),
    members: listActiveTeamMembers(),
  };
}
