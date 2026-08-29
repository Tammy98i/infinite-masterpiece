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

const fieldClass =
  'w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#C8A24C] focus:outline-none min-h-11';

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
    <div className="border border-[#C8A24C]/25 rounded-3xl p-6 bg-[#C8A24C]/5">
      <p className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-2">הפניות</p>
      <h2 className="text-xl font-light mb-2">קישור ההפניה שלכם</h2>
      <p className="text-sm text-white/50 font-light leading-relaxed mb-5">
        מי שנכנס דרך הקישור ונרשם או ממלא מסלול כניסה נספר כאן. בלי לערבב עם מועמדות לנבחרת 88.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input readOnly value={referralUrl} className={`${fieldClass} flex-1`} dir="ltr" />
        <button
          type="button"
          onClick={() => void copy()}
          className="px-5 py-3 rounded-full bg-[#C8A24C] text-black text-sm font-medium min-h-11 cursor-pointer shrink-0"
        >
          {copied ? 'הועתק' : 'העתקת קישור'}
        </button>
      </div>
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
    </div>
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
      <p className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-2">מרצים</p>
      <h1 className="text-3xl font-light mb-4">בקשה להיות מרצה</h1>
      <p className="text-sm text-white/45 font-light mb-8">
        הבקשה עוברת לאישור אדמין. אחרי אישור נפתח דשבורד להעלאת תוכן לבדיקה.
      </p>

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

      <form onSubmit={(e) => void submit(e)} className="grid gap-4">
        <label className="block">
          <span className="block text-xs text-white/45 mb-1">שם מלא</span>
          <input required disabled={locked} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={fieldClass} />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs text-white/45 mb-1">טלפון</span>
            <input required disabled={locked} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fieldClass} />
          </label>
          <label className="block">
            <span className="block text-xs text-white/45 mb-1">אימייל</span>
            <input required type="email" disabled={locked} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={fieldClass} />
          </label>
        </div>
        <label className="block">
          <span className="block text-xs text-white/45 mb-1">תחום</span>
          <input required disabled={locked} value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} className={fieldClass} />
        </label>
        <label className="block">
          <span className="block text-xs text-white/45 mb-1">לינקים</span>
          <input disabled={locked} value={form.links} onChange={(e) => setForm({ ...form, links: e.target.value })} className={fieldClass} />
        </label>
        <label className="block">
          <span className="block text-xs text-white/45 mb-1">הרצאה מוצעת</span>
          <textarea required disabled={locked} rows={3} value={form.proposedLecture} onChange={(e) => setForm({ ...form, proposedLecture: e.target.value })} className={fieldClass} />
        </label>
        <label className="block">
          <span className="block text-xs text-white/45 mb-1">למי מיועדת</span>
          <input disabled={locked} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className={fieldClass} />
        </label>
        <label className="block">
          <span className="block text-xs text-white/45 mb-1">ערך למשתמש</span>
          <textarea disabled={locked} rows={3} value={form.valueToUser} onChange={(e) => setForm({ ...form, valueToUser: e.target.value })} className={fieldClass} />
        </label>
        <label className="block">
          <span className="block text-xs text-white/45 mb-1">ניסיון</span>
          <textarea disabled={locked} rows={3} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className={fieldClass} />
        </label>
        <FileUploadField
          kind="video"
          label="וידאו דוגמה (אופציונלי)"
          value={form.sampleVideo}
          disabled={locked}
          onChange={(sampleVideo) => setForm({ ...form, sampleVideo })}
        />
        <label className="flex items-center gap-3 text-sm text-white/55 min-h-11">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} disabled={locked} />
          מאשר/ת את תנאי המרצים
        </label>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        {!locked && (
          <button type="submit" disabled={pending} className="w-full py-3 rounded-full bg-[#C8A24C] text-black text-sm font-medium min-h-11 cursor-pointer disabled:opacity-60">
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
    | 'drafts'
    | 'pending'
    | 'analytics'
    | 'questions'
    | 'resources'
    | 'profile'
    | 'messages'
    | 'settings'
    | 'founder'
    | 'founder88'
    | 'team';

  const [tab, setTab] = useState<Tab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    else if (id !== 'videos' && id !== 'drafts' && id !== 'pending') setEditing(null);
  };

  const navItems: Array<{ id: Tab; label: string; badge?: number; ready?: boolean; founderOnly?: boolean }> = [
    { id: 'overview', label: 'סקירה כללית' },
    { id: 'videos', label: 'ההרצאות שלי' },
    { id: 'courses', label: 'קורסים / סדרות שלי' },
    { id: 'upload', label: 'העלאת תוכן' },
    { id: 'drafts', label: 'טיוטות', badge: stats?.drafts },
    { id: 'pending', label: 'ממתין לאישור', badge: stats?.pending },
    { id: 'analytics', label: 'אנליטיקות' },
    { id: 'questions', label: 'שאלות ותגובות' },
    { id: 'resources', label: 'קבצים נלווים' },
    { id: 'profile', label: 'פרופיל מרצה' },
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

  const navButton = (item: (typeof navItems)[number]) => {
    const active = tab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => goTab(item.id)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm min-h-11 text-right transition-colors ${
          active
            ? 'bg-[#C8A24C]/15 text-[#F7E7B5] border border-[#C8A24C]/40'
            : 'text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent'
        }`}
      >
        <span className="font-light">{item.label}</span>
        {item.badge && item.badge > 0 ? (
          <span className="text-[10px] text-[#C8A24C] border border-[#C8A24C]/40 rounded-full px-2 py-0.5">
            {item.badge}
          </span>
        ) : item.ready === false ? (
          <span className="text-[10px] text-white/30">בקרוב</span>
        ) : null}
      </button>
    );
  };

  const filteredCourses = (status?: string) =>
    status ? courses.filter((course) => course.status === status) : courses;

  return (
    <div className="min-h-screen bg-[#050505] text-white text-right" dir="rtl">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-s border-white/10 bg-[#080808] sticky top-0 h-screen overflow-y-auto">
          <div className="p-5 border-b border-white/10">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#C8A24C] mb-2">מרצה</p>
            <h1 className="text-xl font-light">דשבורד מרצה</h1>
            <p className="text-xs text-white/40 mt-2 font-light truncate">{user.name}</p>
            {user.email ? (
              <p className="text-[11px] text-white/30 mt-1 truncate" dir="ltr">
                {user.email}
              </p>
            ) : null}
            {stats?.isFounder ? (
              <p className="text-[11px] text-[#C8A24C] mt-1">מרצה ומייסד</p>
            ) : (
              <p className="text-[11px] text-white/35 mt-1">מרצה</p>
            )}
          </div>
          <nav className="flex-1 p-3 grid gap-1 content-start">{navItems.map(navButton)}</nav>
          <div className="p-4 border-t border-white/10 grid gap-2">
            <div className="border border-[#C8A24C]/30 rounded-2xl p-4 text-center">
              <p className="text-xs text-white/45 mb-3">צריכים עזרה?</p>
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
                תפריט
              </button>
              <div className="min-w-0">
                <p className="text-[11px] tracking-[0.2em] text-[#C8A24C] uppercase truncate">Infinite Masterpiece</p>
                <p className="text-sm text-white/70 font-light truncate">שלום, {user.name}</p>
                {user.email ? (
                  <p className="text-[11px] text-white/40 truncate" dir="ltr">
                    {user.email}
                  </p>
                ) : null}
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
            <div className="lg:hidden border-b border-white/10 bg-[#080808] p-3 grid gap-1">{navItems.map(navButton)}</div>
          ) : null}

          <main className="px-4 sm:px-6 lg:px-8 py-8 pb-24 max-w-7xl">
            {error ? <p className="text-sm text-rose-300 mb-4">{error}</p> : null}

            {tab === 'overview' && stats ? (
              <OverviewHome
                stats={stats}
                onUpload={() => goTab('upload')}
                onVideos={() => goTab('videos')}
              />
            ) : null}

            {(tab === 'videos' || tab === 'drafts' || tab === 'pending') && !editing ? (
              <VideosPanel
                title={
                  tab === 'drafts' ? 'טיוטות' : tab === 'pending' ? 'ממתין לאישור' : 'ההרצאות שלי'
                }
                courses={
                  tab === 'drafts'
                    ? filteredCourses('draft')
                    : tab === 'pending'
                      ? filteredCourses('pending_review')
                      : courses
                }
                categories={categories}
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
            {tab === 'questions' ? <QuestionsPanel /> : null}
            {tab === 'messages' ? <MessagesPanel /> : null}
            {tab === 'team' && stats?.isFounder ? <TeamPanel /> : null}
          </main>
        </div>
      </div>
    </div>
  );
}

function QuestionsPanel() {
  const [questions, setQuestions] = useState<LecturerQuestion[]>([]);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const load = () =>
    lecturerApi
      .questions()
      .then((res) => setQuestions(res.questions))
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

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
    <div className="grid gap-6">
      <div>
        <p className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-2">שאלות</p>
        <h2 className="text-2xl font-light">שאלות ותגובות על התכנים שלי</h2>
        <p className="text-sm text-white/45 mt-2">רק שאלות על ההרצאות שלכם. בלי נתוני משתמשים רגישים מעבר לשם.</p>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="grid gap-3">
        {questions.length === 0 ? (
          <p className="text-sm text-white/40 border border-white/10 rounded-2xl p-6">
            אין שאלות עדיין. משתמשים יכולים לשאול מעמוד ההרצאה.
          </p>
        ) : (
          questions.map((row) => (
            <article key={row.id} className="border border-white/10 rounded-2xl p-5 grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-light">{row.courseTitle || 'הרצאה'}</p>
                <span className="text-xs text-white/40">
                  {row.status === 'open' ? 'פתוח' : row.status === 'escalated' ? 'הועבר לצוות' : 'נענה'}
                </span>
              </div>
              <p className="text-sm text-white/70">{row.question}</p>
              <p className="text-xs text-white/35">
                {row.userName} · {row.createdAt.replace('T', ' ').slice(0, 16)}
              </p>
              {row.answer ? <p className="text-sm text-[#C8A24C]/90">תשובה: {row.answer}</p> : null}
              {row.status === 'open' ? (
                <div className="grid gap-2">
                  <textarea
                    rows={3}
                    value={answers[row.id] || ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    className={fieldClass}
                    placeholder="תשובה לצופה"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pendingId === row.id}
                      onClick={() => void reply(row.id, 'answered')}
                      className="px-4 py-2 rounded-full bg-[#C8A24C] text-black text-xs min-h-10 disabled:opacity-60"
                    >
                      שליחת תשובה
                    </button>
                    <button
                      type="button"
                      disabled={pendingId === row.id}
                      onClick={() => void reply(row.id, 'escalated')}
                      className="px-4 py-2 rounded-full border border-white/20 text-xs min-h-10 disabled:opacity-60"
                    >
                      העברה לצוות
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
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
    <div className="grid gap-6">
      <div>
        <p className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-2">הודעות</p>
        <h2 className="text-2xl font-light">הודעות מהצוות</h2>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className="border border-white/10 rounded-2xl divide-y divide-white/10">
          {messages.length === 0 ? (
            <p className="p-6 text-sm text-white/40">אין הודעות מהצוות.</p>
          ) : (
            messages.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => void open(row.id)}
                className={`w-full text-right p-4 hover:bg-white/[0.03] ${
                  selectedId === row.id ? 'bg-[#C8A24C]/10' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm">{row.subject}</span>
                  {!row.readAt ? <span className="text-[10px] text-[#C8A24C]">חדש</span> : null}
                </div>
                <p className="text-xs text-white/40 mt-1">
                  {row.fromAdminName} · {row.createdAt.replace('T', ' ').slice(0, 16)}
                </p>
              </button>
            ))
          )}
        </div>
        <aside className="border border-white/10 rounded-2xl p-5 min-h-[220px]">
          {!selected ? (
            <p className="text-sm text-white/40">בחרו הודעה.</p>
          ) : (
            <div className="grid gap-3 text-sm">
              <h3 className="text-xl font-light">{selected.subject}</h3>
              <p className="text-xs text-white/40">
                מאת {selected.fromAdminName} · {selected.createdAt.replace('T', ' ').slice(0, 16)}
              </p>
              <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{selected.body}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
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
  const groups = categories
    .map((cat) => ({
      ...cat,
      items: courses.filter((course) => course.categoryId === cat.id),
    }))
    .filter((group) => group.items.length > 0);
  const uncategorized = courses.filter((course) => !categories.some((cat) => cat.id === course.categoryId));

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-2">סדרות</p>
        <h2 className="text-2xl font-light">קורסים / סדרות שלי</h2>
        <p className="text-sm text-white/45 mt-2">
          קיבוץ ההרצאות לפי קטגוריה. יצירת סדרה נפרדת תגיע בהמשך; כרגע מנהלים דרך ההרצאות והקטגוריה.
        </p>
      </div>
      {groups.length === 0 && uncategorized.length === 0 ? (
        <p className="text-sm text-white/40">עדיין אין תכנים לקיבוץ.</p>
      ) : null}
      {[...groups, ...(uncategorized.length ? [{ id: 'none', name: 'ללא קטגוריה', items: uncategorized }] : [])].map(
        (group) => (
          <section key={group.id} className="border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-light">{group.name}</h3>
              <span className="text-xs text-white/40">{group.items.length} הרצאות</span>
            </div>
            <ul className="grid gap-2">
              {group.items.map((course) => (
                <li key={course.id} className="flex flex-wrap items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm truncate">{course.title}</p>
                    <p className="text-xs text-white/40">
                      {STATUS_LABEL[course.status || 'draft']} · {course.episodes?.length || 0} פרקים
                    </p>
                  </div>
                  {course.status !== 'published' && course.status !== 'blocked' ? (
                    <button
                      type="button"
                      onClick={() => onEdit(course)}
                      className="px-3 py-1.5 text-xs border border-white/20 rounded-xl min-h-10"
                    >
                      עריכה
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        )
      )}
    </div>
  );
}

function Founder88Panel({ courses }: { courses: Course[] }) {
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-2">נבחרת 88</p>
        <h2 className="text-2xl font-light">הרצאות בעמוד נבחרת 88</h2>
        <p className="text-sm text-white/45 mt-2">
          הרצאות שפורסמו תחת הפרופיל שלכם. הצגה בעמוד הציבורי נקבעת גם על ידי האדמין.
        </p>
      </div>
      <div className="overflow-x-auto border border-white/10 rounded-2xl">
        <table className="w-full text-sm text-right">
          <thead className="text-xs text-white/40 border-b border-white/10">
            <tr>
              <th className="py-3 px-3 font-normal">הרצאה</th>
              <th className="py-3 px-3 font-normal">גישה</th>
              <th className="py-3 px-3 font-normal">סטטוס</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 px-3 text-white/40">
                  אין עדיין הרצאות מפורסמות להצגה.
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id}>
                  <td className="py-3 px-3">{course.title}</td>
                  <td className="py-3 px-3 text-white/55">{course.accessLevel}</td>
                  <td className="py-3 px-3 text-emerald-300">פורסם</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OverviewHome({
  stats,
  onUpload,
  onVideos,
}: {
  stats: LecturerOverview;
  onUpload: () => void;
  onVideos: () => void;
}) {
  const maxDay = Math.max(1, ...stats.viewsByDay.map((d) => d.views));
  const kpis = [
    { label: 'סך הרצאות', value: stats.courses },
    { label: 'פורסמו', value: stats.published },
    { label: 'ממתינות לאישור', value: stats.pending },
    { label: 'סך צפיות', value: stats.views },
    { label: 'צופים ייחודיים', value: stats.uniqueViewers },
    { label: 'זמן צפייה (שעות)', value: stats.totalWatchHours },
    { label: 'Completion Rate', value: `${stats.completionRate}%` },
    { label: 'שמירות לרשימה', value: stats.saves },
    { label: 'Paywall מהתוכן', value: stats.paywallHits },
    { label: 'שדרוגים מיוחסים', value: stats.upgrades },
  ];

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-light mb-2">ברוך הבא לדשבורד המרצה שלך</h2>
          <p className="text-sm text-white/45 font-light max-w-2xl">
            כאן מנהלים רק את התכנים שלכם: סטטוס, צפיות ושליחה לאישור. פרסום ישיר נשאר בידי האדמין.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onUpload}
            className="px-5 py-2.5 rounded-full bg-[#C8A24C] text-black text-sm min-h-11"
          >
            העלאת תוכן
          </button>
          <button
            type="button"
            onClick={onVideos}
            className="px-5 py-2.5 rounded-full border border-white/15 text-sm min-h-11"
          >
            ההרצאות שלי
          </button>
        </div>
      </div>

      {stats.lecturerId ? (
        <ReferralCard
          lecturerId={stats.lecturerId}
          referredLeads={stats.referredLeads}
          referredUsers={stats.referredUsers}
        />
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {kpis.map((card) => (
          <div key={card.label} className="border border-white/10 rounded-2xl p-4 bg-[#0A0A0A]">
            <div className="text-[11px] text-white/40 mb-2">{card.label}</div>
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
        <p className="text-[13px] uppercase tracking-[0.25em] text-[#C8A24C] mb-2">טיפ להצלחה</p>
        <p className="text-sm text-white/70 font-light leading-relaxed">
          שמרו על הרצאות ממוקדות. Completion Rate גבוה מגדיל שמירות ושדרוגים מהתוכן שלכם.
        </p>
      </div>
    </div>
  );
}

function VideosPanel({
  title,
  courses,
  categories,
  onEdit,
  onSubmit,
  onUpload,
}: {
  title: string;
  courses: Course[];
  categories: { id: string; name: string }[];
  onEdit: (course: Course) => void;
  onSubmit: (id: string) => void;
  onUpload: () => void;
}) {
  const categoryName = (id?: string) => categories.find((c) => c.id === id)?.name || '—';

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-2">תוכן</p>
          <h2 className="text-2xl font-light">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onUpload}
          className="px-5 py-2.5 rounded-full bg-[#C8A24C] text-black text-sm min-h-11"
        >
          העלאת תוכן
        </button>
      </div>
      <div className="overflow-x-auto border border-white/10 rounded-2xl">
        <table className="w-full text-sm text-right">
          <thead className="text-xs text-white/40 border-b border-white/10">
            <tr>
              <th className="py-3 px-3 font-normal">הרצאה</th>
              <th className="py-3 px-3 font-normal">קטגוריה</th>
              <th className="py-3 px-3 font-normal">גישה</th>
              <th className="py-3 px-3 font-normal">סטטוס</th>
              <th className="py-3 px-3 font-normal">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 px-3 text-white/40">
                  אין פריטים להצגה. העלו הרצאה ראשונה.
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id}>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      {course.coverImage ? (
                        <img src={course.coverImage} alt="" aria-hidden className="w-14 h-9 rounded object-cover shrink-0" />
                      ) : (
                        <div className="w-14 h-9 rounded bg-white/5 border border-white/10 shrink-0" />
                      )}
                      <span>{course.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-white/55">{categoryName(course.categoryId)}</td>
                  <td className="py-3 px-3 text-white/55">{course.accessLevel}</td>
                  <td className="py-3 px-3">{STATUS_LABEL[course.status || 'draft']}</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-2">
                      {course.status !== 'published' && course.status !== 'blocked' ? (
                        <button
                          type="button"
                          onClick={() => onEdit(course)}
                          className="px-3 py-1.5 text-xs border border-white/20 rounded-xl min-h-10"
                        >
                          עריכה
                        </button>
                      ) : null}
                      {course.status === 'draft' ? (
                        <button
                          type="button"
                          onClick={() => onSubmit(course.id)}
                          className="px-3 py-1.5 text-xs border border-[#C8A24C]/40 text-[#C8A24C] rounded-xl min-h-10"
                        >
                          שליחה לאישור
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsPanel({ stats }: { stats: LecturerOverview }) {
  const maxTop = Math.max(1, ...stats.topContent.map((item) => item.views));
  return (
    <div className="grid gap-8">
      <div>
        <p className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-2">אנליטיקות</p>
        <h2 className="text-2xl font-light">ביצועי התכנים שלי</h2>
        <p className="text-sm text-white/45 mt-2">נתונים מצרפיים בלבד על התוכן שלכם. בלי פרטי משתמשים.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'צפיות', value: stats.views },
          { label: 'צופים ייחודיים', value: stats.uniqueViewers },
          { label: 'Completion', value: `${stats.completionRate}%` },
          { label: 'זמן ממוצע', value: `${stats.avgWatchMinutes} דק׳` },
          { label: 'שמירות', value: stats.saves },
          { label: 'Paywall', value: stats.paywallHits },
          { label: 'שדרוגים', value: stats.upgrades },
          { label: 'שעות צפייה', value: stats.totalWatchHours },
        ].map((card) => (
          <div key={card.label} className="border border-white/10 rounded-2xl p-4">
            <div className="text-[11px] text-white/40 mb-1">{card.label}</div>
            <div className="text-xl font-light">{card.value}</div>
          </div>
        ))}
      </div>
      <div className="border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-light mb-4">Completion לפי תוכן מוביל</h3>
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
    </div>
  );
}

function ResourcesPanel({ courses }: { courses: Course[] }) {
  const rows = courses.filter((course) => course.resources);
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-2">קבצים</p>
        <h2 className="text-2xl font-light">קבצים נלווים</h2>
        <p className="text-sm text-white/45 mt-2">קבצים שצורפו להרצאות שלכם. העלאה חדשה דרך עריכת הרצאה.</p>
      </div>
      <div className="overflow-x-auto border border-white/10 rounded-2xl">
        <table className="w-full text-sm text-right">
          <thead className="text-xs text-white/40 border-b border-white/10">
            <tr>
              <th className="py-3 px-3 font-normal">הרצאה</th>
              <th className="py-3 px-3 font-normal">קובץ / קישור</th>
              <th className="py-3 px-3 font-normal">סטטוס</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 px-3 text-white/40">
                  עדיין אין קבצים נלווים.
                </td>
              </tr>
            ) : (
              rows.map((course) => (
                <tr key={course.id}>
                  <td className="py-3 px-3">{course.title}</td>
                  <td className="py-3 px-3 text-white/55 break-all" dir="ltr">
                    {course.resources}
                  </td>
                  <td className="py-3 px-3">{STATUS_LABEL[course.status || 'draft']}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
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
    <div className="grid gap-6 max-w-2xl">
      <div>
        <p className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-2">
          {isFounderTab ? 'מייסד' : 'פרופיל'}
        </p>
        <h2 className="text-2xl font-light">{isFounderTab ? 'פרופיל מייסד' : 'פרופיל מרצה'}</h2>
        <p className="text-sm text-white/45 mt-2">
          {profile.isFounder
            ? 'הפרופיל מוצג גם בהקשר נבחרת 88 לפי הגדרת האדמין.'
            : 'הפרופיל הציבורי שלכם בספרייה.'}
        </p>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      <label className="grid gap-1 text-xs text-white/45">
        שם
        <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
      </label>
      <label className="grid gap-1 text-xs text-white/45">
        טייטל
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
      </label>
      <label className="grid gap-1 text-xs text-white/45">
        ביוגרפיה
        <textarea rows={5} value={bio} onChange={(e) => setBio(e.target.value)} className={fieldClass} />
      </label>
      <label className="grid gap-1 text-xs text-white/45">
        תחומי מומחיות (מופרדים בפסיק)
        <input value={expertise} onChange={(e) => setExpertise(e.target.value)} className={fieldClass} />
      </label>
      <FileUploadField kind="image" label="תמונה" value={avatarUrl} onChange={setAvatarUrl} />
      <button
        type="button"
        disabled={pending}
        onClick={() => void save()}
        className="w-fit px-6 py-3 rounded-full bg-[#C8A24C] text-black text-sm min-h-11 disabled:opacity-60"
      >
        {pending ? 'שומר...' : 'שמירת פרופיל'}
      </button>
    </div>
  );
}

function SettingsPanel({ onLibrary }: { onLibrary: () => void }) {
  const { setView } = useApp();
  return (
    <div className="grid gap-6 max-w-xl">
      <div>
        <p className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-2">הגדרות</p>
        <h2 className="text-2xl font-light">הגדרות חשבון</h2>
      </div>
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
    </div>
  );
}

function TeamPanel() {
  const { reloadCatalog } = useApp();
  const [members, setMembers] = useState<Instructor[]>([]);
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

  return (
    <div className="grid gap-8 max-w-2xl">
      <div>
        <h2 className="text-xl font-light mb-2">הוספת יזם לצוות</h2>
        <p className="text-sm text-white/50 font-light leading-relaxed">
          נכנסים מחשבון גל. לכל יזם: שם, תפקיד ותמונה. בלי להמציא אנשים.
        </p>
      </div>
      <div className="grid gap-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 border border-white/10 rounded-2xl p-4">
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.name ? `תמונת פרופיל: ${member.name}` : 'תמונת חבר צוות'} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10" />
            )}
            <div>
              <div className="text-sm">{member.name}</div>
              <div className="text-xs text-white/40">{member.title}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="border border-[#C8A24C]/25 rounded-3xl p-6 grid gap-4">
        <label className="block">
          <span className="block text-xs text-white/45 mb-1">שם</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
        </label>
        <label className="block">
          <span className="block text-xs text-white/45 mb-1">תפקיד</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
        </label>
        <label className="block">
          <span className="block text-xs text-white/45 mb-1">ביו קצר (אופציונלי)</span>
          <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className={fieldClass} />
        </label>
        <FileUploadField kind="image" label="תמונה" value={avatarUrl} onChange={setAvatarUrl} />
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => void save()}
          className="w-full py-3 rounded-full bg-[#C8A24C] text-black text-sm font-medium min-h-11 cursor-pointer disabled:opacity-60"
        >
          {pending ? 'שומר...' : 'הוספה לצוות'}
        </button>
      </div>
    </div>
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

  const save = async (e: FormEvent) => {
    e.preventDefault();
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

  return (
    <form onSubmit={(e) => void save(e)} className="grid gap-4 max-w-2xl">
      <button type="button" onClick={onCancel} className="text-sm text-white/45 text-right cursor-pointer">
        חזרה
      </button>
      <label className="block">
        <span className="block text-xs text-white/45 mb-1">שם ההרצאה</span>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
      </label>
      <label className="block">
        <span className="block text-xs text-white/45 mb-1">כותרת משנה</span>
        <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={fieldClass} />
      </label>
      <label className="block">
        <span className="block text-xs text-white/45 mb-1">תיאור</span>
        <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={fieldClass} />
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-xs text-white/45 mb-1">קטגוריה</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={fieldClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs text-white/45 mb-1">רמת גישה</span>
          <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as AccessLevel)} className={fieldClass}>
            <option value="free">חינמי</option>
            <option value="premium">פרימיום</option>
            <option value="premium_88">נבחרת 88</option>
          </select>
        </label>
      </div>
      <FileUploadField
        kind="image"
        label="תמונת כיסוי"
        value={coverImage}
        onChange={setCoverImage}
        previewAlt={title ? `תמונת כיסוי: ${title}` : 'תמונת כיסוי'}
      />
      <FileUploadField kind="resource" label="קבצים נלווים" value={resources} onChange={setResources} />
      <label className="block">
        <span className="block text-xs text-white/45 mb-1">שם הפרק</span>
        <input value={episodeTitle} onChange={(e) => setEpisodeTitle(e.target.value)} className={fieldClass} />
      </label>
      <label className="block">
        <span className="block text-xs text-white/45 mb-1">משך בדקות</span>
        <input type="number" min={1} value={durationMin} onChange={(e) => setDurationMin(e.target.value)} className={fieldClass} />
      </label>
      <FileUploadField kind="video" label="קובץ וידאו" value={videoUrl} onChange={setVideoUrl} />
      <FileUploadField kind="caption" label="כתוביות (WebVTT)" value={captionVttUrl} onChange={setCaptionVttUrl} />
      <label className="flex items-center gap-3 text-sm text-white/55 min-h-11">
        <input type="checkbox" checked={freeSample} onChange={(e) => setFreeSample(e.target.checked)} />
        פרק ראשון כטעימה חינמית
      </label>
      <label className="flex items-center gap-3 text-sm text-white/55 min-h-11">
        <input type="checkbox" checked={submitAfter} onChange={(e) => setSubmitAfter(e.target.checked)} />
        שליחה לאישור אדמין אחרי שמירה
      </label>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <button type="submit" disabled={pending} className="w-full py-3 rounded-full bg-[#C8A24C] text-black text-sm font-medium min-h-11 cursor-pointer disabled:opacity-60">
        {pending ? 'שומר...' : 'שמירה'}
      </button>
    </form>
  );
}
