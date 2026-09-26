# Team Galaxy — Mobile / Tablet Sketch

## Problem
Desktop elliptical map is absolute-positioned. On ≤767px the same layout scales stars to ~25px for contributors — effectively invisible. Users see a heading and empty space.

## Proposal (sketch only — desktop unchanged)

### Mobile ≤767 — Orbital Stage
- Large founder “sun” (≥120px) fixed at top
- Satellite members in a horizontal snap-scroll orbit rail (72px+ portraits)
- Gold orbit rings + star dust for space atmosphere
- Tap opens bottom sheet with role + bio
- Escape / close control; 44px targets

### Tablet 768–1199 — Horseshoe
- Founder centered and large
- Team split into two readable side columns (arc metaphor)
- Soft orbit ellipses behind
- Selection shows bottom detail strip

### Desktop ≥1200
- Keep current `TeamGalaxy` map as-is

## Implementation note
Same `/api/team-members` data; branch layout by `matchMedia` inside `TeamGalaxy.tsx` (or CSS+markup variants). Do not remove desktop galaxy.
