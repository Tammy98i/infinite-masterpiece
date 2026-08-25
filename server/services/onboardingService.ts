import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';
import { STUDENT_PATH_ID, INSTRUCTOR_PATH_ID, STUDENT_BONUS_ID } from '../db/seed.js';
import { publicMediaUrl } from '../config/env.js';

export type OnboardingLevel = 'fearful' | 'hesitant' | 'brave';
export type UserRole = 'student' | 'instructor' | 'admin' | 'support' | 'org_manager';
type SqlParam = string | number | bigint | Uint8Array | null;

function rowToPath(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    targetRole: row.target_role,
    difficultyLevel: row.difficulty_level,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToStep(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    pathId: row.path_id as string,
    title: row.title as string,
    description: row.description as string,
    stepOrder: row.step_order as number,
    type: row.type as string,
    videoUrl: row.video_url ? publicMediaUrl(String(row.video_url)) : null,
    screenzEmbed: (row.screenz_embed as string | null) ?? null,
    pageUrl: (row.page_url as string | null) ?? null,
    triggerEvent: (row.trigger_event as string | null) ?? null,
    completionCondition: (row.completion_condition as string | null) ?? null,
    targetSelector: (row.target_selector as string | null) ?? null,
    isRequired: Boolean(row.is_required),
  };
}

export function getPathsByRole(role: string) {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM onboarding_paths WHERE target_role = ? AND is_active = 1 ORDER BY name`)
    .all(role) as Record<string, unknown>[];
  return rows.map(rowToPath);
}

export function getPathById(pathId: string) {
  const db = getDb();
  const path = db.prepare(`SELECT * FROM onboarding_paths WHERE id = ?`).get(pathId) as Record<string, unknown> | undefined;
  if (!path) return null;

  const steps = db
    .prepare(`SELECT * FROM onboarding_steps WHERE path_id = ? ORDER BY step_order`)
    .all(pathId) as Record<string, unknown>[];

  return {
    ...rowToPath(path),
    steps: steps.map(rowToStep),
  };
}

export function getDefaultPathIdForRole(role: UserRole): string {
  if (role === 'instructor') return INSTRUCTOR_PATH_ID;
  return STUDENT_PATH_ID;
}

export function startOnboarding(userId: string, pathId: string, level: OnboardingLevel) {
  const db = getDb();
  const path = getPathById(pathId);
  if (!path || path.steps.length === 0) {
    throw new Error('Path not found or has no steps');
  }

  const firstStep = path.steps[0];
  const progressId = randomUUID();
  const now = new Date().toISOString();

  const existing = db
    .prepare(`SELECT id FROM user_onboarding_progress WHERE user_id = ? AND path_id = ?`)
    .get(userId, pathId) as { id: string } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE user_onboarding_progress
      SET onboarding_level = ?, status = 'in_progress', updated_at = ?
      WHERE id = ?
    `).run(level, now, existing.id);
  } else {
    db.prepare(`
      INSERT INTO user_onboarding_progress (
        id, user_id, path_id, current_step_id, onboarding_level, status,
        completion_percentage, started_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'in_progress', 0, ?, ?)
    `).run(progressId, userId, pathId, firstStep.id, level, now, now);

    for (const step of path.steps) {
      db.prepare(`
        INSERT OR IGNORE INTO user_onboarding_steps (id, user_id, step_id, status)
        VALUES (?, ?, ?, 'open')
      `).run(randomUUID(), userId, step.id);
    }
  }

  return getUserProgress(userId);
}

