import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';
import { trackEvent } from './analyticsService.js';
import { resolveLecturerReferralId } from './lecturerService.js';
import {
  BRAVE_PRICE_BEFORE_VAT,
  HESITANT_INSTALLMENTS,
  HESITANT_TOTAL_BEFORE_VAT,
  RAFFLE_TICKETS,
  nextMotzaeiShabbatIso,
  type EntryTrackId,
} from '../../src/data/entryTracks.ts';

const VAT_RATE = 0.17;

function vatOf(amount: number) {
  return Math.round(amount * VAT_RATE * 100) / 100;
}

function count(sql: string, param?: string | number) {
  const row =
    param === undefined
      ? (getDb().prepare(sql).get() as { c: number })
      : (getDb().prepare(sql).get(param) as { c: number });
  return row.c;
}

export interface TrackLeadInput {
  trackType: string;
  fullName: string;
  phone: string;
  email: string;
  field?: string;
  hesitationReason?: string;
  hasProduct?: string;
  hasSold?: string;
  goal90?: string;
  links?: string;
  referredByLecturerId?: string;
}

export function createTrackLead(input: TrackLeadInput) {
  const trackType = input.trackType === 'brave' ? 'brave' : input.trackType === 'hesitant' ? 'hesitant' : '';
  if (!trackType) throw Object.assign(new Error('מסלול לא תקין'), { status: 400 });
  const fullName = String(input.fullName || '').trim();
  const phone = String(input.phone || '').trim();
  const email = String(input.email || '').trim();
  if (!fullName || !phone || !email) {
    throw Object.assign(new Error('נא למלא שם, טלפון ואימייל'), { status: 400 });
  }

  const id = randomUUID();
  const referredByLecturerId = resolveLecturerReferralId(input.referredByLecturerId);
  getDb()
    .prepare(
      `INSERT INTO track_leads (
        id, track_type, full_name, phone, email, field, hesitation_reason,
        has_product, has_sold, goal_90, links, referred_by_lecturer_id, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`
    )
    .run(
      id,
      trackType,
      fullName,
      phone,
      email,
      String(input.field || '').trim(),
      String(input.hesitationReason || ''),
      String(input.hasProduct || ''),
      String(input.hasSold || ''),
      String(input.goal90 || ''),
      String(input.links || ''),
      referredByLecturerId,
      new Date().toISOString()
    );

  const planId = createLeadPaymentPlan(trackType as EntryTrackId, id);

  trackEvent(trackType === 'brave' ? 'brave_track_clicked' : 'hesitant_8_payment_started', {
    properties: { leadId: id },
  });

  return { id, trackType, planId };
}

function copyLeadReferralToUser(leadId: string, userId: string) {
  const lead = getDb()
    .prepare(`SELECT referred_by_lecturer_id FROM track_leads WHERE id = ?`)
    .get(leadId) as { referred_by_lecturer_id?: string } | undefined;
  const referralId = resolveLecturerReferralId(lead?.referred_by_lecturer_id);
  if (!referralId) return;
  getDb()
    .prepare(
      `UPDATE users SET referred_by_lecturer_id = ?
       WHERE id = ? AND (referred_by_lecturer_id IS NULL OR referred_by_lecturer_id = '')`
    )
    .run(referralId, userId);
}

