import { apiRequest } from './auth';
import type { TeamSectionSettings } from '../constants/teamGalaxySeed';

export type { TeamSectionSettings };

export interface TeamMember {
  id: string;
  slug?: string;
  name: string;
  name_he?: string;
  name_en?: string;
  role: string;
  role_he?: string;
  role_en?: string;
  photo: string;
  photo_alt?: string;
  quote?: string;
  bio: string;
  contribution: string;
  vision?: string;
  closing_quote?: string;
  responsibilities: string[];
  expertise: string[];
  impact_score: number;
  hierarchy_level: string;
  group_key?: string;
  visual_tier?: string;
  featured?: boolean;
  status?: string;
  archived?: boolean;
  orbit: number;
  active: boolean;
  display_order: number;
  professional_url?: string;
}

export interface TeamSectionAdminPayload {
  draft: TeamSectionSettings & { updated_at?: string };
  live: TeamSectionSettings & { updated_at?: string };
  versions: Array<{ id: number; payload: string; created_at: string; created_by: string }>;
}

export const teamMembersApi = {
  list: () => apiRequest<TeamMember[]>('/api/team-members'),
  publicSection: (locale = 'he') =>
    apiRequest<{ settings: TeamSectionSettings; members: TeamMember[] }>(
      `/api/webinar/team?locale=${encodeURIComponent(locale)}`,
    ),
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
  adminDuplicate: (id: string) =>
    apiRequest<TeamMember>(`/api/admin/team-members/${encodeURIComponent(id)}/duplicate`, {
      method: 'POST',
    }),
  adminReorder: (ids: string[]) =>
    apiRequest<{ success: boolean }>('/api/admin/team-members/reorder', {
      method: 'PUT',
      body: JSON.stringify({ ids }),
    }),
  adminSection: () => apiRequest<TeamSectionAdminPayload>('/api/admin/webinar-team-section'),
  adminSaveSection: (data: Partial<TeamSectionSettings>) =>
    apiRequest<TeamSectionAdminPayload>('/api/admin/webinar-team-section', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  adminPublishSection: () =>
    apiRequest<TeamSectionAdminPayload>('/api/admin/webinar-team-section/publish', {
      method: 'POST',
    }),
  adminRestoreSection: (id: number) =>
    apiRequest<TeamSectionAdminPayload>('/api/admin/webinar-team-section/restore', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
};
