CREATE TABLE IF NOT EXISTS onboarding_paths (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  target_role TEXT NOT NULL,
  difficulty_level TEXT DEFAULT 'all',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS onboarding_steps (
  id TEXT PRIMARY KEY,
  path_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  step_order INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'modal',
  video_url TEXT,
  screenz_embed TEXT,
  page_url TEXT,
  trigger_event TEXT,
  completion_condition TEXT,
  target_selector TEXT,
  is_required INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (path_id) REFERENCES onboarding_paths(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_onboarding_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  path_id TEXT NOT NULL,
  current_step_id TEXT,
  onboarding_level TEXT DEFAULT 'hesitant',
  status TEXT DEFAULT 'not_started',
  completion_percentage INTEGER DEFAULT 0,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, path_id),
  FOREIGN KEY (path_id) REFERENCES onboarding_paths(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_onboarding_steps (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  completed_at TEXT,
  skipped_at TEXT,
  metadata TEXT,
  UNIQUE(user_id, step_id),
  FOREIGN KEY (step_id) REFERENCES onboarding_steps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS onboarding_bonuses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  bonus_type TEXT NOT NULL,
  value TEXT,
  unlock_condition TEXT,
  path_id TEXT,
  step_id TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (path_id) REFERENCES onboarding_paths(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_bonus_unlocks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  bonus_id TEXT NOT NULL,
  unlocked_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, bonus_id),
  FOREIGN KEY (bonus_id) REFERENCES onboarding_bonuses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_steps_path ON onboarding_steps(path_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON user_onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_steps ON user_onboarding_steps(user_id);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  subscription_plan TEXT NOT NULL DEFAULT 'none',
  trial_ends_at TEXT,
  interests TEXT DEFAULT '[]',
  avatar TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  last_login_at TEXT,
  entry_track TEXT NOT NULL DEFAULT 'none',
  raffle_tickets_count INTEGER NOT NULL DEFAULT 0,
  current_payment_phase INTEGER NOT NULL DEFAULT 0,
  next_payment_due_at TEXT,
  payment_plan_status TEXT NOT NULL DEFAULT 'none',
  referred_by_lecturer_id TEXT DEFAULT '',
  blocked INTEGER NOT NULL DEFAULT 0,
  is_founder INTEGER NOT NULL DEFAULT 0,
  staff_desk TEXT DEFAULT '',
  staff_status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  cover_image TEXT DEFAULT '',
  access_level TEXT NOT NULL DEFAULT 'premium',
  lead_instructor_ids TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS lecturers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  credentials TEXT DEFAULT '[]',
  user_id TEXT,
  is_founder INTEGER DEFAULT 0,
  founder_id TEXT,
  sort_order INTEGER DEFAULT 0,
  external_links TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  description TEXT DEFAULT '',
  category_id TEXT,
  lecturer_id TEXT,
  cover_image TEXT DEFAULT '',
  backdrop_image TEXT DEFAULT '',
  trailer_url TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  level TEXT DEFAULT 'לכל הרמות',
  what_you_will_learn TEXT DEFAULT '[]',
  target_audience TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  access_level TEXT NOT NULL DEFAULT 'premium',
  resources TEXT DEFAULT '',
  is_featured INTEGER DEFAULT 0,
  is_popular INTEGER DEFAULT 0,
  is_new INTEGER DEFAULT 0,
  is_short INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  program_week INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS episodes (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  duration INTEGER DEFAULT 0,
  video_url TEXT DEFAULT '',
  caption_tracks TEXT DEFAULT '[]',
  episode_number INTEGER NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'premium',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_episodes_course ON episodes(course_id);

CREATE TABLE IF NOT EXISTS lecturer_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  field TEXT NOT NULL,
  links TEXT DEFAULT '',
  proposed_lecture TEXT NOT NULL,
  audience TEXT DEFAULT '',
  value_to_user TEXT DEFAULT '',
  experience TEXT DEFAULT '',
  sample_video TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lecturer_apps_user ON lecturer_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_lecturer_apps_status ON lecturer_applications(status);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  event TEXT NOT NULL,
  user_id TEXT,
  properties TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);

CREATE TABLE IF NOT EXISTS video_progress (
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  episode_id TEXT NOT NULL,
  current_time REAL NOT NULL DEFAULT 0,
  duration REAL NOT NULL DEFAULT 1,
  completed INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, course_id, episode_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON video_progress(user_id, updated_at);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'user',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);

CREATE TABLE IF NOT EXISTS user_list (
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_user_list_user ON user_list(user_id);

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

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

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

