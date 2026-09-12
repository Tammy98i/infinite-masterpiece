import { Router } from 'express';
import {
  archiveTeamMember,
  createTeamMember,
  duplicateTeamMember,
  getPublicTeamPayload,
  getTeamMember,
  getTeamSection,
  listActiveTeamMembers,
  listAllTeamMembers,
  listTeamSectionVersions,
  publishTeamSection,
  reorderTeamMembers,
  restoreTeamSectionVersion,
  saveTeamSection,
  updateTeamMember,
  type TeamMemberInput,
} from '../services/teamService.js';
import { authUser } from '../middleware/auth.js';
import { writeAudit } from '../services/auditService.js';

const router = Router();

function readInput(body: Record<string, unknown>): TeamMemberInput {
  const input: TeamMemberInput = {};
  const str = (k: string) => (body[k] !== undefined ? String(body[k]) : undefined);
  const copy = [
    'name', 'name_he', 'name_en', 'role', 'role_he', 'role_en', 'photo', 'photo_alt',
    'quote', 'bio', 'contribution', 'vision', 'closing_quote', 'hierarchy_level',
    'group_key', 'visual_tier', 'status', 'slug', 'professional_url',
  ] as const;
  for (const k of copy) {
    const v = str(k);
    if (v !== undefined) (input as Record<string, string>)[k] = v;
  }
  if (body.responsibilities !== undefined) {
    input.responsibilities = Array.isArray(body.responsibilities) ? body.responsibilities.map(String) : [];
  }
  if (body.expertise !== undefined) {
    input.expertise = Array.isArray(body.expertise) ? body.expertise.map(String) : [];
  }
  if (body.impact_score !== undefined) input.impact_score = Number(body.impact_score);
  if (body.orbit !== undefined) input.orbit = Number(body.orbit);
  if (body.display_order !== undefined) input.display_order = Number(body.display_order);
  if (body.active !== undefined) input.active = Boolean(body.active);
  if (body.featured !== undefined) input.featured = Boolean(body.featured);
  if (body.archived !== undefined) input.archived = Boolean(body.archived);
  return input;
}

router.get('/', (req, res) => {
  try {
    const admin = String(req.originalUrl || '').includes('/api/admin/team-members');
    res.json(admin ? listAllTeamMembers() : listActiveTeamMembers());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/reorder', (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    reorderTeamMembers(ids);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/:id/duplicate', (req, res) => {
  try {
    res.status(201).json(duplicateTeamMember(req.params.id));
  } catch (err) {
    const status = (err as Error).message.includes('לא נמצא') ? 404 : 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const member = getTeamMember(req.params.id);
    if (!member || member.archived) {
      res.status(404).json({ error: 'איש צוות לא נמצא' });
      return;
    }
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', (req, res) => {
  try {
    const input = readInput(req.body || {});
    if (!(input.name_he || input.name_en || input.name || '').toString().trim()) {
      res.status(400).json({ error: 'שם הוא שדה חובה' });
      return;
    }
    res.status(201).json(createTeamMember(input));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/:id', (req, res) => {
  try {
    res.json(updateTeamMember(req.params.id, readInput(req.body || {})));
  } catch (err) {
    const status = (err as Error).message.includes('לא נמצא') ? 404 : 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    archiveTeamMember(req.params.id);
    res.json({ success: true });
  } catch (err) {
    const status = (err as Error).message.includes('לא נמצא') ? 404 : 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

export function mountTeamSectionRoutes(router: Router) {
  router.get('/webinar-team-section', (_req, res) => {
    try {
      res.json({
        draft: getTeamSection('draft'),
        live: getTeamSection('live'),
        versions: listTeamSectionVersions(),
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
  router.put('/webinar-team-section', (req, res) => {
    try {
      const draft = saveTeamSection(req.body || {});
      writeAudit({
        adminUserId: authUser(req).id,
        actionType: 'webinar_team_section_draft',
        entityType: 'webinar_team_section',
        entityId: 'draft',
        after: draft,
      });
      res.json({
        draft,
        live: getTeamSection('live'),
        versions: listTeamSectionVersions(),
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
  router.post('/webinar-team-section/publish', (req, res) => {
    try {
      const live = publishTeamSection(authUser(req).id);
      writeAudit({
        adminUserId: authUser(req).id,
        actionType: 'webinar_team_section_publish',
        entityType: 'webinar_team_section',
        entityId: 'live',
        after: live,
      });
      res.json({
        draft: getTeamSection('draft'),
        live,
        versions: listTeamSectionVersions(),
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
  router.post('/webinar-team-section/restore', (req, res) => {
    try {
      const id = Number(req.body?.id);
      const draft = restoreTeamSectionVersion(id);
      writeAudit({
        adminUserId: authUser(req).id,
        actionType: 'webinar_team_section_restore',
        entityType: 'webinar_team_section',
        entityId: String(id),
        after: draft,
      });
      res.json({
        draft,
        live: getTeamSection('live'),
        versions: listTeamSectionVersions(),
      });
    } catch (err) {
      const status = (err as Error).message.includes('לא נמצאה') ? 404 : 500;
      res.status(status).json({ error: (err as Error).message });
    }
  });
}

export { getPublicTeamPayload };

export default router;
