import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { FOUNDERS } from '../../src/marketing/data/founders.ts';
import { ensurePlacementColumns } from '../db/teamMembers.js';

export type PublicFace = {
  id: string;
  name: string;
  title: string;
  photo: string;
  bio: string;
  webinar: boolean;
  site: boolean;
  library: boolean;
  linkedUserId: string;
};

type MemberRow = {
  id: string;
  name: string;
  role: string;
  photo: string;
  bio: string;
  active: number;
  user_id: string;
  show_webinar: number | null;
  show_site: number | null;
  show_library: number | null;
};

type LecturerRow = {
  id: string;
  name: string;
  title: string;
  avatar_url: string;
  bio: string;
  user_id: string | null;
  is_founder: number | null;
};

function norm(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function shown(flag: number | null, inherited: boolean) {
  if (flag === 0) return false;
  if (flag === 1) return true;
  return inherited;
}

export function listPublicFaces(db: DatabaseSync): PublicFace[] {
  ensurePlacementColumns(db);
  const members = db.prepare(`SELECT * FROM team_members ORDER BY display_order, name`).all() as MemberRow[];
  const lecturers = db.prepare(`SELECT * FROM lecturers ORDER BY name`).all() as LecturerRow[];
  const founderNames = new Set(FOUNDERS.map((founder) => norm(founder.name)));
  const lecturerByName = new Map(lecturers.map((row) => [norm(row.name), row]));
  const usedNames = new Set<string>();
  const faces: PublicFace[] = [];

  for (const member of members) {
    const key = norm(member.name);
    usedNames.add(key);
    const lecturer = lecturerByName.get(key);
    const linked = member.user_id || lecturer?.user_id || '';
    faces.push({
      id: `team:${member.id}`,
      name: member.name,
      title: member.role,
      photo: member.photo,
      bio: member.bio,
      webinar: shown(member.show_webinar, member.active === 1),
      site: shown(member.show_site, founderNames.has(key) || Number(lecturer?.is_founder) === 1),
      library: shown(member.show_library, Boolean(lecturer)),
      linkedUserId: linked,
    });
  }

  for (const lecturer of lecturers) {
    const key = norm(lecturer.name);
    if (usedNames.has(key)) continue;
    faces.push({
      id: `lecturer:${lecturer.id}`,
      name: lecturer.name,
      title: lecturer.title,
      photo: lecturer.avatar_url,
      bio: lecturer.bio,
      webinar: false,
      site: shown(null, founderNames.has(key) || Number(lecturer.is_founder) === 1),
      library: true,
      linkedUserId: lecturer.user_id || '',
    });
  }

  return faces;
}

function sourceOf(db: DatabaseSync, faceId: string) {
  const [kind, id] = faceId.split(':');
  if (kind === 'team' && id) {
    const member = db.prepare(`SELECT * FROM team_members WHERE id = ?`).get(id) as MemberRow | undefined;
    if (!member) return null;
    return { memberId: member.id, name: member.name, title: member.role, photo: member.photo, bio: member.bio };
  }
  if (kind === 'lecturer' && id) {
    const lecturer = db.prepare(`SELECT * FROM lecturers WHERE id = ?`).get(id) as LecturerRow | undefined;
    if (!lecturer) return null;
    const named = db.prepare(`SELECT id FROM team_members WHERE name = ?`).get(lecturer.name) as { id: string } | undefined;
    return {
      memberId: named?.id || '',
      name: lecturer.name,
      title: lecturer.title,
      photo: lecturer.avatar_url,
      bio: lecturer.bio,
    };
  }
  return null;
}

function ensureMember(db: DatabaseSync, source: { memberId: string; name: string; title: string; photo: string; bio: string }, userId: string) {
  if (source.memberId) return source.memberId;
  const id = `team-${randomUUID()}`;
  db.prepare(
    `INSERT INTO team_members (
      id, name, role, photo, bio, vision, contribution, responsibilities, expertise,
      impact_score, hierarchy_level, orbit, active, display_order, user_id
    ) VALUES (?, ?, ?, ?, ?, '', ?, '[]', '[]', 55, 'contributor', 2, 1, 100, ?)`
  ).run(id, source.name, source.title || 'צוות', source.photo || '', source.bio || '', source.bio || '', userId);
  return id;
}

function fillLecturer(db: DatabaseSync, userId: string, source: { name: string; title: string; photo: string; bio: string }) {
  const byUser = db.prepare(`SELECT id FROM lecturers WHERE user_id = ?`).get(userId) as { id: string } | undefined;
  const byName = db.prepare(`SELECT id, user_id FROM lecturers WHERE name = ?`).get(source.name) as
    | { id: string; user_id: string | null }
    | undefined;
  const existing = byUser || byName;
  if (existing) {
    db.prepare(
      `UPDATE lecturers
       SET user_id = ?,
           title = CASE WHEN TRIM(COALESCE(title, '')) = '' THEN ? ELSE title END,
           avatar_url = CASE WHEN TRIM(COALESCE(avatar_url, '')) = '' THEN ? ELSE avatar_url END,
           bio = CASE WHEN TRIM(COALESCE(bio, '')) = '' THEN ? ELSE bio END
       WHERE id = ?`
    ).run(userId, source.title || 'מרצה', source.photo || '', source.bio || '', existing.id);
    return existing.id;
  }
  const id = `inst-${randomUUID()}`;
  db.prepare(
    `INSERT INTO lecturers (id, name, title, avatar_url, bio, credentials, user_id, is_founder)
     VALUES (?, ?, ?, ?, ?, '[]', ?, 0)`
  ).run(id, source.name, source.title || 'מרצה', source.photo || '', source.bio || '', userId);
  return id;
}

export function savePublicAppearance(
  db: DatabaseSync,
  userId: string,
  input: { faceId: string; showWebinar: boolean; showSite: boolean; showLibrary: boolean }
) {
  ensurePlacementColumns(db);
  const source = sourceOf(db, input.faceId);
  if (!source) throw Object.assign(new Error('הפרופיל הציבורי לא נמצא'), { status: 404 });
  db.prepare(`UPDATE team_members SET user_id = '' WHERE user_id = ?`).run(userId);
  const memberId = ensureMember(db, source, userId);
  db.prepare(`UPDATE team_members SET user_id = '' WHERE id = ? AND user_id != '' AND user_id != ?`).run(memberId, userId);
  db.prepare(
    `UPDATE team_members
     SET user_id = ?, show_webinar = ?, show_site = ?, show_library = ?, active = 1
     WHERE id = ?`
  ).run(userId, input.showWebinar ? 1 : 0, input.showSite ? 1 : 0, input.showLibrary ? 1 : 0, memberId);
  if (input.showLibrary || input.showSite) fillLecturer(db, userId, source);
  return listPublicFaces(db).find((face) => face.linkedUserId === userId) || null;
}

export function hiddenLibraryKeys(db: DatabaseSync) {
  ensurePlacementColumns(db);
  const rows = db.prepare(
    `SELECT user_id, name FROM team_members WHERE show_library = 0 AND user_id != ''`
  ).all() as Array<{ user_id: string; name: string }>;
  return {
    userIds: new Set(rows.map((row) => row.user_id)),
    names: new Set(rows.map((row) => norm(row.name))),
  };
}
