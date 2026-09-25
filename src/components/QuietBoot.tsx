import { useEffect } from 'react';

const HOLD_MS = 480;
const FADE_MS = 520;

/** Covers first paint so fonts and header height settle without a flash. */
export function QuietBoot() {
  useEffect(() => {
    // React SkipLink / page H1 take over; drop static shell copies to avoid duplicate Tab stops / H1s.
    document.getElementById('shell-skip-link')?.remove();
    document.getElementById('shell-doc-heading')?.remove();

    const el = document.getElementById('quiet-boot');
    if (!el) return;

    const reduce =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('a11y-reduce-motion');

    if (reduce) {
      el.remove();
      return;
    }

    const hide = window.setTimeout(() => el.classList.add('quiet-boot-out'), HOLD_MS);
    const remove = window.setTimeout(() => el.remove(), HOLD_MS + FADE_MS);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(remove);
    };
  }, []);

  return null;
}
