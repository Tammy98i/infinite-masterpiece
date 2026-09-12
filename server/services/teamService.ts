import { randomUUID } from 'crypto';
import { getDb, type SqliteDb } from '../db/connection.js';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo: string;
  bio: string;
  contribution: string;
  responsibilities: string[];
  expertise: string[];
  impact_score: number;
  hierarchy_level: string;
  orbit: number;
  active: boolean;
  display_order: number;
}

interface TeamMemberRow {
  id: string;
  name: string;
  role: string;
  photo: string;
  bio: string;
  contribution: string;
  responsibilities: string;
  expertise: string;
  impact_score: number;
  hierarchy_level: string;
  orbit: number;
  active: number;
  display_order: number;
}

function rowToMember(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    photo: row.photo,
    bio: row.bio,
    contribution: row.contribution,
    responsibilities: JSON.parse(row.responsibilities || '[]'),
    expertise: JSON.parse(row.expertise || '[]'),
    impact_score: row.impact_score,
    hierarchy_level: row.hierarchy_level,
    orbit: row.orbit,
    active: row.active === 1,
    display_order: row.display_order,
  };
}

export function listActiveTeamMembers(): TeamMember[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM team_members WHERE active = 1 ORDER BY orbit ASC, display_order ASC`)
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
    .prepare(`SELECT * FROM team_members ORDER BY orbit ASC, display_order ASC`)
    .all() as TeamMemberRow[];
  return rows.map(rowToMember);
}

export interface TeamMemberInput {
  name: string;
  role: string;
  photo?: string;
  bio?: string;
  contribution?: string;
  responsibilities?: string[];
  expertise?: string[];
  impact_score?: number;
  hierarchy_level?: string;
  orbit?: number;
  active?: boolean;
  display_order?: number;
}

export function createTeamMember(input: TeamMemberInput): TeamMember {
  const db = getDb();
  const id = `tm-${randomUUID().slice(0, 8)}`;
  db.prepare(`
    INSERT INTO team_members (
      id, name, role, photo, bio, contribution, responsibilities, expertise,
      impact_score, hierarchy_level, orbit, active, display_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.name,
    input.role || '',
    input.photo || '',
    input.bio || '',
    input.contribution || '',
    JSON.stringify(input.responsibilities || []),
    JSON.stringify(input.expertise || []),
    input.impact_score ?? 50,
    input.hierarchy_level || 'contributor',
    input.orbit ?? 3,
    input.active === false ? 0 : 1,
    input.display_order ?? 0,
  );
  return getTeamMember(id)!;
}

export function updateTeamMember(id: string, input: Partial<TeamMemberInput>): TeamMember {
  const db = getDb();
  const existing = getTeamMember(id);
  if (!existing) throw new Error('איש הצוות לא נמצא');

  const merged: TeamMemberInput = {
    name: input.name ?? existing.name,
    role: input.role ?? existing.role,
    photo: input.photo ?? existing.photo,
    bio: input.bio ?? existing.bio,
    contribution: input.contribution ?? existing.contribution,
    responsibilities: input.responsibilities ?? existing.responsibilities,
    expertise: input.expertise ?? existing.expertise,
    impact_score: input.impact_score ?? existing.impact_score,
    hierarchy_level: input.hierarchy_level ?? existing.hierarchy_level,
    orbit: input.orbit ?? existing.orbit,
    active: input.active ?? existing.active,
    display_order: input.display_order ?? existing.display_order,
  };

  db.prepare(`
    UPDATE team_members SET
      name = ?, role = ?, photo = ?, bio = ?, contribution = ?,
      responsibilities = ?, expertise = ?, impact_score = ?,
      hierarchy_level = ?, orbit = ?, active = ?, display_order = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    merged.name,
    merged.role,
    merged.photo,
    merged.bio,
    merged.contribution,
    JSON.stringify(merged.responsibilities || []),
    JSON.stringify(merged.expertise || []),
    merged.impact_score ?? 50,
    merged.hierarchy_level,
    merged.orbit,
    merged.active === false ? 0 : 1,
    merged.display_order ?? 0,
    id,
  );
  return getTeamMember(id)!;
}

export function deleteTeamMember(id: string): void {
  const db = getDb();
  const result = db.prepare(`DELETE FROM team_members WHERE id = ?`).run(id);
  if (result.changes === 0) throw new Error('איש הצוות לא נמצא');
}
