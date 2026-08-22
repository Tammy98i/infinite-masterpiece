import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';
import { getSetting } from './settingsService.js';
import { trackEvent } from './analyticsService.js';
import { writeAudit } from './auditService.js';

export function listRaffles() {
  return (
    getDb()
      .prepare(`SELECT * FROM raffles ORDER BY created_at DESC LIMIT 100`)
      .all() as Array<Record<string, unknown>>
  ).map(mapRaffle);
}

function mapRaffle(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description || ''),
    status: String(row.status || 'draft'),
    startsAt: row.starts_at ? String(row.starts_at) : null,
    endsAt: row.ends_at ? String(row.ends_at) : null,
    winnerUserId: row.winner_user_id ? String(row.winner_user_id) : null,
    createdAt: String(row.created_at || ''),
  };
}

export function createRaffle(input: { title: string; description?: string; endsAt?: string }, adminUserId: string) {
  const title = String(input.title || '').trim();
  if (!title) throw Object.assign(new Error('נא להזין שם הגרלה'), { status: 400 });
  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO raffles (id, title, description, status, starts_at, ends_at, created_at)
       VALUES (?, ?, ?, 'open', ?, ?, ?)`
    )
    .run(
      id,
      title,
      String(input.description || '').trim(),
      new Date().toISOString(),
      input.endsAt ? String(input.endsAt) : null,
      new Date().toISOString()
    );
  writeAudit({
    adminUserId,
    actionType: 'raffle_created',
    entityType: 'raffle',
    entityId: id,
    after: { title },
  });
  trackEvent('raffle_created', { userId: adminUserId, properties: { raffleId: id } });
  return listRaffles().find((item) => item.id === id)!;
}

export function listRaffleTickets(raffleId?: string) {
  const rows = raffleId
    ? (getDb()
        .prepare(
          `SELECT t.*, u.full_name as user_name, u.email as user_email
           FROM raffle_tickets t
           LEFT JOIN users u ON u.id = t.user_id
           WHERE t.raffle_id = ? OR (t.raffle_id = '' AND ? = '')
           ORDER BY t.created_at DESC LIMIT 300`
        )
        .all(raffleId, raffleId) as Array<Record<string, unknown>>)
    : (getDb()
        .prepare(
          `SELECT t.*, u.full_name as user_name, u.email as user_email
           FROM raffle_tickets t
           LEFT JOIN users u ON u.id = t.user_id
           ORDER BY t.created_at DESC LIMIT 300`
        )
        .all() as Array<Record<string, unknown>>);

  return rows.map((row) => ({
    id: String(row.id),
    userId: String(row.user_id || ''),
    userName: String(row.user_name || ''),
    userEmail: String(row.user_email || ''),
    trackType: String(row.track_type || ''),
    ticketsCount: Number(row.tickets_count || 0),
    raffleId: String(row.raffle_id || ''),
    grantedReason: String(row.granted_reason || ''),
    createdAt: String(row.created_at || ''),
  }));
}

export function assignOpenTicketsToRaffle(raffleId: string) {
  const raffle = getDb().prepare(`SELECT id, status FROM raffles WHERE id = ?`).get(raffleId) as
    | { id: string; status: string }
    | undefined;
  if (!raffle) throw Object.assign(new Error('הגרלה לא נמצאה'), { status: 404 });
  if (raffle.status !== 'open') throw Object.assign(new Error('אפשר לשייך כרטיסים רק להגרלה פתוחה'), { status: 400 });
  const result = getDb()
    .prepare(`UPDATE raffle_tickets SET raffle_id = ? WHERE raffle_id = '' OR raffle_id IS NULL`)
    .run(raffleId);
  return { updated: Number(result.changes || 0) };
}

export function drawRaffleWinner(raffleId: string, adminUserId: string) {
  if (getSetting('raffle_terms_approved') !== '1') {
    throw Object.assign(new Error('יש לאשר תקנון הגרלות לפני הגרלה'), { status: 400 });
  }
  const raffle = getDb().prepare(`SELECT * FROM raffles WHERE id = ?`).get(raffleId) as
    | Record<string, unknown>
    | undefined;
  if (!raffle) throw Object.assign(new Error('הגרלה לא נמצאה'), { status: 404 });
  if (String(raffle.status) === 'drawn') {
    throw Object.assign(new Error('כבר הוגרל זוכה להגרלה הזו'), { status: 400 });
  }

  const tickets = listRaffleTickets(raffleId).filter((item) => item.userId && item.ticketsCount > 0);
  if (tickets.length === 0) {
    throw Object.assign(new Error('אין כרטיסים משויכים להגרלה'), { status: 400 });
  }

  const pool: string[] = [];
  for (const ticket of tickets) {
    for (let i = 0; i < ticket.ticketsCount; i += 1) pool.push(ticket.userId);
  }
  const winnerUserId = pool[Math.floor(Math.random() * pool.length)];
  const winner = getDb().prepare(`SELECT full_name FROM users WHERE id = ?`).get(winnerUserId) as
    | { full_name: string }
    | undefined;

  getDb()
    .prepare(`UPDATE raffles SET status = 'drawn', winner_user_id = ? WHERE id = ?`)
    .run(winnerUserId, raffleId);

  writeAudit({
    adminUserId,
    actionType: 'raffle_winner_selected',
    entityType: 'raffle',
    entityId: raffleId,
    after: { winnerUserId, winnerName: winner?.full_name || '' },
  });
  trackEvent('raffle_winner_selected', {
    userId: adminUserId,
    properties: { raffleId, winnerUserId },
  });

  return listRaffles().find((item) => item.id === raffleId)!;
}

export function getRaffleDashboard() {
  const raffles = listRaffles().map((raffle) => {
    const winner = raffle.winnerUserId
      ? (getDb().prepare(`SELECT full_name FROM users WHERE id = ?`).get(raffle.winnerUserId) as
          | { full_name: string }
          | undefined)
      : undefined;
    const ticketStats = getDb()
      .prepare(
        `SELECT COALESCE(SUM(tickets_count), 0) as tickets, COUNT(DISTINCT user_id) as participants
         FROM raffle_tickets WHERE raffle_id = ?`
      )
      .get(raffle.id) as { tickets: number; participants: number };
    return {
      ...raffle,
      winnerName: winner?.full_name || '',
      ticketsCount: Number(ticketStats.tickets || 0),
      participants: Number(ticketStats.participants || 0),
    };
  });
  return {
    termsApproved: getSetting('raffle_terms_approved') === '1',
    unassignedTickets: Number(
      (getDb()
        .prepare(
          `SELECT COALESCE(SUM(tickets_count), 0) as c FROM raffle_tickets WHERE raffle_id = '' OR raffle_id IS NULL`
        )
        .get() as { c: number }).c || 0
    ),
    raffles,
    tickets: listRaffleTickets(),
  };
}
