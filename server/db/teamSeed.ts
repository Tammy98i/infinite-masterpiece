import type { DatabaseSync } from 'node:sqlite';
import { TEAM_GALAXY_SEED, TEAM_SECTION_DEFAULTS } from '../../src/constants/teamGalaxySeed.ts';

export function seedTeamMembersIfEmpty(db: DatabaseSync) {
  const upsert = db.prepare(`
    INSERT INTO team_members (
      id, slug, name, name_he, name_en, role, role_he, role_en, photo, photo_alt, quote, bio,
      contribution, vision, closing_quote, responsibilities, expertise, impact_score,
      hierarchy_level, group_key, visual_tier, featured, status, archived, orbit, active, display_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug,
      name = excluded.name,
      name_he = excluded.name_he,
      name_en = excluded.name_en,
      role = excluded.role,
      role_he = excluded.role_he,
      role_en = excluded.role_en,
      photo = excluded.photo,
      photo_alt = excluded.photo_alt,
      quote = excluded.quote,
      bio = excluded.bio,
      contribution = excluded.contribution,
      vision = excluded.vision,
      closing_quote = excluded.closing_quote,
      responsibilities = excluded.responsibilities,
      expertise = excluded.expertise,
      impact_score = excluded.impact_score,
      hierarchy_level = excluded.hierarchy_level,
      group_key = excluded.group_key,
      visual_tier = excluded.visual_tier,
      featured = excluded.featured,
      status = excluded.status,
      orbit = excluded.orbit,
      active = excluded.active,
      display_order = excluded.display_order,
      updated_at = datetime('now')
  `);

  for (const m of TEAM_GALAXY_SEED) {
    const orbit = m.group_key === 'founder' ? 0 : m.group_key === 'leadership' ? 1 : 2;
    upsert.run(
      m.id,
      m.slug,
      m.name_he,
      m.name_he,
      m.name_en,
      m.role_en,
      m.role_he,
      m.role_en,
      m.photo,
      m.photo_alt,
      m.quote,
      m.bio,
      m.contribution,
      m.vision,
      m.closing_quote,
      JSON.stringify(m.responsibilities),
      JSON.stringify(m.expertise),
      m.impact_score,
      m.group_key,
      m.group_key,
      m.visual_tier,
      m.featured ? 1 : 0,
      m.status,
      orbit,
      m.status === 'published' ? 1 : 0,
      m.display_order,
    );
  }

  const keep = TEAM_GALAXY_SEED.map((m) => m.id);
  db.prepare(
    `UPDATE team_members SET archived = 0 WHERE id IN (${keep.map(() => '?').join(', ')})`,
  ).run(...keep);
  db.prepare(`UPDATE team_members SET archived = 1, status = 'hidden' WHERE id = 'tm-daniel'`).run();

  const insertSection = db.prepare(`
    INSERT INTO webinar_team_section (id, payload, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(id) DO NOTHING
  `);
  insertSection.run('live', JSON.stringify(TEAM_SECTION_DEFAULTS));
  insertSection.run('draft', JSON.stringify(TEAM_SECTION_DEFAULTS));
  insertSection.run('default', JSON.stringify(TEAM_SECTION_DEFAULTS));

  console.log(`Team members synced: ${TEAM_GALAXY_SEED.length} entries`);
}
