import type { TeamMember } from '../../../api/teamMembers';

/** Star diameter in px — founder sun, then clearly larger CTO/CCO, then core/contributors. */
export function starDiameter(impact: number, level: string): number {
  if (level === 'founder') return 196;
  if (level === 'leadership') return 124;
  if (level === 'core') return 40 + (impact / 100) * 28;
  return 34 + (impact / 100) * 16;
}

/** Glow size in px — proportional to impact. */
export function glowSize(impact: number, isFounder: boolean): number {
  if (isFounder) return 88;
  return 10 + (impact / 100) * 26;
}

/** Gold shade by hierarchy level. */
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

/** Frame border width by hierarchy. */
export function frameWidth(level: string): number {
  switch (level) {
    case 'founder':
      return 3.5;
    case 'leadership':
      return 2.75;
    case 'core':
      return 2;
    default:
      return 1.4;
  }
}

export interface PositionedStar {
  member: TeamMember;
  x: number;
  y: number;
  diameter: number;
  isFounder: boolean;
  /** Degrees, 0 = 3 o'clock, clockwise, y-down. */
  angleDeg: number;
  radius: number;
}

export const ORBIT_DURATION_SEC: Record<number, number> = {
  1: 100,
  2: 150,
  3: 220,
};

/**
 * Radii keep a gap between rings after labels (names sit below avatars, always upright).
 * Inner ring is far enough from the founder disc + CTO/CCO size.
 */
export const ORBIT_RADII = [0, 310, 455, 590];

function orbitStartDeg(orbit: number): number {
  if (orbit === 1) return 210;
  if (orbit === 2) return 18;
  return 40.5;
}

export function calculatePositions(
  members: TeamMember[],
  scale: number = 1,
): { stars: PositionedStar[]; orbitRadii: number[] } {
  const byOrbit = new Map<number, TeamMember[]>();
  for (const m of members) {
    const orbit = m.orbit;
    if (!byOrbit.has(orbit)) byOrbit.set(orbit, []);
    byOrbit.get(orbit)!.push(m);
  }

  const stars: PositionedStar[] = [];
  const orbitRadii = ORBIT_RADII.map((r) => r * scale);

  for (const [orbit, orbitMembers] of byOrbit) {
    const sorted = [...orbitMembers].sort((a, b) => a.display_order - b.display_order);
    if (orbit === 0) {
      const m = sorted[0];
      if (m) {
        stars.push({
          member: m,
          x: 0,
          y: 0,
          diameter: starDiameter(m.impact_score, 'founder'),
          isFounder: true,
          angleDeg: 0,
          radius: 0,
        });
      }
      continue;
    }

    const radius = (ORBIT_RADII[orbit] || 400) * scale;
    const count = Math.max(sorted.length, 1);
    const start = orbitStartDeg(orbit);

    sorted.forEach((m, i) => {
      const deg = start + (i / count) * 360;
      const angle = (deg * Math.PI) / 180;
      stars.push({
        member: m,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        diameter: starDiameter(m.impact_score, m.hierarchy_level),
        isFounder: false,
        angleDeg: deg,
        radius,
      });
    });
  }

  return { stars, orbitRadii };
}

export function orbitOffset(baseDeg: number, spinDeg: number, radius: number): { x: number; y: number } {
  const deg = baseDeg + spinDeg;
  const angle = (deg * Math.PI) / 180;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}
