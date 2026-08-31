import { supabaseRest } from './supabaseAdmin.js';

export type TeamMessageRow = {
  id: string;
  to_user_id?: string | null;
  subject: string;
  body: string;
  created_by?: string | null;
  created_at: string;
};

export async function listTeamMessages() {
  const res = await supabaseRest<TeamMessageRow[]>(
    'team_messages?select=*&order=created_at.desc&limit=100'
  );
  if (!res.ok) {
    if (res.status === 404) return [];
    throw Object.assign(new Error(res.error || 'טעינת הודעות נכשלה'), { status: res.status });
  }
  return Array.isArray(res.data) ? res.data : [];
}

export async function createTeamMessage(input: {
  toUserId?: string;
  subject: string;
  body: string;
  createdBy?: string;
}) {
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!subject || !body) throw Object.assign(new Error('נא למלא נושא ותוכן'), { status: 400 });

  const row = {
    to_user_id: input.toUserId || null,
    subject,
    body,
    created_by: input.createdBy || null,
  };
  const res = await supabaseRest<TeamMessageRow[]>('team_messages', {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    if (String(res.error || '').includes('team_messages')) {
      throw Object.assign(new Error('טבלת team_messages חסרה ב-Supabase. הריצו supabase/team.sql'), { status: 503 });
    }
    throw Object.assign(new Error(res.error || 'שליחת הודעה נכשלה'), { status: res.status });
  }
  const saved = Array.isArray(res.data) ? res.data[0] : null;
  return saved;
}
