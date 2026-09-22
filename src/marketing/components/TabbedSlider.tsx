import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  Rocket,
  Settings,
  Tag,
  Target,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EntryTrackCards } from './EntryTrackCards';
import { FAQS } from '../pages/FAQPage';
import './TabbedSlider.css';

type TabId = 'difference' | 'team' | 'platform' | 'pricing' | 'faq';

type Tab = {
  id: TabId;
  label: string;
  tone: 'cream' | 'dark';
};

const TABS: Tab[] = [
  { id: 'difference', label: 'במה זה שונה', tone: 'cream' },
  { id: 'team', label: 'נבחרת 88', tone: 'dark' },
  { id: 'platform', label: 'הפלטפורמה', tone: 'cream' },
  { id: 'pricing', label: 'מסלולים ומחיר', tone: 'dark' },
  { id: 'faq', label: 'שאלות', tone: 'cream' },
];

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
      <Link to="/journey" className="tabbed-link">לפירוט מסע 33 הימים <ArrowLeft aria-hidden="true" /></Link>
    </div>
  );
}

function TeamPanel() {
  return (
    <div className="tabbed-content">
      <p className="tabbed-kicker">שכבת העומק</p>
      <h2>נבחרת 88</h2>
      <p className="tabbed-lede">עד 88 יוצרים שעובדים קרוב יותר, לפי התאמה. זה לא חלק מבחירת המסלול.</p>
      <Link to="/premium-88" className="tabbed-link">לעמוד נבחרת 88 <ArrowLeft aria-hidden="true" /></Link>
    </div>
  );
}

function PlatformPanel() {
  return (
    <div className="tabbed-content">
      <p className="tabbed-kicker">הפלטפורמה</p>
      <h2>התכנים וההתקדמות במקום אחד.</h2>
      <p className="tabbed-lede">אחרי הכניסה, הספרייה מחזיקה את השיעורים ואת ההמשך. אין כאן מסלול נפרד.</p>
      <Link to="/library" className="tabbed-link">כניסה לספרייה <ArrowLeft aria-hidden="true" /></Link>
    </div>
  );
}

function PricingPanel() {
  return (
    <div className="tabbed-content tabbed-pricing">
      <p className="tabbed-kicker">אמיצים או הססנים</p>
      <h2>מסלולים ומחיר</h2>
      <p className="tabbed-lede">שתי דרכי כניסה. אותו מסע. ההבדל הוא בקצב הכניסה ובכרטיסי ההגרלה.</p>
      <EntryTrackCards />
      <p className="tabbed-lede">מסלול ההססנים הוא אותו מחיר מלא, 8,888 ₪ לפני מע״מ, בפריסה שמתחילה ב־8 ₪. לא הנחה ולא מסלול חלקי.</p>
      <div className="tabbed-steps" aria-label="שלבי התשלום"><span>8 ₪</span><i /><span>80 ₪</span><i /><span>800 ₪</span><i /><span>8,000 ₪</span></div>
    </div>
  );
}

function FaqPanel() {
  return (
    <div className="tabbed-content tabbed-faq">
      <p className="tabbed-kicker">בהירות לפני החלטה</p>
      <h2>שאלות שכדאי לשאול</h2>
      <div className="tabbed-faq-list">
        {FAQS.slice(0, 4).map(item => (
          <details key={item.q}>
            <summary><span>{item.q}</span><ChevronDown aria-hidden="true" /></summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
      <Link to="/faq" className="tabbed-button">לכל השאלות הנפוצות</Link>
    </div>
  );
}

const PANELS: Record<TabId, () => ReactElement> = {
  difference: DifferencePanel,
  team: TeamPanel,
  platform: PlatformPanel,
  pricing: PricingPanel,
  faq: FaqPanel,
};

function tabFromHash(hash: string): TabId | null {
  const id = hash.replace(/^#/, '');
  if (id === 'gradual') return 'pricing';
  return TABS.some(tab => tab.id === id) ? id as TabId : null;
}

export function TabbedSlider() {
  const [active, setActive] = useState<TabId>(() => tabFromHash(window.location.hash) ?? 'difference');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeTab = TABS.find(tab => tab.id === active) ?? TABS[0];
  const ActivePanel = PANELS[active];

  useEffect(() => {
    const apply = () => {
      const next = tabFromHash(window.location.hash);
      if (!next) return;
      setActive(next);
      document.getElementById('home-topics')?.scrollIntoView({ block: 'start' });
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  const selectTab = (id: TabId) => {
    setActive(id);
    const next = `${window.location.pathname}${window.location.search}#${id}`;
    window.history.replaceState(null, '', next);
  };

  const handleKeys = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : (index + (event.key === 'ArrowLeft' ? 1 : -1) + TABS.length) % TABS.length;
    const next = TABS[nextIndex];
    selectTab(next.id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <section id="home-topics" className="tabbed-slider" dir="rtl" aria-label="תוכן עמוד הבית">
      <div className="tabbed-tabs-wrap">
        <div className="tabbed-tabs" role="tablist" aria-label="בחירת נושא">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              ref={node => { tabRefs.current[index] = node; }}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              aria-selected={active === tab.id}
              tabIndex={active === tab.id ? 0 : -1}
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
        className={`tabbed-panel tabbed-panel--${activeTab.tone}`}
      >
        <ActivePanel />
      </div>
    </section>
  );
}
