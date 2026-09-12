import type { TeamMember } from '../../../api/teamMembers';

/** Star diameter in px — founder is significantly larger than all others. */
export function starDiameter(impact: number, isFounder: boolean): number {
  if (isFounder) return 140;
  return 34 + (impact / 100) * 68; // 34px (impact 0) → 102px (impact 100)
}

/** Glow size in px — proportional to impact. */
export function glowSize(impact: number, isFounder: boolean): number {
  if (isFounder) return 80;
  return 12 + (impact / 100) * 28;
}

/** Gold shade by hierarchy level. */
export function goldColor(level: string): string {
  switch (level) {
    case 'founder':
      return '#F4D03F'; // Bright Gold
    case 'leadership':
      return '#D4AF37'; // Deep Metallic Gold
    case 'core':
      return '#C5A059'; // Soft Gold
    default:
      return '#B8976A'; // Muted Champagne
  }
}

/** Frame border width by hierarchy. */
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
  x: number; // px offset from center
  y: number; // px offset from center
  diameter: number;
  isFounder: boolean;
}

/** Orbit radii in px — relative to a base size, scaled by container. */
export const ORBIT_RADII = [0, 170, 290, 400];

/**
 * Calculate star positions within orbits.
 * Stars in each orbit are distributed evenly by angle.
 */
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
    if (orbit === 0) {
      // Founder at center
      const m = orbitMembers[0];
      if (m) {
        stars.push({
          member: m,
          x: 0,
          y: 0,
          diameter: starDiameter(m.impact_score, true),
          isFounder: true,
        });
      }
      continue;
    }

    const radius = (ORBIT_RADII[orbit] || 400) * scale;
    const count = orbitMembers.length;
    // Offset angle so orbits don't align — visual variety
    const angleOffset = orbit === 1 ? -Math.PI / 2 : orbit === 2 ? Math.PI / 6 : Math.PI / 3;

    orbitMembers.forEach((m, i) => {
      const angle = angleOffset + (i / count) * Math.PI * 2;
      stars.push({
        member: m,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        diameter: starDiameter(m.impact_score, false),
        isFounder: false,
      });
    });
  }

  return { stars, orbitRadii };
}

/** Connection pairs — thin lines between founder and leadership. */
export function getConnectionLines(stars: PositionedStar[]): Array<{ from: PositionedStar; to: PositionedStar }> {
  const founder = stars.find((s) => s.isFounder);
  if (!founder) return [];
  return stars
    .filter((s) => !s.isFounder && s.member.hierarchy_level === 'leadership')
    .map((s) => ({ from: founder, to: s }));
}

/** Responsive: how many orbits to show at a given viewport width. */
export function visibleOrbits(viewportWidth: number): number {
  if (viewportWidth < 768) return 0; // mobile uses separate layout
  if (viewportWidth < 1100) return 2; // tablet: orbits 0-2
  return 4; // desktop: all orbits
}
