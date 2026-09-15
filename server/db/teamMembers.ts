import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { FOUNDERS } from '../../src/marketing/data/founders.ts';
import { WEBINAR_GLEB } from '../../src/constants/webinarPage.ts';
import { validateTeamMember, type TeamMember, type TeamMemberInput } from '../../src/lib/teamMembers.ts';

export function initializeTeamMembers(db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, photo TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '', vision TEXT NOT NULL DEFAULT '', contribution TEXT NOT NULL DEFAULT '',
    responsibilities TEXT NOT NULL DEFAULT '[]', expertise TEXT NOT NULL DEFAULT '[]',
    impact_score INTEGER NOT NULL CHECK(impact_score BETWEEN 0 AND 100),
    hierarchy_level TEXT NOT NULL CHECK(hierarchy_level IN ('founder','leadership','core','contributor')),
    orbit INTEGER NOT NULL CHECK(orbit BETWEEN 0 AND 4), active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
    display_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE UNIQUE INDEX IF NOT EXISTS team_one_active_sun ON team_members(hierarchy_level)
    WHERE hierarchy_level = 'founder' AND active = 1;`);
  // One-time import, never overwrite CMS edits or re-enable hidden people on restart.
  if (db.prepare("SELECT value FROM site_settings WHERE key = 'team_members_imported'").get()) return;
  db.exec('BEGIN');
  try {
    const founders = db.prepare('SELECT * FROM lecturers WHERE is_founder = 1 ORDER BY sort_order, name').all();
    for (const [index, row] of founders.entries()) {
      const source = FOUNDERS.find(f => f.id === row.founder_id);
      const isSun = row.founder_id === 'gal';
      insertMember(db, `team-${row.id}`, {
        name: String(row.name), role: String(row.title || 'צוות המיזם'), photo: String(row.avatar_url || ''),
        bio: String(row.bio || ''), vision: isSun ? source?.blurb || '' : '',
        contribution: source?.blurb || '', responsibilities: source?.portfolio.map(p => `${p.title} — ${p.summary}`) || [],
        expertise: JSON.parse(String(row.credentials || '[]')),
        hierarchy_level: isSun ? 'founder' : 'leadership', impact_score: isSun ? 100 : 90,
        orbit: isSun ? 0 : 1, active: true, display_order: index,
      });
    }
    if (!founders.some(row => row.name === WEBINAR_GLEB.name)) insertMember(db, 'team-gleb', {
      name: WEBINAR_GLEB.name, role: WEBINAR_GLEB.title, bio: WEBINAR_GLEB.bio, photo: '',
      vision: '', contribution: WEBINAR_GLEB.bio, responsibilities: ['קריאייטיב', 'תוכן', 'צילום', 'מותג'],
      expertise: ['קריאייטיב', 'שפה ויזואלית', 'תוכן'], hierarchy_level: 'leadership', impact_score: 85,
      orbit: 1, active: true, display_order: founders.length,
    });
    db.prepare("INSERT INTO site_settings (key, value) VALUES ('team_members_imported', '1')").run();
    db.exec('COMMIT');
  } catch (err) { db.exec('ROLLBACK'); throw err; }
}

function rowToMember(row: Record<string, unknown>): TeamMember {
  return { ...row, active: Boolean(row.active), responsibilities: JSON.parse(String(row.responsibilities)), expertise: JSON.parse(String(row.expertise)) } as TeamMember;
}
export function listTeamMembers(db: DatabaseSync, includeHidden = false): TeamMember[] {
  return db.prepare(`SELECT * FROM team_members ${includeHidden ? '' : 'WHERE active = 1'} ORDER BY display_order, name`).all().map(rowToMember);
}
function values(input: TeamMemberInput) {
  return [input.name, input.role, input.photo, input.bio, input.vision, input.contribution,
    JSON.stringify(input.responsibilities), JSON.stringify(input.expertise), input.impact_score,
    input.hierarchy_level, input.orbit, Number(input.active), input.display_order];
}
function insertMember(db: DatabaseSync, id: string, input: TeamMemberInput) {
  db.prepare(`INSERT INTO team_members (id,name,role,photo,bio,vision,contribution,responsibilities,expertise,impact_score,hierarchy_level,orbit,active,display_order)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, ...values(input));
}
export function saveTeamMember(db: DatabaseSync, raw: unknown, id?: string) {
  const before = id ? db.prepare('SELECT * FROM team_members WHERE id = ?').get(id) : undefined;
  if (id && !before) throw Object.assign(new Error('איש הצוות לא נמצא'), { status: 404 });
  const input = validateTeamMember(raw);
  if (input.active && input.hierarchy_level === 'founder' && db.prepare("SELECT id FROM team_members WHERE active = 1 AND hierarchy_level = 'founder' AND id != ?").get(id || '')) {
    throw Object.assign(new Error('יש כבר שמש פעילה. שנו תחילה את רמת המייסד הקיים או הסתירו אותו.'), { status: 409 });
  }
  const memberId = id || randomUUID();
  if (id) db.prepare(`UPDATE team_members SET name=?, role=?, photo=?, bio=?, vision=?, contribution=?, responsibilities=?, expertise=?, impact_score=?, hierarchy_level=?, orbit=?, active=?, display_order=? WHERE id=?`).run(...values(input), id);
  else insertMember(db, memberId, input);
  return rowToMember(db.prepare('SELECT * FROM team_members WHERE id = ?').get(memberId)!);
}
