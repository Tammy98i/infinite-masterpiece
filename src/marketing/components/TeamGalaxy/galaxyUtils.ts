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

export function clampImpact(impact: number): number {
  if (!Number.isFinite(impact)) return 0;
  return Math.max(0, Math.min(100, impact));
}

/** Higher impact = larger star. Founder and C-level keep a visual floor so hierarchy stays readable. */
export function starDiameter(impact: number, member: TeamMember, isFounder: boolean): number {
  const score = clampImpact(impact);
  if (isFounder) return 92 + score * 0.88;
  if (isCtoOrCco(member)) return 52 + score * 0.5;
  if (isLeadership(member)) return 42 + score * 0.4;
  if (member.hierarchy_level === 'core' || member.group_key === 'core') return 30 + score * 0.38;
  return 24 + score * 0.34;
}

/** Compact sizes for the mobile stack while keeping impact hierarchy readable. */
export function mobileStarDiameter(member: TeamMember, isFounder: boolean): number {
  const desktop = starDiameter(member.impact_score, member, isFounder);
  if (isFounder) return Math.min(124, Math.max(108, desktop * 0.68));
  if (isCtoOrCco(member)) return Math.min(88, Math.max(76, desktop * 0.86));
  if (isLeadership(member)) return Math.min(68, Math.max(56, desktop * 0.82));
  if (member.hierarchy_level === 'core' || member.group_key === 'core') {
    return Math.min(62, Math.max(46, 28 + clampImpact(member.impact_score) * 0.42));
  }
  return Math.min(52, Math.max(40, 22 + clampImpact(member.impact_score) * 0.4));
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
export const ORBIT_RADII = [0, 228, 340, 450];
export const ELLIPSE_Y = 0.86;

function leadershipAngle(member: TeamMember, fallbackIndex: number, count: number): number {
  const role = roleBlob(member);
  if (/\bCTO\b/.test(role)) return Math.PI;
  if (/\bCCO\b/.test(role)) return 0;
  if (count <= 1) return Math.PI / 2;
  const others = Math.max(count - 2, 1);
  const slot = Math.min(fallbackIndex, others - 1);
  return Math.PI * (0.42 + (slot / Math.max(others - 1, 1)) * 0.36);
}

function orbitRadiusFor(member: TeamMember, orbit: number): number {
  const base = ORBIT_RADII[orbit] || ORBIT_RADII[3];
  if (orbit !== 1) return base;
  if (isCtoOrCco(member)) return base;
  return base * 1.14;
}

export function calculatePositions(
  members: TeamMember[],
  scale: number = 1,
  options?: { maxOrbit?: number },
): { stars: PositionedStar[]; orbitRadii: number[] } {
  const byOrbit = new Map<number, TeamMember[]>();
  const maxOrbit = options?.maxOrbit ?? 3;
  for (const m of members) {
    const orbit = m.orbit ?? 2;
    if (orbit > maxOrbit) continue;
    if (!byOrbit.has(orbit)) byOrbit.set(orbit, []);
    byOrbit.get(orbit)!.push(m);
  }

  const stars: PositionedStar[] = [];
  const orbitRadii = ORBIT_RADII.slice(0, maxOrbit + 1).map((r) => r * scale);

  for (const [orbit, orbitMembers] of byOrbit) {
    const sorted = [...orbitMembers].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    if (orbit === 0) {
      const m = sorted[0];
      if (m) {
        stars.push({
          member: m,
          x: 0,
          y: 0,
        diameter: starDiameter(m.impact_score, m, true) * scale,
          isFounder: true,
        });
      }
      continue;
    }

    const count = Math.max(sorted.length, 1);

    sorted.forEach((m, i) => {
      let angle: number;
      if (orbit === 1) {
        angle = leadershipAngle(m, i, count);
      } else {
        const angleOffset = orbit === 2 ? Math.PI / 10 : Math.PI / 5;
        angle = angleOffset + (i / count) * Math.PI * 2;
      }
      const radius = orbitRadiusFor(m, orbit) * scale;
      stars.push({
        member: m,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * ELLIPSE_Y,
        diameter: starDiameter(m.impact_score, m, false) * scale,
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
