import { apiRequest } from './auth';
import { getStoredReferralLecturerId } from '../utils/referral';

export interface TrackLeadPayload {
  trackType: 'brave' | 'hesitant';
  fullName: string;
  phone: string;
  email: string;
  field: string;
  hesitationReason?: string;
  hasProduct?: string;
  hasSold?: string;
  goal90?: string;
  links?: string;
}

export function submitTrackLead(payload: TrackLeadPayload) {
  return apiRequest<{ ok: true; lead: { id: string; trackType: 'brave' | 'hesitant'; planId: string } }>(
    '/api/tracks/leads',
    {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        referredByLecturerId: getStoredReferralLecturerId(),
      }),
    }
  );
}
