import { apiRequest } from './auth';

export interface AccessibilityPublicConfig {
  coordinatorName: string;
  email: string;
  phone: string;
  phoneDisplay: string;
  phoneHref: string;
  lastAuditDate: string;
  statementUpdated: string;
  responseDays: number;
  standard: string;
}

export function fetchAccessibilityConfig() {
  return apiRequest<AccessibilityPublicConfig>('/api/legal/accessibility-config');
}

export function submitAccessibilityReport(payload: {
  fullName: string;
  email: string;
  phone?: string;
  pageUrl?: string;
  message: string;
}) {
  return apiRequest<{ ok: true; report: { id: string; createdAt: string } }>('/api/legal/accessibility-report', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
