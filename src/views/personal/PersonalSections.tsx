import { useMemo, useState, type ReactNode } from 'react';
import type { CommunityPost } from '../../api/community';
import type { Course, Instructor, LearningPath, UserProfile, WatchProgress } from '../../types';

export type AreaId =
  | 'home'
  | 'feed'
  | 'calendar'
  | 'recordings'
  | 'courses'
  | 'shorts'
  | 'club'
  | 'agents'
  | 'hall'
  | 'partners'
  | 'contact';

export const AREAS: Array<{ id: AreaId; label: string }> = [
  { id: 'home', label: 'ראשי' },
  { id: 'feed', label: 'בית הקהילה' },
  { id: 'calendar', label: 'לוח חודשי' },
  { id: 'recordings', label: 'הקלטות מפגשים' },
  { id: 'courses', label: 'קורסים ושיעורים' },
  { id: 'shorts', label: 'הדרכות קצרות' },
  { id: 'club', label: 'מועדון' },
  { id: 'agents', label: 'סוכני AI' },
  { id: 'hall', label: 'היכל התהילה' },
  { id: 'partners', label: 'תוכנית שותפים' },
  { id: 'contact', label: 'צור קשר' },
];

const AGENTS = [
  { name: 'סיכום הרצאה', text: 'מסכם הרצאה לנקודות שאפשר ליישם השבוע.', tone: 'סיכום' },
  { name: 'עוזר המסע', text: 'מפרק את משימת השבוע בפוד לצעדים קטנים.', tone: 'מסע' },
  { name: 'סטוריטלינג', text: 'בונה פתיח, דוגמה וסיום להרצאה קצרה.', tone: 'תוכן' },
  { name: 'שאלות לצוות', text: 'מנסח פנייה ברורה לפני שהיא נשלחת לצוות.', tone: 'שירות' },
  { name: 'תכנון שבוע', text: 'מסדר צפייה, תרגול ושיחה בקהילה ללוח השבוע.', tone: 'לוח' },
  { name: 'משוב אישי', text: 'הופך צפייה להרצאה להערה אחת שאפשר לפרסם.', tone: 'קהילה' },
];

const BOARD = [
  { name: 'גל אברמוביץ׳', points: 1860 },
  { name: 'תמי אליאן', points: 1640 },
  { name: 'נועה כהן', points: 1420 },
  { name: 'עידו ברק', points: 1210 },
  { name: 'מיכל רז', points: 980 },
  { name: 'דנה שמש', points: 860 },
  { name: 'יואב לוי', points: 640 },
  { name: 'אורי לוי', points: 510 },
];

const LEVELS = [
  { name: 'מתחיל', min: 0 },
  { name: 'פעיל', min: 200 },
  { name: 'מוביל', min: 800 },
  { name: 'מנטור', min: 1500 },
];

function levelFor(points: number) {
  return [...LEVELS].reverse().find((level) => points >= level.min) || LEVELS[0];
}

export function memberPoints(user: UserProfile, posts: CommunityPost[]) {
  const mine = posts.filter((post) => post.author.firstName && user.name.startsWith(post.author.firstName)).length;
  return 120 + user.interests.length * 15 + mine * 20;
}

