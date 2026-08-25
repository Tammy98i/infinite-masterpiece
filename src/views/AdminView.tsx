import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { OnboardingCenterView } from './admin/OnboardingCenterView';
import { captionTracksFromVttUrl, vttUrlFromCaptionTracks } from '../constants/captions';
import { adminApi, type AdminAnalytics, type AdminAuditLog, type AdminCrmLead, type AdminNotification, type AdminOverview, type AdminPaymentRow, type AdminPremium88Application, type AdminRaffleDashboard, type AdminReadiness, type AdminTrackLead, type AdminTracksDashboard, type AdminUserRow, type AdminWebinarDashboard, type CoursePayload } from '../api/admin';
import { DEFAULT_WEBINAR_CONFIG, type WebinarConfig } from '../constants/webinar';
import type { LecturerApplication } from '../api/lecturer';
import type { AccessLevel, Category, Course, Instructor, PublishStatus } from '../types';
import { trackEvent } from '../utils/analytics';
import { Search } from 'lucide-react';
import { FileUploadField } from '../components/FileUploadField';
import { useConfirm } from '../components/ops/ConfirmDialog';
import { OpsBand, OpsDeskStack, OpsEmptyList, OpsFact, OpsField, OpsListRow, OpsMasterDetail, OpsPageHeader, OpsSection, OpsToolbar, opsChipClass, opsFieldClass, opsGhostBtn, opsLabelClass, opsPrimaryBtn } from '../components/ops/OpsUi';
import { accessLabelHe, formatOpsDate, isPayingPlan, opsStatusHe, planLabelHe, raffleStatusHe, roleLabelHe } from '../utils/opsLabels';

type Tab =
  | 'overview'
  | 'users'
  | 'payments'
  | 'tracks'
  | 'content'
  | 'categories'
  | 'founders'
  | 'team'
  | 'lecturers'
  | 'premium88'
  | 'funnel'
  | 'analytics'
  | 'raffles'
  | 'leads'
  | 'webinar'
  | 'notifications'
  | 'settings'
  | 'legal'
  | 'audit'
  | 'onboarding';

type NavItem = {
  id: Tab;
  label: string;
  ready: boolean;
  badge?: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'מה צריך ממך עכשיו', ready: true },
  { id: 'users', label: 'משתמשים', ready: true },
  { id: 'payments', label: 'מנויים ותשלומים', ready: true },
  { id: 'tracks', label: 'מסלולי כניסה', ready: true },
  { id: 'content', label: 'תכני VOD', ready: true },
  { id: 'categories', label: 'קטגוריות', ready: true },
  { id: 'founders', label: 'צוות מייסדים', ready: true },
  { id: 'team', label: 'צוות ומרצים', ready: true },
  { id: 'lecturers', label: 'בקשות מרצים', ready: true },
  { id: 'premium88', label: 'נבחרת 88', ready: true },
  { id: 'funnel', label: 'משפך חינמיים', ready: true },
  { id: 'analytics', label: 'אנליטיקות', ready: true },
  { id: 'raffles', label: 'הגרלות', ready: true },
  { id: 'leads', label: 'לידים ופניות', ready: true },
  { id: 'webinar', label: 'וובינר', ready: true },
  { id: 'notifications', label: 'תור פעולות', ready: true },
  { id: 'settings', label: 'הגדרות', ready: true },
  { id: 'legal', label: 'משפטי', ready: true },
  { id: 'audit', label: 'יומן פעולות', ready: true },
  { id: 'onboarding', label: 'הדרכות', ready: true },
];

const NAV_GROUPS: { id: string; label: string; tabIds: Tab[] }[] = [
  { id: 'today', label: 'היום', tabIds: ['overview'] },
  { id: 'people', label: 'אנשים', tabIds: ['users', 'team', 'lecturers'] },
  { id: 'money', label: 'כסף', tabIds: ['payments', 'tracks', 'raffles'] },
  { id: 'content', label: 'תוכן', tabIds: ['content', 'categories', 'founders'] },
  { id: 'site', label: 'אתר', tabIds: ['webinar', 'leads', 'funnel', 'premium88', 'analytics', 'notifications', 'settings', 'legal', 'audit', 'onboarding'] },
];

const STATUS_LABEL: Record<PublishStatus, string> = {
  draft: 'טיוטה',
  pending_review: 'בבדיקה',
  published: 'פורסם',
  blocked: 'חסום',
};

const ACCESS_LABEL: Record<AccessLevel, string> = {
  free: 'חינמי',
  premium: 'פרימיום',
  premium_88: 'נבחרת 88',
  admin_only: 'אדמין בלבד',
};

const fieldClass = opsFieldClass;

const STAFF_DESK_TABS: Record<string, Tab[]> = {
  content: ['overview', 'content', 'categories', 'lecturers', 'founders', 'team', 'notifications', 'audit', 'onboarding'],
  support: ['overview', 'users', 'leads', 'notifications', 'audit', 'team'],
  sales: ['overview', 'leads', 'webinar', 'tracks', 'payments', 'funnel', 'premium88', 'analytics', 'notifications', 'team'],
  legal: ['overview', 'legal', 'settings', 'audit', 'notifications', 'team'],
  finance: ['overview', 'payments', 'tracks', 'analytics', 'notifications', 'audit', 'team'],
  community: ['overview', 'users', 'leads', 'premium88', 'funnel', 'notifications', 'team'],
};

const STAFF_DESK_LABEL: Record<string, string> = {
  content: 'תוכן',
  support: 'תמיכה',
  sales: 'מכירות / הצלחה',
  legal: 'משפטי',
  finance: 'כספים',
  community: 'קהילה',
};

function linkUrl(founder: Instructor, label: string) {
  return founder.externalLinks?.find((item) => item.label === label)?.url || '';
}