function createLeadPaymentPlan(trackType: EntryTrackId, leadId: string) {
  const before = trackType === 'brave' ? BRAVE_PRICE_BEFORE_VAT : HESITANT_TOTAL_BEFORE_VAT;
  const vat = vatOf(before);
  const planId = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO payment_plans (
        id, user_id, lead_id, track_type, total_amount_before_vat, vat_amount, total_amount_with_vat, status, created_at
      ) VALUES (?, NULL, ?, ?, ?, ?, ?, 'lead', ?)`
    )
    .run(planId, leadId, trackType, before, vat, before + vat, new Date().toISOString());

  if (trackType === 'hesitant') {
    const insert = getDb().prepare(
      `INSERT INTO payment_installments (
        id, payment_plan_id, installment_number, amount_before_vat, vat_amount, amount_with_vat, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'scheduled')`
    );
    for (const item of HESITANT_INSTALLMENTS) {
      const amountVat = vatOf(item.amountBeforeVat);
      insert.run(randomUUID(), planId, item.number, item.amountBeforeVat, amountVat, item.amountBeforeVat + amountVat);
    }
  } else {
    getDb()
      .prepare(
        `INSERT INTO payment_installments (
          id, payment_plan_id, installment_number, amount_before_vat, vat_amount, amount_with_vat, status
        ) VALUES (?, ?, 1, ?, ?, ?, 'scheduled')`
      )
      .run(randomUUID(), planId, before, vat, before + vat);
  }
  return planId;
}

export function applyEntryTrackToUser(userId: string, trackType: EntryTrackId, phase: number) {
  const tickets = RAFFLE_TICKETS[trackType];
  const status = trackType === 'brave' && phase >= 1 ? 'brave_paid' : phase >= 4 ? 'hesitant_completed' : 'active';
  getDb()
    .prepare(
      `UPDATE users SET entry_track = ?, current_payment_phase = ?, raffle_tickets_count = ?, payment_plan_status = ? WHERE id = ?`
    )
    .run(trackType, phase, tickets, status, userId);

  const already = getDb()
    .prepare(`SELECT id FROM raffle_tickets WHERE user_id = ? AND granted_reason = 'track_assigned'`)
    .get(userId);
  if (!already) {
    getDb()
      .prepare(
        `INSERT INTO raffle_tickets (id, user_id, track_type, tickets_count, granted_reason, created_at)
         VALUES (?, ?, ?, ?, 'track_assigned', ?)`
      )
      .run(randomUUID(), userId, trackType, tickets, new Date().toISOString());
    trackEvent('raffle_ticket_granted', { userId, properties: { trackType, tickets: String(tickets) } });
  }

  trackEvent('vod_access_unlocked', { userId, properties: { trackType, phase: String(phase) } });
}

export function getLeadForCheckout(leadId: string) {
  const row = getDb()
    .prepare(`SELECT id, track_type, email, full_name FROM track_leads WHERE id = ?`)
    .get(leadId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: String(row.id),
    trackType: String(row.track_type) as EntryTrackId,
    email: String(row.email),
    fullName: String(row.full_name),
  };
}

export function getPlanForLead(leadId: string) {
  const row = getDb()
    .prepare(`SELECT id, track_type, status FROM payment_plans WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1`)
    .get(leadId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return { id: String(row.id), trackType: String(row.track_type), status: String(row.status) };
}

export function fulfillPaidCheckout(input: {
  leadId: string;
  planId: string;
  track: EntryTrackId;
  installmentNumber: number;
  transactionId: string;
  customerId?: string;
  paymentMethodId?: string;
  email?: string;
}) {
  const db = getDb();
  const installment = db
    .prepare(
      `SELECT id, status FROM payment_installments WHERE payment_plan_id = ? AND installment_number = ?`
    )
    .get(input.planId, input.installmentNumber) as { id: string; status: string } | undefined;
  if (!installment) throw Object.assign(new Error('תשלום לא נמצא'), { status: 404 });
  if (installment.status === 'paid') return { alreadyPaid: true };

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE payment_installments
     SET status = 'paid', paid_at = ?, payment_provider_transaction_id = ?
     WHERE id = ?`
  ).run(now, input.transactionId, installment.id);

  const planStatus = input.track === 'brave' ? 'paid' : input.installmentNumber >= 4 ? 'paid' : 'active';
  db.prepare(`UPDATE payment_plans SET status = ? WHERE id = ?`).run(planStatus, input.planId);
  if (input.customerId) {
    db.prepare(`UPDATE payment_plans SET stripe_customer_id = ? WHERE id = ?`).run(input.customerId, input.planId);
  }
  if (input.paymentMethodId) {
    db.prepare(`UPDATE payment_plans SET stripe_payment_method_id = ? WHERE id = ?`).run(
      input.paymentMethodId,
      input.planId
    );
  }

  const leadStatus =
    input.track === 'brave' || input.installmentNumber >= 4
      ? 'paid'
      : input.installmentNumber === 1
        ? 'first_paid'
        : `phase_${input.installmentNumber}`;
  db.prepare(`UPDATE track_leads SET status = ? WHERE id = ?`).run(leadStatus, input.leadId);

  const email = String(input.email || '').trim().toLowerCase();
  let user = email
    ? (db.prepare(`SELECT id FROM users WHERE lower(email) = ?`).get(email) as { id: string } | undefined)
    : undefined;
  if (!user) {
    const planRow = db.prepare(`SELECT user_id FROM payment_plans WHERE id = ?`).get(input.planId) as
      | { user_id: string | null }
      | undefined;
    if (planRow?.user_id) user = { id: String(planRow.user_id) };
  }
  if (user) {
    db.prepare(`UPDATE payment_plans SET user_id = ? WHERE id = ?`).run(user.id, input.planId);
    copyLeadReferralToUser(input.leadId, user.id);
    applyEntryTrackToUser(user.id, input.track, input.installmentNumber);
    recordPaymentSafe(user.id, input.track);
  }

  if (input.track === 'hesitant' && input.installmentNumber < 4) {
    const dueAt = nextMotzaeiShabbatIso();
    db.prepare(
      `UPDATE payment_installments SET due_at = ? WHERE payment_plan_id = ? AND installment_number = ? AND status = 'scheduled'`
    ).run(dueAt, input.planId, input.installmentNumber + 1);
    if (user) {
      db.prepare(`UPDATE users SET next_payment_due_at = ? WHERE id = ?`).run(dueAt, user.id);
    }
  } else if (user) {
    db.prepare(`UPDATE users SET next_payment_due_at = NULL WHERE id = ?`).run(user.id);
  }

  trackEvent('track_payment_completed', {
    properties: {
      leadId: input.leadId,
      track: input.track,
      installment: String(input.installmentNumber),
    },
  });

  return { alreadyPaid: false, userId: user?.id || null };
}

