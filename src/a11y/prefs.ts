import { useSyncExternalStore } from 'react';

export type ContrastMode = 'off' | 'high' | 'invert' | 'mono' | 'dark' | 'light';
export type SaturationMode = 'off' | 'low' | 'high';
export type TextSize = 100 | 115 | 130 | 150;
export type LineSpacing = 'normal' | '16' | '20';

export interface A11yPrefs {
  version: number;
  links: boolean;
  contrast: ContrastMode;
  saturation: SaturationMode;
  textSize: TextSize;
  lineSpacing: LineSpacing;
  readableFont: boolean;
  headings: boolean;
  cursorBlack: boolean;
  cursorLarge: boolean;
  reduceMotion: boolean;
  largeTargets: boolean;
  muteMedia: boolean;
}

export const A11Y_VERSION = 2;
export const A11Y_STORAGE_KEY = 'site_a11y_prefs_v1';

export const DEFAULT_PREFS: A11yPrefs = Object.freeze({
  version: A11Y_VERSION,
  links: false,
  contrast: 'off',
  saturation: 'off',
  textSize: 100,
  lineSpacing: 'normal',
  readableFont: false,
  headings: false,
  cursorBlack: false,
  cursorLarge: false,
  reduceMotion: false,
  largeTargets: false,
  muteMedia: false,
});

const CONTRAST_CYCLE: ContrastMode[] = ['off', 'high', 'dark', 'light', 'invert', 'mono'];
const SATURATION_CYCLE: SaturationMode[] = ['off', 'low', 'high'];
const TEXT_SIZE_CYCLE: TextSize[] = [100, 115, 130, 150];
const LINE_SPACING_CYCLE: LineSpacing[] = ['normal', '16', '20'];

export function nextContrast(c: ContrastMode): ContrastMode {
  return CONTRAST_CYCLE[(CONTRAST_CYCLE.indexOf(c) + 1) % CONTRAST_CYCLE.length];
}

export function nextSaturation(s: SaturationMode): SaturationMode {
  return SATURATION_CYCLE[(SATURATION_CYCLE.indexOf(s) + 1) % SATURATION_CYCLE.length];
}

export function nextTextSize(s: TextSize): TextSize {
  return TEXT_SIZE_CYCLE[(TEXT_SIZE_CYCLE.indexOf(s) + 1) % TEXT_SIZE_CYCLE.length];
}

export function nextLineSpacing(l: LineSpacing): LineSpacing {
  return LINE_SPACING_CYCLE[(LINE_SPACING_CYCLE.indexOf(l) + 1) % LINE_SPACING_CYCLE.length];
}

export function isAnyActive(prefs: A11yPrefs): boolean {
  return (
    prefs.links ||
    prefs.contrast !== 'off' ||
    prefs.saturation !== 'off' ||
    prefs.textSize !== 100 ||
    prefs.lineSpacing !== 'normal' ||
    prefs.readableFont ||
    prefs.headings ||
    prefs.cursorBlack ||
    prefs.cursorLarge ||
    prefs.reduceMotion ||
    prefs.largeTargets ||
    prefs.muteMedia
  );
}

const CLASS_RULES: ReadonlyArray<[
  className: string,
  predicate: (p: A11yPrefs) => boolean,
  js: string,
]> = [
  ['a11y-links', (p) => p.links, '!!p.links'],
  ['a11y-contrast-high', (p) => p.contrast === 'high', "p.contrast==='high'"],
  ['a11y-contrast-invert', (p) => p.contrast === 'invert', "p.contrast==='invert'"],
  ['a11y-contrast-mono', (p) => p.contrast === 'mono', "p.contrast==='mono'"],
  ['a11y-contrast-dark', (p) => p.contrast === 'dark', "p.contrast==='dark'"],
  ['a11y-contrast-light', (p) => p.contrast === 'light', "p.contrast==='light'"],
  ['a11y-sat-low', (p) => p.saturation === 'low', "p.saturation==='low'"],
  ['a11y-sat-high', (p) => p.saturation === 'high', "p.saturation==='high'"],
  ['a11y-text-115', (p) => p.textSize === 115, 'p.textSize===115'],
  ['a11y-text-130', (p) => p.textSize === 130, 'p.textSize===130'],
  ['a11y-text-150', (p) => p.textSize === 150, 'p.textSize===150'],
  ['a11y-lines-16', (p) => p.lineSpacing === '16', "p.lineSpacing==='16'"],
  ['a11y-lines-20', (p) => p.lineSpacing === '20', "p.lineSpacing==='20'"],
  ['a11y-readable-font', (p) => p.readableFont, '!!p.readableFont'],
  ['a11y-headings', (p) => p.headings, '!!p.headings'],
  ['a11y-cursor-black', (p) => p.cursorBlack, '!!p.cursorBlack'],
  ['a11y-cursor-large', (p) => p.cursorLarge, '!!p.cursorLarge'],
  ['a11y-reduce-motion', (p) => p.reduceMotion, '!!p.reduceMotion'],
  ['a11y-large-targets', (p) => p.largeTargets, '!!p.largeTargets'],
  ['a11y-mute-media', (p) => p.muteMedia, '!!p.muteMedia'],
];

