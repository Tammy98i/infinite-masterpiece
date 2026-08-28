import type { DatabaseSync } from 'node:sqlite';
import { captionTracksForEpisode } from '../../src/constants/captions.ts';
import { CATEGORIES, COURSE_CATEGORY_OVERRIDES, LEGACY_CATEGORY_MAP } from '../../src/data/categories.ts';

function columnNames(db: DatabaseSync, table: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return new Set(rows.map((r) => r.name));
}

function migrateCategoriesToSpec(db: DatabaseSync) {
  const cats = columnNames(db, 'categories');
  if (cats.size === 0) return;
  if (!cats.has('cover_image')) {
    db.exec(`ALTER TABLE categories ADD COLUMN cover_image TEXT DEFAULT ''`);
  }
  if (!cats.has('access_level')) {
    db.exec(`ALTER TABLE categories ADD COLUMN access_level TEXT NOT NULL DEFAULT 'premium'`);
  }
  if (!cats.has('lead_instructor_ids')) {
    db.exec(`ALTER TABLE categories ADD COLUMN lead_instructor_ids TEXT DEFAULT '[]'`);
  }

  const upsert = db.prepare(`
    INSERT INTO categories (id, name, description, icon, sort_order, cover_image, access_level, lead_instructor_ids)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      sort_order = excluded.sort_order,
      cover_image = excluded.cover_image,
      access_level = excluded.access_level,
      lead_instructor_ids = excluded.lead_instructor_ids
  `);
  for (const cat of CATEGORIES) {
    upsert.run(
      cat.id,
      cat.name,
      cat.description,
      cat.icon,
      cat.sortOrder ?? 0,
      cat.coverImage || '',
      cat.accessLevel || 'premium',
      JSON.stringify(cat.leadInstructorIds || [])
    );
  }

  const remap = db.prepare(`UPDATE courses SET category_id = ? WHERE category_id = ?`);
  for (const [from, to] of Object.entries(LEGACY_CATEGORY_MAP)) {
    remap.run(to, from);
  }
  const override = db.prepare(`UPDATE courses SET category_id = ? WHERE id = ?`);
  for (const [courseId, categoryId] of Object.entries(COURSE_CATEGORY_OVERRIDES)) {
    override.run(categoryId, courseId);
  }

  const keep = CATEGORIES.map((c) => `'${c.id}'`).join(',');
  db.exec(`DELETE FROM categories WHERE id NOT IN (${keep})`);
}

