# Team Galaxy — Mobile / Tablet Sketch

## Problem
Desktop elliptical map is absolute-positioned. On ≤767px the same layout scales stars to ~25px for contributors — effectively invisible. Users see a heading and empty space.

## Shipped behavior (≤1199px Orbital Stage)

- Large featured sun (default founder Gal) at top
- Horizontal snap-scroll rail of everyone except the featured member
- Tap avatar → that person becomes the featured sun; bio under the name
- Outside click / Escape → reset featured to Gal
- Desktop ≥1200 keeps the elliptical map unchanged
