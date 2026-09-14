import { randomUUID } from 'node:crypto';
import type { TeamMember } from '../../src/api/teamMembers.ts';
import { TEAM_SECTION_DEFAULTS, teamGalaxyPublicMembers, type TeamSectionSettings } from '../../src/constants/teamGalaxySeed.ts';
import { DEFAULT_WEBINAR_CONFIG } from './staticData.js';
import { hasSupabaseService, supabaseRest } from './supabaseAdmin.js';

export const WEBINAR_ROW_ID = 'default';
const CMS_KEY = '_teamCms';

export type TeamCmsState = {
  members: TeamMember[];
  sectionDraft: TeamSectionSettings;
  sectionLive: TeamSectionSettings;
};

type StoredConfig = Record<string, unknown> & { [CMS_KEY]?: TeamCmsState };

function httpError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

function seedMembers(): TeamMember[] {
  return teamGalaxyPublicMembers() as TeamMember[];
}

function seedCms(): TeamCmsState {
  return {
    members: seedMembers(),
    sectionDraft: { ...TEAM_SECTION_DEFAULTS },
    sectionLive: { ...TEAM_SECTION_DEFAULTS },
  };
}

export function stripTeamCms<T extends Record<string, unknown>>(raw: T): Omit<T, '_teamCms'> {
  const next = { ...raw };
  delete (next as Record<string, unknown>)[CMS_KEY];
  return next;
}

async function loadWebinarRow(): Promise<{ config: StoredConfig; title?: string; join_url?: string } | null> {
  const res = await supabaseRest<Array<{ config?: StoredConfig; title?: string; join_url?: string }>>(
    `webinars?id=eq.${encodeURIComponent(WEBINAR_ROW_ID)}&select=title,join_url,config`,
  );
  if (!res.ok || !Array.isArray(res.data) || !res.data[0]) return null;
  return { config: (res.data[0].config || {}) as StoredConfig, title: res.data[0].title, join_url: res.data[0].join_url };
}

