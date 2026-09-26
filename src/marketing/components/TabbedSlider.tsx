import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactElement } from 'react';
import {
  BarChart3,
  ChevronDown,
  Rocket,
  Settings,
  Tag,
  Target,
} from 'lucide-react';
import { DirNext } from '../../components/DirArrow';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Journey } from '../pages/Journey';
import { Premium88 } from '../pages/Premium88';
import { Pricing } from '../pages/Pricing';
import { FAQS } from '../pages/FAQPage';
import './TabbedSlider.css';

type TabId = 'difference' | 'journey' | 'team' | 'platform' | 'pricing' | 'faq';

type Tab = {
  id: TabId;
  label: string;
  tone: 'cream' | 'dark';
};

const TABS: Tab[] = [
  { id: 'difference', label: 'במה זה שונה', tone: 'cream' },
  { id: 'journey', label: 'תהליך', tone: 'dark' },
  { id: 'team', label: 'צוות המיזם', tone: 'cream' },
  { id: 'platform', label: 'הפלטפורמה', tone: 'dark' },
  { id: 'pricing', label: 'מחירון', tone: 'cream' },
  { id: 'faq', label: 'שאלות', tone: 'dark' },
];

const COMPACT_QUERY = '(max-width: 900px)';

function subscribeCompact(onChange: () => void) {
  const query = window.matchMedia(COMPACT_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function getCompactSnapshot() {
  return window.matchMedia(COMPACT_QUERY).matches;
}

function useCompactTabs() {
  return useSyncExternalStore(subscribeCompact, getCompactSnapshot, () => false);
}

const DIFFERENCE_ITEMS = [
  { icon: Target, title: 'מתחילים ממכירה', body: 'לא מאפס' },
  { icon: Tag, title: 'מציגים ערך ברור', body: 'ומוכרים אותו' },
  { icon: BarChart3, title: 'מכניסים כסף', body: 'ורק אז בונים' },
  { icon: Settings, title: 'בונים מערכת עסקית', body: 'סביב היצירה' },
  { icon: Rocket, title: 'סקייל, חופש והשפעה', body: 'בקצב שלך' },
];

function DifferencePanel() {
  return (
    <div className="tabbed-content tabbed-difference">
      <p className="tabbed-kicker">במה זה שונה</p>
      <h2>אנחנו לא מוכרים חלומות.<br /><span>אנחנו בונים מערכות עבודה חכמות.</span></h2>
      <div className="tabbed-number-grid">
        {DIFFERENCE_ITEMS.map((item, index) => (
          <article key={item.title}>
            <span className="tabbed-number">{index + 1}</span>
            <item.icon aria-hidden="true" />
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
      <Link to="/#journey" className="tabbed-link">לפירוט מסע 33 הימים <DirNext /></Link>
    </div>
  );
}

function JourneyPanel() {
  return <Journey embedded />;
}

function TeamPanel() {
  return <Premium88 embedded />;
}

function PlatformPanel() {
  return (
    <div className="tabbed-content">
      <p className="tabbed-kicker">הפלטפורמה</p>
      <h2>התכנים וההתקדמות במקום אחד.</h2>
      <p className="tabbed-lede">אחרי הכניסה, הספרייה מחזיקה את השיעורים ואת ההמשך. אין כאן מסלול נפרד.</p>
      <Link to="/library" className="tabbed-link">כניסה לספרייה <DirNext /></Link>
    </div>
  );
}

function PricingPanel() {
  return <Pricing embedded />;
}

function FaqPanel() {
  return (
    <div className="tabbed-content tabbed-faq">
      <p className="tabbed-kicker">בהירות לפני החלטה</p>
      <h2>שאלות נפוצות</h2>
      <div className="tabbed-faq-list">
        {FAQS.map(item => (
          <details key={item.q}>
            <summary><span>{item.q}</span><ChevronDown aria-hidden="true" /></summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

const PANELS: Record<TabId, () => ReactElement> = {
  difference: DifferencePanel,
  journey: JourneyPanel,
  team: TeamPanel,
  platform: PlatformPanel,
  pricing: PricingPanel,
  faq: FaqPanel,
};

function tabFromHash(hash: string): TabId | null {
  const id = hash.replace(/^#/, '');
  if (id === 'gradual') return 'pricing';
  if (id === 'process') return 'journey';
  return TABS.some(tab => tab.id === id) ? id as TabId : null;
}

export function TabbedSlider() {
  const navigate = useNavigate();
  const location = useLocation();
  const compact = useCompactTabs();
  const [active, setActive] = useState<TabId>(() => tabFromHash(window.location.hash) ?? 'difference');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = Math.max(0, TABS.findIndex(tab => tab.id === active));
  const activeTab = TABS[activeIndex] ?? TABS[0];
  const ActivePanel = PANELS[active];
  const prevTab = TABS[(activeIndex - 1 + TABS.length) % TABS.length];
  const nextTab = TABS[(activeIndex + 1) % TABS.length];

  useEffect(() => {
    const next = tabFromHash(location.hash);
    if (!next) return;
    setActive(next);
    document.getElementById('home-topics')?.scrollIntoView({ block: 'start' });
  }, [location.hash]);

  const selectTab = (id: TabId) => {
    setActive(id);
    navigate({ pathname: '/', hash: id }, { replace: true });
  };

  const handleKeys = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : (index + (event.key === 'ArrowLeft' ? 1 : -1) + TABS.length) % TABS.length;
    const next = TABS[nextIndex];
    selectTab(next.id);
    tabRefs.current[nextIndex]?.focus();
  };

  const railTabs = compact
    ? [
        { tab: prevTab, index: (activeIndex - 1 + TABS.length) % TABS.length, slot: 'peek-prev' as const },
        { tab: activeTab, index: activeIndex, slot: 'featured' as const },
        { tab: nextTab, index: (activeIndex + 1) % TABS.length, slot: 'peek-next' as const },
      ]
    : TABS.map((tab, index) => ({ tab, index, slot: 'flat' as const }));

  return (
    <section id="home-topics" className="tabbed-slider" dir="rtl" aria-label="תוכן עמוד הבית">
      <div className="tabbed-tabs-wrap">
        <div
          className={`tabbed-tabs${compact ? ' tabbed-tabs--featured' : ''}`}
          role="tablist"
          aria-label="בחירת נושא"
        >
          {railTabs.map(({ tab, index, slot }) => (
            <button
              key={`${slot}-${tab.id}`}
              ref={node => { tabRefs.current[index] = node; }}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              aria-selected={active === tab.id}
              tabIndex={active === tab.id ? 0 : -1}
              className={slot === 'flat' ? undefined : `tabbed-tab--${slot}`}
              onClick={() => selectTab(tab.id)}
              onKeyDown={event => handleKeys(event, index)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div
        key={active}
        id={`panel-${active}`}
        role="tabpanel"
        aria-labelledby={`tab-${active}`}
        className={`tabbed-panel tabbed-panel--${activeTab.tone}${active === 'pricing' || active === 'journey' || active === 'team' ? ' tabbed-panel--embed' : ''}`}
      >
        <ActivePanel />
      </div>
    </section>
  );
}