export function HomeDesk({
  user,
  posts,
  shorts,
  saved,
  history,
  paths,
  instructors,
  continueItem,
  onOpenFeed,
  onOpenCourse,
  onOpenView,
  onOpenInstructor,
  onWatch,
}: {
  user: UserProfile;
  posts: CommunityPost[];
  shorts: Course[];
  saved: Course[];
  history: Array<{ course: Course; episode: { id: string; title: string } }>;
  paths: LearningPath[];
  instructors: Instructor[];
  continueItem: { course: Course; episode: { id: string; title: string }; progress: WatchProgress } | null;
  onOpenFeed: () => void;
  onOpenCourse: (id: string) => void;
  onOpenView: (view: 'mylist' | 'history' | 'paths' | 'quiz' | 'instructors') => void;
  onOpenInstructor: (id: string) => void;
  onWatch: (courseId: string, episodeId: string) => void;
}) {
  const checks = [
    { label: 'שם מלא', done: Boolean(user.name && user.name !== 'אורח/ת') },
    { label: 'תמונת פרופיל', done: Boolean(user.avatar) },
    { label: 'עיר', done: Boolean(user.city) },
    { label: 'תחומי עניין', done: user.interests.length > 0 },
  ];
  const done = checks.filter((item) => item.done).length;
  const featured = posts[0];
  const points = memberPoints(user, posts);
  return (
    <div className="pa-home">
      <div className="pa-stream">
        {continueItem ? (
          <button type="button" className="pa-card pa-continue" onClick={() => onWatch(continueItem.course.id, continueItem.episode.id)}>
            <span>המשך צפייה</span>
            <strong>{continueItem.course.title}</strong>
            <em>{continueItem.episode.title}</em>
            <i style={{ width: `${Math.max(4, Math.round((continueItem.progress.currentTime / Math.max(1, continueItem.progress.duration)) * 100))}%` }} />
          </button>
        ) : (
          <button type="button" className="pa-card pa-quiz" onClick={() => onOpenView('quiz')}>
            <strong>מה מתאים לי</strong>
            <span>עוד אין הרצאה פעילה. השאלון הקצר מכוון להרצאה הראשונה.</span>
          </button>
        )}
        {featured ? (
          <article className="pa-hero">
            <div>
              <p>{featured.author.firstName}</p>
              <h2>{featured.body}</h2>
              <button type="button" onClick={onOpenFeed}>לדיון</button>
            </div>
            <div className="pa-hero-avatar" aria-hidden="true">{featured.author.initial}</div>
          </article>
        ) : null}
        <section>
          <div className="pa-rowhead"><h2>הדרכות קצרות</h2></div>
          <div className="pa-rail">
            {shorts.map((course) => (
              <button key={course.id} type="button" className="pa-thumb" onClick={() => onOpenCourse(course.id)}>
                {course.coverImage ? <img src={course.coverImage} alt="" /> : null}
                <span>{course.title}</span>
              </button>
            ))}
          </div>
        </section>
        <ShelfRow title="הרשימה שלי" action="לרשימה" onAction={() => onOpenView('mylist')} empty="עוד לא שמרתם הרצאות.">
          {saved.slice(0, 4).map((course) => (
            <button key={course.id} type="button" className="pa-thumb" onClick={() => onOpenCourse(course.id)}>
              {course.coverImage ? <img src={course.coverImage} alt="" /> : null}
              <span>{course.title}</span>
            </button>
          ))}
        </ShelfRow>
        <ShelfRow title="היסטוריה" action="להיסטוריה" onAction={() => onOpenView('history')} empty="הצפיות יופיעו כאן.">
          {history.slice(0, 4).map((item) => (
            <button key={`${item.course.id}-${item.episode.id}`} type="button" className="pa-thumb" onClick={() => onWatch(item.course.id, item.episode.id)}>
              {item.course.coverImage ? <img src={item.course.coverImage} alt="" /> : null}
              <span>{item.course.title}</span>
            </button>
          ))}
        </ShelfRow>
        <ShelfRow title="מסלולי למידה" action="למסלולים" onAction={() => onOpenView('paths')} empty="המסלולים יופיעו כאן.">
          {paths.slice(0, 3).map((path) => (
            <button key={path.id} type="button" className="pa-thumb pa-path" onClick={() => onOpenView('paths')}>
              <span>{path.title}</span>
              <em>{path.courseIds.length} קורסים</em>
            </button>
          ))}
        </ShelfRow>
        <ShelfRow title="מומחים ומרצים" action="לכל המרצים" onAction={() => onOpenView('instructors')} empty="">
          {instructors.slice(0, 8).map((instructor) => (
            <button key={instructor.id} type="button" className="pa-person" onClick={() => onOpenInstructor(instructor.id)}>
              {instructor.avatarUrl ? <img src={instructor.avatarUrl} alt="" /> : <b>{instructor.name.trim().charAt(0)}</b>}
              <span>{instructor.name}</span>
            </button>
          ))}
        </ShelfRow>
        <button type="button" className="pa-card pa-composer" onClick={onOpenFeed}>שתף שאלה, רעיון, או תובנה מהקהילה…</button>
        {posts.slice(0, 2).map((post) => (
          <article key={post.id} className="pa-card pa-post">
            <header><strong>{post.author.firstName}</strong><span>{post.author.badge}</span></header>
            <p>{post.body}</p>
          </article>
        ))}
      </div>
      <aside className="pa-widgets">
        <section className="pa-card">
          <h2>השלמת הפרופיל שלך</h2>
          <p className="pa-progress-label">{done}/{checks.length}</p>
          <div className="pa-bar"><span style={{ width: `${(done / checks.length) * 100}%` }} /></div>
          <ul>
            {checks.map((item) => (
              <li key={item.label} className={item.done ? 'is-done' : ''}>{item.done ? '✓' : '○'} {item.label}</li>
            ))}
          </ul>
        </section>
        <section className="pa-card">
          <h2>הנקודות שלך</h2>
          <p className="pa-points">{points}</p>
          <p>{levelFor(points).name}</p>
        </section>
        <section className="pa-card">
          <h2>מה חדש במועדון</h2>
          {posts.slice(0, 3).map((post) => (
            <button key={post.id} type="button" className="pa-linkrow" onClick={onOpenFeed}>{post.body}</button>
          ))}
        </section>
      </aside>
    </div>
  );
}

