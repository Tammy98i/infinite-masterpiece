export type UserProfileInput = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  birthday?: string;
  phone?: string;
  city?: string;
};

export type NormalizedUserProfile = {
  firstName: string;
  lastName: string;
  fullName: string;
  birthday: string;
  phone: string;
  city: string;
};

const NAME_MAX = 60;
const CITY_MAX = 80;

export function splitFullName(fullName: string) {
  const clean = fullName.trim().replace(/\s+/g, ' ');
  if (!clean) return { firstName: '', lastName: '' };
  const space = clean.indexOf(' ');
  if (space < 0) return { firstName: clean, lastName: '' };
  return { firstName: clean.slice(0, space), lastName: clean.slice(space + 1).trim() };
}

function clip(value: string, max: number, label: string) {
  const clean = value.trim().replace(/\s+/g, ' ');
  if (clean.length > max) {
    throw Object.assign(new Error(`${label} ארוך מדי`), { status: 400 });
  }
  return clean;
}

export function normalizeBirthday(value: string) {
  const clean = value.trim();
  if (!clean) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    throw Object.assign(new Error('יום הולדת לא תקין'), { status: 400 });
  }
  const [year, month, day] = clean.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  const today = new Date().toISOString().slice(0, 10);
  if (!valid || year < 1900 || clean > today) {
    throw Object.assign(new Error('יום הולדת לא תקין'), { status: 400 });
  }
  return clean;
}

export function normalizePhone(value: string) {
  const clean = value.trim();
  if (!clean) return '';
  if (!/^[0-9+\-()\s]{6,20}$/.test(clean)) {
    throw Object.assign(new Error('טלפון לא תקין'), { status: 400 });
  }
  return clean;
}

export function normalizeUserProfile(
  input: UserProfileInput,
  options?: { requireFirstName?: boolean }
): NormalizedUserProfile {
  const fromFull = splitFullName(input.fullName || '');
  const firstName = clip(input.firstName ?? fromFull.firstName, NAME_MAX, 'שם פרטי');
  const lastName = clip(input.lastName ?? fromFull.lastName, NAME_MAX, 'שם משפחה');
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  if (options?.requireFirstName && !firstName) {
    throw Object.assign(new Error('נא להזין שם פרטי'), { status: 400 });
  }
  return {
    firstName,
    lastName,
    fullName,
    birthday: normalizeBirthday(input.birthday || ''),
    phone: normalizePhone(input.phone || ''),
    city: clip(input.city || '', CITY_MAX, 'עיר'),
  };
}

export function profileFromStored(
  row: {
    full_name?: unknown;
    first_name?: unknown;
    last_name?: unknown;
    birthday?: unknown;
    phone?: unknown;
    city?: unknown;
  },
  patch: UserProfileInput = {}
) {
  const storedFirst = String(row.first_name || '');
  const storedLast = String(row.last_name || '');
  const legacy =
    !storedFirst && !storedLast ? splitFullName(String(row.full_name || '')) : null;
  return normalizeUserProfile({
    firstName: patch.firstName === undefined ? legacy?.firstName || storedFirst : patch.firstName,
    lastName: patch.lastName === undefined ? legacy?.lastName || storedLast : patch.lastName,
    birthday: patch.birthday === undefined ? String(row.birthday || '') : patch.birthday,
    phone: patch.phone === undefined ? String(row.phone || '') : patch.phone,
    city: patch.city === undefined ? String(row.city || '') : patch.city,
  });
}