export function getUserProgress(userId: string) {
  const db = getDb();
  const progressRows = db
    .prepare(`SELECT * FROM user_onboarding_progress WHERE user_id = ?`)
    .all(userId) as Record<string, unknown>[];

  const result = progressRows.map((prog) => {
    const path = getPathById(prog.path_id as string);
    const stepStatuses = db
      .prepare(`
        SELECT uos.*, os.title, os.step_order, os.type, os.trigger_event, os.target_selector,
               os.description, os.video_url, os.screenz_embed, os.is_required
        FROM user_onboarding_steps uos
        JOIN onboarding_steps os ON os.id = uos.step_id
        WHERE uos.user_id = ? AND os.path_id = ?
        ORDER BY os.step_order
      `)
      .all(userId, prog.path_id as string) as Record<string, unknown>[];

    const bonuses = db
      .prepare(`SELECT * FROM onboarding_bonuses WHERE path_id = ? AND is_active = 1`)
      .all(prog.path_id as string) as Record<string, unknown>[];

    const unlockedBonuses = db
      .prepare(`
        SELECT ub.*, ob.title, ob.bonus_type, ob.value
        FROM user_bonus_unlocks ub
        JOIN onboarding_bonuses ob ON ob.id = ub.bonus_id
        WHERE ub.user_id = ?
      `)
      .all(userId) as Record<string, unknown>[];

    return {
      pathId: prog.path_id,
      pathName: path?.name,
      currentStepId: prog.current_step_id,
      onboardingLevel: prog.onboarding_level,
      status: prog.status,
      completionPercentage: prog.completion_percentage,
      startedAt: prog.started_at,
      completedAt: prog.completed_at,
      steps: stepStatuses.map((s) => ({
        stepId: s.step_id,
        title: s.title,
        description: s.description,
        stepOrder: s.step_order,
        type: s.type,
        triggerEvent: s.trigger_event,
        targetSelector: s.target_selector,
        videoUrl: s.video_url ? publicMediaUrl(String(s.video_url)) : s.video_url,
        screenzEmbed: s.screenz_embed,
        isRequired: Boolean(s.is_required),
        status: s.status,
        completedAt: s.completed_at,
        skippedAt: s.skipped_at,
      })),
      bonuses: bonuses.map((b) => ({
        id: b.id,
        title: b.title,
        description: b.description,
        bonusType: b.bonus_type,
        value: b.value,
        unlocked: unlockedBonuses.some((u) => u.bonus_id === b.id),
      })),
    };
  });

  return { userId, paths: result };
}

function recalcProgress(userId: string, pathId: string) {
  const db = getDb();
  const total = db
    .prepare(`SELECT COUNT(*) as c FROM onboarding_steps WHERE path_id = ?`)
    .get(pathId) as { c: number };

  const done = db
    .prepare(`
      SELECT COUNT(*) as c FROM user_onboarding_steps uos
      JOIN onboarding_steps os ON os.id = uos.step_id
      WHERE uos.user_id = ? AND os.path_id = ? AND uos.status IN ('completed', 'skipped')
    `)
    .get(userId, pathId) as { c: number };

  const pct = total.c > 0 ? Math.round((done.c / total.c) * 100) : 0;
  const isComplete = pct >= 100;
  const now = new Date().toISOString();

  const nextStep = db
    .prepare(`
      SELECT os.id FROM onboarding_steps os
      LEFT JOIN user_onboarding_steps uos ON uos.step_id = os.id AND uos.user_id = ?
      WHERE os.path_id = ? AND (uos.status IS NULL OR uos.status = 'open')
      ORDER BY os.step_order LIMIT 1
    `)
    .get(userId, pathId) as { id: string } | undefined;

  db.prepare(`
    UPDATE user_onboarding_progress
    SET completion_percentage = ?, status = ?, current_step_id = ?,
        completed_at = ?, updated_at = ?
    WHERE user_id = ? AND path_id = ?
  `).run(
    pct,
    isComplete ? 'completed' : 'in_progress',
    nextStep?.id || null,
    isComplete ? now : null,
    now,
    userId,
    pathId
  );

  if (isComplete && pathId === STUDENT_PATH_ID) {
    const bonusExists = db
      .prepare(`SELECT id FROM user_bonus_unlocks WHERE user_id = ? AND bonus_id = ?`)
      .get(userId, STUDENT_BONUS_ID);
    if (!bonusExists) {
      db.prepare(`INSERT INTO user_bonus_unlocks (id, user_id, bonus_id) VALUES (?, ?, ?)`).run(
        randomUUID(),
        userId,
        STUDENT_BONUS_ID
      );
    }
  }

  return pct;
}

