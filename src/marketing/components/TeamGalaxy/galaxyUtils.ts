import type { TeamMember } from '../../../api/teamMembers';

function roleBlob(member: TeamMember): string {
  return `${member.role_en || ''} ${member.role || ''} ${member.role_he || ''}`.toUpperCase();
}

export function isCtoOrCco(member: TeamMember): boolean {
  const role = roleBlob(member);
  return /\bCTO\b/.test(role) || /\bCCO\b/.test(role);
}

export function isLeadership(member: TeamMember): boolean {
  return member.hierarchy_level === 'leadership' || member.group_key === 'leadership';
}

export function starDiameter(impact: number, member: TeamMember, isFounder: boolean): number {
  if (isFounder) return 176;
  if (isCtoOrCco(member)) return 96;
  if (isLeadership(member)) return 72;
  if (member.hierarchy_level === 'core' || member.group_key === 'core') return 46 + (impact / 100) * 18;
  return 34 + (impact / 100) * 12;
}

export function glowSize(impact: number, isFounder: boolean, member?: TeamMember): number {
  if (isFounder) return 96;
  if (member && isCtoOrCco(member)) return 36;
  if (member && isLeadership(member)) return 22;
  return 10 + (impact / 100) * 16;
}

export function goldColor(level: string): string {
  switch (level) {
    case 'founder':
      return '#F4D03F';
    case 'leadership':
      return '#D4AF37';
    case 'core':
      return '#C5A059';
    default:
      return '#B8976A';
  }
}

export function frameWidth(level: string, member?: TeamMember): number {
  if (level === 'founder') return 2.4;
  if (member && isCtoOrCco(member)) return 2.2;
  if (level === 'leadership') return 1.8;
  if (level === 'core') return 1.4;
  return 1.1;
}

export interface PositionedStar {
  member: TeamMember;
  x: number;
  y: number;
  diameter: number;
  isFounder: boolean;
}

/** Radii sized for 22 people with label breathing room. */
export const ORBIT_RADII = [0, 228, 372, 518];
export const ELLIPSE_Y = 0.86;

function leadershipAngle(member: TeamMember, fallbackIndex: number, count: number): number {
  const role = roleBlob(member);
  if (/\bCTO\b/.test(role)) return (-Math.PI * 2) / 3;
  if (/\bCCO\b/.test(role)) return -Math.PI / 3.2;
  if (count <= 1) return Math.PI * 0.55;
  return Math.PI * (0.28 + (fallbackIndex / Math.max(count - 1, 1)) * 0.7);
}

export function calculatePositions(
  members: TeamMember[],
  scale: number = 1,
): { stars: PositionedStar[]; orbitRadii: number[] } {
  const byOrbit = new Map<number, TeamMember[]>();
  for (const m of members) {
    const orbit = m.orbit ?? 2;
    if (!byOrbit.has(orbit)) byOrbit.set(orbit, []);
    byOrbit.get(orbit)!.push(m);
  }

  const stars: PositionedStar[] = [];
  const orbitRadii = ORBIT_RADII.map((r) => r * scale);

  for (const [orbit, orbitMembers] of byOrbit) {
    const sorted = [...orbitMembers].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    if (orbit === 0) {
      const m = sorted[0];
      if (m) {
        stars.push({
          member: m,
          x: 0,
          y: 0,
          diameter: starDiameter(m.impact_score, m, true),
          isFounder: true,
        });
      }
      continue;
    }

    const radius = (ORBIT_RADII[orbit] || 518) * scale;
    const count = Math.max(sorted.length, 1);

    sorted.forEach((m, i) => {
      let angle: number;
      if (orbit === 1) {
        angle = leadershipAngle(m, i, count);
      } else {
        const angleOffset = orbit === 2 ? Math.PI / 10 : Math.PI / 5;
        angle = angleOffset + (i / count) * Math.PI * 2;
      }
      stars.push({
        member: m,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * ELLIPSE_Y,
        diameter: starDiameter(m.impact_score, m, false),
        isFounder: false,
      });
    });
  }

  return { stars, orbitRadii };
}

export function getConnectionLines(stars: PositionedStar[]): Array<{ from: PositionedStar; to: PositionedStar }> {
  const founder = stars.find((s) => s.isFounder);
  if (!founder) return [];
  return stars.filter((s) => !s.isFounder && isLeadership(s.member)).map((s) => ({ from: founder, to: s }));
}
