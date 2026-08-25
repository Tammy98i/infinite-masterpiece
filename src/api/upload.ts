import { getAuthToken } from './auth';
import { apiUrl, mediaUrl } from '../lib/apiBase';

export type UploadKind = 'image' | 'video' | 'resource' | 'caption';

export async function uploadFile(file: File, kind: UploadKind) {
  const body = new FormData();
  body.append('file', file);
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(apiUrl(`/api/upload?kind=${encodeURIComponent(kind)}`), {
    method: 'POST',
    headers,
    body,
  });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error || 'העלאה נכשלה');
  }
  return mediaUrl(data.url) || data.url;
}
