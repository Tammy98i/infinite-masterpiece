import { Router } from 'express';
import type { PublishStatus } from '../../src/types.ts';
import {
  createCategory,
  createCourse,
  createFounder,
  founderReadiness,
  getOverview,
  listAllCourses,
  listCategoriesAdmin,
  listCourseWeekRows,
  listFounders,
  listUsers,
  reorderCategories,
  reorderFounders,
  setCourseProgramWeek,
  setCourseStatus,
  updateCategory,
  updateCourse,
  updateFounder,
  updateUser,
} from '../services/catalogService.js';
import { ensureLecturerForUser, listApplications, reviewApplication, syncLecturerFounderFlag } from '../services/lecturerService.js';
import { getAnalyticsSummary, trackEvent } from '../services/analyticsService.js';
import { adminSetInstallmentStatus, getTrackDashboard } from '../services/trackService.js';
import { listPayments, recordPayment } from '../services/paymentService.js';
import { authUser } from '../middleware/auth.js';
import { isStripeEnabled } from '../services/stripeService.js';
import { isS3Enabled } from '../services/s3Upload.js';
import { getSetting, setSetting } from '../services/settingsService.js';
import { adminCreateUser } from '../services/authService.js';
import { listAuditLogs, writeAudit } from '../services/auditService.js';
import {
  listPremium88Applications,
  reviewPremium88Application,
} from '../services/premium88Service.js';
import {
  assignOpenTicketsToRaffle,
  createRaffle,
  drawRaffleWinner,
  getRaffleDashboard,
} from '../services/raffleService.js';
import { listCrmLeads } from '../services/leadsService.js';
import { listAdminNotifications } from '../services/notificationsService.js';
import { listTeamMessagesAdmin, sendTeamMessage } from '../services/lecturerInboxService.js';
import {
  listAccessibilityReports,
  updateAccessibilityReportStatus,
  type AccessibilityReportStatus,
} from '../services/accessibilityReportService.js';
import {
  getWebinarConfig,
  listWebinarRegistrations,
  saveWebinarConfig,
  countWebinarRegistrations,
  getWebinarFunnelStats,
} from '../services/webinarService.js';

const router = Router();