function normalizeExternalUrl(raw: string) {
  const value = raw.trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function AdminView() {
  const { user, isAdmin, setView, categories, instructors, reloadCatalog } = useApp();
  const [tab, setTab] = useState<Tab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ today: true });

  const staffDesk = user.staffDesk || '';
  const allowedTabs = staffDesk && STAFF_DESK_TABS[staffDesk] ? STAFF_DESK_TABS[staffDesk] : null;
  const visibleNav = allowedTabs ? NAV_ITEMS.filter((item) => allowedTabs.includes(item.id)) : NAV_ITEMS;
  const navGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.tabIds
          .map((id) => visibleNav.find((item) => item.id === id))
          .filter((item): item is NavItem => Boolean(item)),
      })).filter((group) => group.items.length > 0),
    [visibleNav]
  );

  useEffect(() => {
    if (isAdmin) trackEvent('admin_opened_dashboard');
  }, [isAdmin]);

  useEffect(() => {
    if (allowedTabs && !allowedTabs.includes(tab)) {
      setTab(allowedTabs[0] || 'overview');
    }
  }, [allowedTabs, tab]);

  useEffect(() => {
    const group = NAV_GROUPS.find((item) => item.tabIds.includes(tab));
    if (group) {
      setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
    }
  }, [tab]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] text-white pt-28 pb-24 px-4 text-right">
        <div className="max-w-md mx-auto border border-white/10 rounded-3xl p-8">
          <h1 className="text-2xl font-medium mb-3">אין הרשאת ניהול</h1>
          <p className="text-sm text-white/50 font-light mb-6">
            האזור הזה פתוח למנהלות ומנהלים בלבד.
          </p>
          <button
            type="button"
            onClick={() => setView('home')}
            className="w-full py-3 rounded-full border border-white/15 text-sm min-h-11 cursor-pointer"
          >
            חזרה לספרייה
          </button>
        </div>
      </div>
    );
  }

  const goTab = (id: Tab) => {
    setTab(id);
    setMobileNavOpen(false);
  };

  const navButton = (item: NavItem) => {
    const active = tab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => goTab(item.id)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm min-h-11 text-right transition-colors ${
          active
            ? 'bg-[#C8A24C]/15 text-[#F7E7B5] border border-[#C8A24C]/40'
            : 'text-white/70 hover:text-white hover:bg-white/[0.04] border border-transparent'
        }`}
      >
        <span className="font-light">{item.label}</span>
        {item.badge ? (
          <span className="text-xs tracking-wide text-[#C8A24C] border border-[#C8A24C]/40 rounded-full px-2 py-0.5">
            {item.badge}
          </span>
        ) : !item.ready ? (
          <span className="text-xs text-white/40">בקרוב</span>
        ) : null}
      </button>
    );
  };

  const renderGroupedNav = () => (
    <nav className="p-3 grid gap-3 content-start">
      {navGroups.map((group) => {
        const expanded = openGroups[group.id] !== false && (openGroups[group.id] || group.items.some((item) => item.id === tab) || group.id === 'today');
        return (
          <div key={group.id}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpenGroups((prev) => ({ ...prev, [group.id]: !expanded }))}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-white/55 min-h-11 hover:text-white"
            >
              <span>{group.label}</span>
              <span aria-hidden className="text-white/35">{expanded ? '▾' : '◂'}</span>
            </button>
            {expanded ? <div className="grid gap-1">{group.items.map(navButton)}</div> : null}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white text-right" dir="rtl">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-s border-white/10 bg-[#080808] sticky top-0 h-screen overflow-y-auto">
          <div className="p-5 border-b border-white/10">
            <h1 className="text-xl font-light">לוח בקרה</h1>
            <p className="text-sm text-white/50 mt-2 font-light truncate">{user.name}</p>
          </div>
          <div className="flex-1">{renderGroupedNav()}</div>
          <div className="p-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setView('home')}
              className="w-full px-4 py-2.5 rounded-full border border-white/15 text-sm min-h-11 cursor-pointer hover:border-white/40"
            >
              לספרייה
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050505]/90 backdrop-blur-xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="lg:hidden px-3 py-2 rounded-xl border border-white/15 text-sm min-h-11"
                onClick={() => setMobileNavOpen((open) => !open)}
                aria-expanded={mobileNavOpen}
              >
                מסכים
              </button>
              <div className="min-w-0">
                <p className="text-sm text-white/70 font-light truncate">
                  שלום, {user.name.split(' ')[0] || 'אדמין'}
                </p>
                <p className="text-sm text-white/50">
                  {staffDesk ? `צוות · ${STAFF_DESK_LABEL[staffDesk] || staffDesk}` : 'מנהל/ת ראשי/ת'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setView('home')}
              className="lg:hidden px-3 py-2 rounded-full border border-white/15 text-sm min-h-11"
            >
              ספרייה
            </button>
          </header>

          {mobileNavOpen ? (
            <div className="lg:hidden border-b border-white/10 bg-[#080808]">{renderGroupedNav()}</div>
          ) : null}

          <main className="px-4 sm:px-6 lg:px-8 py-8 pb-24 max-w-7xl">
            {staffDesk ? (
              <p className="text-sm text-[#C8A24C]/90 mb-4">
                מצב צוות מוגבל: {STAFF_DESK_LABEL[staffDesk] || staffDesk}. גישה מלאה רק לאדמין ראשי.
              </p>
            ) : null}
            {tab === 'overview' && <OverviewPanel onNavigate={goTab} staffDesk={staffDesk} />}
            {tab === 'content' && (
              <ContentPanel
                categories={categories}
                instructors={instructors}
                onSaved={() => void reloadCatalog()}
              />
            )}
            {tab === 'analytics' && <AnalyticsPanel />}
            {tab === 'funnel' && <AnalyticsPanel focus="funnel" />}
            {tab === 'users' && <UsersPanel />}
            {tab === 'lecturers' && <LecturerApplicationsPanel />}
            {tab === 'team' && <TeamStaffPanel />}
            {tab === 'founders' && <FoundersPanel />}
            {tab === 'payments' && <PaymentsPanel />}
            {tab === 'tracks' && <TracksPanel />}
            {tab === 'categories' && <CategoriesPanel />}
            {tab === 'premium88' && <Premium88Panel />}
            {tab === 'audit' && <AuditLogsPanel />}
            {tab === 'raffles' && <RafflesPanel />}
            {tab === 'leads' && <LeadsPanel />}
            {tab === 'webinar' && <WebinarPanel />}
            {tab === 'legal' && <LegalPanel />}
            {tab === 'settings' && <ReadinessPanel />}
            {tab === 'onboarding' && <OnboardingCenterView />}
            {tab === 'notifications' && <NotificationsPanel onNavigate={goTab} />}
          </main>
        </div>
      </div>
    </div>
  );
}

const NOTIF_SEVERITY_LABEL: Record<AdminNotification['severity'], string> = {
  high: 'דחוף',
  medium: 'לטיפול',
  low: 'מידע',
};

function NotificationsPanel({
  onNavigate,
  embedded = false,
}: {
  onNavigate: (tab: Tab) => void;
  embedded?: boolean;
}) {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [high, setHigh] = useState(0);
  const [error, setError] = useState('');

  const load = () =>
    adminApi
      .notifications()
      .then((res) => {
        setItems(res.notifications);
        setHigh(res.counts.high);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  if (error) return <p className="text-sm text-rose-300">{error}</p>;

  const selected = items.find((item) => item.id === selectedId) || null;

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title={embedded ? 'תור פעולות' : 'תור פעולות לטיפול'}
        hint={
          embedded
            ? high > 0
              ? `${high} דחופות לטיפול`
              : 'מה שהמערכת זיהתה עכשיו'
            : `סיכום אוטומטי מהמערכת.${high > 0 ? ` · ${high} דחופות` : ''}`
        }
        action={
          <button
            type="button"
            onClick={() => void load()}
            className="px-4 py-2 rounded-full border border-white/15 text-sm min-h-11 hover:border-white/40"
          >
            רענון
          </button>
        }
      />

      {items.length === 0 ? (
        <div className="border border-white/10 rounded-2xl p-8 text-base text-white/55">
          אין פריטים לטיפול כרגע. כשתהיה בקשה, תשלום שנכשל או הרצאה לבדיקה — זה יופיע כאן.
        </div>
      ) : (
        <OpsMasterDetail
          hasSelection={Boolean(selected)}
          onCloseDetail={() => setSelectedId(null)}
          emptyDetail="בחרו פריט מהרשימה."
          list={
            <ul className="divide-y divide-white/10">
              {items.map((item) => (
                <li key={item.id}>
                  <OpsListRow
                    active={selectedId === item.id}
                    onClick={() => setSelectedId(item.id)}
                    title={item.title}
                    meta={`${item.count} · ${NOTIF_SEVERITY_LABEL[item.severity]}`}
                    status={NOTIF_SEVERITY_LABEL[item.severity]}
                    statusClass={
                      item.severity === 'high'
                        ? 'text-rose-300'
                        : item.severity === 'medium'
                          ? 'text-[#C8A24C]'
                          : 'text-white/55'
                    }
                  />
                </li>
              ))}
            </ul>
          }
          detail={
            selected ? (
              <div className="grid gap-4">
                <h3 className="text-lg font-light text-[#C8A24C]">{selected.title}</h3>
                <OpsFact label="דחיפות">{NOTIF_SEVERITY_LABEL[selected.severity]}</OpsFact>
                <OpsFact label="כמות">{selected.count}</OpsFact>
                <p className="text-sm text-white/70 leading-relaxed">{selected.detail}</p>
                <button
                  type="button"
                  onClick={() => onNavigate(selected.tab as Tab)}
                  className={`${opsPrimaryBtn} w-fit`}
                >
                  מעבר לטיפול
                </button>
              </div>
            ) : null
          }
        />
      )}
    </OpsDeskStack>
  );
}

function ReadinessPanel() {
  const { reloadCatalog } = useApp();
  const [data, setData] = useState<AdminReadiness | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const load = () =>
    adminApi
      .readiness()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  if (error && !data) return <p className="text-sm text-rose-300">{error}</p>;
  if (!data) return <p className="text-sm text-white/40">טוען מוכנות...</p>;

  const setWeek = async (courseId: string, programWeek: number) => {
    setPending(true);
    setError('');
    try {
      await adminApi.setProgramWeek(courseId, programWeek);
      await reloadCatalog();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שיבוץ נכשל');
    } finally {
      setPending(false);
    }
  };

  const toggleRaffle = async (approved: boolean) => {
    setPending(true);
    setError('');
    try {
      await adminApi.setSetting('raffle_terms_approved', approved);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירה נכשלה');
    } finally {
      setPending(false);
    }
  };

  const statusClass = (ok: boolean) =>
    ok ? 'border-[#C8A24C]/40 bg-[#C8A24C]/10' : 'border-white/10 bg-white/[0.03]';

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title="הגדרות"
        hint="מפתחות, תמונות ושמות אמיתיים נשארים אצלכם. כאן רואים מה חסר, ומשבצים הרצאות קיימות לשבועות 3 ו־4."
      />
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`rounded-2xl border p-5 ${statusClass(data.stripeEnabled)}`}>
          <div className="text-xs text-white/40 mb-2">סליקה</div>
          <div className="text-lg font-light">
            {data.stripeEnabled || data.billingMode === 'stripe' ? 'Stripe מחובר' : 'פיילוט ידני'}
          </div>
          {!data.stripeEnabled && (
            <p className="text-xs text-white/40 font-light mt-2 leading-relaxed">
              בלי מפתחות: לידים נכנסים לדשבורד והאדמין מסמן תשלומים ידנית. אין מסך כרטיס באתר.
            </p>
          )}
        </div>
        <div className={`rounded-2xl border p-5 ${statusClass(data.s3Enabled)}`}>
          <div className="text-xs text-white/40 mb-2">העלאות</div>
          <div className="text-lg font-light">{data.s3Enabled ? 'ענן מחובר' : 'קבצים מקומיים'}</div>
          {!data.s3Enabled && (
            <p className="text-xs text-white/40 font-light mt-2 leading-relaxed">
              לפרודקשן מגדירים אחסון ענן בקבצי הסביבה.
            </p>
          )}
        </div>
        <div className={`rounded-2xl border p-5 ${statusClass(data.raffleTermsApproved)}`}>
          <div className="text-xs text-white/40 mb-2">הגרלות</div>
          <label className="flex items-start gap-3 text-sm text-white/70 font-light mt-1 min-h-11 cursor-pointer">
            <input
              type="checkbox"
              checked={data.raffleTermsApproved}
              disabled={pending}
              onChange={(e) => void toggleRaffle(e.target.checked)}
              className="mt-1"
            />
            תקנון אושר משפטית
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((week) => {
          const assigned = data.courses.filter((course) => course.programWeek === week);
          const options = data.courses.filter((course) => course.programWeek !== week);
          return (
            <div key={week} className="border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-medium">שבוע {week}</h3>
                <span className="text-xs text-white/35">{assigned.length ? `${assigned.length} הרצאות` : 'ריק'}</span>
              </div>
              {assigned.length === 0 && (
                <p className="text-xs text-white/40 font-light mb-3">אין הרצאה משובצת. בחרו הרצאה קיימת, בלי להמציא תוכן.</p>
              )}
              <div className="grid gap-2 mb-3">
                {assigned.map((course) => (
                  <div key={course.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      {course.title}
                      {course.status !== 'published' ? (
                        <span className="text-white/35"> · {STATUS_LABEL[course.status]}</span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void setWeek(course.id, 0)}
                      className="text-xs text-white/45 hover:text-white min-h-11 cursor-pointer"
                    >
                      הסרה
                    </button>
                  </div>
                ))}
              </div>
              <select
                disabled={pending || options.length === 0}
                defaultValue=""
                onChange={(e) => {
                  const id = e.target.value;
                  e.target.value = '';
                  if (id) void setWeek(id, week);
                }}
                className={fieldClass}
              >
                <option value="">שיבוץ הרצאה קיימת</option>
                {options.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                    {course.programWeek ? ` (שבוע ${course.programWeek})` : ''}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <div className="border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-medium mb-3">צוות המיזם</h3>
        <div className="grid gap-2">
          {data.founders.map((founder) => {
            const missing = [
              !founder.hasRealPhoto ? 'תמונה אמיתית' : '',
              !founder.hasWebsite ? 'אתר' : '',
              !founder.hasInstagram ? 'אינסטגרם' : '',
            ].filter(Boolean);
            return (
              <div key={founder.id} className="flex items-center justify-between gap-3 text-sm">
                <span>{founder.name}</span>
                <span className={missing.length ? 'text-white/40 font-light' : 'text-[#C8A24C]'}>
                  {missing.length ? `חסר: ${missing.join(', ')}` : 'מוכן'}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-white/35 font-light mt-4 leading-relaxed">
          יזם נוסף מתווסף בלשונית צוות המיזם, עם שם, תפקיד ותמונה.
        </p>
      </div>
    </OpsDeskStack>
  );
}

function OverviewPanel({ onNavigate, staffDesk }: { onNavigate: (tab: Tab) => void; staffDesk: string }) {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [error, setError] = useState('');
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    Promise.all([adminApi.overview(), adminApi.analytics()])
      .then(([overview, nextAnalytics]) => {
        setData(overview);
        setAnalytics(nextAnalytics);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));
  }, []);

  if (error) return <p className="text-sm text-rose-300">{error}</p>;
  if (!data) return <p className="text-sm text-white/50">טוען...</p>;

  const taskCards = [
    {
      id: 'pending',
      label: 'הרצאות ממתינות לאישור',
      value: data.pending,
      tab: 'content' as Tab,
    },
    {
      id: 'apps',
      label: 'בקשות מרצים',
      value: data.applicationsPending,
      tab: 'lecturers' as Tab,
    },
    {
      id: 'failed',
      label: 'תשלומים שנכשלו',
      value: data.failedPayments ?? 0,
      tab: 'tracks' as Tab,
    },
    {
      id: 'due',
      label: 'לחיוב עכשיו',
      value: data.dueInstallments ?? 0,
      tab: 'tracks' as Tab,
    },
  ].filter((card) => {
    if (!staffDesk) return true;
    const allowed = STAFF_DESK_TABS[staffDesk];
    return !allowed || allowed.includes(card.tab);
  });

  const extraCards = [
    { label: 'סך משתמשים', value: data.users },
    { label: 'חינמיים', value: data.free },
    { label: 'משלמים', value: data.paying },
    { label: 'אמיצים', value: data.braveUsers ?? 0 },
    { label: 'הססנים', value: data.hesitantUsers ?? 0 },
    { label: 'נבחרת 88', value: data.premium88 ?? 0 },
    { label: 'מרצים', value: data.lecturers },
    { label: 'הרצאות באוויר', value: data.published },
    { label: 'צפיות החודש', value: data.viewsMonth },
    { label: 'זמן צפייה', value: `${data.watchTimeHours} שע׳` },
    { label: 'המרה', value: `${data.conversionRate}%` },
    { label: 'ניסיונות לצפייה נעולה', value: data.paywallHits },
  ];

  const funnelSteps = analytics
    ? [
        { label: 'תוכן נעול', value: analytics.funnel.paywallOpened },
        { label: 'שדרוג', value: analytics.funnel.upgradeClicked },
        { label: 'ניסיון', value: analytics.funnel.trialStarted },
        { label: 'מנוי', value: analytics.funnel.subscriptionStarted },
      ]
    : [];
  const funnelMax = Math.max(1, ...funnelSteps.map((step) => step.value));

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title="מה צריך ממך עכשיו"
        hint="ארבעה דברים שדורשים טיפול. השאר מאחורי «עוד נתונים»."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {taskCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onNavigate(card.tab)}
            className={`text-right rounded-3xl border p-5 min-h-[140px] transition-colors ${
              card.value > 0
                ? 'border-[#C8A24C]/40 bg-[#C8A24C]/8 hover:border-[#C8A24C]'
                : 'border-white/10 bg-white/[0.02] hover:border-white/25'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`w-2.5 h-2.5 rounded-full ${card.value > 0 ? 'bg-[#C8A24C]' : 'bg-white/30'}`}
                aria-hidden
              />
              <span className="text-sm text-white/65">{card.label}</span>
            </div>
            <div className="text-4xl font-light tabular-nums">{card.value}</div>
            <div className="text-sm text-white/50 mt-3">{card.value > 0 ? 'לטיפול' : 'הכול בסדר'}</div>
          </button>
        ))}
      </div>

      <section className="border border-white/10 rounded-3xl p-6">
        <NotificationsPanel onNavigate={onNavigate} embedded />
      </section>

      <div>
        <button
          type="button"
          aria-expanded={showMore}
          onClick={() => setShowMore((open) => !open)}
          className="px-5 py-3 rounded-full border border-white/15 text-sm min-h-11 hover:border-white/40"
        >
          {showMore ? 'הסתרת נתונים נוספים' : 'עוד נתונים'}
        </button>
      </div>

      {showMore ? (
        <div className="grid gap-8">
          <ReadinessPanel />
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {extraCards.map((card) => (
              <div key={card.label} className="border border-white/10 rounded-2xl p-4 bg-white/[0.02]">
                <div className="text-sm text-white/55 mb-2 leading-snug">{card.label}</div>
                <div className="text-xl font-light text-white">{card.value}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h3 className="text-lg font-light">משפך המרה</h3>
                <button
                  type="button"
                  onClick={() => onNavigate('funnel')}
                  className="text-sm text-[#C8A24C] hover:text-[#F7E7B5] min-h-11"
                >
                  פירוט
                </button>
              </div>
              {funnelSteps.length === 0 ? (
                <p className="text-sm text-white/50">טוען משפך...</p>
              ) : (
                <div className="grid gap-4">
                  {funnelSteps.map((step) => (
                    <div key={step.label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-white/70">{step.label}</span>
                        <span className="text-white/55">{step.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-l from-[#C8A24C] to-[#5b4b9a]"
                          style={{ width: `${Math.max(6, (step.value / funnelMax) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-sm text-white/50 mt-2">
                    המרה כוללת: {data.conversionRate}% · ביטולים:{' '}
                    {analytics?.funnel.subscriptionCancelled ?? 0}
                  </p>
                </div>
              )}
            </section>
            <section className="border border-white/10 rounded-3xl p-6">
              <h3 className="text-lg font-light mb-5">תוכן מוביל</h3>
              <div className="grid gap-4">
                {[
                  { label: 'הכי נצפה', item: data.popularContent },
                  { label: 'קטגוריה חזקה', item: data.strongestCategory },
                  { label: 'מרצה מוביל', item: data.leadingLecturer },
                  { label: 'ממיר הכי טוב', item: data.convertingContent },
                ].map((card) => (
                  <div key={card.label} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    <div className="text-sm text-white/50 mb-1">{card.label}</div>
                    {card.item ? (
                      <>
                        <div className="text-sm text-white font-light">{card.item.name}</div>
                        <div className="text-sm text-white/50 mt-1">{card.item.views} צפיות</div>
                      </>
                    ) : (
                      <div className="text-sm text-white/50">עדיין אין מספיק מדידה</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
          <section className="border border-white/10 rounded-3xl p-6">
            <h3 className="text-lg font-light mb-5">פעילות אחרונה</h3>
            {!analytics?.recent?.length ? (
              <p className="text-sm text-white/50">עדיין אין אירועים.</p>
            ) : (
              <ul className="grid gap-3">
                {analytics.recent.slice(0, 8).map((row) => (
                  <li key={row.id} className="flex items-start justify-between gap-3 text-sm border-b border-white/5 pb-3 last:border-0">
                    <span className="text-white/75 font-light">{EVENT_LABEL[row.event] || row.event}</span>
                    <span className="text-sm text-white/45 whitespace-nowrap">{formatOpsDate(row.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </OpsDeskStack>
  );
}

const EVENT_LABEL: Record<string, string> = {
  video_view_started: 'התחלת צפייה',
  video_25_percent: 'רבע פרק',
  video_50_percent: 'חצי פרק',
  video_75_percent: 'שלושה רבעים',
  video_completed: 'סיום פרק',
  video_paused: 'השהיה',
  video_resumed: 'המשך צפייה',
  paywall_opened: 'ניסיון לצפות בתוכן נעול',
  upgrade_clicked: 'לחיצה לשדרוג',
  trial_started: 'תחילת ניסיון',
  subscription_started: 'תחילת מנוי',
  subscription_cancelled: 'ביטול מנוי',
  lecturer_application_started: 'התחלת בקשת מרצה',
  lecturer_application_submitted: 'שליחת בקשת מרצה',
  lecturer_approved: 'אישור מרצה',
  lecturer_rejected: 'דחיית מרצה',
  lecture_uploaded: 'העלאת הרצאה',
  lecture_submitted_for_review: 'שליחה לאישור',
  lecture_published: 'פרסום הרצאה',
  admin_opened_dashboard: 'כניסה לניהול',
  admin_changed_user_role: 'שינוי תפקיד',
  admin_granted_access: 'פתיחת גישה',
  admin_blocked_user: 'חסימת משתמש',
  admin_deleted_user: 'הסרת משתמש',
  admin_published_video: 'פרסום מאדמין',
  premium_88_page_view: 'צפייה בצוות המיזם',
  premium_88_cta_clicked: 'מועמדות לנבחרת 88',
  track_selection_viewed: 'צפייה בבחירת מסלול',
  brave_track_clicked: 'לחיצה על מסלול האמיצים',
  hesitant_track_clicked: 'לחיצה על מסלול ההססנים',
  hesitant_8_payment_started: 'התחלת פעימה 8',
  hesitant_8_payment_completed: 'פעימה 8 הושלמה',
  hesitant_80_payment_completed: 'פעימה 80 הושלמה',
  hesitant_800_payment_completed: 'פעימה 800 הושלמה',
  hesitant_8000_payment_completed: 'פעימה 8,000 הושלמה',
  hesitant_payment_failed: 'חיוב הססנים נכשל',
  brave_payment_completed: 'תשלום אמיצים הושלם',
  raffle_ticket_granted: 'כרטיס הגרלה',
  vod_access_unlocked: 'פתיחת גישה',
  vod_access_paused: 'השהיית גישה',
};

function AnalyticsPanel({ focus }: { focus?: 'funnel' } = {}) {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedRecentId, setSelectedRecentId] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .analytics()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));
  }, []);

  if (error) return <p className="text-sm text-rose-300">{error}</p>;
  if (!data) return <p className="text-sm text-white/40">טוען...</p>;

  const funnel = [
    { label: 'תוכן נעול', value: data.funnel.paywallOpened },
    { label: 'שדרוג', value: data.funnel.upgradeClicked },
    { label: 'ניסיון', value: data.funnel.trialStarted },
    { label: 'מנוי', value: data.funnel.subscriptionStarted },
    { label: 'ביטולים', value: data.funnel.subscriptionCancelled },
  ];
  const video = [
    { label: 'התחלה', value: data.video.started },
    { label: 'רבע', value: data.video.p25 },
    { label: 'חצי', value: data.video.p50 },
    { label: 'שלושה רבעים', value: data.video.p75 },
    { label: 'סיום', value: data.video.completed },
  ];
  const lecturers = [
    { label: 'בקשות', value: data.lecturers.submitted },
    { label: 'אושרו', value: data.lecturers.approved },
    { label: 'הועלו', value: data.lecturers.uploaded },
    { label: 'פורסמו', value: data.lecturers.published },
  ];
  const selectedTotal = data.totals.find((row) => row.event === selectedEvent) || null;
  const selectedRecent = data.recent.find((row) => row.id === selectedRecentId) || null;

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title={focus === 'funnel' ? 'משפך משתמשים חינמיים' : 'אנליטיקות'}
        hint={
          focus === 'funnel'
            ? 'מתוכן נעול עד מנוי. בלי ערבוב עם מועמדות לנבחרת 88.'
            : 'המרה, צפייה ומרצים — במספרים בלבד.'
        }
      />
      <OpsSection title="המרה">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {funnel.map((card) => (
            <div key={card.label} className="border border-white/10 rounded-2xl p-5">
              <div className="text-base text-white/60 mb-2">{card.label}</div>
              <div className="text-2xl font-light">{card.value}</div>
            </div>
          ))}
        </div>
      </OpsSection>
      {focus === 'funnel' ? null : (
        <>
      <OpsSection title="צפייה">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {video.map((card) => (
            <div key={card.label} className="border border-white/10 rounded-2xl p-5">
              <div className="text-base text-white/60 mb-2">{card.label}</div>
              <div className="text-2xl font-light">{card.value}</div>
            </div>
          ))}
        </div>
      </OpsSection>
      <OpsSection title="מרצים">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {lecturers.map((card) => (
            <div key={card.label} className="border border-white/10 rounded-2xl p-5">
              <div className="text-base text-white/60 mb-2">{card.label}</div>
              <div className="text-2xl font-light">{card.value}</div>
            </div>
          ))}
        </div>
      </OpsSection>
        </>
      )}
      <OpsSection title="אירועים">
        <OpsMasterDetail
          hasSelection={Boolean(selectedTotal)}
          onCloseDetail={() => setSelectedEvent(null)}
          emptyDetail="בחרו אירוע מהרשימה."
          list={
            data.totals.length === 0 ? (
              <OpsEmptyList>עדיין אין מדידות.</OpsEmptyList>
            ) : (
              <ul className="divide-y divide-white/10">
                {data.totals.map((row) => (
                  <li key={row.event}>
                    <OpsListRow
                      active={selectedEvent === row.event}
                      onClick={() => setSelectedEvent(row.event)}
                      title={EVENT_LABEL[row.event] || row.event}
                      status={String(row.count)}
                    />
                  </li>
                ))}
              </ul>
            )
          }
          detail={
            selectedTotal ? (
              <div className="grid gap-3">
                <h3 className="text-lg font-light text-[#C8A24C]">{EVENT_LABEL[selectedTotal.event] || selectedTotal.event}</h3>
                <OpsFact label="כמות">{selectedTotal.count}</OpsFact>
                <OpsFact label="מזהה">
                  <span dir="ltr">{selectedTotal.event}</span>
                </OpsFact>
              </div>
            ) : null
          }
        />
      </OpsSection>
      <OpsSection title="אחרונים">
        <OpsMasterDetail
          hasSelection={Boolean(selectedRecent)}
          onCloseDetail={() => setSelectedRecentId(null)}
          emptyDetail="בחרו אירוע מהרשימה."
          list={
            data.recent.length === 0 ? (
              <OpsEmptyList>אין אירועים עדיין.</OpsEmptyList>
            ) : (
              <ul className="divide-y divide-white/10">
                {data.recent.slice(0, 40).map((row) => (
                  <li key={row.id}>
                    <OpsListRow
                      active={selectedRecentId === row.id}
                      onClick={() => setSelectedRecentId(row.id)}
                      title={EVENT_LABEL[row.event] || row.event}
                      meta={formatOpsDate(row.createdAt)}
                    />
                  </li>
                ))}
              </ul>
            )
          }
          detail={
            selectedRecent ? (
              <div className="grid gap-3">
                <h3 className="text-lg font-light text-[#C8A24C]">{EVENT_LABEL[selectedRecent.event] || selectedRecent.event}</h3>
                <OpsFact label="זמן">{formatOpsDate(selectedRecent.createdAt)}</OpsFact>
                {selectedRecent.properties.source ? (
                  <OpsFact label="מקור">{String(selectedRecent.properties.source)}</OpsFact>
                ) : null}
                {selectedRecent.properties.courseId ? (
                  <OpsFact label="הרצאה">
                    <span dir="ltr">{String(selectedRecent.properties.courseId)}</span>
                  </OpsFact>
                ) : null}
              </div>
            ) : null
          }
        />
      </OpsSection>
    </OpsDeskStack>
  );
}

function emptyEpisode() {
  return {
    title: '',
    description: '',
    duration: 600,
    videoUrl: '',
    captionVttUrl: '',
    accessLevel: 'premium' as AccessLevel,
  };
}

function ContentPanel({
  categories,
  instructors,
  onSaved,
}: {
  categories: { id: string; name: string }[];
  instructors: { id: string; name: string; isFounder?: boolean }[];
  onSaved: () => void;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editing, setEditing] = useState<Course | 'new' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const load = () =>
    adminApi
      .courses()
      .then((res) => setCourses(res.courses))
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  const save = async (payload: CoursePayload, id?: string) => {
    setPending(true);
    setError('');
    try {
      if (id) await adminApi.updateCourse(id, payload);
      else await adminApi.createCourse(payload);
      setEditing(null);
      await load();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירה נכשלה');
    } finally {
      setPending(false);
    }
  };

  const setStatus = async (id: string, status: PublishStatus) => {
    await adminApi.setCourseStatus(id, status);
    await load();
    onSaved();
  };

  const selected = courses.find((course) => course.id === selectedId) || null;

  if (editing) {
    const course = editing === 'new' ? null : editing;
    return (
      <CourseForm
        course={course}
        categories={categories}
        instructors={instructors}
        pending={pending}
        error={error}
        onCancel={() => setEditing(null)}
        onSave={(payload) => void save(payload, course?.id)}
      />
    );
  }

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title="תכני VOD"
        hint={`${courses.length} הרצאות. בחרו אחת לעריכה, או הוסיפו חדשה.`}
        action={
          <button type="button" onClick={() => setEditing('new')} className={opsPrimaryBtn}>
            הרצאה חדשה
          </button>
        }
      />
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedId(null)}
        emptyDetail="בחרו הרצאה מהרשימה."
        list={
          courses.length === 0 ? (
            <OpsEmptyList>אין הרצאות עדיין.</OpsEmptyList>
          ) : (
            <ul className="divide-y divide-white/10">
              {courses.map((course) => (
                <li key={course.id}>
                  <OpsListRow
                    active={selectedId === course.id}
                    onClick={() => setSelectedId(course.id)}
                    title={course.title}
                    meta={`${course.episodes.length} פרקים`}
                    status={STATUS_LABEL[course.status || 'draft']}
                    statusClass={
                      course.status === 'published'
                        ? 'text-emerald-300'
                        : course.status === 'blocked'
                          ? 'text-rose-300'
                          : 'text-[#C8A24C]'
                    }
                  />
                </li>
              ))}
            </ul>
          )
        }
        detail={
          selected ? (
            <div className="grid gap-4">
              <h3 className="text-lg font-light text-[#C8A24C]">{selected.title}</h3>
              <OpsFact label="סטטוס">{STATUS_LABEL[selected.status || 'draft']}</OpsFact>
              <OpsFact label="פרקים">{selected.episodes.length}</OpsFact>
              <OpsFact label="גישה">{accessLabelHe(selected.accessLevel)}</OpsFact>
              {instructors.find((i) => i.id === selected.instructorId)?.isFounder ? (
                <OpsFact label="מייסד">כן</OpsFact>
              ) : null}
              <button type="button" onClick={() => setEditing(selected)} className={`${opsPrimaryBtn} w-fit`}>
                עריכה
              </button>
              <div className="flex flex-wrap gap-2">
                {selected.status !== 'published' ? (
                  <button
                    type="button"
                    onClick={() => void setStatus(selected.id, 'published')}
                    className="px-3 py-2 rounded-full border border-white/15 text-xs min-h-11 cursor-pointer"
                  >
                    פרסום
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void setStatus(selected.id, 'draft')}
                    className="px-3 py-2 rounded-full border border-white/15 text-xs min-h-11 cursor-pointer"
                  >
                    להסתרה
                  </button>
                )}
                {selected.status !== 'blocked' ? (
                  <button
                    type="button"
                    onClick={() => void setStatus(selected.id, 'blocked')}
                    className="px-3 py-2 rounded-full border border-white/15 text-xs text-rose-300 min-h-11 cursor-pointer"
                  >
                    חסימה
                  </button>
                ) : null}
              </div>
            </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

function CourseForm({
  course,
  categories,
  instructors,
  pending,
  error,
  onCancel,
  onSave,
}: {
  course: Course | null;
  categories: { id: string; name: string }[];
  instructors: { id: string; name: string; isFounder?: boolean }[];
  pending: boolean;
  error: string;
  onCancel: () => void;
  onSave: (payload: CoursePayload) => void;
}) {
  const [title, setTitle] = useState(course?.title || '');
  const [subtitle, setSubtitle] = useState(course?.subtitle || '');
  const [description, setDescription] = useState(course?.description || '');
  const [categoryId, setCategoryId] = useState(course?.categoryId || categories[0]?.id || '');
  const [instructorId, setInstructorId] = useState(course?.instructorId || instructors[0]?.id || '');
  const [coverImage, setCoverImage] = useState(course?.coverImage || '');
  const [status, setStatus] = useState<PublishStatus>(course?.status || 'draft');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(course?.accessLevel || 'premium');
  const [programWeek, setProgramWeek] = useState(course?.programWeek || 0);
  const [episodes, setEpisodes] = useState(
    course?.episodes.length
      ? course.episodes.map((ep) => ({
          id: ep.id,
          title: ep.title,
          description: ep.description,
          duration: ep.duration,
          videoUrl: ep.videoUrl,
          captionVttUrl: vttUrlFromCaptionTracks(ep.captionTracks),
          accessLevel: (ep.accessLevel || (ep.isFreeSample ? 'free' : 'premium')) as AccessLevel,
        }))
      : [{ ...emptyEpisode(), accessLevel: 'free' as AccessLevel }]
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          title,
          subtitle,
          description,
          categoryId,
          instructorId,
          coverImage,
          backdropImage: coverImage,
          status,
          accessLevel,
          programWeek,
          episodes: episodes.map(({ captionVttUrl, id, ...ep }) => ({
            ...ep,
            id,
            captionTracks: captionTracksFromVttUrl(captionVttUrl, id),
          })),
        });
      }}
      className="grid gap-10 max-w-3xl"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <OpsPageHeader
          title={course ? 'עריכת הרצאה' : 'הרצאה חדשה'}
          hint="פרטים קודם, אחר כך הפרק והכיסוי. שמירה אחת בסוף."
        />
        <button type="button" onClick={onCancel} className="text-base text-white/70 hover:text-white min-h-11">
          חזרה לרשימה
        </button>
      </div>

      <OpsSection title="פרטים">
        <OpsField label="שם">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
        </OpsField>
        <OpsField label="כותרת משנה">
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={fieldClass} />
        </OpsField>
        <OpsField label="תיאור">
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${fieldClass} min-h-24`}
          />
        </OpsField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <OpsField label="קטגוריה">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={fieldClass}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </OpsField>
          <OpsField label="מרצה">
            <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)} className={fieldClass}>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.isFounder ? `${i.name} · מייסד` : i.name}
                </option>
              ))}
            </select>
          </OpsField>
          <OpsField label="סטטוס">
            <select value={status} onChange={(e) => setStatus(e.target.value as PublishStatus)} className={fieldClass}>
              {(Object.keys(STATUS_LABEL) as PublishStatus[]).map((key) => (
                <option key={key} value={key}>
                  {STATUS_LABEL[key]}
                </option>
              ))}
            </select>
          </OpsField>
          <OpsField label="רמת גישה">
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}
              className={fieldClass}
            >
              {(Object.keys(ACCESS_LABEL) as AccessLevel[]).map((key) => (
                <option key={key} value={key}>
                  {ACCESS_LABEL[key]}
                </option>
              ))}
            </select>
          </OpsField>
          <OpsField label="שבוע במסע">
            <select
              value={programWeek}
              onChange={(e) => setProgramWeek(Number(e.target.value))}
              className={fieldClass}
            >
              <option value={0}>לא משויך לשבוע</option>
              <option value={1}>שבוע 1</option>
              <option value={2}>שבוע 2</option>
              <option value={3}>שבוע 3</option>
              <option value={4}>שבוע 4</option>
            </select>
          </OpsField>
        </div>
      </OpsSection>

      <OpsSection title="פרק ראשון">
        <div className="flex items-center justify-between">
          <p className="text-base text-white/60">אפשר להוסיף פרקים נוספים אחרי השמירה.</p>
          <button
            type="button"
            onClick={() => setEpisodes((prev) => [...prev, emptyEpisode()])}
            className="text-base text-[#C8A24C] min-h-11"
          >
            הוספת פרק
          </button>
        </div>
        <div className="grid gap-6">
          {episodes.map((ep, idx) => (
            <div key={ep.id || idx} className="grid gap-4">
              <p className="text-base text-white/70">פרק {idx + 1}</p>
              <OpsField label="כותרת הפרק">
                <input
                  value={ep.title}
                  onChange={(e) =>
                    setEpisodes((prev) => prev.map((item, i) => (i === idx ? { ...item, title: e.target.value } : item)))
                  }
                  className={fieldClass}
                />
              </OpsField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <OpsField label="משך בשניות">
                  <input
                    type="number"
                    value={ep.duration}
                    onChange={(e) =>
                      setEpisodes((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, duration: Number(e.target.value) } : item))
                      )
                    }
                    className={fieldClass}
                  />
                </OpsField>
                <OpsField label="גישה">
                  <select
                    value={ep.accessLevel}
                    onChange={(e) =>
                      setEpisodes((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, accessLevel: e.target.value as AccessLevel } : item
                        )
                      )
                    }
                    className={fieldClass}
                  >
                    {(Object.keys(ACCESS_LABEL) as AccessLevel[]).map((key) => (
                      <option key={key} value={key}>
                        {ACCESS_LABEL[key]}
                      </option>
                    ))}
                  </select>
                </OpsField>
              </div>
              <FileUploadField
                kind="video"
                label="קובץ וידאו"
                value={ep.videoUrl}
                onChange={(videoUrl) =>
                  setEpisodes((prev) => prev.map((item, i) => (i === idx ? { ...item, videoUrl } : item)))
                }
              />
              <FileUploadField
                kind="caption"
                label="כתוביות (WebVTT)"
                value={ep.captionVttUrl}
                onChange={(captionVttUrl) =>
                  setEpisodes((prev) => prev.map((item, i) => (i === idx ? { ...item, captionVttUrl } : item)))
                }
              />
            </div>
          ))}
        </div>
      </OpsSection>

      <OpsSection title="כיסוי">
        <FileUploadField
          kind="image"
          label="תמונת כיסוי"
          value={coverImage}
          onChange={setCoverImage}
          previewAlt={title ? `תמונת כיסוי: ${title}` : 'תמונת כיסוי'}
        />
      </OpsSection>

      {error && <p className="text-base text-rose-300">{error}</p>}
      <button type="submit" disabled={pending} className={`${opsPrimaryBtn} w-full sm:w-auto`}>
        {pending ? 'שומר...' : 'שמירה'}
      </button>
    </form>
  );
}

function UsersPanel() {
  const { reloadCatalog, user } = useApp();
  const confirm = useConfirm();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<'all' | 'active' | 'blocked' | 'lecturer' | 'paying'>('all');

  const load = () =>
    adminApi
      .users()
      .then((res) => setUsers(res.users))
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selected = users.find((row) => row.id === selectedId) || null;

  const visibleUsers = users.filter((row) => {
    const haystack = `${row.name} ${row.email}`.toLowerCase();
    if (query.trim() && !haystack.includes(query.trim().toLowerCase())) return false;
    if (chip === 'active') return !row.blocked;
    if (chip === 'blocked') return Boolean(row.blocked);
    if (chip === 'lecturer') return row.role === 'instructor';
    if (chip === 'paying') return isPayingPlan(row.subscriptionPlan);
    return true;
  });

  const patch = async (id: string, next: Parameters<typeof adminApi.updateUser>[1]) => {
    const row = users.find((item) => item.id === id);
    if (next.blocked === true && row && !row.blocked) {
      const ok = await confirm({
        title: 'לחסום את המשתמש?',
        body: 'החשבון יישאר במערכת אבל לא יוכל להיכנס עד שחרור החסימה.',
        confirmLabel: 'חסימה',
        danger: true,
      });
      if (!ok) return;
    }
    if (next.role && row && next.role !== row.role) {
      const ok = await confirm({
        title: 'לשנות תפקיד למשתמש?',
        body: `התפקיד ישתנה ל־${roleLabelHe(next.role)}.`,
        confirmLabel: 'שינוי תפקיד',
      });
      if (!ok) return;
    }
    if (next.subscriptionPlan === 'none' && row && row.subscriptionPlan !== 'none') {
      const ok = await confirm({
        title: 'לבטל מנוי למשתמש?',
        body: 'הגישה לתוכן פרימיום תיסגר. אפשר לפתוח שוב אחר כך.',
        confirmLabel: 'ביטול מנוי',
        danger: true,
      });
      if (!ok) return;
    }
    setPendingId(id);
    setError('');
    try {
      await adminApi.updateUser(id, next);
      await load();
      if (next.role === 'instructor' || next.isFounder !== undefined) await reloadCatalog();
      setToast('הפעולה בוצעה');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'הפעולה נכשלה');
    } finally {
      setPendingId(null);
    }
  };

  const createUser = async () => {
    setCreating(true);
    setError('');
    try {
      await adminApi.createUser({ fullName: newName, email: newEmail, password: newPassword });
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      await load();
      setToast('החשבון נוצר');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'יצירה נכשלה');
    } finally {
      setCreating(false);
    }
  };

  const removeUser = async (row: AdminUserRow) => {
    if (row.id === user.id) return;
    const ok = await confirm({
      title: `להסיר את ${row.name || row.email} מהמערכת?`,
      body: 'החשבון יימחק ולא ניתן לבטל. הרצאות ותשלומים נשמרים.',
      confirmLabel: 'הסרה מהמערכת',
      danger: true,
    });
    if (!ok) return;
    setPendingId(row.id);
    setError('');
    try {
      await adminApi.deleteUser(row.id);
      setSelectedId(null);
      await load();
      if (row.role === 'instructor' || row.isFounder) await reloadCatalog();
      setToast('המשתמש הוסר');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ההסרה נכשלה');
    } finally {
      setPendingId(null);
    }
  };

  const exportCsv = () => {
    const header = 'name,email,role,plan,team,blocked,createdAt';
    const rows = users.map((row) =>
      [
        row.name,
        row.email,
        row.role,
        row.subscriptionPlan,
        row.isFounder ? '1' : '0',
        row.blocked ? '1' : '0',
        row.createdAt,
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([`\uFEFF${header}\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <OpsDeskStack>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {toast ? (
        <p className="text-sm text-[#C8A24C]" role="status">
          {toast}
        </p>
      ) : null}

      <OpsPageHeader title="משתמשים" hint="חיפוש, סינון, ואז פעולה בכרטיס." />
      <OpsBand title="הוספת משתמש">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <OpsField label="שם">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className={fieldClass} />
          </OpsField>
          <OpsField label="אימייל">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={fieldClass}
              dir="ltr"
            />
          </OpsField>
          <OpsField label="סיסמה">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={fieldClass}
              dir="ltr"
            />
          </OpsField>
          <button
            type="button"
            disabled={creating}
            onClick={() => void createUser()}
            className={`${opsPrimaryBtn} w-full`}
          >
            {creating ? 'יוצר...' : 'יצירת חשבון'}
          </button>
        </div>
      </OpsBand>

      <OpsToolbar>
        <label className="block flex-1 min-w-0">
          <span className="block text-sm text-white/60 mb-1">חיפוש לפי שם או אימייל</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="למשל: דנה או dana@"
            className={fieldClass}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['all', 'הכל'],
              ['active', 'פעיל'],
              ['blocked', 'חסום'],
              ['lecturer', 'מרצה'],
              ['paying', 'משלם'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setChip(id)}
              className={opsChipClass(chip === id)}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={exportCsv}
            className="px-4 py-2 rounded-full border border-white/15 text-sm min-h-11 cursor-pointer hover:border-white/40"
          >
            ייצוא
          </button>
        </div>
      </OpsToolbar>

      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedId(null)}
        emptyDetail="בחרו משתמש מהרשימה."
        list={
          visibleUsers.length === 0 ? (
            <OpsEmptyList>אין משתמשים שתואמים לחיפוש.</OpsEmptyList>
          ) : (
            <ul className="divide-y divide-white/10">
              {visibleUsers.map((row) => (
                <li key={row.id}>
                  <OpsListRow
                    active={selectedId === row.id}
                    onClick={() => setSelectedId(row.id)}
                    title={
                      <>
                        {row.name}
                        {row.isFounder ? <span className="text-white/40"> · מייסד</span> : null}
                      </>
                    }
                    meta={`${roleLabelHe(row.role)} · ${planLabelHe(row.subscriptionPlan)}`}
                    status={row.blocked ? 'חסום' : 'פעיל'}
                    statusClass={row.blocked ? 'text-rose-300' : 'text-[#C8A24C]'}
                  />
                </li>
              ))}
            </ul>
          )
        }
        detail={
          selected ? (
          <div className="grid gap-4 text-sm">
            <div>
              <h3 className="text-lg font-light text-[#C8A24C]">{selected.name}</h3>
              <p className="text-white/50 mt-0.5 break-all">{selected.email}</p>
            </div>
            <OpsFact label="מסלול">
              {selected.entryTrack === 'brave' ? 'אמיצים' : selected.entryTrack === 'hesitant' ? 'הססנים' : 'ללא'}
            </OpsFact>
            <OpsFact label="פעימה">{selected.currentPaymentPhase || 0}</OpsFact>
            <OpsFact label="כרטיסי הגרלה">{selected.raffleTicketsCount || 0}</OpsFact>
            <OpsFact label="הצטרפות">{formatOpsDate(selected.createdAt)}</OpsFact>
            <OpsFact label="כניסה אחרונה">{formatOpsDate(selected.lastLoginAt)}</OpsFact>

            <OpsField label="תפקיד">
              <select
                value={selected.role}
                disabled={pendingId === selected.id}
                onChange={(e) => void patch(selected.id, { role: e.target.value })}
                className={fieldClass}
              >
                <option value="student">משתמש</option>
                <option value="instructor">מרצה</option>
                <option value="admin">אדמין</option>
              </select>
            </OpsField>
            <OpsField label="מנוי">
              <select
                value={selected.subscriptionPlan}
                disabled={pendingId === selected.id}
                onChange={(e) => void patch(selected.id, { subscriptionPlan: e.target.value })}
                className={fieldClass}
              >
                <option value="none">חינמי</option>
                <option value="free_trial">ניסיון</option>
                <option value="monthly">חודשי</option>
                <option value="annual">שנתי</option>
                <option value="premium_88">נבחרת 88</option>
              </select>
            </OpsField>
            <OpsField label="מסלול כניסה">
              <select
                value={selected.entryTrack || 'none'}
                disabled={pendingId === selected.id}
                onChange={(e) =>
                  void patch(selected.id, {
                    entryTrack: e.target.value,
                    currentPaymentPhase: e.target.value === 'brave' ? 1 : selected.currentPaymentPhase || 0,
                  })
                }
                className={fieldClass}
              >
                <option value="none">ללא</option>
                <option value="brave">אמיצים</option>
                <option value="hesitant">הססנים</option>
              </select>
            </OpsField>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={pendingId === selected.id}
                onClick={() => void patch(selected.id, { blocked: !selected.blocked })}
                className={`${opsGhostBtn} text-sm`}
              >
                {selected.blocked ? 'שחרור חסימה' : 'חסימה'}
              </button>
              <button
                type="button"
                disabled={
                  pendingId === selected.id ||
                  selected.id === user.id ||
                  (selected.role === 'admin' && users.filter((row) => row.role === 'admin').length <= 1)
                }
                onClick={() => void removeUser(selected)}
                className="inline-flex items-center justify-center px-5 py-3 rounded-full border border-rose-400/40 text-sm text-rose-200 min-h-12 disabled:opacity-40"
              >
                הסרה מהמערכת
              </button>
              <button
                type="button"
                disabled={pendingId === selected.id}
                onClick={() => {
                  void (async () => {
                    const ok = await confirm({
                      title: selected.isFounder ? 'להסיר את המשתמש מצוות המיזם?' : 'לשייך את המשתמש לצוות המיזם?',
                      confirmLabel: selected.isFounder ? 'הסרה מהצוות' : 'שיוך לצוות',
                    });
                    if (!ok) return;
                    await patch(selected.id, { isFounder: !selected.isFounder });
                  })();
                }}
                className={`${opsGhostBtn} text-sm`}
              >
                {selected.isFounder ? 'הסרה מהצוות' : 'שיוך לצוות'}
              </button>
              {selected.role !== 'instructor' && selected.role !== 'admin' ? (
                <button
                  type="button"
                  disabled={pendingId === selected.id}
                  onClick={() => void patch(selected.id, { role: 'instructor' })}
                  className={`${opsPrimaryBtn} text-sm`}
                >
                  אישור כמרצה
                </button>
              ) : null}
            </div>
          </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

const APP_STATUS_LABEL: Record<LecturerApplication['status'], string> = {
  pending: 'ממתינה',
  approved: 'אושרה',
  rejected: 'נדחתה',
  more_info: 'פרטים נוספים',
};

type TeamListChip = 'lecturers' | 'staff';
type TeamAccess = 'active' | 'suspended' | 'blocked';

function teamAccessKind(row: AdminUserRow): TeamAccess {
  if (row.blocked) return 'blocked';
  if (row.staffStatus === 'suspended') return 'suspended';
  return 'active';
}

function teamAccessLabel(kind: TeamAccess): string {
  if (kind === 'blocked') return 'חסום';
  if (kind === 'suspended') return 'מושהה';
  return 'פעיל';
}

function teamRowRoleLabel(row: AdminUserRow): string {
  if (row.role === 'instructor') return 'מרצה';
  if (row.role === 'admin') {
    const desk = row.staffDesk ? STAFF_DESK_LABEL[row.staffDesk] || row.staffDesk : 'מנהל/ת ראשי/ת';
    return `צוות · ${desk}`;
  }
  return 'משתמש';
}

function teamAccessTone(kind: TeamAccess): string {
  if (kind === 'blocked') return 'text-rose-300';
  if (kind === 'suspended') return 'text-amber-200';
  return 'text-[#C8A24C]';
}

function TeamChoiceChip({
  selected,
  onClick,
  disabled,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm min-h-11 border disabled:opacity-40 ${
        selected ? 'bg-[#C8A24C] text-black border-[#C8A24C]' : 'border-white/15 text-white/70'
      }`}
    >
      {children}
    </button>
  );
}

function TeamStaffPanel() {
  const { reloadCatalog, user } = useApp();
  const confirm = useConfirm();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chip, setChip] = useState<TeamListChip>('lecturers');
  const [query, setQuery] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = () =>
    adminApi
      .users()
      .then((res) => setUsers(res.users))
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    setMoreOpen(false);
    setMessageOpen(false);
  }, [selectedId]);

  const rows = users.filter((row) => {
    const matchesChip = chip === 'lecturers' ? row.role === 'instructor' : row.role === 'admin';
    if (!matchesChip) return false;
    const haystack = `${row.name} ${row.email}`.toLowerCase();
    if (query.trim() && !haystack.includes(query.trim().toLowerCase())) return false;
    return true;
  });

  const selected = users.find((row) => row.id === selectedId) || null;

  const patch = async (id: string, next: Parameters<typeof adminApi.updateUser>[1], confirmMsg?: string) => {
    if (confirmMsg) {
      const ok = await confirm({
        title: confirmMsg,
        confirmLabel: 'אישור',
        danger: confirmMsg.includes('חסום') || confirmMsg.includes('השהות') || confirmMsg.includes('הסיר'),
      });
      if (!ok) return;
    }
    setPendingId(id);
    setError('');
    try {
      await adminApi.updateUser(id, next);
      await load();
      if (next.role === 'instructor') setChip('lecturers');
      else if (next.role === 'admin') setChip('staff');
      else if (next.role === 'student') setSelectedId(null);
      if (next.role === 'instructor' || next.isFounder !== undefined) await reloadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'הפעולה נכשלה');
    } finally {
      setPendingId(null);
    }
  };

  const removeUser = async (row: AdminUserRow) => {
    if (row.id === user.id) return;
    const ok = await confirm({
      title: `להסיר את ${row.name || row.email} מהמערכת?`,
      body: 'החשבון יימחק ולא ניתן לבטל. הרצאות ותשלומים נשמרים.',
      confirmLabel: 'הסרה מהמערכת',
      danger: true,
    });
    if (!ok) return;
    setPendingId(row.id);
    setError('');
    try {
      await adminApi.deleteUser(row.id);
      setSelectedId(null);
      await load();
      if (row.role === 'instructor' || row.isFounder) await reloadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ההסרה נכשלה');
    } finally {
      setPendingId(null);
    }
  };

  const selectChip = (next: TeamListChip) => {
    setChip(next);
    setSelectedId((current) => {
      const row = users.find((item) => item.id === current);
      if (!row) return null;
      const matches = next === 'lecturers' ? row.role === 'instructor' : row.role === 'admin';
      return matches ? current : null;
    });
  };

  return (
    <OpsDeskStack>
      <OpsPageHeader title="צוות ומרצים" hint="מי מרצה, מי רואה דסק, ומי חסום." />
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <OpsToolbar>
        <label className="block flex-1 min-w-0">
          <span className="block text-sm text-white/60 mb-1">חיפוש לפי שם או אימייל</span>
          <span className="relative block">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-white/40 pointer-events-none" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="למשל: דנה או dana@"
              className={`${fieldClass} ps-10`}
            />
          </span>
        </label>
        <div className="flex flex-wrap gap-2 shrink-0" role="tablist" aria-label="סינון צוות ומרצים">
          {(
            [
              ['lecturers', 'מרצים'],
              ['staff', 'צוות'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={chip === id}
              onClick={() => selectChip(id)}
              className={opsChipClass(chip === id)}
            >
              {label}
            </button>
          ))}
        </div>
      </OpsToolbar>

      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedId(null)}
        emptyDetail="בחרו אדם מהרשימה."
        list={
          rows.length === 0 ? (
            <OpsEmptyList>
              {chip === 'lecturers' ? 'אין מרצים שתואמים לחיפוש.' : 'אין אנשי צוות שתואמים לחיפוש.'}
            </OpsEmptyList>
          ) : (
            <ul className="divide-y divide-white/10">
              {rows.map((row) => (
                <li key={row.id}>
                  <OpsListRow
                    active={selectedId === row.id}
                    onClick={() => setSelectedId(row.id)}
                    title={
                      <>
                        {row.name}
                        {row.isFounder ? <span className="text-white/40"> · מייסד</span> : null}
                      </>
                    }
                    meta={teamRowRoleLabel(row)}
                    status={teamAccessLabel(teamAccessKind(row))}
                    statusClass={teamAccessTone(teamAccessKind(row))}
                  />
                </li>
              ))}
            </ul>
          )
        }
        detail={
          selected ? (
            <TeamPersonCard
              selected={selected}
              users={users}
              currentUserId={user.id}
              pending={pendingId === selected.id}
              moreOpen={moreOpen}
              messageOpen={messageOpen}
              onToggleMore={() => setMoreOpen((open) => !open)}
              onOpenMessage={() => {
                setMessageOpen(true);
                setMoreOpen(false);
              }}
              onCloseMessage={() => setMessageOpen(false)}
              onPatch={patch}
              onRemove={() => void removeUser(selected)}
            />
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

function TeamPersonCard({
  selected,
  users,
  currentUserId,
  pending,
  moreOpen,
  messageOpen,
  onToggleMore,
  onOpenMessage,
  onCloseMessage,
  onPatch,
  onRemove,
}: {
  selected: AdminUserRow;
  users: AdminUserRow[];
  currentUserId: string;
  pending: boolean;
  moreOpen: boolean;
  messageOpen: boolean;
  onToggleMore: () => void;
  onOpenMessage: () => void;
  onCloseMessage: () => void;
  onPatch: (id: string, next: Parameters<typeof adminApi.updateUser>[1], confirmMsg?: string) => Promise<void>;
  onRemove: () => void;
}) {
  const isSelf = selected.id === currentUserId;
  const isLecturer = selected.role === 'instructor';
  const isStaff = selected.role === 'admin';
  const lastAdmin = isStaff && users.filter((row) => row.role === 'admin').length <= 1;
  const access = teamAccessKind(selected);
  const busy = pending || isSelf;
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) onToggleMore();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [moreOpen, onToggleMore]);

  return (
    <div className="grid gap-4">
      <div className="min-w-0">
        <h3 className="text-lg font-light text-[#C8A24C]">{selected.name}</h3>
        <p className="text-sm text-white/50 mt-0.5 break-all">{selected.email}</p>
      </div>

      <div className="grid gap-2">
        <span className="text-sm text-white/50">תפקיד</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="תפקיד">
          <TeamChoiceChip
            selected={isLecturer}
            disabled={busy || lastAdmin}
            onClick={() => {
              if (isLecturer) return;
              void onPatch(selected.id, { role: 'instructor', staffDesk: '' }, 'לאשר כמרצה?');
            }}
          >
            מרצה
          </TeamChoiceChip>
          <TeamChoiceChip
            selected={isStaff}
            disabled={busy}
            onClick={() => {
              if (isStaff) return;
              void onPatch(selected.id, { role: 'admin' }, 'לשייך כצוות? המשתמש יקבל גישה לדסק.');
            }}
          >
            צוות
          </TeamChoiceChip>
        </div>
        {isStaff ? (
          <OpsField label="דסק">
            <select
              value={selected.staffDesk || ''}
              disabled={busy}
              onChange={(e) => void onPatch(selected.id, { staffDesk: e.target.value })}
              className={fieldClass}
            >
              <option value="">מנהל/ת ראשי/ת</option>
              <option value="content">תוכן</option>
              <option value="support">תמיכה</option>
              <option value="sales">מכירות / הצלחה</option>
              <option value="legal">משפטי</option>
              <option value="finance">כספים</option>
              <option value="community">קהילה</option>
            </select>
          </OpsField>
        ) : null}
      </div>

      <div className="grid gap-2">
        <span className="text-sm text-white/50">גישה</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="גישה">
          <TeamChoiceChip
            selected={access === 'active'}
            disabled={busy}
            onClick={() => {
              if (access === 'active') return;
              void onPatch(selected.id, { blocked: false, staffStatus: 'active' });
            }}
          >
            פעיל
          </TeamChoiceChip>
          <TeamChoiceChip
            selected={access === 'suspended'}
            disabled={busy}
            onClick={() => {
              if (access === 'suspended') return;
              void onPatch(
                selected.id,
                { blocked: false, staffStatus: 'suspended' },
                'להשהות גישה ולנתק סשנים פעילים?'
              );
            }}
          >
            מושהה
          </TeamChoiceChip>
          <TeamChoiceChip
            selected={access === 'blocked'}
            disabled={busy}
            onClick={() => {
              if (access === 'blocked') return;
              void onPatch(selected.id, { blocked: true }, 'לחסום את המשתמש ולנתק סשנים?');
            }}
          >
            חסום
          </TeamChoiceChip>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1 border-t border-white/10">
        <button
          type="button"
          disabled={pending}
          onClick={onOpenMessage}
          className="text-sm text-white/70 hover:text-white min-h-11 px-1"
        >
          הודעה
        </button>
        <span className="text-white/20" aria-hidden>
          |
        </span>
        <div className="relative" ref={moreRef}>
          <button
            type="button"
            onClick={onToggleMore}
            aria-expanded={moreOpen}
            className="text-sm text-white/70 hover:text-white min-h-11 px-1"
          >
            עוד
          </button>
          {moreOpen ? (
            <div className="absolute bottom-full start-0 mb-2 min-w-[13rem] border border-white/15 rounded-xl bg-[#0a0a0a] p-1 shadow-xl z-10">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  void onPatch(
                    selected.id,
                    { isFounder: !selected.isFounder },
                    selected.isFounder ? 'להסיר דגל מייסד?' : 'לסמן כמייסד?'
                  )
                }
                className="w-full text-right px-3 py-2.5 text-sm text-white/80 hover:bg-white/[0.04] rounded-lg min-h-11 disabled:opacity-40"
              >
                {selected.isFounder ? 'הסרת מייסד' : 'סימון מייסד'}
              </button>
              <button
                type="button"
                disabled={busy || lastAdmin}
                onClick={() =>
                  void onPatch(selected.id, { role: 'student', staffDesk: '' }, 'להסיר מתפקיד? האדם ייצא מהרשימה.')
                }
                className="w-full text-right px-3 py-2.5 text-sm text-white/80 hover:bg-white/[0.04] rounded-lg min-h-11 disabled:opacity-40"
              >
                הסרה מתפקיד
              </button>
              <button
                type="button"
                disabled={pending || isSelf || lastAdmin}
                onClick={onRemove}
                className="w-full text-right px-3 py-2.5 text-sm text-rose-200 hover:bg-rose-500/10 rounded-lg min-h-11 disabled:opacity-40"
              >
                הסרה מהמערכת
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <TeamMessageComposer
        lecturerUserId={selected.id}
        lecturerName={selected.name}
        open={messageOpen}
        disabled={pending}
        onClose={onCloseMessage}
      />
    </div>
  );
}

function TeamMessageComposer({
  lecturerUserId,
  lecturerName,
  open,
  disabled,
  onClose,
}: {
  lecturerUserId: string;
  lecturerName: string;
  open: boolean;
  disabled?: boolean;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSubject('');
    setBody('');
    setError('');
  }, [lecturerUserId, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const send = async () => {
    setPending(true);
    setError('');
    try {
      await adminApi.sendTeamMessage({ lecturerUserId, subject, body });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שליחה נכשלה');
    } finally {
      setPending(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" dir="rtl">
      <button type="button" className="absolute inset-0 bg-black/80" aria-label="סגירה" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 text-right shadow-2xl grid gap-4">
        <h3 className="text-xl font-light">הודעה אל {lecturerName}</h3>
        <OpsField label="נושא">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={fieldClass}
            disabled={disabled || pending}
          />
        </OpsField>
        <OpsField label="תוכן">
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={fieldClass}
            disabled={disabled || pending}
          />
        </OpsField>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled || pending || !subject.trim() || !body.trim()}
            onClick={() => void send()}
            className={opsPrimaryBtn}
          >
            {pending ? 'שולח...' : 'שליחה'}
          </button>
          <button type="button" disabled={pending} onClick={onClose} className={opsGhostBtn}>
            ביטול
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function LecturerApplicationsPanel() {
  const [applications, setApplications] = useState<LecturerApplication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = () =>
    adminApi
      .applications()
      .then((res) => setApplications(res.applications))
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  const review = async (id: string, action: 'approved' | 'rejected' | 'more_info') => {
    setPendingId(id);
    setError('');
    try {
      await adminApi.reviewApplication(id, action, notes[id]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'הפעולה נכשלה');
    } finally {
      setPendingId(null);
    }
  };

  if (error && applications.length === 0) return <p className="text-sm text-rose-300">{error}</p>;
  if (applications.length === 0) {
    return (
      <div className="grid gap-4">
        <OpsPageHeader
          title="בקשות מרצים"
          hint="אין בקשות כרגע. אפשר לאשר משתמש בלשונית משתמשים, בלי טופס בקשה."
        />
      </div>
    );
  }

  const ordered = [...applications].sort((a, b) => {
    const rank = (status: LecturerApplication['status']) =>
      status === 'pending' ? 0 : status === 'more_info' ? 1 : 2;
    return rank(a.status) - rank(b.status);
  });
  const selected = ordered.find((app) => app.id === selectedId) || null;

  return (
    <OpsDeskStack>
      <OpsPageHeader title="בקשות מרצים" hint="בקשות ממתינות קודם. הערה נשמרת עם האישור או הדחייה." />
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedId(null)}
        emptyDetail="בחרו בקשה מהרשימה."
        list={
          <ul className="divide-y divide-white/10">
            {ordered.map((app) => (
              <li key={app.id}>
                <OpsListRow
                  active={selectedId === app.id}
                  onClick={() => setSelectedId(app.id)}
                  title={app.fullName}
                  meta={app.field || 'תחום לא צוין'}
                  status={APP_STATUS_LABEL[app.status]}
                  statusClass={
                    app.status === 'pending' || app.status === 'more_info'
                      ? 'text-[#C8A24C]'
                      : app.status === 'rejected'
                        ? 'text-rose-300'
                        : 'text-emerald-300'
                  }
                />
              </li>
            ))}
          </ul>
        }
        detail={
          selected ? (
            <div className="grid gap-3">
              <div>
                <h3 className="text-lg font-light text-[#C8A24C]">{selected.fullName}</h3>
                <p className="text-sm text-white/50 mt-0.5 break-all">
                  {selected.email}
                  {selected.phone ? ` · ${selected.phone}` : ''}
                </p>
              </div>
              <OpsFact label="סטטוס">{APP_STATUS_LABEL[selected.status]}</OpsFact>
              <OpsFact label="תחום">{selected.field || 'לא צוין'}</OpsFact>
              <OpsFact label="הרצאה מוצעת">{selected.proposedLecture || 'לא צוין'}</OpsFact>
              {selected.audience ? <OpsFact label="קהל">{selected.audience}</OpsFact> : null}
              {selected.valueToUser ? <OpsFact label="ערך למשתמש">{selected.valueToUser}</OpsFact> : null}
              {selected.experience ? <OpsFact label="ניסיון">{selected.experience}</OpsFact> : null}
              {selected.links ? (
                <OpsFact label="קישורים">
                  <span className="break-all">{selected.links}</span>
                </OpsFact>
              ) : null}
              {selected.sampleVideo ? (
                <a
                  href={selected.sampleVideo}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#C8A24C] hover:text-[#F7E7B5] break-all"
                >
                  וידאו דוגמה
                </a>
              ) : null}
              {selected.adminNote ? (
                <p className="text-sm text-[#C8A24C]">הערה קודמת: {selected.adminNote}</p>
              ) : null}
              {selected.status === 'pending' || selected.status === 'more_info' ? (
                <>
                  <label className="block">
                    <span className={opsLabelClass}>הערת אדמין (אופציונלי)</span>
                    <textarea
                      rows={2}
                      value={notes[selected.id] ?? ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [selected.id]: e.target.value }))}
                      className={fieldClass}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pendingId === selected.id}
                      onClick={() => void review(selected.id, 'approved')}
                      className="px-4 py-2 rounded-full bg-[#C8A24C] text-black text-sm min-h-11 cursor-pointer disabled:opacity-60"
                    >
                      אישור
                    </button>
                    <button
                      type="button"
                      disabled={pendingId === selected.id}
                      onClick={() => void review(selected.id, 'more_info')}
                      className="px-4 py-2 rounded-full border border-white/15 text-sm min-h-11 cursor-pointer disabled:opacity-60"
                    >
                      פרטים נוספים
                    </button>
                    <button
                      type="button"
                      disabled={pendingId === selected.id}
                      onClick={() => void review(selected.id, 'rejected')}
                      className="px-4 py-2 rounded-full border border-rose-400/30 text-rose-300 text-sm min-h-11 cursor-pointer disabled:opacity-60"
                    >
                      דחייה
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

function FounderAddForm({ onCreated }: { onCreated: (founder: Instructor) => void }) {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('יזם');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setTitle('יזם');
    setBio('');
    setAvatarUrl('');
    setError('');
  };

  const save = async () => {
    setPending(true);
    setError('');
    try {
      const { founder } = await adminApi.createFounder({ name, title, bio, avatarUrl });
      if (founder) onCreated(founder);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירה נכשלה');
    } finally {
      setPending(false);
    }
  };

  return (
    <OpsBand title="הוספת איש צוות">
      <p className="text-sm text-white/50 font-light">
        לכל יזם: שם, תפקיד ותמונה. ביו אפשר להוסיף אחר כך.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
        <OpsField label="שם">
          <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
        </OpsField>
        <OpsField label="תפקיד">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
        </OpsField>
        <OpsField label="ביו קצר (אופציונלי)" className="sm:col-span-2">
          <textarea rows={2} value={bio} onChange={(e) => setBio(e.target.value)} className={fieldClass} />
        </OpsField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
        <FileUploadField kind="image" label="תמונה" value={avatarUrl} onChange={setAvatarUrl} />
        {error ? <p className="text-sm text-rose-300 sm:col-span-3">{error}</p> : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => void save()}
          className={opsPrimaryBtn}
        >
          {pending ? 'שומר...' : 'הוספה'}
        </button>
        <button type="button" onClick={reset} className={opsGhostBtn}>
          ביטול
        </button>
      </div>
    </OpsBand>
  );
}

function FoundersPanel() {
  const { reloadCatalog } = useApp();
  const [founders, setFounders] = useState<Instructor[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const load = () =>
    adminApi
      .founders()
      .then((res) => setFounders(res.founders))
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
    const timers = saveTimers.current;
    return () => {
      for (const id of Object.keys(timers)) {
        clearTimeout(timers[id]);
      }
    };
  }, []);

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...founders];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    const tmp = next[index];
    next[index] = next[swap];
    next[swap] = tmp;
    setFounders(next);
    await adminApi.reorderFounders(next.map((item) => item.id));
  };

  const persistPhoto = async (id: string, avatarUrl: string) => {
    setPendingId(id);
    setError('');
    try {
      const { founder } = await adminApi.updateFounder(id, { avatarUrl });
      setFounders((prev) => prev.map((item) => (item.id === id ? { ...item, ...founder } : item)));
      await reloadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'העלאה נכשלה');
    } finally {
      setPendingId(null);
    }
  };

  const persistLinks = async (id: string, override?: { label: string; url: string }) => {
    const current = founders.find((item) => item.id === id);
    if (!current) return;
    const rest = (current.externalLinks || []).filter((item) => !override || item.label !== override.label);
    const links = override?.url.trim()
      ? [...rest, { label: override.label, url: override.url }]
      : rest.filter((item) => item.url.trim());
    setPendingId(id);
    setError('');
    try {
      const { founder: saved } = await adminApi.updateFounder(id, {
        externalLinks: links
          .map((item) => ({ label: item.label, url: normalizeExternalUrl(item.url) }))
          .filter((item) => item.label && item.url),
      });
      setFounders((prev) => prev.map((item) => (item.id === id ? { ...item, ...saved } : item)));
      await reloadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירת קישורים נכשלה');
    } finally {
      setPendingId(null);
    }
  };

  const setLinkDraft = (id: string, label: string, url: string) => {
    setFounders((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const rest = (item.externalLinks || []).filter((link) => link.label !== label);
        return { ...item, externalLinks: url.trim() ? [...rest, { label, url }] : rest };
      })
    );
  };

  const onPhotoChange = (id: string, avatarUrl: string) => {
    setFounders((prev) => prev.map((item) => (item.id === id ? { ...item, avatarUrl } : item)));
    clearTimeout(saveTimers.current[id]);
    const delay = !avatarUrl || avatarUrl.includes('/uploads/') ? 0 : 500;
    saveTimers.current[id] = setTimeout(() => {
      void persistPhoto(id, avatarUrl);
    }, delay);
  };

  if (error && founders.length === 0) return <p className="text-sm text-rose-300">{error}</p>;

  const selected = founders.find((item) => item.id === selectedId) || null;
  const selectedIndex = selected ? founders.findIndex((item) => item.id === selected.id) : -1;

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title="צוות מייסדים"
        hint="תמונות צוות, קישורים חיצוניים, וסדר ההופעה. יזם חדש: שם, תפקיד ותמונה."
      />
      <FounderAddForm
        onCreated={(founder) => {
          setFounders((prev) => [...prev, founder]);
          setSelectedId(founder.id);
          void reloadCatalog();
        }}
      />
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedId(null)}
        emptyDetail="בחרו איש צוות מהרשימה."
        list={
          founders.length === 0 ? (
            <OpsEmptyList>אין מייסדים מסומנים עדיין.</OpsEmptyList>
          ) : (
            <ul className="divide-y divide-white/10">
              {founders.map((founder) => (
                <li key={founder.id}>
                  <OpsListRow
                    active={selectedId === founder.id}
                    onClick={() => setSelectedId(founder.id)}
                    title={founder.name}
                    meta={founder.title}
                  />
                </li>
              ))}
            </ul>
          )
        }
        detail={
          selected ? (
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                {selected.avatarUrl ? (
                  <img
                    src={selected.avatarUrl}
                    alt={selected.name ? `תמונת צוות: ${selected.name}` : 'תמונת צוות'}
                    className="w-16 h-16 rounded-full object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border border-white/10 bg-white/5" />
                )}
                <div className="min-w-0">
                  <h3 className="text-lg font-light text-[#C8A24C]">{selected.name}</h3>
                  <p className="text-sm text-white/50">{selected.title}</p>
                </div>
              </div>
              <FileUploadField
                kind="image"
                label="תמונת צוות"
                value={selected.avatarUrl}
                hidePreview
                previewAlt={selected.name ? `תמונת צוות: ${selected.name}` : 'תמונת צוות'}
                disabled={pendingId === selected.id}
                onChange={(url) => onPhotoChange(selected.id, url)}
              />
              <label className="text-xs text-white/40">
                אתר
                <input
                  type="url"
                  dir="ltr"
                  className={`${fieldClass} mt-1 text-left`}
                  placeholder="https://"
                  value={linkUrl(selected, 'אתר')}
                  onChange={(e) => setLinkDraft(selected.id, 'אתר', e.target.value)}
                  onBlur={(e) => void persistLinks(selected.id, { label: 'אתר', url: e.currentTarget.value })}
                />
              </label>
              <label className="text-xs text-white/40">
                אינסטגרם
                <input
                  type="url"
                  dir="ltr"
                  className={`${fieldClass} mt-1 text-left`}
                  placeholder="https://instagram.com/"
                  value={linkUrl(selected, 'אינסטגרם')}
                  onChange={(e) => setLinkDraft(selected.id, 'אינסטגרם', e.target.value)}
                  onBlur={(e) => void persistLinks(selected.id, { label: 'אינסטגרם', url: e.currentTarget.value })}
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={selectedIndex <= 0}
                  onClick={() => void move(selectedIndex, -1)}
                  className="px-3 py-2 rounded-full border border-white/15 text-xs min-h-11 cursor-pointer disabled:opacity-30"
                >
                  למעלה
                </button>
                <button
                  type="button"
                  disabled={selectedIndex < 0 || selectedIndex >= founders.length - 1}
                  onClick={() => void move(selectedIndex, 1)}
                  className="px-3 py-2 rounded-full border border-white/15 text-xs min-h-11 cursor-pointer disabled:opacity-30"
                >
                  למטה
                </button>
              </div>
            </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

const PLAN_LABEL: Record<string, string> = {
  none: 'חינמי',
  free_trial: 'ניסיון',
  monthly: 'חודשי',
  annual: 'שנתי',
  premium_88: 'נבחרת 88',
};

function PaymentsPanel() {
  const [rows, setRows] = useState<AdminPaymentRow[]>([]);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .payments()
      .then((res) => setRows(res.payments))
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));
  }, []);

  if (error) return <p className="text-sm text-rose-300">{error}</p>;
  const selected = rows.find((row) => row.id === selectedId) || null;

  return (
    <OpsDeskStack>
      <OpsPageHeader title="מנויים ותשלומים" hint="שינוי מנוי או תשלום מסלול נרשמים כאן." />
      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedId(null)}
        emptyDetail="בחרו תשלום מהרשימה."
        list={
          rows.length === 0 ? (
            <OpsEmptyList>אין רשומות עדיין.</OpsEmptyList>
          ) : (
            <ul className="divide-y divide-white/10">
              {rows.map((row) => (
                <li key={row.id}>
                  <OpsListRow
                    active={selectedId === row.id}
                    onClick={() => setSelectedId(row.id)}
                    title={row.userName}
                    meta={row.createdAt.replace('T', ' ').slice(0, 16)}
                    status={PLAN_LABEL[row.plan] || row.plan}
                  />
                </li>
              ))}
            </ul>
          )
        }
        detail={
          selected ? (
            <div className="grid gap-3">
              <h3 className="text-lg font-light text-[#C8A24C]">{selected.userName}</h3>
              <OpsFact label="אימייל">{selected.email}</OpsFact>
              <OpsFact label="מנוי">{PLAN_LABEL[selected.plan] || selected.plan}</OpsFact>
              <OpsFact label="מקור">{selected.source === 'admin' ? 'אדמין' : 'משתמש'}</OpsFact>
              <OpsFact label="מתי">{selected.createdAt.replace('T', ' ').slice(0, 16)}</OpsFact>
            </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

function trackLabel(trackType: string) {
  return trackType === 'brave' ? 'אמיצים' : trackType === 'hesitant' ? 'הססנים' : trackType;
}

function installmentStatusLabel(status: string) {
  if (status === 'paid') return 'שולם';
  if (status === 'due') return 'לחיוב';
  if (status === 'failed') return 'נכשל';
  if (status === 'scheduled') return 'מתוזמן';
  return status;
}

function leadPaymentSummary(lead: AdminTrackLead) {
  const current = lead.currentInstallment;
  if (!current) return lead.plan?.status || lead.status;
  return `פעימה ${current.number} · ${installmentStatusLabel(current.status)}`;
}

function exportJoinersCsv(leads: AdminTrackLead[]) {
  const headers = [
    'מסלול',
    'שם',
    'טלפון',
    'אימייל',
    'תחום',
    'סיבת הססנות',
    'מוצר',
    'מכירות',
    'יעד 90',
    'קישורים',
    'הפניה ממרצה',
    'סטטוס ליד',
    'סטטוס תוכנית',
    'משתמש מקושר',
    'פעימה נוכחית',
    'סטטוס פעימה',
    'תאריך',
  ];
  const rows = leads.map((lead) => [
    trackLabel(lead.trackType),
    lead.name,
    lead.phone,
    lead.email,
    lead.field,
    lead.hesitationReason,
    lead.hasProduct,
    lead.hasSold,
    lead.goal90,
    lead.links,
    lead.referredByLecturerName || lead.referredByLecturerId,
    lead.status,
    lead.plan?.status || '',
    lead.userId ? lead.userName || lead.userId : '',
    lead.currentInstallment ? String(lead.currentInstallment.number) : '',
    lead.currentInstallment ? installmentStatusLabel(lead.currentInstallment.status) : '',
    lead.createdAt,
  ]);
  const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `joiners-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function TracksPanel() {
  const [data, setData] = useState<AdminTracksDashboard | null>(null);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [trackFilter, setTrackFilter] = useState<'all' | 'brave' | 'hesitant'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'due' | 'failed' | 'paid'>('all');

  const load = () =>
    adminApi
      .tracks()
      .then((next) => {
        setData(next);
        setSelectedId((prev) => {
          if (prev && next.leads.some((lead) => lead.id === prev)) return prev;
          return next.leads[0]?.id || null;
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  if (error && !data) return <p className="text-sm text-rose-300">{error}</p>;
  if (!data) return <p className="text-sm text-white/40">טוען...</p>;

  const cards = [
    { label: 'לידים אמיצים', value: data.braveLeads },
    { label: 'לידים הססנים', value: data.hesitantLeads },
    { label: 'משתמשי אמיצים', value: data.braveUsers },
    { label: 'משתמשי הססנים', value: data.hesitantUsers },
    { label: 'שילמו 8', value: data.paid8 },
    { label: 'שילמו 80', value: data.paid80 },
    { label: 'שילמו 800', value: data.paid800 },
    { label: 'שילמו 8,000', value: data.paid8000 },
    { label: 'פעימות לחיוב', value: data.dueNow },
    { label: 'חיובים שנכשלו', value: data.failedPayments },
    { label: 'כרטיסי הגרלה', value: data.raffleTicketsGranted },
    { label: 'למעקב', value: data.followUp },
  ];

  const filtered = data.leads.filter((lead) => {
    if (trackFilter !== 'all' && lead.trackType !== trackFilter) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'new') return lead.status === 'new';
    if (statusFilter === 'paid') {
      return lead.plan?.status === 'paid' || lead.installments.some((item) => item.status === 'paid');
    }
    return lead.currentInstallment?.status === statusFilter || lead.installments.some((item) => item.status === statusFilter);
  });

  const selected = filtered.find((lead) => lead.id === selectedId) || filtered[0] || null;

  const setInstallment = async (installmentId: string, status: 'paid' | 'failed' | 'due') => {
    setPendingId(installmentId);
    setError('');
    try {
      await adminApi.setInstallmentStatus(installmentId, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'עדכון נכשל');
    } finally {
      setPendingId('');
    }
  };

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title="מסלולי כניסה"
        hint={`כל מצטרפי האמיצים וההססנים, כולל שאלון ופעימות. סליקה: ${
          data.billingMode === 'stripe' ? 'Stripe מחובר' : 'פיילוט ידני'
        }. מועמדות לנבחרת 88 נשארת בלשונית נפרדת.`}
        action={
          <button
            type="button"
            onClick={() => exportJoinersCsv(filtered)}
            className="border border-white/15 px-4 py-2 text-sm text-white/70 hover:border-[#C8A24C]/50 hover:text-[#C8A24C] transition-colors min-h-11"
          >
            ייצוא CSV
          </button>
        }
      />

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <article key={card.label} className="border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-white/40 mb-1">{card.label}</p>
            <p className="text-2xl font-light">{card.value}</p>
          </article>
        ))}
      </div>

      <OpsToolbar>
        <label className="text-sm text-white/50 font-light flex items-center gap-2">
          מסלול
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value as typeof trackFilter)}
            className="bg-black border border-white/15 rounded-lg px-3 py-2 text-white min-h-11"
          >
            <option value="all">הכל</option>
            <option value="brave">אמיצים</option>
            <option value="hesitant">הססנים</option>
          </select>
        </label>
        <label className="text-sm text-white/50 font-light flex items-center gap-2">
          סטטוס
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="bg-black border border-white/15 rounded-lg px-3 py-2 text-white min-h-11"
          >
            <option value="all">הכל</option>
            <option value="new">ליד חדש</option>
            <option value="due">לחיוב</option>
            <option value="failed">נכשל</option>
            <option value="paid">שולם</option>
          </select>
        </label>
        <p className="text-sm text-white/35 self-center">{filtered.length} מצטרפים</p>
      </OpsToolbar>

      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedId(null)}
        emptyDetail="בחרו מצטרף מהרשימה."
        list={
          filtered.length === 0 ? (
            <OpsEmptyList>אין מצטרפים לפי הסינון.</OpsEmptyList>
          ) : (
            <ul className="divide-y divide-white/10">
              {filtered.map((row) => (
                <li key={row.id}>
                  <OpsListRow
                    active={selected?.id === row.id}
                    onClick={() => setSelectedId(row.id)}
                    title={row.name}
                    meta={trackLabel(row.trackType)}
                    status={leadPaymentSummary(row)}
                    statusClass="text-white/70"
                  />
                </li>
              ))}
            </ul>
          )
        }
        detail={
          selected ? (
            <div className="grid gap-5">
              <div>
                <h3 className="text-lg font-light text-[#C8A24C]">{selected.name}</h3>
                <p className="text-sm text-white/50 mt-1">
                  {trackLabel(selected.trackType)} · {opsStatusHe(selected.status)}
                </p>
              </div>

              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-white/40">טלפון</dt><dd>{selected.phone}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-white/40">אימייל</dt><dd className="text-left break-all">{selected.email}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-white/40">תחום</dt><dd>{selected.field || 'לא צוין'}</dd></div>
                {selected.hesitationReason ? (
                  <div className="flex justify-between gap-3"><dt className="text-white/40">הססנות</dt><dd className="text-left">{selected.hesitationReason}</dd></div>
                ) : null}
                {selected.hasProduct ? (
                  <div className="flex justify-between gap-3"><dt className="text-white/40">מוצר</dt><dd>{selected.hasProduct}</dd></div>
                ) : null}
                {selected.hasSold ? (
                  <div className="flex justify-between gap-3"><dt className="text-white/40">מכירות</dt><dd>{selected.hasSold}</dd></div>
                ) : null}
                {selected.goal90 ? (
                  <div className="flex justify-between gap-3"><dt className="text-white/40">יעד 90</dt><dd className="text-left">{selected.goal90}</dd></div>
                ) : null}
                {selected.links ? (
                  <div className="flex justify-between gap-3"><dt className="text-white/40">קישורים</dt><dd className="text-left break-all">{selected.links}</dd></div>
                ) : null}
                {(selected.referredByLecturerName || selected.referredByLecturerId) && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">הפניה</dt>
                    <dd>{selected.referredByLecturerName || selected.referredByLecturerId}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-white/40">משתמש</dt>
                  <dd>{selected.userId ? selected.userName || selected.userId : 'לא מקושר עדיין'}</dd>
                </div>
              </dl>

              {selected.plan ? (
                <div className="border-t border-white/10 pt-4">
                  <p className="text-xs text-white/40 mb-2">תוכנית תשלום</p>
                  <p className="text-sm text-white/70">
                    {selected.plan.amountBeforeVat.toLocaleString('he-IL')} ₪ לפני מע״מ ·{' '}
                    {selected.plan.amountWithVat.toLocaleString('he-IL')} ₪ כולל · {selected.plan.status}
                  </p>
                </div>
              ) : null}

              <div className="border-t border-white/10 pt-4 grid gap-3">
                <p className="text-xs text-white/40">פעימות</p>
                {selected.installments.length === 0 ? (
                  <p className="text-sm text-white/40">אין פעימות.</p>
                ) : (
                  selected.installments.map((item) => {
                    const canAct = item.status === 'scheduled' || item.status === 'due' || item.status === 'failed';
                    return (
                      <div key={item.id} className="border border-white/10 rounded-xl p-3 grid gap-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span>
                            פעימה {item.number} · {item.amountBeforeVat.toLocaleString('he-IL')} ₪
                          </span>
                          <span className="text-white/55">{installmentStatusLabel(item.status)}</span>
                        </div>
                        <p className="text-xs text-white/35">
                          {item.dueAt ? `לתאריך ${item.dueAt.replace('T', ' ').slice(0, 16)}` : 'ללא תאריך יעד'}
                          {item.paidAt ? ` · שולם ${item.paidAt.replace('T', ' ').slice(0, 16)}` : ''}
                          {item.paymentSource ? ` · ${item.paymentSource === 'manual' ? 'ידני' : 'Stripe'}` : ''}
                        </p>
                        {canAct ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={pendingId === item.id}
                              onClick={() => void setInstallment(item.id, 'paid')}
                              className="px-3 py-1.5 text-xs border border-[#C8A24C]/50 text-[#C8A24C] hover:bg-[#C8A24C]/10 disabled:opacity-50"
                            >
                              סומן כשולם
                            </button>
                            {item.status !== 'failed' ? (
                              <button
                                type="button"
                                disabled={pendingId === item.id}
                                onClick={() => void setInstallment(item.id, 'failed')}
                                className="px-3 py-1.5 text-xs border border-white/20 text-white/60 hover:border-rose-300/40 hover:text-rose-200 disabled:opacity-50"
                              >
                                נכשל
                              </button>
                            ) : null}
                            {item.status !== 'due' ? (
                              <button
                                type="button"
                                disabled={pendingId === item.id}
                                onClick={() => void setInstallment(item.id, 'due')}
                                className="px-3 py-1.5 text-xs border border-white/20 text-white/60 hover:border-white/40 disabled:opacity-50"
                              >
                                לחיוב
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

const P88_STATUS_LABEL: Record<string, string> = {
  submitted: 'הוגש',
  under_review: 'בבדיקה',
  call_needed: 'נדרשת שיחה',
  approved: 'אושר',
  rejected: 'נדחה',
  waitlist: 'רשימת המתנה',
  paid: 'שולם',
  onboarded: 'נקלט',
};

const AUDIT_ACTION_LABEL: Record<string, string> = {
  user_updated: 'עדכון משתמש',
  category_created: 'יצירת קטגוריה',
  category_updated: 'עדכון קטגוריה',
  categories_reordered: 'סידור קטגוריות',
  premium_88_reviewed: 'סקירת מועמדות 88',
  setting_updated: 'עדכון הגדרה',
  legal_page_updated: 'עדכון עמוד משפטי',
  raffle_created: 'יצירת הגרלה',
  raffle_tickets_assigned: 'שיוך כרטיסי הגרלה',
  raffle_winner_selected: 'בחירת זוכה בהגרלה',
};

function CategoriesPanel() {
  const { reloadCatalog } = useApp();
  const [rows, setRows] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('premium');

  const load = () =>
    adminApi
      .categories()
      .then((res) => setRows(res.categories))
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    setPending(true);
    setError('');
    try {
      await adminApi.createCategory({ name, description, accessLevel });
      setName('');
      setDescription('');
      await load();
      await reloadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'יצירה נכשלה');
    } finally {
      setPending(false);
    }
  };

  const patch = async (id: string, next: Partial<Category>) => {
    setPending(true);
    setError('');
    try {
      await adminApi.updateCategory(id, {
        name: next.name,
        description: next.description,
        accessLevel: next.accessLevel,
        sortOrder: next.sortOrder,
      });
      await load();
      await reloadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירה נכשלה');
    } finally {
      setPending(false);
    }
  };

  const move = async (id: string, direction: -1 | 1) => {
    const index = rows.findIndex((row) => row.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= rows.length) return;
    const next = [...rows];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setPending(true);
    try {
      const { categories } = await adminApi.reorderCategories(next.map((row) => row.id));
      setRows(categories);
      await reloadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'סידור נכשל');
    } finally {
      setPending(false);
    }
  };

  const selected = rows.find((row) => row.id === selectedId) || null;

  return (
    <OpsDeskStack>
      <OpsPageHeader title="קטגוריות" hint="שם, תיאור וגישה. הסדר ברשימה הוא הסדר בספרייה." />
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <OpsBand title="קטגוריה חדשה">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <OpsField label="שם">
            <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </OpsField>
          <OpsField label="תיאור">
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={fieldClass} />
          </OpsField>
          <OpsField label="גישה">
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}
              className={fieldClass}
            >
              <option value="free">חינמי</option>
              <option value="premium">פרימיום</option>
              <option value="premium_88">נבחרת 88</option>
              <option value="admin_only">אדמין בלבד</option>
            </select>
          </OpsField>
          <button
            type="button"
            disabled={pending || !name.trim()}
            onClick={() => void create()}
            className={`${opsPrimaryBtn} w-full`}
          >
            הוספה
          </button>
        </div>
      </OpsBand>

      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedId(null)}
        emptyDetail="בחרו קטגוריה מהרשימה."
        list={
          rows.length === 0 ? (
            <OpsEmptyList>אין קטגוריות עדיין.</OpsEmptyList>
          ) : (
            <ul className="divide-y divide-white/10">
              {rows.map((row) => (
                <li key={row.id}>
                  <OpsListRow
                    active={selectedId === row.id}
                    onClick={() => setSelectedId(row.id)}
                    title={row.name}
                    meta={row.description || undefined}
                    status={accessLabelHe(row.accessLevel)}
                  />
                </li>
              ))}
            </ul>
          )
        }
        detail={
          selected ? (
            <div className="grid gap-4">
              <h3 className="text-lg font-light text-[#C8A24C]">{selected.name}</h3>
              <OpsField label="שם">
                <input
                  key={`${selected.id}-name`}
                  defaultValue={selected.name}
                  className={fieldClass}
                  onBlur={(e) => {
                    if (e.target.value.trim() !== selected.name) void patch(selected.id, { name: e.target.value });
                  }}
                />
              </OpsField>
              <OpsField label="תיאור">
                <input
                  key={`${selected.id}-description`}
                  defaultValue={selected.description}
                  className={fieldClass}
                  onBlur={(e) => {
                    if (e.target.value !== selected.description) void patch(selected.id, { description: e.target.value });
                  }}
                />
              </OpsField>
              <OpsField label="גישה">
                <select
                  value={selected.accessLevel || 'premium'}
                  className={fieldClass}
                  onChange={(e) => void patch(selected.id, { accessLevel: e.target.value as AccessLevel })}
                >
                  <option value="free">חינמי</option>
                  <option value="premium">פרימיום</option>
                  <option value="premium_88">נבחרת 88</option>
                  <option value="admin_only">אדמין בלבד</option>
                </select>
              </OpsField>
              <OpsFact label="סדר">{selected.sortOrder ?? 0}</OpsFact>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void move(selected.id, -1)}
                  className="px-3 py-2 rounded-full border border-white/15 text-xs min-h-11"
                >
                  למעלה
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void move(selected.id, 1)}
                  className="px-3 py-2 rounded-full border border-white/15 text-xs min-h-11"
                >
                  למטה
                </button>
              </div>
            </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

function Premium88Panel() {
  const confirm = useConfirm();
  const [rows, setRows] = useState<AdminPremium88Application[]>([]);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = () =>
    adminApi
      .premium88()
      .then((res) => {
        setRows(res.applications);
        setSelectedId((prev) => {
          if (prev && res.applications.some((item) => item.id === prev)) return prev;
          return res.applications[0]?.id || null;
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  const selected = rows.find((row) => row.id === selectedId) || null;

  const review = async (id: string, status: string) => {
    const ok = await confirm({
      title: 'לאשר את שינוי הסטטוס?',
      body: 'המועמדות תעודכן מיד.',
      confirmLabel: 'שינוי סטטוס',
    });
    if (!ok) return;
    setPendingId(id);
    setError('');
    try {
      await adminApi.reviewPremium88(id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'עדכון נכשל');
    } finally {
      setPendingId('');
    }
  };

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title="נבחרת 88"
        hint="מועמדויות מטופס ההרשמה. נפרד ממסלולי כניסה וממנוי הספרייה."
      />
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedId(null)}
        emptyDetail="בחרו מועמדות."
        list={
          rows.length === 0 ? (
            <OpsEmptyList>אין מועמדויות עדיין.</OpsEmptyList>
          ) : (
            <ul className="divide-y divide-white/10">
              {rows.map((row) => (
                <li key={row.id}>
                  <OpsListRow
                    active={selectedId === row.id}
                    onClick={() => setSelectedId(row.id)}
                    title={row.fullName}
                    meta={row.field || 'ללא תחום'}
                    status={P88_STATUS_LABEL[row.status] || row.status}
                  />
                </li>
              ))}
            </ul>
          )
        }
        detail={
          selected ? (
            <div className="grid gap-4 text-sm">
              <div>
                <h3 className="text-lg font-light text-[#C8A24C]">{selected.fullName}</h3>
                <p className="text-white/45 mt-1">
                  {selected.phone} · {selected.email}
                </p>
              </div>
              <OpsFact label="תחום">{selected.field || 'לא צוין'}</OpsFact>
              <OpsFact label="שלב עסקי">{selected.businessStage || 'לא צוין'}</OpsFact>
              <OpsFact label="מטרה">{selected.goal || 'לא צוין'}</OpsFact>
              {selected.links ? <OpsFact label="קישורים">{selected.links}</OpsFact> : null}
              {selected.notes ? <p className="text-white/70 leading-relaxed">{selected.notes}</p> : null}
              <div className="flex flex-wrap gap-2 pt-2">
                {(['under_review', 'call_needed', 'approved', 'waitlist', 'rejected'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={pendingId === selected.id}
                    onClick={() => void review(selected.id, status)}
                    className="px-3 py-1.5 text-xs border border-white/20 text-white/70 hover:border-[#C8A24C]/50 hover:text-[#C8A24C] disabled:opacity-50 min-h-11"
                  >
                    {P88_STATUS_LABEL[status]}
                  </button>
                ))}
              </div>
            </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

function AuditLogsPanel() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .auditLogs()
      .then((res) => setLogs(res.logs))
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));
  }, []);

  if (error) return <p className="text-sm text-rose-300">{error}</p>;
  const selected = logs.find((row) => row.id === selectedId) || null;

  return (
    <OpsDeskStack>
      <OpsPageHeader title="יומן פעולות" hint="פעולות רגישות באדמין." />
      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedId(null)}
        emptyDetail="בחרו פעולה מהרשימה."
        list={
          logs.length === 0 ? (
            <OpsEmptyList>עדיין אין רשומות. שינוי משתמש או קטגוריה ייצור רשומה.</OpsEmptyList>
          ) : (
            <ul className="divide-y divide-white/10">
              {logs.map((row) => (
                <li key={row.id}>
                  <OpsListRow
                    active={selectedId === row.id}
                    onClick={() => setSelectedId(row.id)}
                    title={AUDIT_ACTION_LABEL[row.actionType] || row.actionType}
                    meta={row.adminName || row.adminEmail || row.adminUserId}
                    status={row.createdAt.replace('T', ' ').slice(0, 16)}
                    statusClass="text-white/45"
                  />
                </li>
              ))}
            </ul>
          )
        }
        detail={
          selected ? (
            <div className="grid gap-3">
              <h3 className="text-lg font-light text-[#C8A24C]">
                {AUDIT_ACTION_LABEL[selected.actionType] || selected.actionType}
              </h3>
              <OpsFact label="מי">{selected.adminName || selected.adminEmail || selected.adminUserId}</OpsFact>
              <OpsFact label="ישות">
                {selected.entityType}
                {selected.entityId ? ` · ${selected.entityId}` : ''}
              </OpsFact>
              <OpsFact label="מתי">{selected.createdAt.replace('T', ' ').slice(0, 16)}</OpsFact>
            </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

function RafflesPanel() {
  const confirm = useConfirm();
  const [data, setData] = useState<AdminRaffleDashboard | null>(null);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selectedRaffleId, setSelectedRaffleId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const load = () =>
    adminApi
      .raffles()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    setBusy(true);
    setError('');
    try {
      await adminApi.createRaffle({
        title,
        description,
        endsAt: endsAt || undefined,
      });
      setTitle('');
      setDescription('');
      setEndsAt('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'יצירה נכשלה');
    } finally {
      setBusy(false);
    }
  };

  const assign = async (id: string) => {
    const ok = await confirm({
      title: 'לשייך את כל הכרטיסים הפתוחים להגרלה הזו?',
      confirmLabel: 'שיוך כרטיסים',
    });
    if (!ok) return;
    setPendingId(id);
    setError('');
    try {
      await adminApi.assignRaffleTickets(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שיוך נכשל');
    } finally {
      setPendingId(null);
    }
  };

  const draw = async (id: string) => {
    const ok = await confirm({
      title: 'להגריל זוכה עכשיו?',
      body: 'לא ניתן לבטל אחרי ההגרלה.',
      confirmLabel: 'הגרלת זוכה',
      danger: true,
    });
    if (!ok) return;
    setPendingId(id);
    setError('');
    try {
      await adminApi.drawRaffle(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'הגרלה נכשלה');
    } finally {
      setPendingId(null);
    }
  };

  if (!data && !error) return <p className="text-sm text-white/40">טוען הגרלות...</p>;
  if (error && !data) return <p className="text-sm text-rose-300">{error}</p>;
  if (!data) return null;

  const selectedRaffle = data.raffles.find((row) => row.id === selectedRaffleId) || null;
  const tickets = data.tickets.slice(0, 40);
  const selectedTicket = tickets.find((row) => row.id === selectedTicketId) || null;
  const raffleTitle = (id?: string) => data.raffles.find((row) => row.id === id)?.title || (id ? id : 'ללא שיוך');
  const trackLabel = (track?: string) =>
    track === 'brave' ? 'אמיצים' : track === 'hesitant' ? 'הססנים' : track || '—';

  return (
    <OpsDeskStack>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <OpsPageHeader
        title="הגרלות"
        hint={`תקנון מאושר: ${data.termsApproved ? 'כן' : 'לא'} · כרטיסים ללא שיוך: ${data.unassignedTickets}`}
      />

      <OpsBand title="הגרלה חדשה">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <OpsField label="שם" className="xl:col-span-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
          </OpsField>
          <OpsField label="תאריך סיום (אופציונלי)">
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className={fieldClass}
              dir="ltr"
            />
          </OpsField>
          <button
            type="button"
            disabled={busy || !title.trim()}
            onClick={() => void create()}
            className={`${opsPrimaryBtn} w-full`}
          >
            {busy ? 'יוצר...' : 'יצירת הגרלה'}
          </button>
          <OpsField label="תיאור" className="sm:col-span-2 xl:col-span-4">
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={fieldClass}
            />
          </OpsField>
        </div>
      </OpsBand>

      <OpsSection title="הגרלות">
        <OpsMasterDetail
          hasSelection={Boolean(selectedRaffle)}
          onCloseDetail={() => setSelectedRaffleId(null)}
          emptyDetail="בחרו הגרלה מהרשימה."
          list={
            data.raffles.length === 0 ? (
              <OpsEmptyList>עדיין אין הגרלות.</OpsEmptyList>
            ) : (
              <ul className="divide-y divide-white/10">
                {data.raffles.map((row) => (
                  <li key={row.id}>
                    <OpsListRow
                      active={selectedRaffleId === row.id}
                      onClick={() => setSelectedRaffleId(row.id)}
                      title={row.title}
                      meta={`${row.ticketsCount ?? 0} כרטיסים · ${row.participants ?? 0} משתתפים`}
                      status={raffleStatusHe(row.status)}
                    />
                  </li>
                ))}
              </ul>
            )
          }
          detail={
            selectedRaffle ? (
              <div className="grid gap-4">
                <h3 className="text-lg font-light text-[#C8A24C]">{selectedRaffle.title}</h3>
                <OpsFact label="סטטוס">{raffleStatusHe(selectedRaffle.status)}</OpsFact>
                <OpsFact label="כרטיסים">{selectedRaffle.ticketsCount ?? 0}</OpsFact>
                <OpsFact label="משתתפים">{selectedRaffle.participants ?? 0}</OpsFact>
                <OpsFact label="זוכה">{selectedRaffle.winnerName || '—'}</OpsFact>
                {selectedRaffle.description ? (
                  <p className="text-sm text-white/60 leading-relaxed">{selectedRaffle.description}</p>
                ) : null}
                {selectedRaffle.status === 'open' ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pendingId === selectedRaffle.id}
                      onClick={() => void assign(selectedRaffle.id)}
                      className="px-3 py-2 text-xs border border-white/20 rounded-full min-h-11"
                    >
                      שיוך כרטיסים
                    </button>
                    <button
                      type="button"
                      disabled={pendingId === selectedRaffle.id || !data.termsApproved}
                      onClick={() => void draw(selectedRaffle.id)}
                      className="px-3 py-2 text-xs bg-[#C8A24C] text-black rounded-full min-h-11 disabled:opacity-50"
                      title={!data.termsApproved ? 'נדרש אישור תקנון הגרלות בהגדרות' : undefined}
                    >
                      הגרלת זוכה
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null
          }
        />
      </OpsSection>

      <OpsSection title="כרטיסים אחרונים">
        <OpsMasterDetail
          hasSelection={Boolean(selectedTicket)}
          onCloseDetail={() => setSelectedTicketId(null)}
          emptyDetail="בחרו כרטיס מהרשימה."
          list={
            tickets.length === 0 ? (
              <OpsEmptyList>אין כרטיסים עדיין.</OpsEmptyList>
            ) : (
              <ul className="divide-y divide-white/10">
                {tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <OpsListRow
                      active={selectedTicketId === ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      title={ticket.userName || ticket.userEmail || '—'}
                      meta={`${ticket.ticketsCount} כרטיסים`}
                      status={trackLabel(ticket.trackType)}
                    />
                  </li>
                ))}
              </ul>
            )
          }
          detail={
            selectedTicket ? (
              <div className="grid gap-3">
                <h3 className="text-lg font-light text-[#C8A24C]">{selectedTicket.userName || '—'}</h3>
                <OpsFact label="אימייל">
                  <span dir="ltr">{selectedTicket.userEmail || '—'}</span>
                </OpsFact>
                <OpsFact label="מסלול">{trackLabel(selectedTicket.trackType)}</OpsFact>
                <OpsFact label="כמות">{selectedTicket.ticketsCount}</OpsFact>
                <OpsFact label="הגרלה">{raffleTitle(selectedTicket.raffleId)}</OpsFact>
                <OpsFact label="סיבה">{selectedTicket.grantedReason || '—'}</OpsFact>
              </div>
            ) : null
          }
        />
      </OpsSection>
    </OpsDeskStack>
  );
}

function LeadsPanel() {
  const [leads, setLeads] = useState<AdminCrmLead[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [source, setSource] = useState<'all' | AdminCrmLead['source']>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    adminApi
      .leads()
      .then((res) => setLeads(res.leads))
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));
  }, []);

  const filtered = leads.filter((row) => {
    if (source !== 'all' && row.source !== source) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [row.name, row.email, row.phone, row.interest, row.sourceLabel]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
  const leadKey = (row: AdminCrmLead) => `${row.source}-${row.id}`;
  const selected = filtered.find((row) => leadKey(row) === selectedKey) || null;

  const exportCsv = () => {
    const header = 'source,name,phone,email,interest,status,createdAt';
    const rows = filtered.map((row) =>
      [row.sourceLabel, row.name, row.phone, row.email, row.interest, row.status, row.createdAt]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([`\uFEFF${header}\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'crm-leads.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (error) return <p className="text-sm text-rose-300">{error}</p>;

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title="לידים ופניות"
        hint={`${filtered.length} רשומות מכל המקורות.`}
        action={
          <button
            type="button"
            onClick={exportCsv}
            className="px-4 py-2 rounded-full border border-white/15 text-sm min-h-11 hover:border-white/40"
          >
            ייצוא CSV
          </button>
        }
      />

      <OpsToolbar>
        <select value={source} onChange={(e) => setSource(e.target.value as typeof source)} className={`${fieldClass} lg:max-w-xs`}>
          <option value="all">כל המקורות</option>
          <option value="track">מסלולי כניסה</option>
          <option value="premium88">נבחרת 88</option>
          <option value="lecturer">בקשות מרצים</option>
          <option value="webinar">וובינר</option>
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש שם, אימייל, טלפון..."
          className={`${fieldClass} flex-1`}
        />
      </OpsToolbar>

      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedKey(null)}
        emptyDetail="בחרו פנייה מהרשימה."
        list={
          filtered.length === 0 ? (
            <OpsEmptyList>אין לידים להצגה.</OpsEmptyList>
          ) : (
            <ul className="divide-y divide-white/10">
              {filtered.map((row) => (
                <li key={leadKey(row)}>
                  <OpsListRow
                    active={selectedKey === leadKey(row)}
                    onClick={() => setSelectedKey(leadKey(row))}
                    title={row.name || row.email || '—'}
                    meta={row.sourceLabel}
                    status={opsStatusHe(row.status)}
                  />
                </li>
              ))}
            </ul>
          )
        }
        detail={
          selected ? (
            <div className="grid gap-3">
              <h3 className="text-lg font-light text-[#C8A24C]">{selected.name || '—'}</h3>
              <OpsFact label="מקור">{selected.sourceLabel}</OpsFact>
              <OpsFact label="טלפון">
                <span dir="ltr">{selected.phone || '—'}</span>
              </OpsFact>
              <OpsFact label="אימייל">
                <span dir="ltr">{selected.email || '—'}</span>
              </OpsFact>
              <OpsFact label="עניין">{selected.interest || '—'}</OpsFact>
              <OpsFact label="סטטוס">{opsStatusHe(selected.status)}</OpsFact>
              <OpsFact label="תאריך">{formatOpsDate(selected.createdAt)}</OpsFact>
            </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

function LegalPanel() {
  const confirm = useConfirm();
  const [terms, setTerms] = useState('');
  const [privacy, setPrivacy] = useState('');
  const [raffle, setRaffle] = useState('');
  const [raffleTermsApproved, setRaffleTermsApproved] = useState(false);
  const [a11yReports, setA11yReports] = useState<
    Array<{
      id: string;
      fullName: string;
      email: string;
      phone: string;
      message: string;
      status: 'open' | 'in_progress' | 'resolved';
      createdAt: string;
    }>
  >([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [doc, setDoc] = useState<'terms' | 'privacy' | 'raffle'>('terms');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const load = () =>
    Promise.all([adminApi.legal(), adminApi.accessibilityReports()])
      .then(([legal, reports]) => {
        setTerms(legal.terms || '');
        setPrivacy(legal.privacy || '');
        setRaffle(legal.raffle || '');
        setRaffleTermsApproved(Boolean(legal.raffleTermsApproved));
        setA11yReports(reports.reports);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  const save = async (key: 'legal_terms' | 'legal_privacy' | 'legal_raffle', value: string) => {
    setSaving(key);
    setError('');
    setMessage('');
    try {
      await adminApi.setSetting(key, value);
      setMessage('נשמר בהצלחה');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירה נכשלה');
    } finally {
      setSaving(null);
    }
  };

  const toggleRaffleApproval = async () => {
    const ok = await confirm({
      title: raffleTermsApproved
        ? 'לבטל אישור תקנון הגרלות?'
        : 'לאשר שהתקנון המשפטי להגרלות מוכן לפרסום?',
      confirmLabel: raffleTermsApproved ? 'ביטול אישור' : 'אישור תקנון',
      danger: raffleTermsApproved,
    });
    if (!ok) return;
    setSaving('raffle_terms_approved');
    setError('');
    setMessage('');
    try {
      await adminApi.setSetting('raffle_terms_approved', !raffleTermsApproved);
      setMessage('עודכן');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'עדכון נכשל');
    } finally {
      setSaving(null);
    }
  };

  const selectedReport = a11yReports.find((row) => row.id === selectedReportId) || null;
  const a11yStatusHe = (status: 'open' | 'in_progress' | 'resolved') =>
    status === 'open' ? 'פתוח' : status === 'in_progress' ? 'בטיפול' : 'נסגר';

  return (
    <OpsDeskStack>
      <OpsPageHeader title="משפטי" hint="מסמך אחד בכל פעם. הטקסטים מוצגים בעמודי האתר." />
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {message ? <p className="text-sm text-[#C8A24C]">{message}</p> : null}

      <OpsToolbar>
        {(
          [
            ['terms', 'תקנון'],
            ['privacy', 'פרטיות'],
            ['raffle', 'הגרלות'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setDoc(id)}
            className={opsChipClass(doc === id)}
          >
            {label}
          </button>
        ))}
      </OpsToolbar>

      {doc === 'terms' ? (
        <div className="grid gap-4">
          <textarea rows={12} value={terms} onChange={(e) => setTerms(e.target.value)} className={fieldClass} />
          <button
            type="button"
            disabled={saving === 'legal_terms'}
            onClick={() => void save('legal_terms', terms)}
            className={`${opsPrimaryBtn} w-fit`}
          >
            {saving === 'legal_terms' ? 'שומר...' : 'שמירת תקנון'}
          </button>
        </div>
      ) : null}

      {doc === 'privacy' ? (
        <div className="grid gap-4">
          <textarea rows={12} value={privacy} onChange={(e) => setPrivacy(e.target.value)} className={fieldClass} />
          <button
            type="button"
            disabled={saving === 'legal_privacy'}
            onClick={() => void save('legal_privacy', privacy)}
            className={`${opsPrimaryBtn} w-fit`}
          >
            {saving === 'legal_privacy' ? 'שומר...' : 'שמירת פרטיות'}
          </button>
        </div>
      ) : null}

      {doc === 'raffle' ? (
        <div className="grid gap-4">
          <textarea rows={12} value={raffle} onChange={(e) => setRaffle(e.target.value)} className={fieldClass} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving === 'legal_raffle'}
              onClick={() => void save('legal_raffle', raffle)}
              className={`${opsPrimaryBtn} w-fit`}
            >
              {saving === 'legal_raffle' ? 'שומר...' : 'שמירת תקנון הגרלות'}
            </button>
            <button
              type="button"
              disabled={saving === 'raffle_terms_approved'}
              onClick={() => void toggleRaffleApproval()}
              className="px-5 py-3 rounded-full border border-white/20 text-base min-h-12 disabled:opacity-60"
            >
              {raffleTermsApproved ? 'ביטול אישור משפטי' : 'אישור משפטי להגרלות'}
            </button>
          </div>
          <p className="text-base text-white/60">
            סטטוס: {raffleTermsApproved ? 'מאושר · ניתן להגריל זוכה' : 'לא מאושר · הגרלת זוכה חסומה'}
          </p>
        </div>
      ) : null}

      <OpsSection title="פניות נגישות">
        <p className="text-base text-white/60">
          פניות מהצהרת הנגישות. טיפול ראשון תוך 14 ימי עסקים.
        </p>
        <OpsMasterDetail
          hasSelection={Boolean(selectedReport)}
          onCloseDetail={() => setSelectedReportId(null)}
          emptyDetail="בחרו פנייה מהרשימה."
          list={
            a11yReports.length === 0 ? (
              <OpsEmptyList>אין פניות רשומות.</OpsEmptyList>
            ) : (
              <ul className="divide-y divide-white/10">
                {a11yReports.map((report) => (
                  <li key={report.id}>
                    <OpsListRow
                      active={selectedReportId === report.id}
                      onClick={() => setSelectedReportId(report.id)}
                      title={report.fullName}
                      meta={formatOpsDate(report.createdAt)}
                      status={a11yStatusHe(report.status)}
                      statusClass={
                        report.status === 'resolved'
                          ? 'text-emerald-300'
                          : report.status === 'in_progress'
                            ? 'text-[#C8A24C]'
                            : 'text-rose-300'
                      }
                    />
                  </li>
                ))}
              </ul>
            )
          }
          detail={
            selectedReport ? (
              <div className="grid gap-3">
                <h3 className="text-lg font-light text-[#C8A24C]">{selectedReport.fullName}</h3>
                <OpsFact label="סטטוס">{a11yStatusHe(selectedReport.status)}</OpsFact>
                <OpsFact label="תאריך">{formatOpsDate(selectedReport.createdAt)}</OpsFact>
                <OpsFact label="דוא״ל">
                  <span dir="ltr">{selectedReport.email}</span>
                </OpsFact>
                {selectedReport.phone ? (
                  <OpsFact label="טלפון">
                    <span dir="ltr">{selectedReport.phone}</span>
                  </OpsFact>
                ) : null}
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{selectedReport.message}</p>
                {selectedReport.status !== 'resolved' ? (
                  <button
                    type="button"
                    className="px-3 py-2 rounded-full border border-white/20 text-sm min-h-11 w-fit"
                    onClick={() => {
                      void adminApi
                        .updateAccessibilityReport(selectedReport.id, {
                          status: selectedReport.status === 'open' ? 'in_progress' : 'resolved',
                        })
                        .then(() => load())
                        .catch((err) => setError(err instanceof Error ? err.message : 'עדכון נכשל'));
                    }}
                  >
                    {selectedReport.status === 'open' ? 'בטיפול' : 'סגור'}
                  </button>
                ) : (
                  <p className="text-white/50 text-sm">נסגר</p>
                )}
              </div>
            ) : null
          }
        />
      </OpsSection>
    </OpsDeskStack>
  );
}

function WebinarPanel() {
  const [data, setData] = useState<AdminWebinarDashboard | null>(null);
  const [config, setConfig] = useState<WebinarConfig>(DEFAULT_WEBINAR_CONFIG);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'partial' | 'complete' | 'waitlist'>('all');
  const [showMore, setShowMore] = useState(false);
  const [selectedRegId, setSelectedRegId] = useState<string | null>(null);

  const load = () =>
    adminApi
      .webinar()
      .then((res) => {
        setData(res);
        setConfig(res.config);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    setError('');
    try {
      const { config: next } = await adminApi.saveWebinarConfig(config);
      setConfig(next);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירה נכשלה');
    } finally {
      setSaving(false);
    }
  };

  const registrations = (data?.registrations || []).filter((row) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'complete' && row.status !== 'complete' && row.status !== 'new') return false;
      if (statusFilter !== 'complete' && row.status !== statusFilter) return false;
    }
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [row.fullName, row.email, row.phone, row.field, row.interest, row.blocker, row.status]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
  const selectedReg = registrations.find((row) => row.id === selectedRegId) || null;

  const statusLabel = (status: string) => {
    if (status === 'partial') return 'חלקי';
    if (status === 'complete' || status === 'new') return 'הושלם';
    if (status === 'waitlist') return 'רשימת המתנה';
    if (status === 'all') return 'הכל';
    return status;
  };

  const exportCsv = () => {
    const header = 'name,phone,email,field,interest,blocker,utm_source,status,createdAt';
    const rows = registrations.map((row) =>
      [row.fullName, row.phone, row.email, row.field, row.interest, row.blocker, row.utmSource, row.status, row.createdAt]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([`\uFEFF${header}\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'webinar-registrations.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateConfig = <K extends keyof WebinarConfig>(key: K, value: WebinarConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (error && !data) return <p className="text-sm text-rose-300">{error}</p>;

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title="וובינר"
        hint={`${data?.totalRegistrations ?? 0} נרשמים. שינויים נשמרים בכפתור הזהוב.`}
        action={
          <a href="/webinar" target="_blank" rel="noreferrer" className={`${opsGhostBtn} text-sm`}>
            צפייה בדף
          </a>
        }
      />

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {data?.funnel ? (
        <section className="grid gap-3">
          <h3 className="text-lg font-light">משפך</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ['צפיות', data.funnel.pageViews],
              ['טופס נצפה', data.funnel.formViews],
              ['שלב ראשון', data.funnel.stepACompleted],
              ['השלמה', data.funnel.completed],
              ['יומן', data.funnel.calendarClicks],
              ['וואטסאפ', data.funnel.whatsappClicks],
              ['חלקי', data.funnel.partialLeads],
              ['רשימת המתנה', data.funnel.waitlistLeads],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-white/10 p-3">
                <p className="text-white/60 text-base">{label}</p>
                <p className="text-xl font-light tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-3 xl:items-start">
      <OpsSection title="פרטים">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <OpsField label="כותרת" className="sm:col-span-2">
            <input value={config.title} onChange={(e) => updateConfig('title', e.target.value)} className={fieldClass} />
          </OpsField>
          <OpsField label="תאריך">
            <input value={config.date} onChange={(e) => updateConfig('date', e.target.value)} className={fieldClass} />
          </OpsField>
          <OpsField label="שעה">
            <input value={config.time} onChange={(e) => updateConfig('time', e.target.value)} className={fieldClass} />
          </OpsField>
          <OpsField label="משך בדקות">
            <input
              type="number"
              value={config.durationMinutes}
              onChange={(e) => updateConfig('durationMinutes', Number(e.target.value) || 90)}
              className={fieldClass}
            />
          </OpsField>
          <OpsField label="מיקום">
            <input value={config.location} onChange={(e) => updateConfig('location', e.target.value)} className={fieldClass} />
          </OpsField>
          <OpsField label="תווית עלות">
            <input value={config.costLabel} onChange={(e) => updateConfig('costLabel', e.target.value)} className={fieldClass} />
          </OpsField>
          <OpsField label="תווית מקומות">
            <input value={config.spotsLabel} onChange={(e) => updateConfig('spotsLabel', e.target.value)} className={fieldClass} />
          </OpsField>
        </div>
      </OpsSection>

      <OpsSection title="קישורים">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <OpsField label="קבוצת וואטסאפ (אופציונלי)" className="sm:col-span-2">
            <input
              value={config.whatsappGroupUrl}
              onChange={(e) => updateConfig('whatsappGroupUrl', e.target.value)}
              className={fieldClass}
              dir="ltr"
            />
          </OpsField>
          <OpsField label="קישור זום" className="sm:col-span-2">
            <input value={config.zoomLink} onChange={(e) => updateConfig('zoomLink', e.target.value)} className={fieldClass} dir="ltr" />
          </OpsField>
        </div>
      </OpsSection>

      <OpsSection title="הרשמה">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <OpsField label="מקסימום מקומות (0 = בלי הגבלה)">
            <input
              type="number"
              value={config.maxSpots}
              onChange={(e) => updateConfig('maxSpots', Number(e.target.value) || 0)}
              className={fieldClass}
            />
          </OpsField>
          <div className="grid gap-3 content-end">
            <label className="flex items-center gap-3 text-base min-h-11">
              <input type="checkbox" checked={config.showRegistrationCount} onChange={(e) => updateConfig('showRegistrationCount', e.target.checked)} className="accent-[#C8A24C]" />
              <span>הצגת מונה נרשמים</span>
            </label>
            <label className="flex items-center gap-3 text-base min-h-11">
              <input type="checkbox" checked={config.showSpotsRemaining} onChange={(e) => updateConfig('showSpotsRemaining', e.target.checked)} className="accent-[#C8A24C]" />
              <span>הצגת מקומות שנותרו</span>
            </label>
            <label className="flex items-center gap-3 text-base min-h-11">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => updateConfig('enabled', e.target.checked)}
                className="accent-[#C8A24C]"
              />
              <span>הרשמה פתוחה</span>
            </label>
          </div>
        </div>
      </OpsSection>
      </div>

      <div>
        <button
          type="button"
          aria-expanded={showMore}
          onClick={() => setShowMore((open) => !open)}
          className="text-base text-white/70 hover:text-white min-h-11"
        >
          {showMore ? 'הסתרת הגדרות נוספות' : 'עוד הגדרות'}
        </button>
      </div>

      {showMore ? (
        <>
          <OpsSection title="מובילים">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <OpsField label="שם מוביל ראשי">
                <input
                  value={config.leaderPrimaryName}
                  onChange={(e) => updateConfig('leaderPrimaryName', e.target.value)}
                  className={fieldClass}
                />
              </OpsField>
              <OpsField label="תפקיד מוביל ראשי">
                <input
                  value={config.leaderPrimaryTitle}
                  onChange={(e) => updateConfig('leaderPrimaryTitle', e.target.value)}
                  className={fieldClass}
                />
              </OpsField>
              <OpsField label="תיאור מוביל ראשי" className="sm:col-span-2">
                <textarea
                  value={config.leaderPrimaryBio}
                  onChange={(e) => updateConfig('leaderPrimaryBio', e.target.value)}
                  rows={3}
                  className={fieldClass}
                />
              </OpsField>
              <OpsField label="שם מוביל/ה שני/ה">
                <input
                  value={config.leaderSecondaryName}
                  onChange={(e) => updateConfig('leaderSecondaryName', e.target.value)}
                  className={fieldClass}
                />
              </OpsField>
              <OpsField label="תפקיד מוביל/ה שני/ה">
                <input
                  value={config.leaderSecondaryTitle}
                  onChange={(e) => updateConfig('leaderSecondaryTitle', e.target.value)}
                  className={fieldClass}
                />
              </OpsField>
              <OpsField label="תיאור מוביל/ה שני/ה" className="sm:col-span-2">
                <textarea
                  value={config.leaderSecondaryBio}
                  onChange={(e) => updateConfig('leaderSecondaryBio', e.target.value)}
                  rows={3}
                  className={fieldClass}
                />
              </OpsField>
            </div>
          </OpsSection>
          <OpsSection title="כותרת חלופית והמלצות">
            <label className="flex items-center gap-3 text-base min-h-11">
              <input type="checkbox" checked={config.abTestEnabled} onChange={(e) => updateConfig('abTestEnabled', e.target.checked)} className="accent-[#C8A24C]" />
              <span>הפעלת כותרת חלופית</span>
            </label>
            <OpsField label="כותרת חלופית">
              <input value={config.heroHeadlineVariantB} onChange={(e) => updateConfig('heroHeadlineVariantB', e.target.value)} className={fieldClass} />
            </OpsField>
            <OpsField label="ציטוטי המלצה (מבנה נתונים)">
              <textarea
                value={JSON.stringify(config.socialProofQuotes, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value) as WebinarConfig['socialProofQuotes'];
                    updateConfig('socialProofQuotes', parsed);
                  } catch {
                    /* keep editing */
                  }
                }}
                rows={6}
                className={`${fieldClass} font-mono text-sm`}
                dir="ltr"
              />
            </OpsField>
          </OpsSection>
        </>
      ) : null}

      <button
        type="button"
        onClick={() => void saveConfig()}
        disabled={saving}
        className={`${opsPrimaryBtn} w-fit`}
      >
        {saving ? 'שומר…' : 'שמירה'}
      </button>

      <section className="grid gap-4">
        <OpsPageHeader
          title="נרשמים לוובינר"
          hint={`${registrations.length} רשומות`}
          action={
            <button
              type="button"
              onClick={exportCsv}
              className="px-4 py-2 rounded-full border border-white/15 text-sm min-h-11 hover:border-white/40"
            >
              ייצוא CSV
            </button>
          }
        />
        <OpsToolbar>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש…"
            className={`${fieldClass} flex-1`}
          />
          <div className="flex flex-wrap gap-2">
          {(['all', 'partial', 'complete', 'waitlist'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={opsChipClass(statusFilter === key)}
            >
              {key === 'all' ? 'הכל' : statusLabel(key)}
            </button>
          ))}
          </div>
        </OpsToolbar>
        <OpsMasterDetail
          hasSelection={Boolean(selectedReg)}
          onCloseDetail={() => setSelectedRegId(null)}
          emptyDetail="בחרו נרשם מהרשימה."
          list={
            registrations.length === 0 ? (
              <OpsEmptyList>אין נרשמים עדיין.</OpsEmptyList>
            ) : (
              <ul className="divide-y divide-white/10">
                {registrations.map((row) => (
                  <li key={row.id}>
                    <OpsListRow
                      active={selectedRegId === row.id}
                      onClick={() => setSelectedRegId(row.id)}
                      title={row.fullName}
                      meta={row.field || undefined}
                      status={statusLabel(row.status)}
                    />
                  </li>
                ))}
              </ul>
            )
          }
          detail={
            selectedReg ? (
              <div className="grid gap-3">
                <h3 className="text-lg font-light text-[#C8A24C]">{selectedReg.fullName}</h3>
                <OpsFact label="סטטוס">{statusLabel(selectedReg.status)}</OpsFact>
                <OpsFact label="תאריך">{formatOpsDate(selectedReg.createdAt)}</OpsFact>
                <OpsFact label="טלפון">
                  <span dir="ltr">{selectedReg.phone || '—'}</span>
                </OpsFact>
                <OpsFact label="אימייל">
                  <span dir="ltr">{selectedReg.email || '—'}</span>
                </OpsFact>
                <OpsFact label="תחום">{selectedReg.field || '—'}</OpsFact>
                <OpsFact label="מסקרן">{selectedReg.interest || '—'}</OpsFact>
                {selectedReg.blocker ? <OpsFact label="חסם">{selectedReg.blocker}</OpsFact> : null}
                {selectedReg.utmSource ? <OpsFact label="מקור">{selectedReg.utmSource}</OpsFact> : null}
              </div>
            ) : null
          }
        />
      </section>
    </OpsDeskStack>
  );
}