export function migrateSchema(db: DatabaseSync) {
  const users = columnNames(db, 'users');
  if (!users.has('blocked')) {
    db.exec(`ALTER TABLE users ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0`);
  }
  if (!users.has('is_founder')) {
    db.exec(`ALTER TABLE users ADD COLUMN is_founder INTEGER NOT NULL DEFAULT 0`);
  }
  if (!users.has('staff_desk')) {
    db.exec(`ALTER TABLE users ADD COLUMN staff_desk TEXT DEFAULT ''`);
  }
  if (!users.has('staff_status')) {
    db.exec(`ALTER TABLE users ADD COLUMN staff_status TEXT NOT NULL DEFAULT 'active'`);
  }

  const lecturers = columnNames(db, 'lecturers');
  if (lecturers.size > 0 && !lecturers.has('founder_id')) {
    db.exec(`ALTER TABLE lecturers ADD COLUMN founder_id TEXT`);
  }
  if (lecturers.size > 0 && !lecturers.has('external_links')) {
    db.exec(`ALTER TABLE lecturers ADD COLUMN external_links TEXT DEFAULT '[]'`);
  }

  const courses = columnNames(db, 'courses');
  if (courses.size > 0 && !courses.has('resources')) {
    db.exec(`ALTER TABLE courses ADD COLUMN resources TEXT DEFAULT ''`);
  }
  if (courses.size > 0 && !courses.has('program_week')) {
    db.exec(`ALTER TABLE courses ADD COLUMN program_week INTEGER NOT NULL DEFAULT 0`);
  }

  if (users.has('id')) {
    if (!users.has('entry_track')) {
      db.exec(`ALTER TABLE users ADD COLUMN entry_track TEXT NOT NULL DEFAULT 'none'`);
    }
    if (!users.has('raffle_tickets_count')) {
      db.exec(`ALTER TABLE users ADD COLUMN raffle_tickets_count INTEGER NOT NULL DEFAULT 0`);
    }
    if (!users.has('current_payment_phase')) {
      db.exec(`ALTER TABLE users ADD COLUMN current_payment_phase INTEGER NOT NULL DEFAULT 0`);
    }
    if (!users.has('next_payment_due_at')) {
      db.exec(`ALTER TABLE users ADD COLUMN next_payment_due_at TEXT`);
    }
    if (!users.has('payment_plan_status')) {
      db.exec(`ALTER TABLE users ADD COLUMN payment_plan_status TEXT NOT NULL DEFAULT 'none'`);
    }
    if (!users.has('referred_by_lecturer_id')) {
      db.exec(`ALTER TABLE users ADD COLUMN referred_by_lecturer_id TEXT DEFAULT ''`);
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS track_leads (
      id TEXT PRIMARY KEY,
      track_type TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      field TEXT DEFAULT '',
      hesitation_reason TEXT DEFAULT '',
      has_product TEXT DEFAULT '',
      has_sold TEXT DEFAULT '',
      goal_90 TEXT DEFAULT '',
      links TEXT DEFAULT '',
      referred_by_lecturer_id TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_track_leads_created ON track_leads(created_at);
    CREATE INDEX IF NOT EXISTS idx_track_leads_type ON track_leads(track_type);

    CREATE TABLE IF NOT EXISTS payment_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      lead_id TEXT,
      track_type TEXT NOT NULL,
      total_amount_before_vat REAL NOT NULL,
      vat_amount REAL NOT NULL,
      total_amount_with_vat REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'lead',
      stripe_customer_id TEXT DEFAULT '',
      stripe_payment_method_id TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_payment_plans_user ON payment_plans(user_id);

    CREATE TABLE IF NOT EXISTS payment_installments (
      id TEXT PRIMARY KEY,
      payment_plan_id TEXT NOT NULL,
      installment_number INTEGER NOT NULL,
      amount_before_vat REAL NOT NULL,
      vat_amount REAL NOT NULL,
      amount_with_vat REAL NOT NULL,
      due_at TEXT,
      paid_at TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      payment_provider_transaction_id TEXT DEFAULT '',
      FOREIGN KEY (payment_plan_id) REFERENCES payment_plans(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_installments_plan ON payment_installments(payment_plan_id);
    CREATE INDEX IF NOT EXISTS idx_installments_status ON payment_installments(status);

    CREATE TABLE IF NOT EXISTS raffle_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      track_type TEXT NOT NULL,
      tickets_count INTEGER NOT NULL DEFAULT 1,
      raffle_id TEXT DEFAULT '',
      granted_reason TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_raffle_user ON raffle_tickets(user_id);
  `);

  const plans = columnNames(db, 'payment_plans');
  if (plans.size > 0 && !plans.has('lead_id')) {
    db.exec(`ALTER TABLE payment_plans ADD COLUMN lead_id TEXT`);
  }
  if (plans.size > 0 && !plans.has('stripe_customer_id')) {
    db.exec(`ALTER TABLE payment_plans ADD COLUMN stripe_customer_id TEXT DEFAULT ''`);
  }
  if (plans.size > 0 && !plans.has('stripe_payment_method_id')) {
    db.exec(`ALTER TABLE payment_plans ADD COLUMN stripe_payment_method_id TEXT DEFAULT ''`);
  }

  const leads = columnNames(db, 'track_leads');
  if (leads.size > 0 && !leads.has('referred_by_lecturer_id')) {
    db.exec(`ALTER TABLE track_leads ADD COLUMN referred_by_lecturer_id TEXT DEFAULT ''`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS premium_88_applications (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      creative_field TEXT DEFAULT '',
      business_stage TEXT DEFAULT '',
      goal TEXT DEFAULT '',
      links TEXT DEFAULT '',
      open_notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'submitted',
      admin_notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_p88_created ON premium_88_applications(created_at);
    CREATE INDEX IF NOT EXISTS idx_p88_status ON premium_88_applications(status);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT DEFAULT '',
      before_json TEXT DEFAULT 'null',
      after_json TEXT DEFAULT 'null',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

    CREATE TABLE IF NOT EXISTS raffles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      starts_at TEXT,
      ends_at TEXT,
      winner_user_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_raffles_created ON raffles(created_at);

    CREATE TABLE IF NOT EXISTS content_questions (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      lecturer_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT DEFAULT '',
      question TEXT NOT NULL,
      answer TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT DEFAULT (datetime('now')),
      answered_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_content_questions_lecturer ON content_questions(lecturer_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_content_questions_course ON content_questions(course_id);

    CREATE TABLE IF NOT EXISTS team_messages (
      id TEXT PRIMARY KEY,
      lecturer_user_id TEXT NOT NULL,
      from_admin_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      read_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_team_messages_lecturer ON team_messages(lecturer_user_id, created_at);

    CREATE TABLE IF NOT EXISTS accessibility_reports (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT DEFAULT '',
      page_url TEXT DEFAULT '',
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      admin_notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_a11y_reports_status ON accessibility_reports(status, created_at);

    CREATE TABLE IF NOT EXISTS webinar_registrations (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      field TEXT DEFAULT '',
      interest TEXT DEFAULT '',
      blocker TEXT DEFAULT '',
      marketing_opt_in INTEGER NOT NULL DEFAULT 0,
      utm_source TEXT DEFAULT '',
      utm_medium TEXT DEFAULT '',
      utm_campaign TEXT DEFAULT '',
      utm_term TEXT DEFAULT '',
      utm_content TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_webinar_reg_created ON webinar_registrations(created_at);
    CREATE INDEX IF NOT EXISTS idx_webinar_reg_status ON webinar_registrations(status);
  `);

  const webinarRegs = columnNames(db, 'webinar_registrations');
  if (webinarRegs.size > 0) {
    if (!webinarRegs.has('ab_variant')) db.exec(`ALTER TABLE webinar_registrations ADD COLUMN ab_variant TEXT DEFAULT ''`);
    if (!webinarRegs.has('updated_at')) db.exec(`ALTER TABLE webinar_registrations ADD COLUMN updated_at TEXT`);
    if (!webinarRegs.has('step_completed_at')) db.exec(`ALTER TABLE webinar_registrations ADD COLUMN step_completed_at TEXT`);
    if (!webinarRegs.has('reminded_24h_at')) db.exec(`ALTER TABLE webinar_registrations ADD COLUMN reminded_24h_at TEXT`);
    if (!webinarRegs.has('reminded_1h_at')) db.exec(`ALTER TABLE webinar_registrations ADD COLUMN reminded_1h_at TEXT`);
    if (!webinarRegs.has('confirmation_email_sent_at')) {
      db.exec(`ALTER TABLE webinar_registrations ADD COLUMN confirmation_email_sent_at TEXT`);
    }
    if (!webinarRegs.has('reminded_partial_at')) {
      db.exec(`ALTER TABLE webinar_registrations ADD COLUMN reminded_partial_at TEXT`);
    }
    if (!webinarRegs.has('person_picked_at')) {
      db.exec(`ALTER TABLE webinar_registrations ADD COLUMN person_picked_at TEXT`);
    }
  }

  migrateCategoriesToSpec(db);

  const episodes = columnNames(db, 'episodes');
  if (episodes.size > 0 && !episodes.has('caption_tracks')) {
    db.exec(`ALTER TABLE episodes ADD COLUMN caption_tracks TEXT DEFAULT '[]'`);
  }
  if (episodes.size > 0) {
    const rows = db.prepare(`SELECT id, caption_tracks FROM episodes`).all() as Array<{
      id: string;
      caption_tracks: string | null;
    }>;
    const update = db.prepare(`UPDATE episodes SET caption_tracks = ? WHERE id = ?`);
    for (const row of rows) {
      const raw = row.caption_tracks || '';
      const needsUpdate =
        !raw ||
        raw === '[]' ||
        raw.includes('he-placeholder.vtt') ||
        raw.includes('he-sample.vtt');
      if (needsUpdate) {
        update.run(JSON.stringify(captionTracksForEpisode(row.id)), row.id);
      }
    }
  }
}
