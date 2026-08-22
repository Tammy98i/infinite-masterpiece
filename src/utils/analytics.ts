import { getAuthToken } from '../api/auth';

export function trackEvent(eventName: string, data?: Record<string, string>) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  void fetch('/api/analytics', {
    method: 'POST',
    headers,
    body: JSON.stringify({ event: eventName, properties: data || {} }),
    keepalive: true,
  }).catch(() => undefined);
}