router.get('/overview', (_req, res) => {
  try {
    res.json(getOverview());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/readiness', (_req, res) => {
  try {
    const courses = listCourseWeekRows();
    const stripeEnabled = isStripeEnabled();
    res.json({
      stripeEnabled,
      billingMode: stripeEnabled ? 'stripe' : 'pilot_manual',
      s3Enabled: isS3Enabled(),
      raffleTermsApproved: getSetting('raffle_terms_approved') === '1',
      courses,
      founders: listFounders().map(founderReadiness),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/settings', (req, res) => {
  try {
    const key = String(req.body?.key || '');
    const allowed = [
      'raffle_terms_approved',
      'legal_terms',
      'legal_privacy',
      'legal_raffle',
    ];
    if (!allowed.includes(key)) {
      res.status(400).json({ error: 'הגדרה לא תקינה' });
      return;
    }
    if (key === 'raffle_terms_approved') {
      const value = req.body?.value === true || req.body?.value === '1' || req.body?.value === 1 ? '1' : '0';
      setSetting(key, value);
      writeAudit({
        adminUserId: authUser(req).id,
        actionType: 'setting_updated',
        entityType: 'setting',
        entityId: key,
        after: { value: value === '1' },
      });
      res.json({ key, value: value === '1' });
      return;
    }
    const value = String(req.body?.value ?? '');
    setSetting(key, value);
    writeAudit({
      adminUserId: authUser(req).id,
      actionType: 'legal_page_updated',
      entityType: 'legal',
      entityId: key,
      after: { length: value.length },
    });
    res.json({ key, value });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/legal', (_req, res) => {
  try {
    res.json({
      terms: getSetting('legal_terms'),
      privacy: getSetting('legal_privacy'),
      raffle: getSetting('legal_raffle'),
      raffleTermsApproved: getSetting('raffle_terms_approved') === '1',
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/accessibility-reports', (_req, res) => {
  try {
    res.json({ reports: listAccessibilityReports() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/accessibility-reports/:id', (req, res) => {
  try {
    const status = String(req.body?.status || '') as AccessibilityReportStatus;
    if (!['open', 'in_progress', 'resolved'].includes(status)) {
      res.status(400).json({ error: 'סטטוס לא תקין' });
      return;
    }
    const report = updateAccessibilityReportStatus(
      String(req.params.id),
      status,
      String(req.body?.adminNotes || ''),
    );
    writeAudit({
      adminUserId: authUser(req).id,
      actionType: 'accessibility_report_updated',
      entityType: 'accessibility_report',
      entityId: report.id,
      after: report,
    });
    res.json({ report });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.get('/analytics', (_req, res) => {
  try {
    res.json(getAnalyticsSummary());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/courses', (_req, res) => {
  try {
    res.json({ courses: listAllCourses() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/courses', (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    if (!title) {
      res.status(400).json({ error: 'נא להזין שם הרצאה' });
      return;
    }
    res.status(201).json({ course: createCourse(req.body) });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.patch('/courses/:id/program-week', (req, res) => {
  try {
    res.json({ course: setCourseProgramWeek(req.params.id, Number(req.body?.programWeek)) });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.patch('/courses/:id', (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    if (!title) {
      res.status(400).json({ error: 'נא להזין שם הרצאה' });
      return;
    }
    res.json({ course: updateCourse(req.params.id, req.body) });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.patch('/courses/:id/status', (req, res) => {
  try {
    const status = String(req.body?.status || '') as PublishStatus;
    const course = setCourseStatus(req.params.id, status);
    const actor = authUser(req).id;
    if (status === 'published') {
      trackEvent('lecture_published', { userId: actor, properties: { courseId: req.params.id } });
      trackEvent('admin_published_video', { userId: actor, properties: { courseId: req.params.id } });
    }
    res.json({ course });
  } catch (err) {
    const code = (err as { status?: number }).status || 500;
    res.status(code).json({ error: (err as Error).message });
  }
});

router.get('/users', (_req, res) => {
  try {
    res.json({ users: listUsers() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/users', (req, res) => {
  try {
    const id = adminCreateUser(
      String(req.body?.fullName || req.body?.name || ''),
      String(req.body?.email || ''),
      String(req.body?.password || '')
    );
    const user = listUsers().find((u) => u.id === id);
    res.status(201).json({ user });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.patch('/users/:id', (req, res) => {
  try {
    const before = listUsers().find((u) => u.id === req.params.id);
    const user = updateUser(req.params.id, req.body || {});
    if (user?.role === 'instructor') {
      ensureLecturerForUser(user.id, user.name);
    }
    if (req.body?.isFounder !== undefined && user) {
      syncLecturerFounderFlag(user.id, Boolean(user.isFounder), user.name);
    } else if (user?.role === 'instructor' && user.isFounder) {
      syncLecturerFounderFlag(user.id, true, user.name);
    }
    const actor = authUser(req).id;
    if (req.body?.role && before && before.role !== user?.role) {
      trackEvent('admin_changed_user_role', {
        userId: actor,
        properties: { targetId: req.params.id, role: String(req.body.role) },
      });
    }
    if (req.body?.blocked !== undefined && before && before.blocked !== user?.blocked && user?.blocked) {
      trackEvent('admin_blocked_user', { userId: actor, properties: { targetId: req.params.id } });
    }
    if (
      req.body?.subscriptionPlan &&
      before &&
      before.subscriptionPlan !== user?.subscriptionPlan &&
      user?.subscriptionPlan
    ) {
      recordPayment(req.params.id, user.subscriptionPlan, 'admin');
      if (user.subscriptionPlan !== 'none') {
        trackEvent('admin_granted_access', {
          userId: actor,
          properties: { targetId: req.params.id, plan: user.subscriptionPlan },
        });
      }
    }
    writeAudit({
      adminUserId: actor,
      actionType: 'user_updated',
      entityType: 'user',
      entityId: req.params.id,
      before,
      after: user,
    });
    res.json({ user });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.get('/applications', (_req, res) => {
  try {
    res.json({ applications: listApplications() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/applications/:id', (req, res) => {
  try {
    const action = String(req.body?.action || '');
    if (action !== 'approved' && action !== 'rejected' && action !== 'more_info') {
      res.status(400).json({ error: 'פעולה לא תקינה' });
      return;
    }
    const note = typeof req.body?.adminNote === 'string' ? req.body.adminNote : '';
    const application = reviewApplication(req.params.id, action, note);
    if (action === 'approved') {
      trackEvent('lecturer_approved', { userId: authUser(req).id, properties: { applicationId: req.params.id } });
    }
    if (action === 'rejected') {
      trackEvent('lecturer_rejected', { userId: authUser(req).id, properties: { applicationId: req.params.id } });
    }
    res.json({ application });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.get('/founders', (_req, res) => {
  try {
    res.json({ founders: listFounders() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/founders', (req, res) => {
  try {
    const founder = createFounder({
      name: String(req.body?.name || ''),
      title: String(req.body?.title || ''),
      bio: String(req.body?.bio || ''),
      avatarUrl: String(req.body?.avatarUrl || ''),
    });
    res.status(201).json({ founder });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.patch('/founders/order', (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    res.json({ founders: reorderFounders(ids) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/founders/:id', (req, res) => {
  try {
    const founder = updateFounder(req.params.id, {
      avatarUrl: req.body?.avatarUrl !== undefined ? String(req.body.avatarUrl) : undefined,
      externalLinks: Array.isArray(req.body?.externalLinks) ? req.body.externalLinks : undefined,
    });
    res.json({ founder });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.get('/tracks', (_req, res) => {
  try {
    res.json({
      ...getTrackDashboard(),
      billingMode: isStripeEnabled() ? 'stripe' : 'pilot_manual',
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/tracks/installments/:id', (req, res) => {
  try {
    const status = String(req.body?.status || '');
    if (status !== 'paid' && status !== 'failed' && status !== 'due') {
      res.status(400).json({ error: 'סטטוס לא תקין' });
      return;
    }
    const result = adminSetInstallmentStatus(req.params.id, status);
    res.json(result);
  } catch (err) {
    const statusCode = (err as { status?: number }).status || 500;
    res.status(statusCode).json({ error: (err as Error).message });
  }
});

router.get('/payments', (_req, res) => {
  try {
    res.json({ payments: listPayments() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/categories', (_req, res) => {
  try {
    res.json({ categories: listCategoriesAdmin() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/categories', (req, res) => {
  try {
    const category = createCategory(req.body || {});
    writeAudit({
      adminUserId: authUser(req).id,
      actionType: 'category_created',
      entityType: 'category',
      entityId: category.id,
      after: category,
    });
    res.status(201).json({ category });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.patch('/categories/order', (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    const categories = reorderCategories(ids);
    writeAudit({
      adminUserId: authUser(req).id,
      actionType: 'categories_reordered',
      entityType: 'category',
      after: { ids },
    });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/categories/:id', (req, res) => {
  try {
    const before = listCategoriesAdmin().find((item) => item.id === req.params.id);
    const category = updateCategory(req.params.id, req.body || {});
    writeAudit({
      adminUserId: authUser(req).id,
      actionType: 'category_updated',
      entityType: 'category',
      entityId: req.params.id,
      before,
      after: category,
    });
    res.json({ category });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.get('/premium-88', (_req, res) => {
  try {
    res.json({ applications: listPremium88Applications() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/premium-88/:id', (req, res) => {
  try {
    const status = String(req.body?.status || '');
    const adminNotes = typeof req.body?.adminNotes === 'string' ? req.body.adminNotes : undefined;
    const before = listPremium88Applications().find((item) => item.id === req.params.id);
    const application = reviewPremium88Application(req.params.id, status, adminNotes);
    writeAudit({
      adminUserId: authUser(req).id,
      actionType: 'premium_88_reviewed',
      entityType: 'premium_88_application',
      entityId: req.params.id,
      before,
      after: application,
    });
    res.json({ application });
  } catch (err) {
    const statusCode = (err as { status?: number }).status || 500;
    res.status(statusCode).json({ error: (err as Error).message });
  }
});

router.get('/audit-logs', (_req, res) => {
  try {
    res.json({ logs: listAuditLogs(150) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/leads', (_req, res) => {
  try {
    res.json({ leads: listCrmLeads() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/notifications', (_req, res) => {
  try {
    const notifications = listAdminNotifications();
    res.json({
      notifications,
      counts: {
        total: notifications.length,
        high: notifications.filter((item) => item.severity === 'high').length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/team-messages', (_req, res) => {
  try {
    res.json({ messages: listTeamMessagesAdmin() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/team-messages', (req, res) => {
  try {
    const message = sendTeamMessage(
      authUser(req).id,
      String(req.body?.lecturerUserId || ''),
      String(req.body?.subject || ''),
      String(req.body?.body || '')
    );
    writeAudit({
      adminUserId: authUser(req).id,
      actionType: 'team_message_sent',
      entityType: 'team_message',
      entityId: message.id,
      after: { lecturerUserId: message.lecturerUserId, subject: message.subject },
    });
    res.status(201).json({ message });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.get('/raffles', (_req, res) => {
  try {
    res.json(getRaffleDashboard());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/raffles', (req, res) => {
  try {
    const raffle = createRaffle(
      {
        title: String(req.body?.title || ''),
        description: String(req.body?.description || ''),
        endsAt: req.body?.endsAt ? String(req.body.endsAt) : undefined,
      },
      authUser(req).id
    );
    res.status(201).json({ raffle });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.post('/raffles/:id/assign-tickets', (req, res) => {
  try {
    const result = assignOpenTicketsToRaffle(req.params.id);
    writeAudit({
      adminUserId: authUser(req).id,
      actionType: 'raffle_tickets_assigned',
      entityType: 'raffle',
      entityId: req.params.id,
      after: result,
    });
    res.json(result);
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.post('/raffles/:id/draw', (req, res) => {
  try {
    const raffle = drawRaffleWinner(req.params.id, authUser(req).id);
    res.json({ raffle });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.get('/webinar', (_req, res) => {
  try {
    res.json({
      config: getWebinarConfig(),
      registrations: listWebinarRegistrations(300),
      totalRegistrations: countWebinarRegistrations(),
      funnel: getWebinarFunnelStats(),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/webinar', (req, res) => {
  try {
    const config = saveWebinarConfig(req.body?.config || req.body || {});
    writeAudit({
      adminUserId: authUser(req).id,
      actionType: 'webinar_config_updated',
      entityType: 'webinar',
      entityId: 'config',
      after: { title: config.title, date: config.date },
    });
    res.json({ config });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
