import { useEffect, useState, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { useUser } from '../context/UserContext';
import {
  lecturerApi,
  type LecturerApplication,
  type LecturerOverview,
  type LecturerProfile,
  type LecturerQuestion,
  type LecturerTeamMessage,
} from '../api/lecturer';
import type { AccessLevel, Course, Instructor } from '../types';
import type { CoursePayload } from '../api/admin';
import { captionTracksFromVttUrl, vttUrlFromCaptionTracks } from '../constants/captions';
import { trackEvent } from '../utils/analytics';
import { FileUploadField } from '../components/FileUploadField';
import { OpsBand, OpsCardActions, OpsCardTitle, OpsDeskStack, OpsEmptyList, OpsFact, OpsFacts, OpsField, OpsListRow, OpsMasterDetail, OpsPageHeader, OpsSection, OpsToolbar, opsCardGhost, opsCardPrimary, opsChipClass, opsFieldClass, opsGhostBtn, opsPrimaryBtn } from '../components/ops/OpsUi';
import { accessLabelHe } from '../utils/opsLabels';

const fieldClass = opsFieldClass;

const STATUS_LABEL: Record<string, string> = {
  draft: 'טיוטה',
  pending_review: 'בבדיקה',
  published: 'פורסם',
  blocked: 'חסום',
};

export function LecturerView() {
  const { user, isGuest, categories, setView, setAuthModalOpen } = useApp();
  const { refreshUser } = useUser();
  const isLecturer = user.role === 'instructor';

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  if (isGuest) {
    return (
      <div className="min-h-screen bg-[#050505] text-white pt-28 pb-24 px-4 text-right">
        <div className="max-w-md mx-auto border border-white/10 rounded-3xl p-8">
          <h1 className="text-2xl font-medium mb-3">אזור מרצים</h1>
          <p className="text-sm text-white/50 font-light mb-6">
            התחברו או צרו חשבון כדי להגיש בקשה להיות מרצה.
          </p>
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="w-full py-3 rounded-full bg-[#C8A24C] text-black text-sm min-h-11 cursor-pointer"
          >
            כניסה
          </button>
        </div>
      </div>
    );
  }

  if (!isLecturer) {
    return <ApplicationPanel userName={user.name} userEmail={user.email} onBack={() => setView('profile')} />;
  }

  return <LecturerDashboard categories={categories} onBack={() => setView('home')} />;
}

function ReferralCard({
  lecturerId,
  referredLeads,
  referredUsers,
}: {
  lecturerId: string;
  referredLeads: number;
  referredUsers: number;
}) {
  const [copied, setCopied] = useState(false);
  const referralUrl =
    typeof window === 'undefined' ? '' : `${window.location.origin}/pricing?ref=${encodeURIComponent(lecturerId)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title="הקישור שלכם"
        hint="מי שנכנס דרך הקישור ונרשם או ממלא מסלול כניסה נספר כאן. בלי לערבב עם מועמדות לנבחרת 88."
      />
      <OpsToolbar>
        <input readOnly value={referralUrl} className={`${fieldClass} flex-1`} dir="ltr" aria-label="קישור הפניה" />
        <button
          type="button"
          onClick={() => void copy()}
          className={`${opsPrimaryBtn} shrink-0`}
        >
          {copied ? 'הועתק' : 'העתקת קישור'}
        </button>
      </OpsToolbar>
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-white/10 rounded-2xl p-4">
          <div className="text-xs text-white/40 mb-1">לידים שהגיעו דרככם</div>
          <div className="text-2xl font-light">{referredLeads}</div>
        </div>
        <div className="border border-white/10 rounded-2xl p-4">
          <div className="text-xs text-white/40 mb-1">משתמשים שנרשמו דרככם</div>
          <div className="text-2xl font-light">{referredUsers}</div>
        </div>
      </div>
    </OpsDeskStack>
  );
}

function ApplicationPanel({
  userName,
  userEmail,
  onBack,
}: {
  userName: string;
  userEmail: string;
  onBack: () => void;
}) {
  const { refreshUser } = useUser();
  const [application, setApplication] = useState<LecturerApplication | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [terms, setTerms] = useState(false);
  const [form, setForm] = useState({
    fullName: userName,
    phone: '',
    email: userEmail,
    field: '',
    links: '',
    proposedLecture: '',
    audience: '',
    valueToUser: '',
    experience: '',
    sampleVideo: '',
  });

  useEffect(() => {
    trackEvent('lecturer_application_started');
    lecturerApi
      .application()
      .then((res) => {
        setApplication(res.application);
        if (res.application) {
          setForm({
            fullName: res.application.fullName,
            phone: res.application.phone,
            email: res.application.email,
            field: res.application.field,
            links: res.application.links,
            proposedLecture: res.application.proposedLecture,
            audience: res.application.audience,
            valueToUser: res.application.valueToUser,
            experience: res.application.experience,
            sampleVideo: res.application.sampleVideo,
          });
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));
  }, []);

  const locked = application?.status === 'pending' || application?.status === 'approved';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!terms) {
      setError('נא לאשר את התנאים');
      return;
    }
    setPending(true);
    setError('');
    try {
      const res = await lecturerApi.submitApplication(form);
      setApplication(res.application);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שליחה נכשלה');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-28 pb-24 px-4 sm:px-8 max-w-3xl mx-auto text-right">
      <button type="button" onClick={onBack} className="text-sm text-white/45 hover:text-white mb-8 min-h-11 cursor-pointer">
        חזרה לפרופיל
      </button>
      <OpsPageHeader
        title="בקשה להיות מרצה"
        hint="הבקשה עוברת לאישור אדמין. אחרי אישור נפתח דשבורד להעלאת תוכן לבדיקה."
      />

      {application?.status === 'pending' && (
        <p className="text-sm text-[#C8A24C] mb-6">הבקשה ממתינה לאישור.</p>
      )}
      {application?.status === 'approved' && (
        <div className="mb-6">
          <p className="text-sm text-emerald-400 mb-3">אושרתם כמרצים.</p>
          <button
            type="button"
            onClick={() => void refreshUser()}
            className="px-4 py-2.5 rounded-full bg-[#C8A24C] text-black text-sm min-h-11 cursor-pointer"
          >
            כניסה לדשבורד
          </button>
        </div>
      )}
      {application?.status === 'rejected' && (
        <p className="text-sm text-rose-300 mb-6">
          הבקשה נדחתה{application.adminNote ? `. ${application.adminNote}` : '.'} אפשר לשלוח שוב.
        </p>
      )}
      {application?.status === 'more_info' && (
        <p className="text-sm text-[#C8A24C] mb-6">
          נדרשים פרטים נוספים{application.adminNote ? `. ${application.adminNote}` : '.'}
        </p>
      )}

      <form onSubmit={(e) => void submit(e)} className="grid gap-8">
        <OpsSection title="פרטים">
          <OpsField label="שם מלא">
            <input required disabled={locked} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={fieldClass} />
          </OpsField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <OpsField label="טלפון">
              <input required disabled={locked} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fieldClass} />
            </OpsField>
            <OpsField label="אימייל">
              <input required type="email" disabled={locked} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={fieldClass} />
            </OpsField>
          </div>
          <OpsField label="תחום">
            <input required disabled={locked} value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} className={fieldClass} />
          </OpsField>
          <OpsField label="קישורים">
            <input disabled={locked} value={form.links} onChange={(e) => setForm({ ...form, links: e.target.value })} className={fieldClass} />
          </OpsField>
        </OpsSection>
        <OpsSection title="הרצאה">
          <OpsField label="הרצאה מוצעת">
            <textarea required disabled={locked} rows={3} value={form.proposedLecture} onChange={(e) => setForm({ ...form, proposedLecture: e.target.value })} className={fieldClass} />
          </OpsField>
          <OpsField label="למי מיועדת">
            <input disabled={locked} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className={fieldClass} />
          </OpsField>
          <OpsField label="ערך למשתמש">
            <textarea disabled={locked} rows={3} value={form.valueToUser} onChange={(e) => setForm({ ...form, valueToUser: e.target.value })} className={fieldClass} />
          </OpsField>
        </OpsSection>
        <OpsSection title="ניסיון">
          <OpsField label="ניסיון">
            <textarea disabled={locked} rows={3} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className={fieldClass} />
          </OpsField>
          <FileUploadField
            kind="video"
            label="וידאו דוגמה (אופציונלי)"
            value={form.sampleVideo}
            disabled={locked}
            onChange={(sampleVideo) => setForm({ ...form, sampleVideo })}
          />
          <label className="flex items-center gap-3 text-base text-white/70 min-h-11">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} disabled={locked} />
            מאשר/ת את תנאי המרצים
          </label>
        </OpsSection>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        {!locked && (
          <button type="submit" disabled={pending} className={`${opsPrimaryBtn} w-full sm:w-auto disabled:opacity-60`}>
            {pending ? 'שולח...' : 'שליחת בקשה'}
          </button>
        )}
      </form>
    </div>
  );
}

function LecturerDashboard({
  categories,
  onBack,
}: {
  categories: { id: string; name: string }[];
  onBack: () => void;
}) {
  const { user } = useApp();
  type Tab =
    | 'overview'
    | 'videos'
    | 'courses'
    | 'upload'
    | 'analytics'
    | 'resources'
    | 'profile'
    | 'referral'
    | 'messages'
    | 'settings'
    | 'founder'
    | 'founder88'
    | 'team';

  const [tab, setTab] = useState<Tab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [videoFilter, setVideoFilter] = useState<'all' | 'draft' | 'pending_review' | 'published'>('all');
  const [stats, setStats] = useState<LecturerOverview | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [editing, setEditing] = useState<Course | 'new' | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    const [overview, list] = await Promise.all([lecturerApi.overview(), lecturerApi.courses()]);
    setStats(overview);
    setCourses(list.courses);
  };

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));
  }, []);

  const goTab = (id: Tab) => {
    setTab(id);
    setMobileNavOpen(false);
    if (id === 'upload') setEditing('new');
    else setEditing(null);
  };

  const primaryNav: Array<{ id: Tab; label: string; badge?: number }> = [
    { id: 'overview', label: 'היום' },
    { id: 'videos', label: 'ההרצאות שלי', badge: stats?.pending },
    { id: 'upload', label: 'הוספת הרצאה' },
    { id: 'profile', label: 'הפרופיל שלי' },
    { id: 'referral', label: 'הקישור שלי' },
  ];

  const moreNav: Array<{ id: Tab; label: string; founderOnly?: boolean }> = [
    { id: 'courses', label: 'קורסים / סדרות' },
    { id: 'analytics', label: 'אנליטיקות' },
    { id: 'resources', label: 'קבצים נלווים' },
    { id: 'messages', label: 'הודעות מהצוות' },
    { id: 'settings', label: 'הגדרות חשבון' },
    ...(stats?.isFounder
      ? [
          { id: 'founder' as const, label: 'פרופיל מייסד', founderOnly: true },
          { id: 'team' as const, label: 'ניהול צוות מייסדים', founderOnly: true },
          { id: 'founder88' as const, label: 'הרצאות בנבחרת 88', founderOnly: true },
        ]
      : []),
  ];

  const moreActive = moreNav.some((item) => item.id === tab);

  const navButton = (item: { id: Tab; label: string; badge?: number }) => {
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
        {item.badge && item.badge > 0 ? (
          <span className="text-sm text-[#C8A24C] border border-[#C8A24C]/40 rounded-full px-2 py-0.5">
            {item.badge}
          </span>
        ) : null}
      </button>
    );
  };

  const renderSideNav = () => (
    <nav className="flex-1 p-3 grid gap-1 content-start">
      {primaryNav.map(navButton)}
      <div className="pt-2 mt-1 border-t border-white/10">
        <button
          type="button"
          aria-expanded={moreOpen || moreActive}
          onClick={() => setMoreOpen((open) => !open)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-white/55 min-h-11 hover:text-white"
        >
          <span>עוד</span>
          <span aria-hidden>{moreOpen || moreActive ? '▾' : '◂'}</span>
        </button>
        {moreOpen || moreActive ? <div className="grid gap-1">{moreNav.map(navButton)}</div> : null}
      </div>
    </nav>
  );

  const filteredCourses = (status?: string) =>
    status ? courses.filter((course) => course.status === status) : courses;

  return (
    <div className="min-h-screen bg-[#050505] text-white text-right" dir="rtl">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-s border-white/10 bg-[#080808] sticky top-0 h-screen overflow-y-auto">
          <div className="p-5 border-b border-white/10">
            <h1 className="text-xl font-light">דשבורד מרצה</h1>
            <p className="text-sm text-white/50 mt-2 font-light truncate">{user.name}</p>
            {stats?.isFounder ? (
              <p className="text-[11px] text-[#C8A24C] mt-1">מרצה ומייסד</p>
            ) : (
              <p className="text-[11px] text-white/35 mt-1">מרצה</p>
            )}
          </div>
          {renderSideNav()}
          <div className="p-4 border-t border-white/10 grid gap-2">
            <div className="border border-[#C8A24C]/30 rounded-2xl p-4 text-center">
              <p className="text-base text-white/60 mb-3">צריכים עזרה?</p>
              <a
                href="mailto:support@infinitemasterpiece.local"
                className="inline-flex px-4 py-2 rounded-full bg-[#C8A24C] text-black text-xs min-h-10 items-center justify-center"
              >
                צור פניה
              </a>
            </div>
            <button
              type="button"
              onClick={onBack}
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
              >
                מסכים
              </button>
              <div className="min-w-0">
                <p className="text-sm text-white/50 truncate">Infinite Masterpiece</p>
                <p className="text-sm text-white/70 font-light truncate">שלום, {user.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="lg:hidden px-3 py-2 rounded-full border border-white/15 text-sm min-h-11"
            >
              ספרייה
            </button>
          </header>

          {mobileNavOpen ? (
            <div className="lg:hidden border-b border-white/10 bg-[#080808]">{renderSideNav()}</div>
          ) : null}

          <main className="px-4 sm:px-6 lg:px-8 py-8 pb-24 max-w-7xl">
            {error ? <p className="text-sm text-rose-300 mb-4">{error}</p> : null}

            {tab === 'overview' && stats ? (
              <OverviewHome
                stats={stats}
                onUpload={() => goTab('upload')}
                onVideos={() => goTab('videos')}
                onReferral={() => goTab('referral')}
              />
            ) : null}

            {tab === 'videos' && !editing ? (
              <VideosPanel
                title="ההרצאות שלי"
                courses={videoFilter === 'all' ? courses : filteredCourses(videoFilter)}
                categories={categories}
                filter={videoFilter}
                onFilter={setVideoFilter}
                counts={{
                  all: courses.length,
                  draft: courses.filter((c) => c.status === 'draft').length,
                  pending_review: courses.filter((c) => c.status === 'pending_review').length,
                  published: courses.filter((c) => c.status === 'published').length,
                }}
                onEdit={(course) => {
                  setEditing(course);
                  setTab('upload');
                }}
                onSubmit={(id) =>
                  lecturerApi
                    .submitCourse(id)
                    .then(() => load())
                    .catch((err) => setError(err instanceof Error ? err.message : 'שליחה נכשלה'))
                }
                onUpload={() => goTab('upload')}
              />
            ) : null}

            {tab === 'referral' && stats?.lecturerId ? (
              <ReferralCard
                lecturerId={stats.lecturerId}
                referredLeads={stats.referredLeads}
                referredUsers={stats.referredUsers}
              />
            ) : null}
            {tab === 'referral' && !stats?.lecturerId ? (
              <p className="text-base text-white/55">הקישור ייפתח אחרי שהפרופיל יאושר במערכת.</p>
            ) : null}

            {(tab === 'upload' || editing) && (
              <LecturerCourseForm
                course={editing === 'new' || !editing ? null : editing}
                categories={categories}
                onCancel={() => {
                  setEditing(null);
                  setTab('videos');
                }}
                onSaved={() => {
                  setEditing(null);
                  setTab('videos');
                  void load();
                }}
              />
            )}

            {tab === 'analytics' && stats ? <AnalyticsPanel stats={stats} /> : null}
            {tab === 'resources' ? <ResourcesPanel courses={courses} /> : null}
            {tab === 'profile' || tab === 'founder' ? <ProfileEditorPanel isFounderTab={tab === 'founder'} /> : null}
            {tab === 'settings' ? <SettingsPanel onLibrary={onBack} /> : null}
            {tab === 'courses' ? (
              <CoursesSeriesPanel courses={courses} categories={categories} onEdit={(course) => {
                setEditing(course);
                setTab('upload');
              }} />
            ) : null}
            {tab === 'founder88' && stats?.isFounder ? (
              <Founder88Panel courses={courses.filter((c) => c.status === 'published')} />
            ) : null}
            {tab === 'messages' ? <MessagesPanel /> : null}
            {tab === 'team' && stats?.isFounder ? <TeamPanel /> : null}
          </main>
        </div>
      </div>
    </div>
  );
}

function questionStatusHe(status: LecturerQuestion['status']) {
  if (status === 'open') return 'פתוח';
  if (status === 'escalated') return 'הועבר לצוות';
  return 'נענה';
}

function QuestionsPanel() {
  const [questions, setQuestions] = useState<LecturerQuestion[]>([]);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = () =>
    lecturerApi
      .questions()
      .then((res) => setQuestions(res.questions))
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  const selected = questions.find((row) => row.id === selectedId) || null;

  const reply = async (id: string, status: 'answered' | 'escalated') => {
    setPendingId(id);
    setError('');
    try {
      await lecturerApi.answerQuestion(id, { answer: answers[id] || '', status });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירה נכשלה');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title="שאלות ותגובות"
        hint="רק שאלות על ההרצאות שלכם. בלי נתוני משתמשים רגישים מעבר לשם."
      />
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedId(null)}
        emptyDetail="בחרו שאלה מהרשימה."
        list={
          questions.length === 0 ? (
            <OpsEmptyList>אין שאלות עדיין. משתמשים יכולים לשאול מעמוד ההרצאה.</OpsEmptyList>
          ) : (
            <ul className="divide-y divide-white/10">
              {questions.map((row) => (
                <li key={row.id}>
                  <OpsListRow
                    active={selectedId === row.id}
                    onClick={() => setSelectedId(row.id)}
                    title={row.courseTitle || 'הרצאה'}
                    status={questionStatusHe(row.status)}
                    statusClass={
                      row.status === 'open'
                        ? 'text-[#C8A24C]'
                        : row.status === 'escalated'
                          ? 'text-white/45'
                          : 'text-emerald-300'
                    }
                  />
                </li>
              ))}
            </ul>
          )
        }
        detail={
          selected ? (
            <div className="grid gap-3">
              <OpsCardTitle>{selected.courseTitle || 'הרצאה'}</OpsCardTitle>
              <OpsFacts>
              <OpsFact label="סטטוס">{questionStatusHe(selected.status)}</OpsFact>
              </OpsFacts>
              <p className="text-sm text-white/70 leading-relaxed">{selected.question}</p>
              <p className="text-xs text-white/35">
                {selected.userName} · {selected.createdAt.replace('T', ' ').slice(0, 16)}
              </p>
              {selected.answer ? (
                <p className="text-sm text-[#C8A24C]/90">תשובה: {selected.answer}</p>
              ) : null}
              {selected.status === 'open' ? (
                <div className="grid gap-2">
                  <textarea
                    rows={3}
                    value={answers[selected.id] || ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [selected.id]: e.target.value }))}
                    className={fieldClass}
                    placeholder="תשובה לצופה"
                  />
                  <OpsCardActions>
                    <button
                      type="button"
                      disabled={pendingId === selected.id}
                      onClick={() => void reply(selected.id, 'answered')}
                      className={opsCardPrimary}
                    >
                      שליחת תשובה
                    </button>
                    <button
                      type="button"
                      disabled={pendingId === selected.id}
                      onClick={() => void reply(selected.id, 'escalated')}
                      className={opsCardGhost}
                    >
                      העברה לצוות
                    </button>
                  </OpsCardActions>
                </div>
              ) : null}
            </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

function MessagesPanel() {
  const [messages, setMessages] = useState<LecturerTeamMessage[]>([]);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = () =>
    lecturerApi
      .messages()
      .then((res) => setMessages(res.messages))
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  const selected = messages.find((row) => row.id === selectedId) || null;

  const open = async (id: string) => {
    setSelectedId(id);
    const row = messages.find((item) => item.id === id);
    if (row && !row.readAt) {
      try {
        await lecturerApi.markMessageRead(id);
        await load();
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <OpsDeskStack>
      <OpsPageHeader title="הודעות מהצוות" />
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedId(null)}
        emptyDetail="בחרו הודעה מהרשימה."
        list={
          messages.length === 0 ? (
            <OpsEmptyList>אין הודעות מהצוות.</OpsEmptyList>
          ) : (
            <ul className="divide-y divide-white/10">
              {messages.map((row) => (
                <li key={row.id}>
                  <OpsListRow
                    active={selectedId === row.id}
                    onClick={() => void open(row.id)}
                    title={row.subject}
                    meta={`${row.fromAdminName} · ${row.createdAt.replace('T', ' ').slice(0, 16)}`}
                    status={!row.readAt ? 'חדש' : undefined}
                  />
                </li>
              ))}
            </ul>
          )
        }
        detail={
          selected ? (
            <div className="grid gap-3">
              <OpsCardTitle sub={`מאת ${selected.fromAdminName} · ${selected.createdAt.replace('T', ' ').slice(0, 16)}`}>
                {selected.subject}
              </OpsCardTitle>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{selected.body}</p>
            </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

function CoursesSeriesPanel({
  courses,
  categories,
  onEdit,
}: {
  courses: Course[];
  categories: { id: string; name: string }[];
  onEdit: (course: Course) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const groups = categories
    .map((cat) => ({
      ...cat,
      items: courses.filter((course) => course.categoryId === cat.id),
    }))
    .filter((group) => group.items.length > 0);
  const uncategorized = courses.filter((course) => !categories.some((cat) => cat.id === course.categoryId));
  const grouped = [
    ...groups,
    ...(uncategorized.length ? [{ id: 'none', name: 'ללא קטגוריה', items: uncategorized }] : []),
  ];
  const selected = courses.find((course) => course.id === selectedId) || null;
  const canEdit = selected && selected.status !== 'published' && selected.status !== 'blocked';

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title="קורסים / סדרות"
        hint="קיבוץ ההרצאות לפי קטגוריה. יצירת סדרה נפרדת תגיע בהמשך; כרגע מנהלים דרך ההרצאות והקטגוריה."
      />
      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedId(null)}
        emptyDetail="בחרו הרצאה מהרשימה."
        list={
          grouped.length === 0 ? (
            <OpsEmptyList>עדיין אין תכנים לקיבוץ.</OpsEmptyList>
          ) : (
            <div>
              {grouped.map((group) => (
                <section key={group.id}>
                  <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 bg-[#0a0a0a] border-b border-white/10">
                    <h3 className="text-sm font-light">{group.name}</h3>
                    <span className="text-xs text-white/40">{group.items.length} הרצאות</span>
                  </div>
                  <ul className="divide-y divide-white/10">
                    {group.items.map((course) => (
                      <li key={course.id}>
                        <OpsListRow
                          active={selectedId === course.id}
                          onClick={() => setSelectedId(course.id)}
                          title={course.title}
                          meta={`${course.episodes?.length || 0} פרקים`}
                          status={STATUS_LABEL[course.status || 'draft']}
                          statusClass={
                            course.status === 'published'
                              ? 'text-emerald-300'
                              : course.status === 'pending_review'
                                ? 'text-[#C8A24C]'
                                : course.status === 'blocked'
                                  ? 'text-rose-300'
                                  : 'text-white/45'
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )
        }
        detail={
          selected ? (
            <div className="grid gap-3">
              <OpsCardTitle>{selected.title}</OpsCardTitle>
              <OpsFacts>
              <OpsFact label="סטטוס">{STATUS_LABEL[selected.status || 'draft']}</OpsFact>
              <OpsFact label="פרקים">{selected.episodes?.length || 0}</OpsFact>
              </OpsFacts>
              {canEdit ? (
                <OpsCardActions>
                  <button type="button" onClick={() => onEdit(selected)} className={opsCardGhost}>
                    עריכה
                  </button>
                </OpsCardActions>
              ) : null}
            </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

function Founder88Panel({ courses }: { courses: Course[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = courses.find((course) => course.id === selectedId) || null;

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title="הרצאות בנבחרת 88"
        hint="הרצאות שפורסמו תחת הפרופיל שלכם. הצגה בעמוד הציבורי נקבעת גם על ידי האדמין."
      />
      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedId(null)}
        emptyDetail="בחרו הרצאה מהרשימה."
        list={
          courses.length === 0 ? (
            <OpsEmptyList>אין עדיין הרצאות מפורסמות להצגה.</OpsEmptyList>
          ) : (
            <ul className="divide-y divide-white/10">
              {courses.map((course) => (
                <li key={course.id}>
                  <OpsListRow
                    active={selectedId === course.id}
                    onClick={() => setSelectedId(course.id)}
                    title={course.title}
                    status="פורסם"
                    statusClass="text-emerald-300"
                  />
                </li>
              ))}
            </ul>
          )
        }
        detail={
          selected ? (
            <div className="grid gap-3">
              <OpsCardTitle>{selected.title}</OpsCardTitle>
              <OpsFacts>
              <OpsFact label="גישה">{accessLabelHe(selected.accessLevel)}</OpsFact>
              <OpsFact label="סטטוס">פורסם</OpsFact>
              </OpsFacts>
            </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

function OverviewHome({
  stats,
  onUpload,
  onVideos,
  onReferral,
}: {
  stats: LecturerOverview;
  onUpload: () => void;
  onVideos: () => void;
  onReferral: () => void;
}) {
  const maxDay = Math.max(1, ...stats.viewsByDay.map((d) => d.views));
  const kpis = [
    { label: 'סך הרצאות', value: stats.courses },
    { label: 'פורסמו', value: stats.published },
    { label: 'ממתינות לאישור', value: stats.pending },
    { label: 'סך צפיות', value: stats.views },
  ];

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title="מה לעשות היום"
        hint="מעלים הרצאה, שולחים לאישור, ועוקבים אחרי מה שכבר באוויר. פרסום ישיר נשאר בידי האדמין."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onUpload}
              className="px-5 py-2.5 rounded-full bg-[#C8A24C] text-black text-sm min-h-11"
            >
              הוספת הרצאה
            </button>
            <button
              type="button"
              onClick={onVideos}
              className="px-5 py-2.5 rounded-full border border-white/15 text-sm min-h-11"
            >
              ההרצאות שלי
            </button>
            <button
              type="button"
              onClick={onReferral}
              className="px-5 py-2.5 rounded-full border border-white/15 text-sm min-h-11"
            >
              הקישור שלי
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((card) => (
          <div key={card.label} className="border border-white/10 rounded-2xl p-4 bg-[#0A0A0A]">
            <div className="text-sm text-white/55 mb-2">{card.label}</div>
            <div className="text-2xl font-light tabular-nums">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-light mb-4">צפיות ב־14 הימים האחרונים</h3>
          {stats.viewsByDay.length === 0 ? (
            <p className="text-sm text-white/40">עדיין אין צפיות למדידה.</p>
          ) : (
            <div className="flex items-end gap-1.5 h-40">
              {stats.viewsByDay.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div
                    className="w-full rounded-t bg-[#C8A24C]/80"
                    style={{ height: `${Math.max(6, (day.views / maxDay) * 100)}%` }}
                    title={`${day.date}: ${day.views}`}
                  />
                  <span className="text-[9px] text-white/30 truncate w-full text-center">
                    {day.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-light mb-4">תוכן מוביל</h3>
          {stats.topContent.length === 0 ? (
            <p className="text-sm text-white/40">העלו הרצאה כדי לראות דירוג.</p>
          ) : (
            <ul className="grid gap-3">
              {stats.topContent.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{item.title}</span>
                  <span className="text-white/45 shrink-0">{item.views} צפיות</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-light mb-4">סטטוס תכנים אחרונים</h3>
        <div className="grid gap-2">
          {stats.recentStatuses.length === 0 ? (
            <p className="text-sm text-white/40">אין תכנים עדיין.</p>
          ) : (
            stats.recentStatuses.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                <span className="text-sm truncate">{row.title}</span>
                <span
                  className={`text-xs shrink-0 ${
                    row.status === 'published'
                      ? 'text-emerald-300'
                      : row.status === 'pending_review'
                        ? 'text-[#C8A24C]'
                        : 'text-white/40'
                  }`}
                >
                  {STATUS_LABEL[row.status] || row.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border border-[#C8A24C]/25 rounded-2xl p-5 bg-[#C8A24C]/5">
        <h3 className="text-lg font-light mb-2">טיפ להצלחה</h3>
        <p className="text-base text-white/70 font-light leading-relaxed">
          הרצאות קצרות וממוקדות נצפות עד הסוף יותר. זה מה שמביא שמירות ושדרוגים מהתוכן שלכם.
        </p>
      </div>
    </OpsDeskStack>
  );
}

function VideosPanel({
  title,
  courses,
  categories,
  filter,
  onFilter,
  counts,
  onEdit,
  onSubmit,
  onUpload,
}: {
  title: string;
  courses: Course[];
  categories: { id: string; name: string }[];
  filter: 'all' | 'draft' | 'pending_review' | 'published';
  onFilter: (next: 'all' | 'draft' | 'pending_review' | 'published') => void;
  counts: { all: number; draft: number; pending_review: number; published: number };
  onEdit: (course: Course) => void;
  onSubmit: (id: string) => void;
  onUpload: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const categoryName = (id?: string) => categories.find((c) => c.id === id)?.name || '—';
  const chips = [
    { id: 'all' as const, label: 'הכל', count: counts.all },
    { id: 'draft' as const, label: 'טיוטה', count: counts.draft },
    { id: 'pending_review' as const, label: 'בבדיקה', count: counts.pending_review },
    { id: 'published' as const, label: 'פורסם', count: counts.published },
  ];
  const selected = courses.find((course) => course.id === selectedId) || null;

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title={title}
        action={
          <button
            type="button"
            onClick={onUpload}
            className="px-5 py-2.5 rounded-full bg-[#C8A24C] text-black text-sm min-h-11"
          >
            הוספת הרצאה
          </button>
        }
      />
      <OpsToolbar>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onFilter(chip.id)}
              className={opsChipClass(filter === chip.id)}
            >
              {chip.label} ({chip.count})
            </button>
          ))}
        </div>
      </OpsToolbar>
      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedId(null)}
        emptyDetail="בחרו הרצאה מהרשימה."
        list={
          courses.length === 0 ? (
            <OpsEmptyList>אין פריטים להצגה. העלו הרצאה ראשונה.</OpsEmptyList>
          ) : (
            <ul className="divide-y divide-white/10">
              {courses.map((course) => (
                <li key={course.id}>
                  <OpsListRow
                    active={selectedId === course.id}
                    onClick={() => setSelectedId(course.id)}
                    title={course.title}
                    status={STATUS_LABEL[course.status || 'draft']}
                    statusClass={
                      course.status === 'published'
                        ? 'text-emerald-300'
                        : course.status === 'pending_review'
                          ? 'text-[#C8A24C]'
                          : course.status === 'blocked'
                            ? 'text-rose-300'
                            : 'text-white/45'
                    }
                  />
                </li>
              ))}
            </ul>
          )
        }
        detail={
          selected ? (
            <div className="grid gap-3">
              <OpsCardTitle>{selected.title}</OpsCardTitle>
              <OpsFacts>
              <OpsFact label="קטגוריה">{categoryName(selected.categoryId)}</OpsFact>
              <OpsFact label="גישה">{accessLabelHe(selected.accessLevel)}</OpsFact>
              <OpsFact label="סטטוס">{STATUS_LABEL[selected.status || 'draft']}</OpsFact>
              </OpsFacts>
              <OpsCardActions>
                {selected.status !== 'published' && selected.status !== 'blocked' ? (
                  <button type="button" onClick={() => onEdit(selected)} className={opsCardGhost}>
                    עריכה
                  </button>
                ) : null}
                {selected.status === 'draft' ? (
                  <button type="button" onClick={() => onSubmit(selected.id)} className={opsCardPrimary}>
                    שליחה לאישור
                  </button>
                ) : null}
              </OpsCardActions>
            </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

function AnalyticsPanel({ stats }: { stats: LecturerOverview }) {
  const maxTop = Math.max(1, ...stats.topContent.map((item) => item.views));
  return (
    <OpsDeskStack>
      <OpsPageHeader
        title="ביצועי התכנים"
        hint="נתונים מצרפיים בלבד על התוכן שלכם. בלי פרטי משתמשים."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'צפיות', value: stats.views },
          { label: 'צופים ייחודיים', value: stats.uniqueViewers },
          { label: 'השלמת צפייה', value: `${stats.completionRate}%` },
          { label: 'זמן ממוצע', value: `${stats.avgWatchMinutes} דק׳` },
          { label: 'שמירות', value: stats.saves },
          { label: 'ניסיונות לתוכן נעול', value: stats.paywallHits },
          { label: 'שדרוגים', value: stats.upgrades },
          { label: 'שעות צפייה', value: stats.totalWatchHours },
        ].map((card) => (
          <div key={card.label} className="border border-white/10 rounded-2xl p-4">
            <div className="text-base text-white/60 mb-1">{card.label}</div>
            <div className="text-xl font-light">{card.value}</div>
          </div>
        ))}
      </div>
      <div className="border border-white/10 rounded-2xl p-5">
        <h3 className="text-lg font-light mb-4">השלמת צפייה לפי תוכן מוביל</h3>
        {stats.topContent.length === 0 ? (
          <p className="text-sm text-white/40">אין נתונים עדיין.</p>
        ) : (
          <ul className="grid gap-3">
            {stats.topContent.map((item) => {
              const rate = item.views ? Math.round((item.completions / item.views) * 100) : 0;
              return (
                <li key={item.id}>
                  <div className="flex justify-between text-sm mb-1 gap-3">
                    <span className="truncate">{item.title}</span>
                    <span className="text-white/45 shrink-0">{rate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-[#C8A24C]"
                      style={{ width: `${Math.max(4, (item.views / maxTop) * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </OpsDeskStack>
  );
}

function ResourcesPanel({ courses }: { courses: Course[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rows = courses.filter((course) => course.resources);
  const selected = rows.find((course) => course.id === selectedId) || null;

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title="קבצים נלווים"
        hint="קבצים שצורפו להרצאות שלכם. העלאה חדשה דרך עריכת הרצאה."
      />
      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedId(null)}
        emptyDetail="בחרו שורה מהרשימה."
        list={
          rows.length === 0 ? (
            <OpsEmptyList>עדיין אין קבצים נלווים.</OpsEmptyList>
          ) : (
            <ul className="divide-y divide-white/10">
              {rows.map((course) => (
                <li key={course.id}>
                  <OpsListRow
                    active={selectedId === course.id}
                    onClick={() => setSelectedId(course.id)}
                    title={course.title}
                    status={STATUS_LABEL[course.status || 'draft']}
                    statusClass={
                      course.status === 'published'
                        ? 'text-emerald-300'
                        : course.status === 'pending_review'
                          ? 'text-[#C8A24C]'
                          : course.status === 'blocked'
                            ? 'text-rose-300'
                            : 'text-white/45'
                    }
                  />
                </li>
              ))}
            </ul>
          )
        }
        detail={
          selected ? (
            <div className="grid gap-3">
              <OpsCardTitle>{selected.title}</OpsCardTitle>
              <OpsFacts>
              <OpsFact label="קובץ / קישור">
                <a
                  href={selected.resources}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all underline decoration-white/20 hover:decoration-[#C8A24C]"
                  dir="ltr"
                >
                  {selected.resources}
                </a>
              </OpsFact>
              <OpsFact label="סטטוס">{STATUS_LABEL[selected.status || 'draft']}</OpsFact>
              </OpsFacts>
            </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

function ProfileEditorPanel({ isFounderTab }: { isFounderTab: boolean }) {
  const { reloadCatalog } = useApp();
  const [profile, setProfile] = useState<LecturerProfile | null>(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [expertise, setExpertise] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    lecturerApi
      .profile()
      .then((res) => {
        setProfile(res.profile);
        setName(res.profile.name);
        setTitle(res.profile.title);
        setBio(res.profile.bio);
        setAvatarUrl(res.profile.avatarUrl);
        setExpertise(res.profile.expertise.join(', '));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));
  }, []);

  const save = async () => {
    setPending(true);
    setError('');
    setMessage('');
    try {
      const res = await lecturerApi.updateProfile({
        name,
        title,
        bio,
        avatarUrl,
        expertise: expertise
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setProfile(res.profile);
      setMessage('הפרופיל נשמר');
      await reloadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירה נכשלה');
    } finally {
      setPending(false);
    }
  };

  if (error && !profile) return <p className="text-sm text-rose-300">{error}</p>;
  if (!profile) return <p className="text-sm text-white/40">טוען פרופיל...</p>;

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title={isFounderTab ? 'פרופיל מייסד' : 'הפרופיל שלי'}
        hint={
          profile.isFounder
            ? 'הפרופיל מוצג גם בהקשר נבחרת 88 לפי הגדרת האדמין.'
            : 'הפרופיל הציבורי שלכם בספרייה.'
        }
      />
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <OpsField label="שם">
          <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
        </OpsField>
        <OpsField label="תפקיד">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
        </OpsField>
      </div>
      <OpsField label="ביוגרפיה">
        <textarea rows={5} value={bio} onChange={(e) => setBio(e.target.value)} className={fieldClass} />
      </OpsField>
      <OpsField label="תחומי מומחיות (מופרדים בפסיק)">
        <input value={expertise} onChange={(e) => setExpertise(e.target.value)} className={fieldClass} />
      </OpsField>
      <FileUploadField kind="image" label="תמונה" value={avatarUrl} onChange={setAvatarUrl} />
      <button
        type="button"
        disabled={pending}
        onClick={() => void save()}
        className={`${opsPrimaryBtn} w-fit`}
      >
        {pending ? 'שומר...' : 'שמירה'}
      </button>
    </OpsDeskStack>
  );
}

function SettingsPanel({ onLibrary }: { onLibrary: () => void }) {
  const { setView } = useApp();
  return (
    <OpsDeskStack>
      <OpsPageHeader title="הגדרות חשבון" hint="מעבר לפרופיל הכללי או חזרה לספרייה." />
      <div className="border border-white/10 rounded-2xl p-5 grid gap-3">
        <button
          type="button"
          onClick={() => setView('profile')}
          className="text-right px-4 py-3 rounded-xl border border-white/15 text-sm min-h-11 hover:border-white/40"
        >
          פרופיל משתמש כללי
        </button>
        <button
          type="button"
          onClick={onLibrary}
          className="text-right px-4 py-3 rounded-xl border border-white/15 text-sm min-h-11 hover:border-white/40"
        >
          חזרה לספרייה
        </button>
      </div>
    </OpsDeskStack>
  );
}

function TeamPanel() {
  const { reloadCatalog } = useApp();
  const [members, setMembers] = useState<Instructor[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('יזם');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    lecturerApi
      .team()
      .then((res) => setMembers(res.members))
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setPending(true);
    setError('');
    try {
      await lecturerApi.addTeamMember({ name, title, bio, avatarUrl });
      setName('');
      setTitle('יזם');
      setBio('');
      setAvatarUrl('');
      await reloadCatalog();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירה נכשלה');
    } finally {
      setPending(false);
    }
  };

  const selected = members.find((member) => member.id === selectedId) || null;

  return (
    <OpsDeskStack>
      <OpsPageHeader
        title="צוות מייסדים"
        hint="נכנסים מחשבון גל. לכל יזם: שם, תפקיד ותמונה. בלי להמציא אנשים."
      />
      <OpsBand title="הוספת יזם">
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
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
          <FileUploadField kind="image" label="תמונה" value={avatarUrl} onChange={setAvatarUrl} />
          {error ? <p className="text-sm text-rose-300 sm:col-span-2">{error}</p> : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => void save()}
            className={`${opsPrimaryBtn} w-full sm:w-auto`}
          >
            {pending ? 'שומר...' : 'הוספה לצוות'}
          </button>
        </div>
      </OpsBand>
      <OpsMasterDetail
        hasSelection={Boolean(selected)}
        onCloseDetail={() => setSelectedId(null)}
        emptyDetail="בחרו איש צוות מהרשימה."
        list={
          members.length === 0 ? (
            <OpsEmptyList>אין חברי צוות עדיין.</OpsEmptyList>
          ) : (
            <ul className="divide-y divide-white/10">
              {members.map((member) => (
                <li key={member.id}>
                  <OpsListRow
                    active={selectedId === member.id}
                    onClick={() => setSelectedId(member.id)}
                    title={member.name}
                    meta={member.title}
                  />
                </li>
              ))}
            </ul>
          )
        }
        detail={
          selected ? (
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                {selected.avatarUrl ? (
                  <img
                    src={selected.avatarUrl}
                    alt={selected.name ? `תמונת פרופיל: ${selected.name}` : 'תמונת חבר צוות'}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10" />
                )}
                <div className="min-w-0">
                  <OpsCardTitle sub={selected.title}>{selected.name}</OpsCardTitle>
                </div>
              </div>
              {selected.bio ? <p className="text-sm text-white/70 leading-relaxed">{selected.bio}</p> : null}
            </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
}

function LecturerCourseForm({
  course,
  categories,
  onCancel,
  onSaved,
}: {
  course: Course | null;
  categories: { id: string; name: string }[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(course?.title || '');
  const [subtitle, setSubtitle] = useState(course?.subtitle || '');
  const [description, setDescription] = useState(course?.description || '');
  const [categoryId, setCategoryId] = useState(course?.categoryId || categories[0]?.id || '');
  const [coverImage, setCoverImage] = useState(course?.coverImage || '');
  const [resources, setResources] = useState(course?.resources || '');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(course?.accessLevel || 'premium');
  const [videoUrl, setVideoUrl] = useState(course?.episodes[0]?.videoUrl || '');
  const [captionVttUrl, setCaptionVttUrl] = useState(vttUrlFromCaptionTracks(course?.episodes[0]?.captionTracks));
  const [episodeTitle, setEpisodeTitle] = useState(course?.episodes[0]?.title || 'פרק 1');
  const [durationMin, setDurationMin] = useState(String(Math.round((course?.episodes[0]?.duration || 600) / 60)));
  const [freeSample, setFreeSample] = useState(course?.episodes[0]?.accessLevel === 'free' || !course);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [submitAfter, setSubmitAfter] = useState(true);
  const [step, setStep] = useState(0);
  const steps = ['שם', 'סרטון', 'תמונה', 'שליחה לאישור'];

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('נא למלא שם הרצאה');
      setStep(0);
      return;
    }
    setPending(true);
    setError('');
    const payload: CoursePayload = {
      title,
      subtitle,
      description,
      categoryId,
      coverImage,
      accessLevel,
      resources,
      episodes: [
        {
          id: course?.episodes[0]?.id,
          title: episodeTitle || title,
          videoUrl,
          duration: Math.max(60, Number(durationMin) * 60 || 600),
          accessLevel: freeSample ? 'free' : accessLevel,
          captionTracks: captionTracksFromVttUrl(captionVttUrl, course?.episodes[0]?.id),
        },
      ],
    };
    try {
      const saved = course
        ? await lecturerApi.updateCourse(course.id, payload)
        : await lecturerApi.createCourse(payload);
      if (submitAfter && saved.course) {
        await lecturerApi.submitCourse(saved.course.id);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירה נכשלה');
    } finally {
      setPending(false);
    }
  };

  const canNext =
    (step === 0 && title.trim().length > 0) ||
    (step === 1 && Boolean(videoUrl)) ||
    step === 2 ||
    step === 3;

  return (
    <form onSubmit={(e) => void save(e)} className="grid gap-6 max-w-2xl">
      <button type="button" onClick={onCancel} className="text-sm text-white/55 text-right cursor-pointer min-h-11">
        חזרה להרצאות
      </button>
      <OpsPageHeader
        title={course ? 'עריכת הרצאה' : 'הוספת הרצאה'}
        hint="ארבעה צעדים עד שליחה לאישור."
      />
      <ol className="flex flex-wrap gap-2" aria-label="שלבי העלאה">
          {steps.map((label, index) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(index)}
                className={`px-4 py-2 rounded-full text-sm min-h-11 border ${
                  step === index
                    ? 'bg-[#C8A24C] text-black border-[#C8A24C]'
                    : index < step
                      ? 'border-[#C8A24C]/40 text-[#F7E7B5]'
                      : 'border-white/15 text-white/55'
                }`}
              >
                {index + 1}. {label}
              </button>
            </li>
          ))}
        </ol>

      {step === 0 ? (
        <div className="grid gap-4">
          <OpsField label="שם ההרצאה">
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
          </OpsField>
          <OpsField label="כותרת משנה">
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={fieldClass} />
          </OpsField>
          <OpsField label="תיאור">
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={fieldClass} />
          </OpsField>
          <OpsField label="קטגוריה">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={fieldClass}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </OpsField>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-4">
          <OpsField label="שם הפרק">
            <input value={episodeTitle} onChange={(e) => setEpisodeTitle(e.target.value)} className={fieldClass} />
          </OpsField>
          <OpsField label="משך בדקות">
            <input type="number" min={1} value={durationMin} onChange={(e) => setDurationMin(e.target.value)} className={fieldClass} />
          </OpsField>
          <FileUploadField kind="video" label="קובץ וידאו" value={videoUrl} onChange={setVideoUrl} />
          <FileUploadField kind="caption" label="כתוביות" value={captionVttUrl} onChange={setCaptionVttUrl} />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-4">
          <FileUploadField
            kind="image"
            label="תמונת כיסוי"
            value={coverImage}
            onChange={setCoverImage}
            previewAlt={title ? `תמונת כיסוי: ${title}` : 'תמונת כיסוי'}
          />
          <FileUploadField kind="resource" label="קבצים נלווים (אופציונלי)" value={resources} onChange={setResources} />
          <OpsField label="רמת גישה להרצאה">
            <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as AccessLevel)} className={fieldClass}>
              <option value="free">חינמי</option>
              <option value="premium">פרימיום</option>
              <option value="premium_88">נבחרת 88</option>
            </select>
          </OpsField>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-5">
          <div>
            <p className="text-base text-white mb-3">האם הפרק הראשון פתוח לכולם?</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFreeSample(true)}
                className={`px-5 py-3 rounded-full text-sm min-h-11 border ${
                  freeSample ? 'bg-[#C8A24C] text-black border-[#C8A24C]' : 'border-white/15 text-white/70'
                }`}
              >
                כן, טעימה חינמית
              </button>
              <button
                type="button"
                onClick={() => setFreeSample(false)}
                className={`px-5 py-3 rounded-full text-sm min-h-11 border ${
                  !freeSample ? 'bg-[#C8A24C] text-black border-[#C8A24C]' : 'border-white/15 text-white/70'
                }`}
              >
                לא, רק למנויים
              </button>
            </div>
          </div>
          <label className="flex items-center gap-3 text-base text-white/70 min-h-11">
            <input type="checkbox" checked={submitAfter} onChange={(e) => setSubmitAfter(e.target.checked)} />
            שליחה לאישור אדמין אחרי שמירה
          </label>
          <p className="text-sm text-white/50">
            {title || 'בלי שם עדיין'}
            {videoUrl ? ' · יש סרטון' : ' · חסר סרטון'}
            {coverImage ? ' · יש תמונה' : ' · בלי תמונת כיסוי'}
          </p>
        </div>
      ) : null}

      {error && <p className="text-sm text-rose-300">{error}</p>}
      <div className="flex flex-wrap gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((prev) => prev - 1)}
            className={opsGhostBtn}
          >
            חזרה
          </button>
        ) : null}
        {step < 3 ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setStep((prev) => prev + 1)}
            className={`${opsPrimaryBtn} disabled:opacity-50`}
          >
            המשך
          </button>
        ) : (
          <button type="submit" disabled={pending} className={`${opsPrimaryBtn} disabled:opacity-60`}>
            {pending ? 'שומר...' : submitAfter ? 'שמירה ושליחה לאישור' : 'שמירת טיוטה'}
          </button>
        )}
      </div>
    </form>
  );
}
