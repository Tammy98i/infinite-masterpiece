import { apiRequest } from './auth';
import type { TeamMember, TeamMemberInput } from '../lib/teamMembers';
export const teamMembersApi = {
  list: (surface?: 'webinar' | 'site' | 'library') =>
    apiRequest<{ members: TeamMember[]; suppressedNames?: string[] }>(
      `/api/team-members${surface ? `?surface=${surface}` : ''}`
    ),
  adminList: () => apiRequest<{ members: TeamMember[] }>('/api/admin/team-members'),
  save: (input: TeamMemberInput, id?: string) => apiRequest<{ member: TeamMember }>(
    `/api/admin/team-members${id ? `/${encodeURIComponent(id)}` : ''}`,
    { method: id ? 'PUT' : 'POST', body: JSON.stringify(input) },
  ),
};
