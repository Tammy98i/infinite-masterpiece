import type { DatabaseSync } from 'node:sqlite';
import { TEAM_GALAXY_SEED } from '../../src/constants/teamGalaxySeed.ts';

export function seedTeamMembersIfEmpty(db: DatabaseSync) {
  const count = db.prepare(`SELECT COUNT(*) as c FROM team_members`).get() as { c: number };
  if (count.c > 0) return;

  const insert = db.prepare(`
    INSERT INTO team_members (
      id, name, role, photo, bio, contribution, responsibilities, expertise,
      impact_score, hierarchy_level, orbit, active, display_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  for (const m of TEAM_GALAXY_SEED) {
    insert.run(
      m.id,
      m.name,
      m.role,
      m.photo,
      m.bio,
      m.contribution,
      JSON.stringify(m.responsibilities),
      JSON.stringify(m.expertise),
      m.impact_score,
      m.hierarchy_level,
      m.orbit,
      m.display_order,
    );
  }
  console.log(`Team members seeded: ${TEAM_GALAXY_SEED.length} entries`);
}
