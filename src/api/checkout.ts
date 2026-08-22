import { apiRequest } from './auth';
import type { EntryTrackId } from '../data/entryTracks';

export const checkoutApi = {
  status: () => apiRequest<{ enabled: boolean }>('/api/checkout/status'),
  createSession: (payload: { track: EntryTrackId; email: string; fullName: string; leadId: string }) =>
    apiRequest<{ url: string }>('/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export async function continueAfterTrackLead(input: {
  leadId: string;
  trackType: EntryTrackId;
  email: string;
  fullName: string;
}) {
  const { enabled } = await checkoutApi.status();
  if (!enabled) return { redirected: false };
  const { url } = await checkoutApi.createSession({
    track: input.trackType,
    email: input.email,
    fullName: input.fullName,
    leadId: input.leadId,
  });
  window.location.href = url;
  return { redirected: true };
}