async function persistConfig(config: StoredConfig, title: string, joinUrl: string) {
  if (!hasSupabaseService()) {
    throw httpError('שמירת צוות וובינר דורשת SUPABASE_SERVICE_ROLE_KEY', 503);
  }
  const payload = { title, join_url: joinUrl, config };
  const patched = await supabaseRest(`webinars?id=eq.${encodeURIComponent(WEBINAR_ROW_ID)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    prefer: 'return=representation',
  });
  if (patched.ok && Array.isArray(patched.data) && patched.data.length) return;
  const created = await supabaseRest('webinars', {
    method: 'POST',
    body: JSON.stringify({ id: WEBINAR_ROW_ID, ...payload }),
    prefer: 'return=representation',
  });
  if (!created.ok) {
    throw httpError(created.error || patched.error || 'שמירה נכשלה', created.status || patched.status || 500);
  }
}

export async function loadTeamCms(): Promise<TeamCmsState> {
  const row = await loadWebinarRow();
  const stored = row?.config?.[CMS_KEY];
  if (stored?.members?.length) {
    return {
      members: stored.members,
      sectionDraft: { ...TEAM_SECTION_DEFAULTS, ...stored.sectionDraft },
      sectionLive: { ...TEAM_SECTION_DEFAULTS, ...stored.sectionLive },
    };
  }
  return seedCms();
}

async function saveTeamCms(next: TeamCmsState) {
  const row = await loadWebinarRow();
  const current = { ...DEFAULT_WEBINAR_CONFIG, ...(row?.config || {}) } as StoredConfig;
  current[CMS_KEY] = next;
  await persistConfig(current, String(current.title || DEFAULT_WEBINAR_CONFIG.title), String(current.zoomLink || row?.join_url || ''));
}

export async function publicTeamPayload() {
  const cms = await loadTeamCms();
  return {
    settings: cms.sectionLive,
    members: cms.members.filter((member) => !member.archived && member.status !== 'hidden' && member.status !== 'draft' && member.active !== false),
  };
}

export async function adminTeamPayload() {
  const cms = await loadTeamCms();
  return {
    members: cms.members.filter((member) => !member.archived),
    draft: cms.sectionDraft,
    live: cms.sectionLive,
    versions: [],
  };
}

export async function saveTeamSectionDraft(input: Partial<TeamSectionSettings>) {
  const cms = await loadTeamCms();
  cms.sectionDraft = { ...cms.sectionDraft, ...input, published: false };
  await saveTeamCms(cms);
  return adminTeamPayload();
}

export async function publishTeamSection() {
  const cms = await loadTeamCms();
  cms.sectionLive = { ...cms.sectionDraft, published: true };
  cms.sectionDraft = { ...cms.sectionLive };
  await saveTeamCms(cms);
  return adminTeamPayload();
}

function asMember(input: Partial<TeamMember>, fallback?: TeamMember): TeamMember {
  const name_he = String(input.name_he || input.name || fallback?.name_he || '').trim();
  const name_en = String(input.name_en || fallback?.name_en || '').trim();
  const role_he = String(input.role_he || fallback?.role_he || '').trim();
  const role_en = String(input.role_en || input.role || fallback?.role_en || '').trim();
  const group = String(input.group_key || input.hierarchy_level || fallback?.group_key || 'core');
  const status = String(input.status || fallback?.status || 'draft');
  return {
    id: fallback?.id || `tm-${randomUUID().slice(0, 8)}`,
    slug: String(input.slug || fallback?.slug || name_en || name_he || 'member'),
    name: name_he || name_en,
    name_he: name_he || name_en,
    name_en: name_en || name_he,
    role: role_en || role_he,
    role_he,
    role_en,
    photo: String(input.photo ?? fallback?.photo ?? ''),
    photo_alt: String(input.photo_alt ?? fallback?.photo_alt ?? ''),
    quote: String(input.quote ?? fallback?.quote ?? ''),
    bio: String(input.bio ?? fallback?.bio ?? ''),
    contribution: String(input.contribution ?? fallback?.contribution ?? ''),
    vision: String(input.vision ?? fallback?.vision ?? ''),
    closing_quote: String(input.closing_quote ?? fallback?.closing_quote ?? ''),
    responsibilities: Array.isArray(input.responsibilities) ? input.responsibilities.map(String) : fallback?.responsibilities || [],
    expertise: Array.isArray(input.expertise) ? input.expertise.map(String) : fallback?.expertise || [],
    impact_score: Number(input.impact_score ?? fallback?.impact_score ?? 50),
    hierarchy_level: String(input.hierarchy_level || group),
    group_key: group,
    visual_tier: String(input.visual_tier || fallback?.visual_tier || 'medium'),
    featured: Boolean(input.featured ?? fallback?.featured ?? false),
    status,
    archived: Boolean(input.archived ?? fallback?.archived ?? false),
    orbit: Number(input.orbit ?? fallback?.orbit ?? 2),
    active: status === 'published',
    display_order: Number(input.display_order ?? fallback?.display_order ?? 0),
    professional_url: String(input.professional_url ?? fallback?.professional_url ?? ''),
  };
}

export async function createRemoteTeamMember(input: Partial<TeamMember>) {
  const cms = await loadTeamCms();
  const member = asMember({ ...input, display_order: input.display_order ?? cms.members.length });
  if (!member.name_he && !member.name_en) throw httpError('שם הוא שדה חובה');
  if (!member.role_he && !member.role_en) throw httpError('תפקיד הוא שדה חובה');
  cms.members.push(member);
  await saveTeamCms(cms);
  return member;
}

export async function updateRemoteTeamMember(id: string, input: Partial<TeamMember>) {
  const cms = await loadTeamCms();
  const index = cms.members.findIndex((member) => member.id === id);
  if (index < 0) throw httpError('איש הצוות לא נמצא', 404);
  cms.members[index] = asMember(input, cms.members[index]);
  await saveTeamCms(cms);
  return cms.members[index];
}

export async function archiveRemoteTeamMember(id: string) {
  const cms = await loadTeamCms();
  const index = cms.members.findIndex((member) => member.id === id);
  if (index < 0) throw httpError('איש הצוות לא נמצא', 404);
  cms.members[index] = { ...cms.members[index], archived: true, status: 'hidden', featured: false, active: false };
  await saveTeamCms(cms);
}

export async function duplicateRemoteTeamMember(id: string) {
  const cms = await loadTeamCms();
  const existing = cms.members.find((member) => member.id === id);
  if (!existing) throw httpError('איש הצוות לא נמצא', 404);
  return createRemoteTeamMember({
    ...existing,
    id: undefined,
    name_he: `${existing.name_he || existing.name} (עותק)`,
    name_en: existing.name_en ? `${existing.name_en} (copy)` : '',
    status: 'draft',
    featured: false,
    display_order: existing.display_order + 1,
  });
}

export async function reorderRemoteTeamMembers(ids: string[]) {
  const cms = await loadTeamCms();
  const byId = new Map(cms.members.map((member) => [member.id, member]));
  const next: TeamMember[] = [];
  ids.forEach((id, index) => {
    const member = byId.get(id);
    if (!member) return;
    next.push({ ...member, display_order: index });
    byId.delete(id);
  });
  for (const leftover of byId.values()) next.push(leftover);
  cms.members = next;
  await saveTeamCms(cms);
}

export async function saveRemoteWebinarConfig(input: Record<string, unknown>) {
  const row = await loadWebinarRow();
  const current = { ...DEFAULT_WEBINAR_CONFIG, ...(row?.config || {}) } as StoredConfig;
  const cms = current[CMS_KEY];
  const merged = stripTeamCms({ ...current, ...input }) as StoredConfig;
  if (cms) merged[CMS_KEY] = cms;
  await persistConfig(merged, String(merged.title || DEFAULT_WEBINAR_CONFIG.title), String(merged.zoomLink || ''));
  return stripTeamCms(merged);
}
