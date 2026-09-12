import { Router } from 'express';
import {
  createTeamMember,
  deleteTeamMember,
  getTeamMember,
  listActiveTeamMembers,
  listAllTeamMembers,
  updateTeamMember,
  type TeamMemberInput,
} from '../services/teamService.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const admin = String(req.originalUrl || '').includes('/api/admin/team-members');
    res.json(admin ? listAllTeamMembers() : listActiveTeamMembers());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const member = getTeamMember(req.params.id);
    if (!member) {
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
    const input: TeamMemberInput = {
      name: String(req.body.name || ''),
      role: String(req.body.role || ''),
      photo: String(req.body.photo || ''),
      bio: String(req.body.bio || ''),
      contribution: String(req.body.contribution || ''),
      responsibilities: Array.isArray(req.body.responsibilities) ? req.body.responsibilities : [],
      expertise: Array.isArray(req.body.expertise) ? req.body.expertise : [],
      impact_score: Number(req.body.impact_score) || 50,
      hierarchy_level: String(req.body.hierarchy_level || 'contributor'),
      orbit: Number(req.body.orbit) || 3,
      active: req.body.active !== false,
      display_order: Number(req.body.display_order) || 0,
    };
    if (!input.name.trim()) {
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
    const input: Partial<TeamMemberInput> = {};
    if (req.body.name !== undefined) input.name = String(req.body.name);
    if (req.body.role !== undefined) input.role = String(req.body.role);
    if (req.body.photo !== undefined) input.photo = String(req.body.photo);
    if (req.body.bio !== undefined) input.bio = String(req.body.bio);
    if (req.body.contribution !== undefined) input.contribution = String(req.body.contribution);
    if (req.body.responsibilities !== undefined) input.responsibilities = req.body.responsibilities;
    if (req.body.expertise !== undefined) input.expertise = req.body.expertise;
    if (req.body.impact_score !== undefined) input.impact_score = Number(req.body.impact_score);
    if (req.body.hierarchy_level !== undefined) input.hierarchy_level = String(req.body.hierarchy_level);
    if (req.body.orbit !== undefined) input.orbit = Number(req.body.orbit);
    if (req.body.active !== undefined) input.active = req.body.active;
    if (req.body.display_order !== undefined) input.display_order = Number(req.body.display_order);

    const updated = updateTeamMember(req.params.id, input);
    res.json(updated);
  } catch (err) {
    const status = (err as Error).message.includes('לא נמצא') ? 404 : 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    deleteTeamMember(req.params.id);
    res.json({ success: true });
  } catch (err) {
    const status = (err as Error).message.includes('לא נמצא') ? 404 : 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

export default router;
