import { apiRequest } from './auth';

export function submitPremium88Application(payload: {
  fullName: string;
  phone: string;
  email: string;
  field: string;
  businessStage: string;
  goal: string;
  links?: string;
  notes?: string;
}) {
  return apiRequest<{ ok: true; application: { id: string } }>('/api/premium-88/applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