export function listDueInstallments() {
  const now = new Date().toISOString();
  return (
    getDb()
      .prepare(
        `SELECT i.id as installment_id, i.installment_number, i.amount_before_vat, i.status, i.due_at,
                p.id as plan_id, p.lead_id, p.track_type, p.stripe_customer_id, p.stripe_payment_method_id,
                l.email, l.full_name
         FROM payment_installments i
         JOIN payment_plans p ON p.id = i.payment_plan_id
         LEFT JOIN track_leads l ON l.id = p.lead_id
         WHERE i.installment_number > 1
           AND i.status IN ('scheduled', 'due')
           AND i.due_at IS NOT NULL
           AND i.due_at <= ?
         ORDER BY i.due_at ASC`
      )
      .all(now) as Array<Record<string, unknown>>
  ).map((row) => ({
    installmentId: String(row.installment_id),
    installmentNumber: Number(row.installment_number),
    amountBeforeVat: Number(row.amount_before_vat),
    status: String(row.status),
    dueAt: String(row.due_at),
    planId: String(row.plan_id),
    leadId: String(row.lead_id || ''),
    trackType: String(row.track_type) as EntryTrackId,
    customerId: String(row.stripe_customer_id || ''),
    paymentMethodId: String(row.stripe_payment_method_id || ''),
    email: String(row.email || ''),
    fullName: String(row.full_name || ''),
  }));
}

export function markInstallmentStatus(id: string, status: 'due' | 'failed' | 'scheduled') {
  getDb().prepare(`UPDATE payment_installments SET status = ? WHERE id = ?`).run(status, id);
}

