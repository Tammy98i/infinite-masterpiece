import { DEFAULT_WEBINAR_CONFIG } from './staticData.js';
import { hasSupabaseService, supabaseRest } from './supabaseAdmin.js';
import { DEFAULT_WEBINAR_ID } from './webinarStore.js';
import { zoomConfigured } from './zoom.js';
import { isWebinarEmailEnabled } from './webinarMail.js';

export async function webinarAdminPayload() {
  const emailEnabled = isWebinarEmailEnabled();
  const zoomOk = zoomConfigured() || Boolean(DEFAULT_WEBINAR_CONFIG.zoomLink?.trim());
  const hasWhatsapp = Boolean(DEFAULT_WEBINAR_CONFIG.whatsappGroupUrl.trim());
  const supabaseOk = hasSupabaseService();

  let registrations: Array<Record<string, unknown>> = [];
  if (supabaseOk) {
    const res = await supabaseRest<Array<Record<string, unknown>>>(
      `webinar_registrations?webinar_id=eq.${encodeURIComponent(DEFAULT_WEBINAR_ID)}&select=id,full_name,email,phone,status,utm_source,utm_campaign,zoom_registrant_id,attendance_segment,created_at,registered_at&order=created_at.desc&limit=200`
    );
    if (res.ok && Array.isArray(res.data)) registrations = res.data;
  }

  const items = [
    {
      id: 'supabase',
      ok: supabaseOk,
      required: true,
      label: 'Supabase Service Role',
      hint: supabaseOk ? 'מחובר' : 'חסר SUPABASE_SERVICE_ROLE_KEY',
    },
    {
      id: 'whatsapp',
      ok: hasWhatsapp,
      required: true,
      label: 'קבוצת וואטסאפ שקטה',
      hint: hasWhatsapp ? 'מוגדר' : 'חסר קישור קבוצה',
    },
    {
      id: 'zoom',
      ok: zoomOk,
      required: false,
      label: 'Zoom',
      hint: zoomConfigured() ? 'OAuth מוגדר' : zoomOk ? 'קישור ידני' : 'חסר Zoom',
    },
    {
      id: 'email',
      ok: emailEnabled,
      required: true,
      label: 'שליחת מייל',
      hint: emailEnabled ? 'Resend פעיל' : 'חסר RESEND_API_KEY',
    },
  ];

  const bySource: Record<string, number> = {};
  for (const row of registrations) {
    const source = String(row.utm_source || 'unknown');
    bySource[source] = (bySource[source] || 0) + 1;
  }

  return {
    config: DEFAULT_WEBINAR_CONFIG,
    registrations: registrations.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      status: row.status,
      utmSource: row.utm_source,
      utmCampaign: row.utm_campaign,
      zoomRegistrantId: row.zoom_registrant_id,
      attendanceSegment: row.attendance_segment,
      createdAt: row.created_at || row.registered_at,
    })),
    totalRegistrations: registrations.length,
    bySource,
    funnel: {
      pageViews: 0,
      formViews: 0,
      stepAStarted: 0,
      stepACompleted: registrations.length,
      stepBStarted: 0,
      stepBCompleted: 0,
      completed: registrations.filter((row) =>
        ['registered', 'confirmed', 'complete', 'attended'].includes(String(row.status))
      ).length,
      calendarClicks: 0,
      whatsappClicks: 0,
      fitSectionViews: 0,
      ctaClicks: 0,
      partialLeads: 0,
      emailLeads: 0,
      completeLeads: registrations.length,
      waitlistLeads: registrations.filter((row) => row.status === 'waitlist').length,
      personPicked: 0,
    },
    readiness: {
      ready: items.filter((item) => item.required).every((item) => item.ok),
      emailEnabled,
      items,
    },
  };
}
