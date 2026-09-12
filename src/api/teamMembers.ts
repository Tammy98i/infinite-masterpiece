import { apiRequest } from './auth';

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

export const teamMembersApi = {
  list: () => apiRequest<TeamMember[]>('/api/team-members'),
  get: (id: string) => apiRequest<TeamMember>(`/api/team-members/${encodeURIComponent(id)}`),
  adminList: () => apiRequest<TeamMember[]>('/api/admin/team-members'),
  adminCreate: (data: Partial<TeamMember>) =>
    apiRequest<TeamMember>('/api/admin/team-members', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  adminUpdate: (id: string, data: Partial<TeamMember>) =>
    apiRequest<TeamMember>(`/api/admin/team-members/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  adminDelete: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/admin/team-members/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