export function adminSetInstallmentStatus(installmentId: string, status: 'paid' | 'failed' | 'due') {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT i.id, i.installment_number, i.status as installment_status, i.payment_plan_id,
              p.lead_id, p.track_type, l.email
       FROM payment_installments i
       JOIN payment_plans p ON p.id = i.payment_plan_id
       LEFT JOIN track_leads l ON l.id = p.lead_id
       WHERE i.id = ?`
    )
    .get(installmentId) as
    | {
        id: string;
        installment_number: number;
        installment_status: string;
        payment_plan_id: string;
        lead_id: string | null;
        track_type: string;
        email: string | null;
      }
    | undefined;

  if (!row) throw Object.assign(new Error('פעימה לא נמצאה'), { status: 404 });
  if (!row.lead_id) throw Object.assign(new Error('לפעימה אין ליד מקושר'), { status: 400 });

  if (status === 'paid') {
    const result = fulfillPaidCheckout({
      leadId: String(row.lead_id),
      planId: String(row.payment_plan_id),
      track: (row.track_type === 'brave' ? 'brave' : 'hesitant') as EntryTrackId,
      installmentNumber: Number(row.installment_number),
      transactionId: `manual:${randomUUID()}`,
      email: String(row.email || ''),
    });
    return { ok: true as const, status: 'paid' as const, alreadyPaid: Boolean(result.alreadyPaid), userId: result.userId };
  }

  if (row.installment_status === 'paid') {
    throw Object.assign(new Error('לא ניתן לשנות פעימה שכבר שולמה'), { status: 400 });
  }

  markInstallmentStatus(installmentId, status);
  return { ok: true as const, status, alreadyPaid: false, userId: null as string | null };
}

function recordPaymentSafe(userId: string, plan: string) {
  try {
    getDb()
      .prepare(`INSERT INTO payments (id, user_id, plan, source, created_at) VALUES (?, ?, ?, 'user', ?)`)
      .run(randomUUID(), userId, plan, new Date().toISOString());
  } catch {
    /* ledger must not block access */
  }
}

function mapInstallment(row: Record<string, unknown>) {
  const tx = String(row.payment_provider_transaction_id || '');
  return {
    id: String(row.id),
    number: Number(row.installment_number),
    amountBeforeVat: Number(row.amount_before_vat),
    vatAmount: Number(row.vat_amount),
    amountWithVat: Number(row.amount_with_vat),
    dueAt: row.due_at ? String(row.due_at) : null,
    paidAt: row.paid_at ? String(row.paid_at) : null,
    status: String(row.status),
    transactionId: tx,
    paymentSource: tx.startsWith('manual:') ? 'manual' : tx ? 'stripe' : '',
  };
}

export function getTrackDashboard() {
  const db = getDb();
  const leadRows = db
    .prepare(
      `SELECT id, track_type, full_name, phone, email, field, hesitation_reason,
              has_product, has_sold, goal_90, links, referred_by_lecturer_id, status, created_at
       FROM track_leads ORDER BY created_at DESC LIMIT 200`
    )
    .all() as Array<Record<string, unknown>>;

  const planStmt = db.prepare(
    `SELECT id, user_id, total_amount_before_vat, vat_amount, total_amount_with_vat, status, created_at
     FROM payment_plans WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1`
  );
  const installmentsStmt = db.prepare(
    `SELECT id, installment_number, amount_before_vat, vat_amount, amount_with_vat,
            due_at, paid_at, status, payment_provider_transaction_id
     FROM payment_installments WHERE payment_plan_id = ? ORDER BY installment_number ASC`
  );
  const userStmt = db.prepare(`SELECT id, full_name FROM users WHERE lower(email) = lower(?) LIMIT 1`);
  const lecturerStmt = db.prepare(`SELECT name FROM lecturers WHERE id = ? LIMIT 1`);

  const leads = leadRows.map((row) => {
    const leadId = String(row.id);
    const email = String(row.email);
    const planRow = planStmt.get(leadId) as Record<string, unknown> | undefined;
    const installments = planRow
      ? (installmentsStmt.all(String(planRow.id)) as Array<Record<string, unknown>>).map(mapInstallment)
      : [];
    const userRow = userStmt.get(email) as { id: string; full_name: string } | undefined;
    const referralId = String(row.referred_by_lecturer_id || '');
    const lecturerRow = referralId
      ? (lecturerStmt.get(referralId) as { name: string } | undefined)
      : undefined;
    const currentInstallment =
      installments.find((item) => item.status === 'due' || item.status === 'failed') ||
      installments.find((item) => item.status === 'scheduled') ||
      installments[installments.length - 1] ||
      null;

    return {
      id: leadId,
      trackType: String(row.track_type),
      name: String(row.full_name),
      phone: String(row.phone),
      email,
      field: String(row.field || ''),
      hesitationReason: String(row.hesitation_reason || ''),
      hasProduct: String(row.has_product || ''),
      hasSold: String(row.has_sold || ''),
      goal90: String(row.goal_90 || ''),
      links: String(row.links || ''),
      referredByLecturerId: referralId,
      referredByLecturerName: lecturerRow?.name ? String(lecturerRow.name) : '',
      status: String(row.status),
      createdAt: String(row.created_at),
      userId: userRow?.id || (planRow?.user_id ? String(planRow.user_id) : null),
      userName: userRow?.full_name ? String(userRow.full_name) : null,
      plan: planRow
        ? {
            id: String(planRow.id),
            amountBeforeVat: Number(planRow.total_amount_before_vat),
            vatAmount: Number(planRow.vat_amount),
            amountWithVat: Number(planRow.total_amount_with_vat),
            status: String(planRow.status),
            createdAt: String(planRow.created_at),
          }
        : null,
      installments,
      currentInstallment,
    };
  });

  const paidN = (n: number) =>
    count(
      `SELECT COUNT(*) as c FROM payment_installments WHERE installment_number = ? AND status = 'paid'`,
      n
    );

  return {
    braveLeads: count(`SELECT COUNT(*) as c FROM track_leads WHERE track_type = 'brave'`),
    hesitantLeads: count(`SELECT COUNT(*) as c FROM track_leads WHERE track_type = 'hesitant'`),
    braveUsers: count(`SELECT COUNT(*) as c FROM users WHERE entry_track = 'brave'`),
    hesitantUsers: count(`SELECT COUNT(*) as c FROM users WHERE entry_track = 'hesitant'`),
    paid8: paidN(1),
    paid80: paidN(2),
    paid800: paidN(3),
    paid8000: paidN(4),
    dueNow: listDueInstallments().length,
    failedPayments: count(`SELECT COUNT(*) as c FROM payment_installments WHERE status = 'failed'`),
    raffleTicketsGranted: count(`SELECT COALESCE(SUM(tickets_count), 0) as c FROM raffle_tickets`),
    followUp: leads.filter((item) => item.status === 'new').length,
    revenueByPhase: HESITANT_INSTALLMENTS.map((item) => ({
      installment: item.number,
      amountBeforeVat: item.amountBeforeVat,
      paidCount: paidN(item.number),
      revenue:
        item.amountBeforeVat *
        count(
          `SELECT COUNT(*) as c FROM payment_installments WHERE installment_number = ? AND status = 'paid'`,
          item.number
        ),
    })),
    leads,
  };
}
