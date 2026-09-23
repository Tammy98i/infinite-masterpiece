/** Physical Tailwind tokens → logical tokens for LTR-authored class strings. */
export const PHYSICAL_TO_LOGICAL: Record<string, string> = {
  'pl-': 'ps-',
  'pr-': 'pe-',
  'ml-': 'ms-',
  'mr-': 'me-',
  'left-': 'start-',
  'right-': 'end-',
  'text-left': 'text-start',
  'text-right': 'text-start',
  'float-left': 'float-start',
  'float-right': 'float-end',
  'border-l-': 'border-s-',
  'border-r-': 'border-e-',
};

const PHYSICAL_CLASS =
  /(?:^|[\s:'"`])(-?(?:(?:max|min)-)?(?:sm|md|lg|xl|2xl):)?(?:-?(?:p|m|scroll-p|scroll-m)[lr]-|(?:-?(?:left|right)-(?!1\/2))|text-(?:left|right)|float-(?:left|right)|border-[lr]-)/;

/** True when a className token is a physical (left/right) utility that should be logical. */
export function isPhysicalUtility(token: string): boolean {
  return PHYSICAL_CLASS.test(token);
}

/** Convert LTR-authored physical utilities to logical start/end equivalents. */
export function toLogicalUtility(token: string): string {
  return token
    .replace(/\btext-right\b/g, 'text-start')
    .replace(/\btext-left\b/g, 'text-start')
    .replace(/\bfloat-left\b/g, 'float-start')
    .replace(/\bfloat-right\b/g, 'float-end')
    .replace(/(^|:)(-?)pl-/g, '$1$2ps-')
    .replace(/(^|:)(-?)pr-/g, '$1$2pe-')
    .replace(/(^|:)(-?)ml-/g, '$1$2ms-')
    .replace(/(^|:)(-?)mr-/g, '$1$2me-')
    .replace(/(^|:)(-?)left-(?!1\/2)/g, '$1$2start-')
    .replace(/(^|:)(-?)right-(?!1\/2)/g, '$1$2end-')
    .replace(/(^|:)(-?)border-l-/g, '$1$2border-s-')
    .replace(/(^|:)(-?)border-r-/g, '$1$2border-e-');
}

/**
 * Convert physical utilities that were authored against an already-RTL document.
 * Visual right is inline-start; visual left is inline-end.
 */
export function rtlPhysicalToLogical(token: string): string {
  return token
    .replace(/\btext-right\b/g, 'text-start')
    .replace(/\btext-left\b/g, 'text-start')
    .replace(/\bfloat-left\b/g, 'float-end')
    .replace(/\bfloat-right\b/g, 'float-start')
    .replace(/(^|:)(-?)pl-/g, '$1$2pe-')
    .replace(/(^|:)(-?)pr-/g, '$1$2ps-')
    .replace(/(^|:)(-?)ml-/g, '$1$2me-')
    .replace(/(^|:)(-?)mr-/g, '$1$2ms-')
    .replace(/(^|:)(-?)left-(?!1\/2)/g, '$1$2end-')
    .replace(/(^|:)(-?)right-(?!1\/2)/g, '$1$2start-')
    .replace(/(^|:)(-?)border-l-/g, '$1$2border-e-')
    .replace(/(^|:)(-?)border-r-/g, '$1$2border-s-');
}

/** Icons that must stay un-mirrored in RTL (universal, not directional). */
export const UNMIRRORED_ICONS = ['play', 'search', 'check', 'clock', 'pause', 'volume'] as const;
