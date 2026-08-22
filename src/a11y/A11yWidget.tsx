import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import {
  Accessibility,
  AlignJustify,
  CaseSensitive,
  Contrast,
  Heading,
  Link2,
  MousePointer2,
  MousePointerClick,
  Pause,
  RotateCcw,
  SunDim,
  Type,
  VolumeX,
  X,
  Maximize2,
} from 'lucide-react';
import {
  a11yStore,
  applyPrefsToElement,
  isAnyActive,
  nextContrast,
  nextLineSpacing,
  nextSaturation,
  nextTextSize,
  useA11yPrefs,
  type A11yPrefs,
  type ContrastMode,
  type LineSpacing,
  type SaturationMode,
  type TextSize,
} from './prefs';
import { collectPageOutline, focusPageElement } from './pageOutline';
import { useA11yMediaMuteObserver } from './useA11yMediaMuteObserver';

const DICT = {
  triggerLabel: 'פתיחת תפריט נגישות',
  title: 'הגדרות נגישות',
  close: 'סגירת תפריט נגישות',
  reset: 'איפוס הגדרות',
  keyboardHint: 'קיצור מקלדת: Alt+A',
  announceChange: 'הגדרה עודכנה',
  footerLink: 'הצהרת נגישות',
  tabPrefs: 'העדפות',
  tabOutline: 'מבנה דף',
  outlineLandmarks: 'ציוני דרך',
  outlineHeadings: 'כותרות',
  outlineEmpty: 'לא נמצאו רכיבים בדף זה.',
  labels: {
    links: 'הדגשת קישורים',
    contrast: 'ניגודיות',
    saturation: 'רוויה',
    textSize: 'גודל טקסט',
    lineSpacing: 'ריווח שורות',
    readableFont: 'גופן קריא',
    headings: 'הדגשת כותרות',
    cursorBlack: 'סמן שחור',
    cursorLarge: 'סמן גדול',
    reduceMotion: 'עצירת אנימציות',
    largeTargets: 'כפתורים גדולים',
    muteMedia: 'השתקת מדיה',
  },
  values: {
    contrast: {
      off: 'רגיל',
      high: 'גבוה',
      dark: 'כהה',
      light: 'בהיר',
      invert: 'היפוך',
      mono: 'שחור-לבן',
    } satisfies Record<ContrastMode, string>,
    saturation: {
      off: 'רגיל',
      low: 'נמוכה',
      high: 'גבוהה',
    } satisfies Record<SaturationMode, string>,
    textSize: {
      100: '100%',
      115: '115%',
      130: '130%',
      150: '150%',
    } satisfies Record<TextSize, string>,
    lineSpacing: {
      normal: 'רגיל',
      '16': '1.6',
      '20': '2.0',
    } satisfies Record<LineSpacing, string>,
  },
};

type PanelTab = 'prefs' | 'outline';

interface ToggleCardProps {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  label: string;
  active: boolean;
  valueLabel?: string;
  cycling?: boolean;
  onClick: () => void;
}

function ToggleCard({ icon: Icon, label, active, valueLabel, cycling, onClick }: ToggleCardProps) {
  return (
    <button
      type="button"
      className={`a11y-toggle-card${cycling && active ? ' a11y-cycling-active' : ''}`}
      onClick={onClick}
      aria-pressed={cycling ? undefined : active}
      aria-label={valueLabel ? `${label}: ${valueLabel}` : label}
    >
      <Icon className="w-6 h-6" aria-hidden />
      <span className="a11y-toggle-label">{label}</span>
      {valueLabel ? <span className="a11y-toggle-value">{valueLabel}</span> : null}
    </button>
  );
}

