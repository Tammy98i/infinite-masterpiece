export type WebinarSlideRef = {
  id: string;
  aliases?: string[];
};

export const WEBINAR_SLIDE_ALIASES: Record<string, string> = {
  hero: 'webinar-hero',
  'webinar-hero': 'webinar-hero',
  problem: 'problem',
  hosts: 'hosts',
  'team-universe': 'team-universe',
  fit: 'webinar-fit',
  'webinar-fit': 'webinar-fit',
  faq: 'webinar-faq',
  'webinar-faq': 'webinar-faq',
  register: 'webinar-register',
  'webinar-register': 'webinar-register',
  'webinar-register-bottom': 'webinar-register',
};

export function normalizeWebinarHash(raw: string): string {
  return decodeURIComponent(String(raw || '').replace(/^#/, '')).trim();
}

export function resolveWebinarSlideId(raw: string, slides: readonly WebinarSlideRef[]): string {
  const ids = slides.map((slide) => slide.id);
  const fallback = ids[0] || '';
  const key = normalizeWebinarHash(raw);
  if (!key) return fallback;

  const direct = slides.find((slide) => slide.id === key || slide.aliases?.includes(key));
  if (direct) return direct.id;

  const mapped = WEBINAR_SLIDE_ALIASES[key];
  if (mapped) {
    const aliased = slides.find((slide) => slide.id === mapped || slide.aliases?.includes(mapped));
    if (aliased) return aliased.id;
  }

  return fallback;
}

export function webinarSlideIndex(id: string, slides: readonly WebinarSlideRef[]): number {
  const index = slides.findIndex((slide) => slide.id === id);
  return index < 0 ? 0 : index;
}

export function stepWebinarSlide(index: number, total: number, direction: 1 | -1): number {
  if (total <= 0) return 0;
  return Math.min(total - 1, Math.max(0, index + direction));
}
