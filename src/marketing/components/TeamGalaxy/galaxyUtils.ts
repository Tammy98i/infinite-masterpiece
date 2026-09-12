import type { TeamMember } from '../../../api/teamMembers';

export function starDiameter(impact: number, levelOrFounder: string | boolean): number {
  if (levelOrFounder === true || levelOrFounder === 'founder') return 140;
  if (levelOrFounder === 'leadership') return 108;
  if (levelOrFounder === 'core') return 42 + (impact / 100) * 28;
  return 32 + (impact / 100) * 16;
}

export function glowSize(impact: number, isFounder: boolean): number {
  if (isFounder) return 80;
  return 12 + (impact / 100) * 28;
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

export function frameWidth(level: string): number {
  switch (level) {
    case 'founder':
      return 3;
    case 'leadership':
      return 2.5;
    case 'core':
      return 2;
    default:
      return 1.5;
  }
}

export interface PositionedStar {
  member: TeamMember;
  x: number;
  y: number;
  diameter: number;
  isFounder: boolean;
}

/** Radii sized for 22 people: ~3 inner, ~8 core, ~10 outer. */
export const ORBIT_RADII = [0, 210, 355, 500];

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
          diameter: starDiameter(m.impact_score, 'founder'),
          isFounder: true,
        });
      }
      continue;
    }

    const radius = (ORBIT_RADII[orbit] || 500) * scale;
    const count = Math.max(sorted.length, 1);
    const angleOffset = orbit === 1 ? -Math.PI / 2 : orbit === 2 ? Math.PI / 6 : Math.PI / 3;

    sorted.forEach((m, i) => {
      const angle = angleOffset + (i / count) * Math.PI * 2;
      stars.push({
        member: m,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        diameter: starDiameter(m.impact_score, m.hierarchy_level),
        isFounder: false,
      });
    });
  }

  return { stars, orbitRadii };
}

export function getConnectionLines(stars: PositionedStar[]): Array<{ from: PositionedStar; to: PositionedStar }> {
  const founder = stars.find((s) => s.isFounder);
  if (!founder) return [];
  return stars
    .filter((s) => !s.isFounder && (s.member.hierarchy_level === 'leadership' || s.member.group_key === 'leadership'))
    .map((s) => ({ from: founder, to: s }));
}
