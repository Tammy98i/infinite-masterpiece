/** Hebrew labels for admin and lecturer operations desks — not the public site. */

export function planLabelHe(plan?: string | null): string {
  switch (plan) {
    case 'free_trial':
      return 'ניסיון';
    case 'monthly':
      return 'חודשי';
    case 'annual':
      return 'שנתי';
    case 'premium_88':
      return 'נבחרת 88';
    case 'none':
    case '':
    case null:
    case undefined:
      return 'חינמי';
    default:
      return plan;
  }
}

export function roleLabelHe(role?: string | null): string {
  if (role === 'admin') return 'אדמין';
  if (role === 'instructor') return 'מרצה';
  return 'משתמש';
}

export function accessLabelHe(level?: string | null): string {
  switch (level) {
    case 'free':
      return 'חינמי';
    case 'premium':
      return 'פרימיום';
    case 'premium_88':
      return 'נבחרת 88';
    case 'admin_only':
      return 'אדמין בלבד';
    case 'draft':
      return 'טיוטה';
    default:
      return level || '—';
  }
}

export function formatOpsDate(iso?: string | null): string {
  if (!iso) return 'אין';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.replace('T', ' ').slice(0, 16);
  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function isPayingPlan(plan?: string | null): boolean {
  return plan === 'monthly' || plan === 'annual' || plan === 'premium_88';
}
