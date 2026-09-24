export const POD_KINDS = ['journey', 'micro_88'] as const;
export type PodKind = (typeof POD_KINDS)[number];

export const POD_STATUSES = ['forming', 'active', 'completed', 'closed'] as const;
export type PodStatus = (typeof POD_STATUSES)[number];

export const POD_ROLES = ['captain', 'member'] as const;
export type PodRole = (typeof POD_ROLES)[number];

export const POD_MEMBER_STATUSES = ['invited', 'active', 'paused', 'left'] as const;
export type PodMemberStatus = (typeof POD_MEMBER_STATUSES)[number];

export const POD_TASK_STATUSES = ['todo', 'submitted', 'reviewed', 'stuck'] as const;
export type PodTaskStatus = (typeof POD_TASK_STATUSES)[number];

export const POD_QUESTION_STATUSES = ['open', 'answered'] as const;
export type PodQuestionStatus = (typeof POD_QUESTION_STATUSES)[number];

export const POD_KIND_LABELS: Record<PodKind, string> = {
  journey: 'מסע',
  micro_88: 'Micro-Pod · נבחרת 88',
};

export const POD_STATUS_LABELS: Record<PodStatus, string> = {
  forming: 'בהקמה',
  active: 'פעיל',
  completed: 'הסתיים',
  closed: 'סגור',
};

export const POD_MEMBER_STATUS_LABELS: Record<PodMemberStatus, string> = {
  invited: 'הוזמן',
  active: 'פעיל',
  paused: 'מושהה',
  left: 'עזב',
};

export const POD_TASK_STATUS_LABELS: Record<PodTaskStatus, string> = {
  todo: 'טרם הוגש',
  submitted: 'הוגש',
  reviewed: 'נבדק',
  stuck: 'תקוע',
};

export const defaultPodCapacity = (kind: PodKind) => (kind === 'micro_88' ? 6 : 12);

export function firstName(fullName: string) {
  const part = fullName.trim().split(/\s+/)[0] || '';
  return part || 'משתתף';
}

export function nameInitial(fullName: string) {
  return (firstName(fullName)[0] || '?').toUpperCase();
}

export function isPodKind(value: string): value is PodKind {
  return (POD_KINDS as readonly string[]).includes(value);
}

export function isPodStatus(value: string): value is PodStatus {
  return (POD_STATUSES as readonly string[]).includes(value);
}

export function isPodTaskStatus(value: string): value is PodTaskStatus {
  return (POD_TASK_STATUSES as readonly string[]).includes(value);
}