function ShelfRow({ title, action, onAction, empty, children }: { title: string; action: string; onAction: () => void; empty: string; children: ReactNode }) {
  const list = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <section>
      <div className="pa-rowhead"><h2>{title}</h2><button type="button" onClick={onAction}>{action}</button></div>
      {list.length === 0 ? <p className="pa-note">{empty}</p> : <div className="pa-rail">{children}</div>}
    </section>
  );
}

export function CourseShelf({ title, courses, onOpen }: { title: string; courses: Course[]; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const shown = courses.filter((course) => course.title.includes(query.trim()));
  return (
    <section className="pa-shelf">
      <div className="pa-rowhead"><h2>{title}</h2><span>{shown.length} פריטים</span></div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="חיפוש לפי שם" aria-label="חיפוש" />
      <div className="pa-grid">
        {shown.map((course) => (
          <button key={course.id} type="button" className="pa-course" onClick={() => onOpen(course.id)}>
            {course.coverImage ? <img src={course.coverImage} alt="" /> : <span className="pa-fallback" />}
            <strong>{course.title}</strong>
            <em>{course.level}</em>
          </button>
        ))}
      </div>
    </section>
  );
}

export function MonthBoard() {
  const now = new Date();
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const label = cursor.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  const cells = [...Array(first).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  const marked = new Set([4, 11, 18, 25]);
  return (
    <section className="pa-card pa-month" aria-label="לוח חודשי">
      <div className="pa-rowhead">
        <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="חודש קודם">‹</button>
        <h2>{label}</h2>
        <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="חודש הבא">›</button>
      </div>
      <div className="pa-weekdays">{['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="pa-days">
        {cells.map((day, index) => (
          <span key={index} className={`${day === now.getDate() && month === now.getMonth() ? 'is-today' : ''} ${day && marked.has(day) ? 'has-event' : ''}`}>
            {day || ''}
            {day && marked.has(day) ? <small>20:30 מפגש</small> : null}
          </span>
        ))}
      </div>
    </section>
  );
}

export function EventList({ courses, onOpen }: { courses: Course[]; onOpen: (id: string) => void }) {
  const events = courses.slice(0, 4);
  return (
    <div className="pa-events">
      <section className="pa-card">
        <h2>לוח המועדון החודשי</h2>
        <p>1 אירועים קרובים · שידורים חיים, סדנאות ומפגשים</p>
        {events.map((course, index) => (
          <button key={course.id} type="button" className="pa-event" onClick={() => onOpen(course.id)}>
            <span className="pa-avatar">{course.title.trim().charAt(0)}</span>
            <span>
              <strong>{course.title}</strong>
              <em>{course.subtitle || course.level}</em>
            </span>
            <time>20:30</time>
            <b>{index + 7}.11</b>
          </button>
        ))}
      </section>
      <section>
        <h2>הקלטות אחרונות</h2>
        <div className="pa-rail">
          {courses.slice(0, 4).map((course) => (
            <button key={course.id} type="button" className="pa-thumb" onClick={() => onOpen(course.id)}>
              {course.coverImage ? <img src={course.coverImage} alt="" /> : null}
              <span>{course.title}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AgentGrid() {
  const [active, setActive] = useState<string | null>(null);
  const agent = AGENTS.find((item) => item.name === active);
  return (
    <section className="pa-agents">
      <div className="pa-rowhead"><h2>סוכני AI</h2><span>{AGENTS.length} סוכנים זמינים לשימוש</span></div>
      <div className="pa-grid">
        {AGENTS.map((item) => (
          <article key={item.name} className="pa-agent">
            <div className="pa-agent-art">{item.tone}</div>
            <h3>{item.name}</h3>
            <p>{item.text}</p>
            <button type="button" onClick={() => setActive(item.name)}>הפעל סוכן</button>
          </article>
        ))}
      </div>
      {agent ? (
        <form className="pa-card pa-agent-run" onSubmit={(event) => { event.preventDefault(); setActive(null); }}>
          <h2>{agent.name}</h2>
          <p>{agent.text}</p>
          <label htmlFor="agent-brief">מה תרצו שיכין</label>
          <textarea id="agent-brief" placeholder="כתבו בקצרה את המשימה" />
          <button type="submit">סגירה</button>
        </form>
      ) : null}
    </section>
  );
}

export function HallOfFame({ user, posts }: { user: UserProfile; posts: CommunityPost[] }) {
  const [range, setRange] = useState<'all' | 'month' | 'week'>('all');
  const mine = memberPoints(user, posts);
  const rows = useMemo(() => {
    const list = [...BOARD, { name: user.name.split(' ')[0] || 'אתם', points: mine }];
    const factor = range === 'week' ? 0.35 : range === 'month' ? 0.7 : 1;
    return list.map((row) => ({ ...row, points: Math.round(row.points * factor) })).sort((a, b) => b.points - a.points);
  }, [mine, range, user.name]);
  const top = rows[0]?.points || 1;
  return (
    <div className="pa-hall">
      <section className="pa-card pa-profile">
        <div className="pa-avatar lg">{(user.name || 'ח').trim().charAt(0)}</div>
        <h2>{user.name}</h2>
        <p>מקום {rows.findIndex((row) => row.name === (user.name.split(' ')[0] || 'אתם')) + 1} בטבלה</p>
        <div className="pa-stats">
          <div><b>{levelFor(mine).name}</b><span>דרגה</span></div>
          <div><b>{mine}</b><span>נקודות</span></div>
        </div>
      </section>
      <section className="pa-card">
        <div className="pa-tabs">
          {([['all', 'כל הזמנים'], ['month', 'חודשי'], ['week', 'שבועי']] as const).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={range === id} onClick={() => setRange(id)}>{label}</button>
          ))}
        </div>
        <ol className="pa-board">
          {rows.map((row, index) => (
            <li key={row.name}>
              <b>{index + 1}</b>
              <span>{row.name}</span>
              <i style={{ width: `${Math.max(8, (row.points / top) * 100)}%` }} />
              <em>{row.points}</em>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function Partners({ userId }: { userId: string }) {
  const link = `${window.location.origin}/library?ref=${userId.slice(0, 8)}`;
  const [copied, setCopied] = useState(false);
  return (
    <div className="pa-partners">
      <section className="pa-card pa-partner-hero">
        <h2>תוכנית שותפים</h2>
        <p>שיתפו קישור. כשמישהו נרשם דרככם, הקרדיט נספר כאן.</p>
      </section>
      <section className="pa-card">
        <h2>הקישור שלי</h2>
        <p className="pa-link">{link}</p>
        <button type="button" onClick={() => { void navigator.clipboard.writeText(link).then(() => setCopied(true)); }}>
          {copied ? 'הועתק' : 'העתקת קישור'}
        </button>
      </section>
      <div className="pa-steps">
        <article><b>1</b><p>שתפו את הקישור</p></article>
        <article><b>2</b><p>חבר חדש נרשם</p></article>
        <article><b>3</b><p>הקרדיט מופיע בטבלה</p></article>
      </div>
      <div className="pa-metrics">
        <article><b>0</b><span>חברים שהגיעו</span></article>
        <article><b>0</b><span>נרשמו</span></article>
        <article><b>0</b><span>קרדיט</span></article>
      </div>
    </div>
  );
}

export function ContactDesk() {
  const [stars, setStars] = useState(0);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <div className="pa-contact">
      <section className="pa-contact-hero"><h2>צור קשר ותמיכה</h2><p>אנחנו כאן לעזור לך לאורך כל הדרך</p></section>
      <div className="pa-contact-cards">
        <article><b>קהילת הוואטסאפ</b><span>הצטרפות לקבוצה הרשמית</span></article>
        <article><b>מרכז הידע</b><span>שאלות נפוצות על הספרייה</span></article>
        <article><b>תמיכה במייל</b><span>support@infinitemasterpiece.local</span></article>
      </div>
      <form className="pa-card" onSubmit={(event) => {
        event.preventDefault();
        if (note.trim().length < 2) return;
        window.location.href = `mailto:support@infinitemasterpiece.local?subject=${encodeURIComponent(`פנייה · ${stars} כוכבים`)}&body=${encodeURIComponent(note.trim())}`;
        setSent(true);
      }}>
        <h2>שלחו לנו משוב</h2>
        <p>איך הייתם מדרגים את החוויה?</p>
        <div className="pa-stars">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" aria-pressed={stars >= value} onClick={() => setStars(value)}>★</button>
          ))}
        </div>
        <label htmlFor="pa-note">כתבו אימייל</label>
        <textarea id="pa-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="ספרו מה עבד ומה לשפר" />
        <button type="submit">שליחת משוב</button>
        {sent ? <p>חלון המייל נפתח עם המשוב.</p> : null}
      </form>
    </div>
  );
}

export function ClubCard({ plan }: { plan: string }) {
  const labels: Record<string, string> = {
    none: 'ללא מנוי',
    free_trial: 'ניסיון',
    monthly: 'מנוי חודשי',
    annual: 'מנוי שנתי',
    premium_88: 'נבחרת 88',
  };
  return (
    <section className="pa-card pa-club">
      <h2>המועדון</h2>
      <p>המסלול הפעיל: {labels[plan] || plan}</p>
      <ul>
        <li>שיחה בקהילה וכתיבה</li>
        <li>לוח מפגשים והקלטות</li>
        <li>הדרכות קצרות וקורסים</li>
        <li>נקודות ודירוג בהיכל התהילה</li>
      </ul>
    </section>
  );
}