function syncMediaMute(mute: boolean): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('video, audio').forEach((node) => {
    const media = node as HTMLMediaElement;
    media.muted = mute;
  });
}

export function applyPrefsToElement(el: HTMLElement, prefs: A11yPrefs): void {
  for (const [cls, pred] of CLASS_RULES) {
    el.classList.toggle(cls, pred(prefs));
  }
  syncMediaMute(prefs.muteMedia);
}

/** Keep in sync with the inline bootstrap script in index.html */
export const A11Y_BOOTSTRAP_SCRIPT =
  `(function(){try{var raw=localStorage.getItem(${JSON.stringify(A11Y_STORAGE_KEY)});` +
  `if(!raw)return;var p=JSON.parse(raw);if(p.version!==${A11Y_VERSION})return;` +
  `var c=document.documentElement.classList;` +
  CLASS_RULES.map(([cls, , js]) => `c.toggle(${JSON.stringify(cls)},${js})`).join(';') +
  `}catch(e){}})()`;

function normalizeStoredPrefs(parsed: Partial<A11yPrefs> & { version?: number }): A11yPrefs | null {
  if (parsed.version === A11Y_VERSION) {
    return { ...DEFAULT_PREFS, ...parsed, version: A11Y_VERSION };
  }
  if (parsed.version === 1) {
    return {
      ...DEFAULT_PREFS,
      links: Boolean(parsed.links),
      contrast: parsed.contrast ?? 'off',
      textSize: parsed.textSize ?? 100,
      lineSpacing: parsed.lineSpacing ?? 'normal',
      readableFont: Boolean(parsed.readableFont),
      headings: Boolean(parsed.headings),
      cursorBlack: Boolean(parsed.cursorBlack),
      cursorLarge: Boolean(parsed.cursorLarge),
      reduceMotion: Boolean(parsed.reduceMotion),
      version: A11Y_VERSION,
    };
  }
  return null;
}

function readStorage(): A11yPrefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<A11yPrefs> & { version?: number };
    const normalized = normalizeStoredPrefs(parsed);
    if (normalized && parsed.version !== A11Y_VERSION) {
      localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return null;
  }
}

const listeners = new Set<() => void>();
let cached: A11yPrefs | undefined;

function notify(next?: A11yPrefs) {
  cached = next ?? readStorage() ?? DEFAULT_PREFS;
  for (const cb of listeners) cb();
}

function writeStorage(prefs: A11yPrefs) {
  try {
    localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // quota / private mode
  }
}

export const a11yStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  getSnapshot(): A11yPrefs {
    if (cached === undefined) cached = readStorage() ?? DEFAULT_PREFS;
    return cached;
  },
  getServerSnapshot(): A11yPrefs {
    return DEFAULT_PREFS;
  },
  set(partial: Partial<A11yPrefs>): A11yPrefs {
    const next: A11yPrefs = { ...this.getSnapshot(), ...partial, version: A11Y_VERSION };
    writeStorage(next);
    if (typeof document !== 'undefined') {
      applyPrefsToElement(document.documentElement, next);
    }
    notify(next);
    return next;
  },
  reset(): A11yPrefs {
    try {
      localStorage.removeItem(A11Y_STORAGE_KEY);
    } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      applyPrefsToElement(document.documentElement, DEFAULT_PREFS);
    }
    notify(DEFAULT_PREFS);
    return DEFAULT_PREFS;
  },
};

export function useA11yPrefs(): A11yPrefs {
  return useSyncExternalStore(
    a11yStore.subscribe,
    a11yStore.getSnapshot,
    a11yStore.getServerSnapshot,
  );
}
