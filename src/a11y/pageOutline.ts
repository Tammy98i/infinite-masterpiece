export interface PageOutlineItem {
  id: string;
  label: string;
  level?: number;
  element: HTMLElement;
}

const LANDMARK_SELECTORS = [
  'main',
  'nav',
  'header',
  'footer',
  '[role="main"]',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
];

function landmarkLabel(el: HTMLElement): string {
  const aria = el.getAttribute('aria-label')?.trim();
  if (aria) return aria;
  const tag = el.tagName.toLowerCase();
  if (tag === 'main' || el.getAttribute('role') === 'main') return 'תוכן ראשי';
  if (tag === 'nav' || el.getAttribute('role') === 'navigation') return 'ניווט';
  if (tag === 'header' || el.getAttribute('role') === 'banner') return 'כותרת';
  if (tag === 'footer' || el.getAttribute('role') === 'contentinfo') return 'תחתית';
  return tag;
}

export function collectPageOutline(): { landmarks: PageOutlineItem[]; headings: PageOutlineItem[] } {
  if (typeof document === 'undefined') {
    return { landmarks: [], headings: [] };
  }

  const panel = document.getElementById('a11y-widget-panel');
  const landmarks: PageOutlineItem[] = [];
  const seen = new Set<HTMLElement>();

  for (const selector of LANDMARK_SELECTORS) {
    document.querySelectorAll<HTMLElement>(selector).forEach((el, index) => {
      if (seen.has(el) || panel?.contains(el)) return;
      seen.add(el);
      landmarks.push({
        id: `landmark-${index}-${selector}`,
        label: landmarkLabel(el),
        element: el,
      });
    });
  }

  const headings: PageOutlineItem[] = [];
  document.querySelectorAll<HTMLElement>('h1, h2, h3').forEach((el, index) => {
    if (panel?.contains(el)) return;
    const text = el.textContent?.trim() || `כותרת ${index + 1}`;
    headings.push({
      id: `heading-${index}`,
      label: text.slice(0, 80),
      level: Number(el.tagName.charAt(1)),
      element: el,
    });
  });

  return { landmarks, headings };
}

export function focusPageElement(el: HTMLElement): void {
  if (!el.hasAttribute('tabindex')) {
    el.setAttribute('tabindex', '-1');
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.focus({ preventScroll: true });
}
