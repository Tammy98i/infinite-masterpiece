import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { authUser, requireAdmin } from '../middleware/auth.js';
import { listTeamMembers, saveTeamMember } from '../db/teamMembers.js';
import { writeAudit } from '../services/auditService.js';

export const publicTeamMembers = Router();
export const adminTeamMembers = Router();
publicTeamMembers.get('/', (_req, res) => {
  res.set('Cache-Control', 'no-store').json({ members: listTeamMembers(getDb()) });
});
adminTeamMembers.use(requireAdmin);
adminTeamMembers.get('/', (_req, res) => res.json({ members: listTeamMembers(getDb(), true) }));
adminTeamMembers.post('/', (req, res) => {
  try {
    const member = saveTeamMember(getDb(), req.body);
    writeAudit({ adminUserId: authUser(req).id, actionType: 'team_member_created', entityType: 'team_member', entityId: member.id, after: member });
    res.status(201).json({ member });
  } catch (err) { res.status((err as { status?: number }).status || 500).json({ error: (err as Error).message }); }
});
adminTeamMembers.put('/:id', (req, res) => {
  try {
    const before = listTeamMembers(getDb(), true).find(member => member.id === req.params.id);
    const member = saveTeamMember(getDb(), req.body, req.params.id);
    writeAudit({ adminUserId: authUser(req).id, actionType: 'team_member_updated', entityType: 'team_member', entityId: member.id, before, after: member });
    res.json({ member });
  } catch (err) { res.status((err as { status?: number }).status || 500).json({ error: (err as Error).message }); }
});