export function completeStep(userId: string, stepId: string) {
  const db = getDb();
  const step = db.prepare(`SELECT * FROM onboarding_steps WHERE id = ?`).get(stepId) as Record<string, unknown> | undefined;
  if (!step) throw new Error('Step not found');

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE user_onboarding_steps
    SET status = 'completed', completed_at = ?, skipped_at = NULL
    WHERE user_id = ? AND step_id = ?
  `).run(now, userId, stepId);

  recalcProgress(userId, step.path_id as string);
  return getUserProgress(userId);
}

export function skipStep(userId: string, stepId: string) {
  const db = getDb();
  const step = db.prepare(`SELECT * FROM onboarding_steps WHERE id = ?`).get(stepId) as Record<string, unknown> | undefined;
  if (!step) throw new Error('Step not found');

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE user_onboarding_steps
    SET status = 'skipped', skipped_at = ?, completed_at = NULL
    WHERE user_id = ? AND step_id = ?
  `).run(now, userId, stepId);

  recalcProgress(userId, step.path_id as string);
  return getUserProgress(userId);
}

export function getStepsForTrigger(userId: string, role: UserRole, trigger: string) {
  const db = getDb();
  const pathId = getDefaultPathIdForRole(role);

  const progress = db
    .prepare(`SELECT status FROM user_onboarding_progress WHERE user_id = ? AND path_id = ?`)
    .get(userId, pathId) as { status: string } | undefined;

  if (!progress || progress.status === 'completed') return [];

  const steps = db
    .prepare(`
      SELECT os.*, uos.status as user_status
      FROM onboarding_steps os
      LEFT JOIN user_onboarding_steps uos ON uos.step_id = os.id AND uos.user_id = ?
      WHERE os.path_id = ? AND os.trigger_event = ?
        AND (uos.status IS NULL OR uos.status = 'open')
      ORDER BY os.step_order
    `)
    .all(userId, pathId, trigger) as Record<string, unknown>[];

  return steps.map((s) => ({
    ...rowToStep(s),
    userStatus: s.user_status || 'open',
  }));
}

// --- Admin ---

export function getAllPathsAdmin() {
  const db = getDb();
  const paths = db.prepare(`SELECT * FROM onboarding_paths ORDER BY target_role, name`).all() as Record<string, unknown>[];
  return paths.map((p) => {
    const steps = db
      .prepare(`SELECT * FROM onboarding_steps WHERE path_id = ? ORDER BY step_order`)
      .all(p.id as string) as Record<string, unknown>[];
    return { ...rowToPath(p), steps: steps.map(rowToStep) };
  });
}

export function getStats() {
  const db = getDb();
  const totalStarted = (db.prepare(`SELECT COUNT(*) as c FROM user_onboarding_progress`).get() as { c: number }).c;
  const totalCompleted = (
    db.prepare(`SELECT COUNT(*) as c FROM user_onboarding_progress WHERE status = 'completed'`).get() as { c: number }
  ).c;
  const bonusesUnlocked = (db.prepare(`SELECT COUNT(*) as c FROM user_bonus_unlocks`).get() as { c: number }).c;

  const stepsWithSkips = db
    .prepare(`
      SELECT os.title, os.id, COUNT(*) as skip_count
      FROM user_onboarding_steps uos
      JOIN onboarding_steps os ON os.id = uos.step_id
      WHERE uos.status = 'skipped'
      GROUP BY os.id
      ORDER BY skip_count DESC
      LIMIT 3
    `)
    .all() as { title: string; id: string; skip_count: number }[];

  return {
    totalStarted,
    totalCompleted,
    completionRate: totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0,
    bonusesUnlockedCount: bonusesUnlocked,
    stepsWithMostSkips: stepsWithSkips,
  };
}

