import { getAuthToken } from '../api/auth';
import { WEBINAR_REGISTER_ID } from '../constants/webinarPage';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const MARKETING_EVENTS: Record<string, { ga?: string; meta?: string }> = {
  webinar_page_view: { ga: 'page_view', meta: 'PageView' },
  webinar_form_started: { ga: 'generate_lead', meta: 'Lead' },
  webinar_form_submitted: { ga: 'generate_lead', meta: 'CompleteRegistration' },
  webinar_step_a_completed: { ga: 'generate_lead', meta: 'Lead' },
  webinar_registration_completed: { ga: 'generate_lead', meta: 'CompleteRegistration' },
};

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

  if (typeof window === 'undefined') return;

  try {
    window.gtag?.('event', eventName, data || {});
    const mapped = MARKETING_EVENTS[eventName];
    if (mapped?.ga) {
      window.gtag?.('event', mapped.ga, { event_category: 'webinar', ...data });
    }
  } catch {
    /* optional GA4 */
  }

  try {
    window.fbq?.('trackCustom', eventName, data || {});
    const mapped = MARKETING_EVENTS[eventName];
    if (mapped?.meta) {
      window.fbq?.('track', mapped.meta, data || {});
    }
  } catch {
    /* optional Meta Pixel */
  }
}

export function trackWebinarCta(section: string) {
  trackEvent('webinar_cta_clicked', { section });
}

export function scrollToWebinarForm(formId = WEBINAR_REGISTER_ID) {
  document.getElementById(formId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function scrollToWebinarFit() {
  document.getElementById('webinar-fit')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  trackEvent('webinar_fit_cta_clicked');
}
