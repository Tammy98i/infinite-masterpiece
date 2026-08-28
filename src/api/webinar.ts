import type { WebinarPublicPayload } from '../constants/webinar';
import { apiRequest } from './auth';

export type WebinarRegistrationPayload = {
  step?: 'a' | 'b' | 'lead';
  registrationId?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  field?: string;
  interest?: string;
  blocker?: string;
  marketingOptIn?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  abVariant?: string;
};

export type WebinarRegistrationResult = {
  id: string;
  fullName: string;
  email: string;
  status: string;
  step: 'a' | 'b' | 'lead';
  isWaitlist?: boolean;
  alreadyRegistered?: boolean;
  createdAt: string;
  config: WebinarPublicPayload['config'];
};

export type WebinarLookupResult = {
  id: string;
  fullName: string;
  email: string;
  status: string;
  isWaitlist?: boolean;
};

export const webinarApi = {
  config: (abVariant?: string) => {
    const query = abVariant ? `?abVariant=${encodeURIComponent(abVariant)}` : '';
    return apiRequest<WebinarPublicPayload>(`/api/webinar/config${query}`);
  },
  register: (payload: WebinarRegistrationPayload) =>
    apiRequest<{
      ok: boolean;
      registration: WebinarRegistrationResult;
    }>('/api/webinar/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resume: (id: string) =>
    apiRequest<{
      ok: boolean;
      registration: {
        id: string;
        status: string;
        step: 'a' | 'b' | 'done';
        email: string;
        fullName: string;
        personPicked?: boolean;
      };
    }>(`/api/webinar/resume/${encodeURIComponent(id)}`),
  personPicked: (registrationId: string, picked: boolean) =>
    apiRequest<{
      ok: boolean;
      registration: { id: string; personPicked: boolean };
    }>('/api/webinar/person-picked', {
      method: 'POST',
      body: JSON.stringify({ registrationId, picked }),
    }),
  lookup: (email: string) =>
    apiRequest<{
      ok: boolean;
      registration: WebinarLookupResult;
    }>('/api/webinar/lookup', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};