export function createPath(data: {
  name: string;
  description?: string;
  targetRole: string;
  difficultyLevel?: string;
}) {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO onboarding_paths (id, name, description, target_role, difficulty_level, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).run(id, data.name, data.description || '', data.targetRole, data.difficultyLevel || 'all', now, now);
  return getPathById(id);
}

export function updatePath(
  pathId: string,
  data: Partial<{ name: string; description: string; targetRole: string; difficultyLevel: string; isActive: boolean }>
) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM onboarding_paths WHERE id = ?`).get(pathId);
  if (!existing) throw new Error('Path not found');

  const fields: string[] = [];
  const values: SqlParam[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.targetRole !== undefined) { fields.push('target_role = ?'); values.push(data.targetRole); }
  if (data.difficultyLevel !== undefined) { fields.push('difficulty_level = ?'); values.push(data.difficultyLevel); }
  if (data.isActive !== undefined) { fields.push('is_active = ?'); values.push(data.isActive ? 1 : 0); }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(pathId);

  db.prepare(`UPDATE onboarding_paths SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getPathById(pathId);
}

export function deletePath(pathId: string) {
  const db = getDb();
  db.prepare(`DELETE FROM onboarding_paths WHERE id = ?`).run(pathId);
}

export function createStep(pathId: string, data: Partial<ReturnType<typeof rowToStep>>) {
  const db = getDb();
  const id = randomUUID();
  const maxOrder = db
    .prepare(`SELECT MAX(step_order) as m FROM onboarding_steps WHERE path_id = ?`)
    .get(pathId) as { m: number | null };

  db.prepare(`
    INSERT INTO onboarding_steps (
      id, path_id, title, description, step_order, type,
      video_url, screenz_embed, page_url, trigger_event, completion_condition,
      target_selector, is_required
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    pathId,
    data.title || 'שלב חדש',
    data.description || '',
    data.stepOrder ?? (maxOrder.m || 0) + 1,
    data.type || 'modal',
    data.videoUrl || null,
    data.screenzEmbed || null,
    data.pageUrl || null,
    data.triggerEvent || null,
    data.completionCondition || 'manual_confirm',
    data.targetSelector || null,
    data.isRequired !== false ? 1 : 0
  );

  const step = db.prepare(`SELECT * FROM onboarding_steps WHERE id = ?`).get(id) as Record<string, unknown>;
  return rowToStep(step);
}

export function updateStep(stepId: string, data: Partial<ReturnType<typeof rowToStep>>) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM onboarding_steps WHERE id = ?`).get(stepId);
  if (!existing) throw new Error('Step not found');

  const map: Record<string, string> = {
    title: 'title',
    description: 'description',
    stepOrder: 'step_order',
    type: 'type',
    videoUrl: 'video_url',
    screenzEmbed: 'screenz_embed',
    pageUrl: 'page_url',
    triggerEvent: 'trigger_event',
    completionCondition: 'completion_condition',
    targetSelector: 'target_selector',
  };

  const fields: string[] = [];
  const values: SqlParam[] = [];

  for (const [key, col] of Object.entries(map)) {
    if ((data as Record<string, unknown>)[key] !== undefined) {
      fields.push(`${col} = ?`);
      values.push((data as Record<string, unknown>)[key] as SqlParam);
    }
  }
  if (data.isRequired !== undefined) {
    fields.push('is_required = ?');
    values.push(data.isRequired ? 1 : 0);
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(stepId);

  db.prepare(`UPDATE onboarding_steps SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const step = db.prepare(`SELECT * FROM onboarding_steps WHERE id = ?`).get(stepId) as Record<string, unknown>;
  return rowToStep(step);
}
