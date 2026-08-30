/** Israeli mobile helpers for Vercel webinar APIs (no Vite src imports). */
export function digitsOnly(value: string) {
  return String(value || '').replace(/\D/g, '');
}

export function isIsraeliMobile(value: string) {
  const d = digitsOnly(value);
  if (d.startsWith('972')) {
    const local = d.slice(3);
    return local.length === 9 && local.startsWith('5');
  }
  if (d.startsWith('0')) {
    return d.length === 10 && d.startsWith('05');
  }
  return d.length === 9 && d.startsWith('5');
}

export function normalizeEmail(email: string) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}