function PageOutlinePanel() {
  const { landmarks, headings } = collectPageOutline();

  if (landmarks.length === 0 && headings.length === 0) {
    return <p className="a11y-outline-empty">{DICT.outlineEmpty}</p>;
  }

  return (
    <>
      {landmarks.length > 0 ? (
        <section className="a11y-outline-section">
          <h3>{DICT.outlineLandmarks}</h3>
          <ul className="a11y-outline-list">
            {landmarks.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="a11y-outline-item"
                  onClick={() => focusPageElement(item.element)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {headings.length > 0 ? (
        <section className="a11y-outline-section">
          <h3>{DICT.outlineHeadings}</h3>
          <ul className="a11y-outline-list">
            {headings.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="a11y-outline-item"
                  onClick={() => focusPageElement(item.element)}
                >
                  {item.level ? `H${item.level}: ` : ''}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

export function A11yWidget() {
  const prefs = useA11yPrefs();
  const [open, setOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>('prefs');
  const [announcement, setAnnouncement] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useA11yMediaMuteObserver();

  useEffect(() => {
    applyPrefsToElement(document.documentElement, a11yStore.getSnapshot());
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.code === 'KeyA') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    setPanelTab('prefs');
    return undefined;
  }, [open]);

  const toggle = useCallback(
    (feature: keyof A11yPrefs, value: A11yPrefs[keyof A11yPrefs], announce: string) => {
      a11yStore.set({ [feature]: value } as Partial<A11yPrefs>);
      setAnnouncement(`${DICT.announceChange}: ${announce}`);
    },
    [],
  );

  const handleClose = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleReset = () => {
    a11yStore.reset();
    setAnnouncement(`${DICT.announceChange}: ${DICT.reset}`);
  };

  return (
    <>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <button
        ref={triggerRef}
        id="a11y-widget-trigger"
        type="button"
        onClick={() => setOpen(true)}
        aria-label={DICT.triggerLabel}
        aria-expanded={open}
        aria-controls="a11y-widget-panel"
        aria-keyshortcuts="Alt+A"
        className={isAnyActive(prefs) ? 'a11y-active' : undefined}
      >
        <Accessibility className="w-6 h-6" aria-hidden />
      </button>

      {open ? (
        <>
          <div id="a11y-widget-backdrop" aria-hidden="true" onClick={handleClose} />
          <div
            id="a11y-widget-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="a11y-widget-title"
          >
            <div className="a11y-panel-header">
              <h2 id="a11y-widget-title" className="a11y-panel-title">
                {DICT.title}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                className="a11y-panel-close"
                onClick={handleClose}
                aria-label={DICT.close}
              >
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>

            <div className="a11y-panel-tabs" role="tablist" aria-label="לשוניות תפריט נגישות">
              <button
                type="button"
                role="tab"
                className="a11y-panel-tab"
                aria-selected={panelTab === 'prefs'}
                onClick={() => setPanelTab('prefs')}
              >
                {DICT.tabPrefs}
              </button>
              <button
                type="button"
                role="tab"
                className="a11y-panel-tab"
                aria-selected={panelTab === 'outline'}
                onClick={() => setPanelTab('outline')}
              >
                {DICT.tabOutline}
              </button>
            </div>

            <div className="a11y-panel-body">
              {panelTab === 'prefs' ? (
                <div className="a11y-toggle-grid">
                  <ToggleCard
                    icon={Link2}
                    label={DICT.labels.links}
                    active={prefs.links}
                    onClick={() => toggle('links', !prefs.links, DICT.labels.links)}
                  />
                  <ToggleCard
                    icon={Contrast}
                    label={DICT.labels.contrast}
                    active={prefs.contrast !== 'off'}
                    valueLabel={DICT.values.contrast[prefs.contrast]}
                    cycling
                    onClick={() => {
                      const next = nextContrast(prefs.contrast);
                      toggle('contrast', next, DICT.values.contrast[next]);
                    }}
                  />
                  <ToggleCard
                    icon={SunDim}
                    label={DICT.labels.saturation}
                    active={prefs.saturation !== 'off'}
                    valueLabel={DICT.values.saturation[prefs.saturation]}
                    cycling
                    onClick={() => {
                      const next = nextSaturation(prefs.saturation);
                      toggle('saturation', next, DICT.values.saturation[next]);
                    }}
                  />
                  <ToggleCard
                    icon={Type}
                    label={DICT.labels.textSize}
                    active={prefs.textSize !== 100}
                    valueLabel={DICT.values.textSize[prefs.textSize]}
                    cycling
                    onClick={() => {
                      const next = nextTextSize(prefs.textSize);
                      toggle('textSize', next, DICT.values.textSize[next]);
                    }}
                  />
                  <ToggleCard
                    icon={AlignJustify}
                    label={DICT.labels.lineSpacing}
                    active={prefs.lineSpacing !== 'normal'}
                    valueLabel={DICT.values.lineSpacing[prefs.lineSpacing]}
                    cycling
                    onClick={() => {
                      const next = nextLineSpacing(prefs.lineSpacing);
                      toggle('lineSpacing', next, DICT.values.lineSpacing[next]);
                    }}
                  />
                  <ToggleCard
                    icon={CaseSensitive}
                    label={DICT.labels.readableFont}
                    active={prefs.readableFont}
                    onClick={() => toggle('readableFont', !prefs.readableFont, DICT.labels.readableFont)}
                  />
                  <ToggleCard
                    icon={Heading}
                    label={DICT.labels.headings}
                    active={prefs.headings}
                    onClick={() => toggle('headings', !prefs.headings, DICT.labels.headings)}
                  />
                  <ToggleCard
                    icon={Maximize2}
                    label={DICT.labels.largeTargets}
                    active={prefs.largeTargets}
                    onClick={() => toggle('largeTargets', !prefs.largeTargets, DICT.labels.largeTargets)}
                  />
                  <ToggleCard
                    icon={VolumeX}
                    label={DICT.labels.muteMedia}
                    active={prefs.muteMedia}
                    onClick={() => toggle('muteMedia', !prefs.muteMedia, DICT.labels.muteMedia)}
                  />
                  <ToggleCard
                    icon={MousePointer2}
                    label={DICT.labels.cursorBlack}
                    active={prefs.cursorBlack}
                    onClick={() => toggle('cursorBlack', !prefs.cursorBlack, DICT.labels.cursorBlack)}
                  />
                  <ToggleCard
                    icon={MousePointerClick}
                    label={DICT.labels.cursorLarge}
                    active={prefs.cursorLarge}
                    onClick={() => toggle('cursorLarge', !prefs.cursorLarge, DICT.labels.cursorLarge)}
                  />
                  <ToggleCard
                    icon={Pause}
                    label={DICT.labels.reduceMotion}
                    active={prefs.reduceMotion}
                    onClick={() => toggle('reduceMotion', !prefs.reduceMotion, DICT.labels.reduceMotion)}
                  />
                </div>
              ) : (
                <PageOutlinePanel />
              )}
            </div>

            <div className="a11y-panel-footer">
              <button type="button" className="a11y-reset-btn" onClick={handleReset}>
                <RotateCcw className="inline w-4 h-4 me-1 align-text-bottom" aria-hidden />
                {DICT.reset}
              </button>
              <p className="a11y-panel-hint">{DICT.keyboardHint}</p>
              <Link to="/accessibility" className="a11y-panel-link" onClick={handleClose}>
                {DICT.footerLink}
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
