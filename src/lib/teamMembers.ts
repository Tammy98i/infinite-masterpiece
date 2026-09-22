export const TEAM_LEVELS = ['founder', 'leadership', 'core', 'contributor'] as const;
export type TeamLevel = typeof TEAM_LEVELS[number];
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo: string;
  bio: string;
  vision: string;
  contribution: string;
  responsibilities: string[];
  expertise: string[];
  impact_score: number;
  hierarchy_level: TeamLevel;
  orbit: number;
  active: boolean;
  display_order: number;
}
export type TeamMemberInput = Omit<TeamMember, 'id'>;
export const TEAM_LEVEL_LABELS: Record<TeamLevel, string> = {
  founder: 'Founder', leadership: 'Leadership', core: 'Core Team', contributor: 'Contributors',
};

/** Three clear sizes: founder, leadership, then the rest of the team. */
export function starDiameter(member: Pick<TeamMember, 'impact_score' | 'hierarchy_level'>) {
  const score = Math.max(0, Math.min(100, member.impact_score));
  if (member.hierarchy_level === 'founder') return 150 + score * 0.6;
  if (member.hierarchy_level === 'leadership') return 88 + score * 0.22;
  return 36 + score * 0.18;
}
export function sortTeam(members: TeamMember[]) {
  return [...members].sort((a, b) => TEAM_LEVELS.indexOf(a.hierarchy_level) - TEAM_LEVELS.indexOf(b.hierarchy_level)
    || a.orbit - b.orbit || a.display_order - b.display_order || b.impact_score - a.impact_score || a.id.localeCompare(b.id));
}
/** Leadership stays close to the sun. The rest of the team fill the outer ring. */
export function starPosition(member: TeamMember, slot: number, total = 6) {
  if (member.hierarchy_level === 'founder') return { x: 50, y: 52 };
  if (member.hierarchy_level === 'leadership') {
    const angle = [-145, -35][slot % 2] * Math.PI / 180;
    return { x: 50 + Math.cos(angle) * 27, y: 52 + Math.sin(angle) * 24 };
  }
  const count = Math.max(1, total);
  const start = -155 * Math.PI / 180;
  const sweep = 310 * Math.PI / 180;
  const step = count === 1 ? 0 : sweep / count;
  const angle = start + step * slot + step / 2;
  const distance = 36 + member.orbit * 0.4 + (100 - member.impact_score) * 0.02;
  return { x: 50 + Math.cos(angle) * distance, y: 56 + Math.sin(angle) * (distance * 0.72) };
}

export function validateTeamMember(raw: unknown): TeamMemberInput {
  const fail = (message: string): never => { throw Object.assign(new Error(message), { status: 400 }); };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail('פרטי איש הצוות אינם תקינים');
  const input = raw as Record<string, unknown>;
  const text = (key: string, max: number, required = false) => {
    const value = input[key];
    if (typeof value !== 'string' || value.length > max || (required && !value.trim())) return fail(`שדה ${key} אינו תקין`);
    return value.trim();
  };
  const number = (key: string, min: number, max: number) => {
    const value = input[key];
    if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) return fail(`שדה ${key} חייב להיות מספר שלם בין ${min} ל־${max}`);
    return value;
  };
  const list = (key: string) => {
    const value = input[key];
    if (!Array.isArray(value) || value.length > 30 || value.some(v => typeof v !== 'string' || v.length > 300)) return fail(`שדה ${key} אינו תקין`);
    return (value as string[]).map(v => v.trim()).filter(Boolean);
  };
  const hierarchy_level = input.hierarchy_level as TeamLevel;
  if (!TEAM_LEVELS.includes(hierarchy_level)) return fail('רמת ההיררכיה אינה תקינה');
  if (typeof input.active !== 'boolean') return fail('מצב התצוגה אינו תקין');
  const photo = text('photo', 2000);
  if (photo && !/^https?:\/\/[^\s]+$/i.test(photo) && !/^\/(?!\/)[^\s]*$/.test(photo)) return fail('יש להזין קישור תמונה תקין');
  return {
    name: text('name', 120, true), role: text('role', 160, true), photo,
    bio: text('bio', 5000), vision: text('vision', 5000), contribution: text('contribution', 5000),
    responsibilities: list('responsibilities'), expertise: list('expertise'),
    impact_score: number('impact_score', 0, 100), hierarchy_level,
    orbit: hierarchy_level === 'founder' ? 0 : number('orbit', 1, 4),
    display_order: number('display_order', 0, 10000), active: input.active,
  };
}
