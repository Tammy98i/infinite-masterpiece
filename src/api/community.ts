import { apiRequest } from './auth';

export type CommunityBadge = 'אדמין' | 'מרצה' | 'נבחרת 88' | 'חבר ספרייה';

export type CommunityAuthor = {
  firstName: string;
  initial: string;
  badge: CommunityBadge | string;
  avatar?: string;
};

export type CommunityReply = {
  id: string;
  body: string;
  createdAt: string;
  author: CommunityAuthor;
};

export type CommunityPost = {
  id: string;
  channel: string;
  body: string;
  lectureTitle: string;
  imageUrl: string;
  pinned: boolean;
  hidden: boolean;
  createdAt: string;
  canEdit: boolean;
  mine?: boolean;
  author: CommunityAuthor;
  hearts: number;
  hearted: boolean;
  saved: boolean;
  reported: boolean;
  replies: CommunityReply[];
};

export type CommunityHome = {
  access: 'open' | 'locked';
  channel: string;
  nextCursor: string | null;
  channels: Array<{ id: string; label: string; canPost: boolean }>;
  posts: CommunityPost[];
  people: Array<{ firstName: string; initial: string; badge: string }>;
  me?: {
    firstName: string;
    initial: string;
    badge: string;
    isAdmin: boolean;
    muted: boolean;
  };
};

export type CommunityReport = {
  id: string;
  postId: string;
  body: string;
  hidden: boolean;
  authorId: string;
  authorName: string;
  reporterName: string;
  muted: boolean;
  createdAt: string;
};

export const communityApi = {
  home: (channel?: string, cursor?: string) => {
    const params = new URLSearchParams();
    if (channel) params.set('channel', channel);
    if (cursor) params.set('cursor', cursor);
    const query = params.toString();
    return apiRequest<CommunityHome>(`/api/community${query ? `?${query}` : ''}`);
  },
  edit: (postId: string, body: string) =>
    apiRequest<{ ok: boolean }>(`/api/community/posts/${postId}`, { method: 'PATCH', body: JSON.stringify({ body }) }),
  reports: () => apiRequest<{ reports: CommunityReport[] }>('/api/community/moderation'),
  dismissReport: (reportId: string) =>
    apiRequest<{ ok: boolean }>(`/api/community/moderation/reports/${reportId}/dismiss`, { method: 'POST' }),
  mute: (userId: string, muted: boolean) =>
    apiRequest<{ ok: boolean }>('/api/community/moderation/mute', {
      method: 'POST',
      body: JSON.stringify({ userId, muted }),
    }),
  post: (input: { channel: string; body: string; lectureTitle?: string; imageUrl?: string }) =>
    apiRequest<{ id: string }>('/api/community/posts', { method: 'POST', body: JSON.stringify(input) }),
  reply: (postId: string, body: string) =>
    apiRequest<{ id: string }>(`/api/community/posts/${postId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  react: (postId: string) => apiRequest<{ on: boolean }>(`/api/community/posts/${postId}/react`, { method: 'POST' }),
  bookmark: (postId: string) =>
    apiRequest<{ on: boolean }>(`/api/community/posts/${postId}/bookmark`, { method: 'POST' }),
  report: (postId: string) => apiRequest<{ ok: boolean }>(`/api/community/posts/${postId}/report`, { method: 'POST' }),
  pin: (postId: string, pinned: boolean) =>
    apiRequest<{ ok: boolean }>(`/api/community/posts/${postId}/pin`, {
      method: 'POST',
      body: JSON.stringify({ pinned }),
    }),
  hide: (postId: string, hidden: boolean) =>
    apiRequest<{ ok: boolean }>(`/api/community/posts/${postId}/hide`, {
      method: 'POST',
      body: JSON.stringify({ hidden }),
    }),
};
