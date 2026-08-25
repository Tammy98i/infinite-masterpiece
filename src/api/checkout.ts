import { apiRequest } from './auth';
import type { AuthUserPayload } from './auth';
import type { EntryTrackId } from '../data/entryTracks';
import type { LibraryPaidPlan } from '../constants/libraryPlans';

export type CheckoutStatus = {
  enabled: boolean;
  library: {
    monthly: { beforeVat: number; withVat: number; label: string };
    annual: { beforeVat: number; withVat: number; label: string };
  };
};

export const checkoutApi = {
  status: () => apiRequest<CheckoutStatus>('/api/checkout/status'),
  createSession: (payload: { track: EntryTrackId; email: string; fullName: string; leadId: string }) =>
    apiRequest<{ url: string }>('/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createLibrarySession: (plan: LibraryPaidPlan) =>
    apiRequest<{ url: string }>('/api/checkout/library-session', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),
  confirmLibrary: (sessionId: string) =>
    apiRequest<{ user: AuthUserPayload }>('/api/checkout/library-confirm', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
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

export async function startLibraryCheckout(plan: LibraryPaidPlan) {
  const { url } = await checkoutApi.createLibrarySession(plan);
  window.location.href = url;
}
